/******************
* EXT-SmartHome
******************/

Module.register("EXT-SmartHome", {
  defaults: {
    debug: false,
    username: "admin",
    password: "admin",
    CLIENT_ID: null
  },

  start () {
    this.ready = false;
    this.config.translations = {};
    this.EXT_DB = [];
  },

  socketNotificationReceived (notification, payload) {
    if (notification.startsWith("CB_")) return this.callbacks(notification, payload);
    switch (notification) {
      case "INITIALIZED":
        this.ready = true;
        this.sendNotification("Bugsounet_HELLO", this.name);
        break;
      case "SendNoti":
        if (payload.payload && payload.noti) this.sendNotification(payload.noti, payload.payload);
        else this.sendNotification(payload);
        break;
    }
  },

  notificationReceived (notification, payload, sender) {
    switch (notification) {
      case "Bugsounet_READY":
        if (sender.name === "MMM-Bugsounet") this.websiteInit();
        break;
      case "Bugsounet_STATUS":
        this.sendSocketNotification("Bugsounet_STATUS", payload);
        break;
    }
  },

  getDom () {
    var dom = document.createElement("div");
    dom.style.display = "none";
    return dom;
  },

  async websiteInit () {
    this.config.EXT_DB = this.EXT_DB;
    this.sendSocketNotification("INIT", this.config);
  },

  /** smarthome callbacks **/
  callbacks (noti, payload) {
    switch (noti) {
      case "CB_SCREEN":
        if (payload === "ON") this.sendNotification("Bugsounet_SCREEN-FORCE_WAKEUP");
        else if (payload === "OFF") {
          this.sendNotification("Bugsounet_STOP");
          this.sendNotification("Bugsounet_SCREEN-FORCE_END");
        }
        break;
      case "CB_VOLUME":
        this.sendNotification("Bugsounet_VOLUME-SPEAKER_SET", payload);
        break;
      case "CB_VOLUME-MUTE":
        this.sendNotification("Bugsounet_VOLUME-SPEAKER_MUTE", payload);
        break;
      case "CB_VOLUME-UP":
        this.sendNotification("Bugsounet_VOLUME-SPEAKER_UP", payload);
        break;
      case "CB_VOLUME-DOWN":
        this.sendNotification("Bugsounet_VOLUME-SPEAKER_DOWN", payload);
        break;
      case "CB_SET-PAGE":
        this.sendNotification("Bugsounet_PAGES-CHANGED", payload);
        break;
      case "CB_SET-NEXT-PAGE":
        this.sendNotification("Bugsounet_PAGES-INCREMENT");
        break;
      case "CB_SET-PREVIOUS-PAGE":
        this.sendNotification("Bugsounet_PAGES-DECREMENT");
        break;
      case "CB_ALERT":
        this.sendNotification("Bugsounet_ALERT", {
          message: payload,
          type: "warning",
          timer: 10000
        });
        break;
      case "CB_DONE":
        this.sendNotification("Bugsounet_ALERT", {
          message: payload,
          type: "information",
          timer: 5000
        });
        break;
      case "CB_LOCATE":
        this.sendNotification("Bugsounet_ALERT", {
          message: "Hey, I'm here !",
          type: "information",
          sound: "modules/MMM-Bugsounett/EXTs/EXT-Website/website/tools/locator.mp3",
          timer: 19000
        });
        break;
      case "CB_SPOTIFY-PLAY":
        this.sendNotification("BugsounetT_SPOTIFY-PLAY");
        break;
      case "CB_SPOTIFY-PAUSE":
        this.sendNotification("Bugsounet_SPOTIFY-PAUSE");
        break;
      case "CB_SPOTIFY-PREVIOUS":
        this.sendNotification("Bugsounet_SPOTIFY-PREVIOUS");
        break;
      case "CB_SPOTIFY-NEXT":
        this.sendNotification("Bugsounet_SPOTIFY-NEXT");
        break;
      case "CB_STOP":
        this.sendNotification("Bugsounet_STOP");
        break;
      case "CB_TV-PLAY":
        this.sendNotification("Bugsounet_FREEBOXTV-PLAY", payload);
        break;
      case "CB_TV-NEXT":
        this.sendNotification("Bugsounet_FREEBOXTV-NEXT");
        break;
      case "CB_TV-PREVIOUS":
        this.sendNotification("Bugsounet_FREEBOXTV-PREVIOUS");
        break;
      case "CB_RESTART":
        this.sendNotification("Bugsounet_GATEWAY-Restart");
    }
  }
});
