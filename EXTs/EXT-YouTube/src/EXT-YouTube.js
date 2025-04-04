//
// Module : EXT-YouTube v2
// @bugsounet 04/2023

var logYT = () => { /* do nothing */ };

Module.register("EXT-YouTube", {
  defaults: {
    debug: false,
    fullscreen: false,
    width: "30vw",
    height: "17vw",
    alwaysDisplayed: true,
    displayHeader: true,
    username: null,
    password: null
  },

  start () {
    //override user set !
    if (this.data.position === "fullscreen_above" || this.data.position === "fullscreen_below") this.config.fullscreen = true;
    if (this.config.fullscreen) this.data.header = undefined;
    else {
      if (this.config.displayHeader) this.data.header = "~YouTube Player~";
      if (!this.data.position) this.data.position = "top_center";
    }
    if (this.config.debug) logYT = (...args) => { console.log("[YT]", ...args); };
    this.YT = {
      status: false,
      ended: false,
      title: null,
      running: false
    };
    this.searchInit = false;
    this.ready = false;
    this.session = null;
  },

  notificationReceived (notification, payload, sender) {
    if (notification === "GA_READY" && sender.name === "MMM-GoogleAssistant") {
      this.sendSocketNotification("INIT", this.config);
      if (this.config.fullscreen) this.preparePopup();
      this.YouTube = document.getElementById("EXT-YT");
      if (!this.config.password) {
        this.sendNotification("GA_ALERT", {
          type: "warning",
          message: this.translate("YouTubePasswordMissing"),
          icon: this.file("resources/YT.png")
        });
      }
      this.sendNotification("EXT_HELLO", this.name);
      this.ready = true;
    }
    if (!this.ready) return;
    switch (notification) {
      case "EXT_YOUTUBE-PLAY":
        this.YT.title = null;
        this.YouTube.src = `https://youtube.bugsounet.fr/?id=${payload}&username=${this.config.username}&password=${this.config.password}&seed=${Date.now()}`;
        break;
      case "EXT_STOP":
      case "EXT_YOUTUBE-STOP":
        if (this.YT.running) this.Ended();
        break;
      case "EXT_YOUTUBE-SEARCH":
        if (!this.searchInit) {
          this.sendNotification("GA_ALERT", {
            type: "error",
            message: this.translate("YouTubeSearchDisabled"),
            icon: this.file("resources/YT.png")
          });
          return console.error("Search function is disabled!");
        }
        if (payload) this.sendSocketNotification("YT_SEARCH", payload);
        break;
      case "EXT_YOUTUBE-VOLUME_MIN":
        this.sendSocketNotification("Volume-Min");
        break;
      case "EXT_YOUTUBE-VOLUME_MAX":
        this.sendSocketNotification("Volume-Max");
        break;
    }
  },

  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case "YT_INITIALIZED":
        this.searchInit = true;
        break;
      case "YT_RESULT":
        this.notificationReceived("EXT_YOUTUBE-PLAY", payload);
        break;
      case "YT_FOUND":
        if (this.config.fullscreen && this.config.displayHeader) {
          this.sendNotification("GA_ALERT", {
            type: "information",
            message: this.translate("YouTubeIsPlaying", { VALUES: payload.title }),
            icon: payload.thumbnail.url,
            timer: 6000,
            sound: this.file("resources/YT-Launch.mp3")
          });
        }
        break;
      case "YT_LIBRARY_ERROR":
        this.sendNotification("GA_ALERT", {
          type: "error",
          message: this.translate("YouTubeLibraryError", { VALUES: payload }),
          icon: this.file("resources/YT.png"),
          timer: 10000
        });
        break;
      case "YT_SEARCH_ERROR":
        this.sendNotification("GA_ALERT", {
          type: "error",
          message: this.translate("YouTubeFoundError"),
          icon: this.file("resources/YT.png"),
          timer: 5000
        });
        break;
    }
  },

  getDom () {
    var wrapper = document.createElement("div");
    wrapper.id = "EXT-YT_WINDOW";
    if (this.config.fullscreen) {
      wrapper.className = "hidden";
      return wrapper;
    }

    if (!this.config.alwaysDisplayed && !this.config.fullscreen) this.hide(0, { lockString: "EXT-YT_LOCKED" });
    wrapper.style.width = this.config.width;
    wrapper.style.height = this.config.height;
    var YTLogo = document.createElement("img");
    YTLogo.id = "EXT-YT_LOGO";
    YTLogo.src = this.file("resources/YouTube-Logo.png");
    wrapper.appendChild(YTLogo);

    var YTPlayer = document.createElement("webview");
    YTPlayer.id = "EXT-YT";
    YTPlayer.className = "hidden";

    YTPlayer.addEventListener("did-stop-loading", () => {
      if (YTPlayer.getURL().includes("about:blank")) logYT("Video Ended");
      else logYT("Video Started");
    });
    YTPlayer.addEventListener("console-message", (event) => {
      if (YTPlayer.getURL().includes("about:blank")) return;
      this.Rules(event.message);
    });
    YTPlayer.addEventListener("did-fail-load", (message) => {
      console.error("[YT][Error]", message.errorDescription);
      this.sendNotification("GA_ALERT", { type: "error", message: `Youtube Error: ${message.errorDescription}` });
      this.Ended();
    });

    wrapper.appendChild(YTPlayer);
    return wrapper;
  },

  getStyles () {
    return [this.file("EXT-YouTube.css")];
  },

  getTranslations () {
    return {
      en: "translations/en.json",
      fr: "translations/fr.json",
      el: "translations/el.json",
      nl: "translations/nl.json",
      tr: "translations/tr.json",
      de: "translations/de.json"
    };
  },

  Rules (payload) {
    logYT("Received:", payload);
    const tag = payload.split(" ");
    if (tag[0] === "[YT]") {
      switch (tag[1]) {
        case "Status:":
          this.YT.status = tag[2] === "true" ? true : false;
          if (this.YT.status && !this.YT.ended) {
            if (this.YT.running) return;
            this.Started();
          }
          break;
        case "Ended:":
          this.YT.ended = tag[2] === "true" ? true : false;
          if (this.YT.ended) this.Ended();
          if (this.YT.running) this.YT.running = false;
          break;
        case "Title:":
          this.YT.title = tag.slice(2).join(" ");
          if (this.config.fullscreen && this.config.displayHeader) console.log("[YT]", this.translate("YouTubeIsPlaying", { VALUES: this.YT.title }));
          if (this.YT.title && !this.config.fullscreen && this.config.displayHeader) {
            let YTHeader = document.getElementById(this.identifier).getElementsByClassName("module-header")[0];
            YTHeader.innerText = this.YT.title;
          }
          break;
        case "Error:":
          var error = tag.slice(2).join(" ");
          this.sendNotification("GA_ALERT", { type: "error", message: error });
          break;
        case "SESSION:":
          this.session = tag[2];
          this.sendSocketNotification("Session", this.session);
          break;
      }
    }
  },

  Ended () {
    var YTPlayer = document.getElementById("EXT-YT");
    var YTLogo = document.getElementById("EXT-YT_LOGO");
    if (!this.config.fullscreen && this.config.displayHeader) {
      let YTHeader = document.getElementById(this.identifier).getElementsByClassName("module-header")[0];
      YTHeader.innerHTML = this.data.header;
    }

    YTPlayer.classList.add("hidden");
    YTPlayer.src = `about:blank?&seed=${Date.now()}`;
    if (!this.config.fullscreen) YTLogo.classList.remove("hidden");
    if (!this.config.alwaysDisplayed && !this.config.fullscreen) this.hide(0, { lockString: "EXT-YT_LOCKED" });
    this.broadcastStatus("END");

    this.YT = {
      status: false,
      ended: false,
      title: null,
      running: false
    };
    this.sendSocketNotification("Session", null);
    if (this.config.fullscreen) this.Showing();
  },

  Started () {
    if (this.config.fullscreen) this.Hiding();
    var YTPlayer = document.getElementById("EXT-YT");
    var YTLogo = document.getElementById("EXT-YT_LOGO");

    if (!this.config.alwaysDisplayed && !this.config.fullscreen) this.show(0, { lockString: "EXT-YT_LOCKED" });
    if (!this.config.fullscreen) YTLogo.className = "hidden";
    YTPlayer.classList.remove("hidden");
    this.broadcastStatus("START");
    this.YT.running = true;
  },

  Hiding () {
    logYT("Hiding all modules");
    MM.getModules().exceptModule(this).enumerate((module) => {
      module.hide(1000, () => {}, { lockString: "EXT-YT_LOCKED" });
    });
  },

  Showing () {
    logYT("Showing all modules");
    MM.getModules().exceptModule(this).enumerate((module) => {
      module.show(1000, () => {}, { lockString: "EXT-YT_LOCKED" });
    });
  },

  broadcastStatus (status) {
    if (status === "START") this.sendNotification("EXT_YOUTUBE-CONNECTED");
    else if (status === "END") this.sendNotification("EXT_YOUTUBE-DISCONNECTED");
  },


  preparePopup () {
    var YTPlayer = document.createElement("webview");
    YTPlayer.id = "EXT-YT";
    YTPlayer.classList.add("fullscreen", "hidden");

    YTPlayer.addEventListener("did-stop-loading", () => {
      if (YTPlayer.getURL().includes("about:blank")) logYT("Video Ended");
      else logYT("Video Started");
    });
    YTPlayer.addEventListener("console-message", (event) => {
      if (YTPlayer.getURL().includes("about:blank")) return;
      this.Rules(event.message);
    });
    YTPlayer.addEventListener("did-fail-load", (message) => {
      console.error("[YT][Error]", message.errorDescription);
      this.sendNotification("GA_ALERT", { type: "error", message: `Youtube Error: ${message.errorDescription}` });
      this.Ended();
    });
    document.body.appendChild(YTPlayer);
    var webview = document.querySelector("webview");
    webview.addEventListener("dom-ready", () => {
      //webview.openDevTools()
      logYT("And... The Magic things will start!");
    });
  },

  /****************************/
  /*** TelegramBot Commands ***/
  /****************************/
  EXT_TELBOTCommands (commander) {
    commander.add({
      command: "youtube",
      description: this.translate("YouTubeDescription"),
      callback: "tbYoutube"
    });
  },

  tbYoutube (command, handler) {
    var query = handler.args;
    if (query) {
      var args = query.toLowerCase().split(" ");
      var params = query.split(" ").slice(1).join(" ");
      switch (args[0]) {
        case "play":
          if (params) {
            params = params.split(" ");
            this.notificationReceived("EXT_YOUTUBE-PLAY", params[0]);
            handler.reply("TEXT", this.translate("YouTubePlay", { VALUES: params[0] }));
          } else handler.reply("TEXT", "/youtube play <video ID>");
          break;
        case "search":
          if (!this.searchInit) return handler.reply("TEXT", this.translate("YouTubeSearchDisabled"));
          if (params) {
            this.notificationReceived("EXT_YOUTUBE-SEARCH", params);
            handler.reply("TEXT", this.translate("YouTubeSearch", { VALUES: params }));
          }
          else handler.reply("TEXT", "/youtube search <youtube title/artist>");
          break;
        default:
          handler.reply("TEXT", this.translate("YouTubeCmdNotFound"));
          break;
      }
    } else {
      if (!this.config.password) handler.reply("TEXT", "This module is reserved to Donators of @bugsounet's modules\nIf you need password: Ask to @bugsounet to create it\nFreeDays youtube playing is every month from 01 to 07.", { parse_mode: "Markdown" });
      handler.reply("TEXT", this.translate("YouTubeHelp") + (this.searchInit ? this.translate("YouTubeSearchHelp") : ""), { parse_mode: "Markdown" });
    }
  }
});
