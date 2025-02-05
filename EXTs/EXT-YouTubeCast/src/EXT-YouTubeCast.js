/**
 ** Module : EXT-YouTubeCast
 ** @bugsounet
 **/

Module.register("EXT-YouTubeCast", {
  defaults: {
    debug: false,
    fullscreen: false,
    alwaysDisplayed: true,
    width: "30vw",
    height: "17vw",
    castName: "MagicMirror",
    port: 8569
  },

  start () {
    //override user set !
    if (this.data.position === "fullscreen_above" || this.data.position === "fullscreen_below") this.config.fullscreen = true;
    if (!this.data.position) this.data.position = "top_center";
    this.castActive = false;
  },

  getStyles () {
    return ["EXT-YouTubeCast.css"];
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

  getDom () {
    var wrapper = document.createElement("div");
    wrapper.id = "EXT-CAST_WINDOW";
    if (this.config.fullscreen) {
      wrapper.className = "hidden";
      return wrapper;
    }

    if (!this.config.alwaysDisplayed && !this.config.fullscreen) this.hide(0, { lockString: "EXT-CAST_LOCKED" });
    wrapper.style.width = this.config.width;
    wrapper.style.height = this.config.height;
    var CASTLogo = document.createElement("img");
    CASTLogo.id = "EXT-CAST_LOGO";
    CASTLogo.src = this.file("resources/cast-Logo.png");
    wrapper.appendChild(CASTLogo);

    var CASTPlayer = document.createElement("webview");
    CASTPlayer.id = "EXT-CAST";
    CASTPlayer.useragent = "Mozilla/5.0 (SMART-TV; Linux; Tizen 2.4.0) AppleWebkit/538.1 (KHTML, like Gecko) SamsungBrowser/1.1 TV Safari/538.1";
    CASTPlayer.scrolling = "no";
    CASTPlayer.classList.add("hidden");

    wrapper.appendChild(CASTPlayer);
    return wrapper;
  },

  notificationReceived (noti, payload, sender) {
    switch (noti) {
      case "Bugsounet_READY":
        if (sender.name === "MMM-Bugsounet") {
          this.sendSocketNotification("INIT", this.config);
          if (this.config.fullscreen) this.preparePopup();
          this.sendNotification("Bugsounet_HELLO", this.name);
        }
        break;
      case "Bugsounet_STOP":
      case "Bugsounet_YOUTUBECAST-STOP":
        if (!this.castActive) return;
        this.broadcastStatus("END");
        this.castStop();
    }
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {

      /** cast module **/
      case "CAST_START":
        this.sendNotification("Bugsounet_ALERT", {
          type: "information",
          message: this.translate("CastStart"),
          icon: this.file("resources/cast-icon.png")
        });
        this.broadcastStatus("START");
        this.castStart(payload);
        break;
      case "CAST_STOP":
        this.sendNotification("Bugsounet_ALERT", {
          type: "information",
          message: this.translate("CastStop"),
          icon: this.file("resources/cast-icon.png")
        });
        this.broadcastStatus("END");
        this.castStop();
        break;
      case "CAST_WARNING":
        this.sendNotification("Bugsounet_ALERT", {
          type: "error",
          message: "castName missing in config",
          icon: this.file("resources/cast-icon.png")
        });
        break;
    }
  },

  broadcastStatus (status) {
    switch (status) {
      case "START":
        this.sendNotification("Bugsounet_YOUTUBECAST-CONNECTED");
        this.castActive = true;
        break;
      case "END":
        this.sendNotification("Bugsounet_YOUTUBECAST-DISCONNECTED");
        this.castActive = false;
        break;
    }
  },

  castStart (url) {
    if (this.config.fullscreen) this.modulesHide();
    var CASTPlayer = document.getElementById("EXT-CAST");
    var CASTLogo = document.getElementById("EXT-CAST_LOGO");

    if (!this.config.alwaysDisplayed && !this.config.fullscreen) this.show(0, { lockString: "EXT-CAST_LOCKED" });
    if (!this.config.fullscreen) CASTLogo.className = "hidden";
    CASTPlayer.classList.remove("hidden");
    CASTPlayer.src = url;
  },

  castStop () {
    var CASTPlayer = document.getElementById("EXT-CAST");
    var CASTLogo = document.getElementById("EXT-CAST_LOGO");

    CASTPlayer.classList.add("hidden");
    CASTPlayer.src = `about:blank?&seed=${Date.now()}`;
    if (!this.config.fullscreen) CASTLogo.classList.remove("hidden");
    if (!this.config.alwaysDisplayed && !this.config.fullscreen) this.hide(0, { lockString: "EXT-CAST_LOCKED" });
    if (this.config.fullscreen) this.modulesShow();
  },

  modulesHide () {
    MM.getModules().enumerate((module) => {
      module.hide(100, () => {}, { lockString: "EXT_LOCKED" });
    });
  },

  modulesShow () {
    MM.getModules().enumerate((module) => {
      module.show(100, () => {}, { lockString: "EXT_LOCKED" });
    });
  },

  preparePopup () {
    var CASTPlayer = document.createElement("webview");
    CASTPlayer.id = "EXT-CAST";
    CASTPlayer.useragent = "Mozilla/5.0 (SMART-TV; Linux; Tizen 2.4.0) AppleWebkit/538.1 (KHTML, like Gecko) SamsungBrowser/1.1 TV Safari/538.1";
    CASTPlayer.scrolling = "no";
    CASTPlayer.classList.add("hidden", "fullscreen");
    document.body.appendChild(CASTPlayer);
  }
});
