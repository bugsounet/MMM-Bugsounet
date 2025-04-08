/**
 ** Module : EXT-GooglePhotos
 ** @bugsounet
 ** ©04-2025
 ** @eouia code based
 **/

/** Todo : create a displayer class **/

/* global removeAnimateCSS, addAnimateCSS */

var logGP = () => { /* do nothing */ };

Module.register("EXT-GooglePhotos", {
  defaults: {
    debug: false,
    displayType: 0,
    displayDelay: 10 * 1000,
    displayInfos: true,
    displayBackground: true,
    albums: [],
    sort: "new", // "old", "random"
    hiResolution: true,
    timeFormat: "DD/MM/YYYY HH:mm",
    moduleHeight: 300,
    moduleWidth: 300,
    uploadAlbum: null,
    suspendWhenScreenOff: true, // shall EXT-GooglePhotos suspend when EXT_Screen turn off the screen ?
    time_extender: 10, // how many times multiply displayDelay when EXT_GOOGLEPHOTOS-MORE_TIME
    photoSignalUrl: null // where to send photo's url when signalled as not interesting
  },

  start () {
    if (this.config.debug) logGP = (...args) => { console.log("[GPHOTOS]", ...args); };
    var checkConfig = false;
    if (typeof this.config.displayType === "number" && this.config.displayType >= 0 && this.config.displayType <= 1) checkConfig = true;
    if (!checkConfig) {
      this.config.displayType = 0;
      console.error("GPhoto: displayType error --> correct with default");
    }
    this.config.LoadingText = this.translate("LOADING");
    this.config.GPAlbumName = this.translate("GPAlbumName");
    this.busy = false;
    this.Ready = false;
    this.GPhotos = {
      updateTimer: null,
      albums: null,
      scanned: [],
      index: 0,
      needMorePicsFlag: true,
      warning: 0,
      hidden: false
    };
    this.fadeTimeout = null;
  },

  getTranslations () {
    return {
      en: "translations/en.json",
      fr: "translations/fr.json",
      it: "translations/it.json",
      de: "translations/de.json",
      es: "translations/es.json",
      nl: "translations/nl.json",
      pt: "translations/pt.json",
      ko: "translations/ko.json",
      el: "translations/el.json",
      "zh-cn": "translations/zh-cn.json",
      tr: "translations/tr.json"
    };
  },

  getStyles () {
    return ["EXT-GooglePhotos.css"];
  },

  getDom () {

    /** GPhotos Module mode**/
    if (this.config.displayType === 1) {
      var GPhotos = document.createElement("div");
      GPhotos.id = "EXT_GPHOTO";
      GPhotos.style.height = `${this.config.moduleHeight}px`;
      GPhotos.style.width = `${this.config.moduleWidth}px`;
      var GPhotosBack = document.createElement("div");
      GPhotosBack.id = "EXT_GPHOTO_BACK";
      var GPhotosCurrent = document.createElement("div");
      GPhotosCurrent.id = "EXT_GPHOTO_CURRENT";
      GPhotosCurrent.addEventListener("animationend", () => {
        GPhotosCurrent.classList.remove("animated");
      });
      var GPhotosInfo = document.createElement("div");
      GPhotosInfo.id = "EXT_GPHOTO_INFO";
      GPhotosInfo.className = "Module";
      GPhotosInfo.innerHTML = "EXT-GooglePhotos Loading...";

      GPhotos.appendChild(GPhotosBack);
      GPhotos.appendChild(GPhotosCurrent);
      GPhotos.appendChild(GPhotosInfo);
      return GPhotos;
    } else {
      var dom = document.createElement("div");
      dom.style.display = "none";
      return dom;
    }
  },

  notificationReceived (noti, payload, sender) {
    if (noti === "Bugsounet_READY") {
      if (sender.name === "MMM-Bugsounet") {
        this.prepare();
        this.sendSocketNotification("INIT", this.config);
        setTimeout(() => { this.showBackgroundGooglePhotoAPI(); }, 5000);
        this.Ready = true;
        this.sendNotification("Bugsounet_HELLO", this.name);
      }
    }
    if (!this.Ready) return;

    switch (noti) {
      case "Bugsounet_GOOGLEPHOTOS-STOP":
        this.sendSocketNotification("STOP_SCAN");
        this.busy = true;
        break;
      case "Bugsounet_GOOGLEPHOTOS-START":
        this.busy = false;
        this.sendSocketNotification("START_SCAN");
        break;
      case "Bugsounet_GPHOTOPHOTOS-UPLOAD":
        this.sendSocketNotification("UPLOAD", payload);
        break;
      case "Bugsounet_GOOGLEPHOTOS-NEXT":
        // stop timer
        clearTimeout(this.GPhotos.updateTimer);
        // change photo
        this.updatePhotos();
        // restart timer
        this.GPhotos.updateTimer = setInterval(() => {
          this.updatePhotos();
        }, this.config.displayDelay);
        break;
      case "Bugsounet_GOOGLEPHOTOS-PREVIOUS":
        // return to index of photo before current
        this.GPhotos.index -= 2;
        // stop timer
        clearTimeout(this.GPhotos.updateTimer);
        // change photo to the one before current
        this.updatePhotos();
        // restart timer
        this.GPhotos.updateTimer = setInterval(() => {
          this.updatePhotos();
        }, this.config.displayDelay);
        break;
      case "Bugsounet_GOOGLEPHOTOS-MORE_TIME": // shows photo longer
        // stop timers
        clearTimeout(this.GPhotos.updateTimer);
        clearTimeout(this.fadeTimeout);
        // restart longer timers
        this.fadeTimeout = setTimeout(() => {
          removeAnimateCSS("EXT_GPHOTO", this.data.animateIn ? this.data.animateIn : "fadeIn");
          addAnimateCSS("EXT_GPHOTO", this.data.animateOut ? this.data.animateOut : "fadeOut", 2);
        }, this.config.displayDelay * this.config.time_extender - 2200);
        this.GPhotos.updateTimer = setInterval(() => {
          this.updatePhotos();
        }, this.config.displayDelay * this.config.time_extender);
        break;
      case "Bugsounet_SCREEN-POWER":
        if (this.config.suspendWhenScreenOff) {
          if (payload === true) {
            this.resume();
          } else {
            this.suspend();
          }
        }
        break;
      case "Bugsounet_GOOGLEPHOTOS-SIGNAL_PHOTO":
        if (this.config.photoSignalUrl) {
          let current_displayed_photo_index = this.GPhotos.index - 1;
          if (current_displayed_photo_index >= 0) {
            let photoName = this.GPhotos.scanned[current_displayed_photo_index].filename;
            this.sendNotification("Bugsounet_ALERT", {
              type: "warning",
              message: this.translate("GPUninterestingPhoto", { NAME: photoName }),
              icon: this.file("resources/GooglePhoto-Logo.png")
            });
            const formData = new FormData();
            formData.append("photoUrl", this.GPhotos.scanned[current_displayed_photo_index].productUrl);
            formData.append("albumId", this.GPhotos.scanned[current_displayed_photo_index]._albumId);
            formData.append("filename", photoName);
            formData.append("creationTime", JSON.stringify(this.GPhotos.scanned[current_displayed_photo_index].mediaMetadata.creationTime));

            fetch(this.config.photoSignalUrl, {
              method: "POST",
              body: formData
            })
              .then((response) => response.json())
              .then((data) => {
                console.log("Success:", data);
              })
              .catch((error) => {
                console.error("Error:", error);
              });
          }
        }
        break;
    }
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "GPhotos_PICT":
        if (payload && Array.isArray(payload) && payload.length > 0) {
          this.GPhotos.needMorePicsFlag = false;
          this.GPhotos.scanned = payload;
          this.GPhotos.index = 0;
          if (this.config.debug) {
            this.sendNotification("Bugsounet_ALERT", {
              type: "information",
              message: this.translate("GPReceive", { VALUES: payload.length }),
              icon: this.file("resources/GooglePhoto-Logo.png"),
              timer: 10000
            });
          }
          logGP("GPReceive", payload.length);
        }
        break;
      case "GPhotos_INIT":
        this.GPhotos.albums = payload;
        break;
      case "ERROR":
      case "GPError":
        this.sendNotification("Bugsounet_ALERT", {
          type: "error",
          message: payload,
          icon: this.file("resources/GooglePhoto-Logo.png")
        });
    }
  },

  resume () {
    clearTimeout(this.GPhotos.updateTimer);
    this.GPhotos.hidden = false;

    this.updatePhotos();
    this.GPhotos.updateTimer = setInterval(() => {
      this.updatePhotos();
    }, this.config.displayDelay);

    if (this.config.displayType === 0) {
      var GPhotos = document.getElementById("EXT_GPHOTO");
      if (GPhotos) GPhotos.classList.remove("hidden");
    }
    console.log("EXT-GooglePhotos is resumed.");
  },

  suspend () {
    clearTimeout(this.GPhotos.updateTimer);
    this.GPhotos.hidden = true;
    if (this.config.displayType === 0) {
      var GPhotos = document.getElementById("EXT_GPHOTO");
      if (GPhotos) GPhotos.classList.add("hidden");
    }
    console.log("EXT-GooglePhotos is suspended.");
  },

  forceHidden () {
    var GPhotos = document.getElementById("EXT_GPHOTO");
    GPhotos.classList.add("hidden");
  },

  prepare () {

    /** Create a popup for external photo display **/
    var photo = document.createElement("img");
    photo.id = "EXT_PHOTO";
    photo.classList.add("hidden");
    document.body.appendChild(photo);

    /** Create a Fake module for Background using **/
    if (this.config.displayType === 0) {
      var nodes = document.getElementsByClassName("region fullscreen below");
      var pos = nodes[0].querySelector(".container");
      pos.style.display = "block";
      var children = pos.children;
      var module = document.createElement("div");
      module.id = "module_Fake_EXT_GPHOTO";
      module.classList.add("module", "EXT_GPHOTO", "hidden");
      var header = document.createElement("header");
      header.classList.add("module-header");
      header.style.display = "none";
      module.appendChild(header);
      var content = document.createElement("div");
      content.classList.add("module-content");
      var viewDom = document.createElement("div");
      viewDom.id = "EXT_GPHOTO";
      var back = document.createElement("div");
      back.id = "EXT_GPHOTO_BACK";
      var current = document.createElement("div");
      current.id = "EXT_GPHOTO_CURRENT";
      current.addEventListener("animationend", () => {
        current.classList.remove("animated");
      });
      var info = document.createElement("div");
      info.id = "EXT_GPHOTO_INFO";
      info.innerHTML = this.config.LoadingText;
      viewDom.appendChild(back);
      viewDom.appendChild(current);
      viewDom.appendChild(info);

      content.appendChild(viewDom);
      module.appendChild(content);
      pos.insertBefore(module, children[children.length]);
    }
  },

  /** GPhotos API **/
  updatePhotos () {
    if (this.GPhotos.scanned.length === 0) {
      if (!this.busy) this.sendSocketNotification("GP_MORE_PICTS");
      return;
    }
    if (this.GPhotos.index < 0) this.GPhotos.index = 0;
    if (this.GPhotos.index >= this.GPhotos.scanned.length) this.GPhotos.index = 0;
    var target = this.GPhotos.scanned[this.GPhotos.index];
    var url = this.config.hiResolution ? `${target.baseUrl}=w1080-h1920` : target.baseUrl;
    this.ready(url, target);
    this.GPhotos.index++;
    if (this.GPhotos.index >= this.GPhotos.scanned.length) {
      this.GPhotos.index = 0;
      this.GPhotos.needMorePicsFlag = true;
    }
    if (this.GPhotos.needMorePicsFlag) {
      if (!this.busy) this.sendSocketNotification("GP_MORE_PICTS");
    }
  },

  ready (url, target) {
    if (this.config.displayType === 0 && this.GPhotos.hidden) this.forceHidden();
    clearTimeout(this.fadeTimeout);
    var hidden = document.createElement("img");
    hidden.onerror = () => {
      console.error("[GPHOTOS] Failed to Load Image.");
      if (!this.busy) {
        this.sendNotification("Bugsounet_ALERT", {
          type: "warning",
          message: this.translate("GPFailedOpenURL"),
          icon: this.file("resources/GooglePhoto-Logo.png")
        });
        this.sendSocketNotification("GP_LOAD_FAIL", url);
      }
    };
    hidden.onload = () => {
      var back = document.getElementById("EXT_GPHOTO_BACK");
      var current = document.getElementById("EXT_GPHOTO_CURRENT");
      if (this.config.displayBackground) back.style.backgroundImage = `url(${url})`;
      current.style.backgroundImage = `url(${url})`;
      removeAnimateCSS("EXT_GPHOTO", this.data.animateOut ? this.data.animateOut : "fadeOut");
      addAnimateCSS("EXT_GPHOTO", this.data.animateIn ? this.data.animateIn : "fadeIn", 2);
      var info = document.getElementById("EXT_GPHOTO_INFO");
      var album = this.GPhotos.albums.find((a) => {
        if (a.id === target._albumId) return true;
        return false;
      });
      info.innerHTML = "";
      if (!this.config.displayInfos) info.classList.add("hidden");
      var albumCover = document.createElement("div");
      albumCover.classList.add("albumCover");
      if (typeof album !== "undefined") { // @doctorfree patch
        albumCover.style.backgroundImage = `url(${this.file(`tmp/cache/${album.id}`)})`;
      }
      var albumTitle = document.createElement("div");
      albumTitle.classList.add("albumTitle");
      albumTitle.innerHTML = `${this.config.GPAlbumName} ${album.title}`;
      var photoTime = document.createElement("div");
      photoTime.classList.add("photoTime");
      photoTime.innerHTML = (this.config.timeFormat === "relative")
        ? moment(target.mediaMetadata.creationTime).fromNow()
        : moment(target.mediaMetadata.creationTime).format(this.config.timeFormat);
      var infoText = document.createElement("div");
      infoText.classList.add("infoText");

      info.appendChild(albumCover);
      infoText.appendChild(albumTitle);
      infoText.appendChild(photoTime);
      info.appendChild(infoText);
      logGP(`Image loaded [${this.GPhotos.index}/${this.GPhotos.scanned.length}]:`, url);
      if (!this.busy) this.sendSocketNotification("GP_LOADED", url);
    };
    hidden.src = url;
    this.fadeTimeout = setTimeout(() => {
      removeAnimateCSS("EXT_GPHOTO", this.data.animateIn ? this.data.animateIn : "fadeIn");
      addAnimateCSS("EXT_GPHOTO", this.data.animateOut ? this.data.animateOut : "fadeOut", 2);
    }, this.config.displayDelay - 2200);
  },

  showBackgroundGooglePhotoAPI () {
    if (this.GPhotos.scanned.length === 0) {
      clearTimeout(this.GPhotos.updateTimer);
      this.GPhotos.updateTimer = null;
      if (!this.busy) {
        this.sendNotification("Bugsounet_ALERT", {
          type: "warning",
          message: this.translate("GPNoPhotoFound"),
          icon: this.file("resources/GooglePhoto-Logo.png")
        });
        this.sendSocketNotification("GP_MORE_PICTS");
      }
      this.GPhotos.warning++;
      if (this.GPhotos.warning >= 5) {
        if (!this.busy) this.sendNotification("Bugsounet_ALERT", {
          type: "warning",
          message: this.translate("GPError"),
          icon: this.file("resources/GooglePhoto-Logo.png")
        });
        this.GPhotos.warning = 0;
        return;
      }
      this.GPhotos.updateTimer = setInterval(() => {
        this.showBackgroundGooglePhotoAPI();
      }, 15000);
    } else {
      if (this.GPhotos.albums) {
        this.sendNotification("Bugsounet_ALERT", {
          type: "information",
          message: this.translate("GPOpen"),
          icon: this.file("resources/GooglePhoto-Logo.png")
        });
      }
      clearTimeout(this.GPhotos.updateTimer);
      this.GPhotos.updateTimer = null;
      this.updatePhotos();

      this.GPhotos.updateTimer = setInterval(() => {
        this.updatePhotos();
      }, this.config.displayDelay);
    }
  }
});
