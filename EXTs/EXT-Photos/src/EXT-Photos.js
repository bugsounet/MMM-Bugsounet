/**
 ** Module : EXT-Photos
 ** @bugsounet
 ** ©12-2024
 **/

var logPhotos = () => { /* do nothing */ };

Module.register("EXT-Photos", {
  defaults: {
    debug: false,
    displayDelay: 20 * 1000,
    loop: false
  },

  start () {
    if (this.config.debug) logPhotos = (...args) => { console.log("[PHOTOS]", ...args); };
    this.photos = {
      position: 0,
      urls: [],
      length: 0,
      running: false
    };
    this.timerPhoto = null;
    this.ready = false;
  },

  getDom () {
    var dom = document.createElement("div");
    dom.style.display = "none";
    return dom;
  },

  getStyles () {
    return ["EXT-Photos.css"];
  },

  getTranslations () {
    return {
      en: "translations/en.json",
      fr: "translations/fr.json"
    };
  },

  notificationReceived (noti, payload, sender) {
    if (noti === "Bugsounet_ASSISTANT-READY") {
      if (sender.name === "EXT-Assistant") {
        this.sendSocketNotification("INIT");
        this.preparePopup();
        this.ready = true;
        this.sendNotification("Bugsounet_HELLO");
      }
    }
    if (!this.ready) return;

    switch (noti) {
      case "Bugsounet_PHOTOS-OPEN":
        logPhotos("Received:", payload);
        if (!payload || !payload.length) {
          this.sendNotification("Bugsounet_ALERT", {
            message: this.translate("PhotosError"),
            type: "error"
          });
          return;
        }
        this.photos.urls = payload;
        this.photos.position = 0;
        this.photos.length = payload.length;
        this.startPhotos();
        break;
      case "Bugsounet_STOP":
        if (this.photos.running) {
          this.resetPhotos();
          this.endPhotos();
        }
        break;
      case "Bugsounet_PHOTOS-CLOSE":
        if (this.photos.running) {
          this.resetPhotos();
          this.endPhotos(true);
        }
        break;
    }
  },

  /*********************/
  /** Popup Displayer **/
  /*********************/

  preparePopup () {
    var Photos = document.createElement("div");
    Photos.id = "EXT_PHOTOS";
    Photos.classList.add("hidden");
    var backPhoto = document.createElement("div");
    backPhoto.id = "EXT_PHOTOS_BACK";
    var currentPhoto = document.createElement("div");
    currentPhoto.id = "EXT_PHOTOS_CURRENT";
    currentPhoto.addEventListener("animationend", () => {
      currentPhoto.classList.remove("animated");
    });
    Photos.appendChild(backPhoto);
    Photos.appendChild(currentPhoto);
    document.body.appendChild(Photos);
  },

  startPhotos () {
    if (!this.photos.running) this.sendNotification("Bugsounet_ALERT", {
      message: this.translate("PhotosOpen"),
      type: "information",
      icon: this.file("resources/Photos-Logo.png")
    });
    this.sendNotification("Bugsounet_PHOTOS-CONNECTED");
    this.hideModules();
    this.showPhotos();
    this.photoDisplay();
  },

  endPhotos (extAlert = false) {
    if (extAlert) this.sendNotification("Bugsounet_ALERT", {
      message: this.translate("PhotosClose"),
      type: "information",
      icon: this.file("resources/Photos-Logo.png")
    });
    this.sendNotification("Bugsounet_PHOTOS-DISCONNECTED");
    this.hidePhotos();
    this.showModules();
  },

  showPhotos () {
    logPhotos("Show Photos Iframe");
    var iframe = document.getElementById("EXT_PHOTOS");
    iframe.classList.remove("hidden");
  },

  hidePhotos () {
    logPhotos("Hide Photos Iframe");
    var iframe = document.getElementById("EXT_PHOTOS");
    iframe.classList.add("hidden");
  },

  hideModules () {
    MM.getModules().enumerate((module) => {
      module.hide(100, { lockString: "EXT_PHOTOS-LOCKED" });
    });
  },

  showModules () {
    MM.getModules().enumerate((module) => {
      module.show(100, { lockString: "EXT_PHOTOS-LOCKED" });
    });
  },

  /** photos code **/
  photoDisplay () {
    this.photos.running = true;
    logPhotos(`Loading photo #${this.photos.position}/${this.photos.length - 1}`);
    var hidden = document.createElement("img");
    hidden.onerror = () => {
      this.sendNotification("Bugsounet_ALERT", {
        message: this.translate("PhotosError"),
        type: "warning",
        icon: this.file("resources/Photos-Logo.png")
      });
      logPhotos("Photo Loading Error... retry with next");
      clearTimeout(this.timerPhoto);
      this.timerPhoto = null;
      this.photoNext();
    };
    hidden.onload = () => {
      var back = document.getElementById("EXT_PHOTOS_BACK");
      var current = document.getElementById("EXT_PHOTOS_CURRENT");
      logPhotos("URL=", this.photos.urls[this.photos.position]);
      back.style.backgroundImage = `url(${this.photos.urls[this.photos.position]})`;
      current.style.backgroundImage = `url(${this.photos.urls[this.photos.position]})`;
      current.classList.add("animated");
      this.timerPhoto = setTimeout(() => {
        this.photoNext();
      }, this.config.displayDelay);
    };
    hidden.src = this.photos.urls[this.photos.position];
  },

  photoNext () {
    if (this.photos.position >= (this.photos.length - 1)) {
      if (this.config.loop) {
        this.photos.position = 0;
        this.photoDisplay();
      } else {
        this.resetPhotos();
        this.endPhotos(true);
      }
    } else {
      this.photos.position++;
      this.photoDisplay();
    }
  },

  resetPhotos () {
    var back = document.getElementById("EXT_PHOTOS_BACK");
    var current = document.getElementById("EXT_PHOTOS_CURRENT");
    clearTimeout(this.timerPhoto);
    this.timerPhoto = null;
    this.photos = {
      position: 0,
      urls: [],
      length: 0,
      running: false
    };
    back.removeAttribute("style");
    current.removeAttribute("style");
    logPhotos("Reset Photos", this.photos);
  }
});
