/******************
* EXT-Website
* bugsounet ©05/24
******************/

/* global WebsiteTranslations, sysInfoPage */

Module.register("EXT-Website", {
  defaults: {
    debug: false,
    username: "admin",
    password: "admin",
    useAPIDocs: false,
    useLimiter: true
  },

  start () {
    this.ready = false;
    this.config.translations = {};
    this.EXT_DB = [];
  },

  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case "INITIALIZED":
        this.ready = true;
        this.sendNotification("Bugsounet_HELLO");
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
      case "EXT_DB":
        this.EXT_DB = payload;
        console.log("[WEBSITE] Received Database", this.EXT_DB);
        break;
      case "EXT_DB-UPDATE":
        this.sendSocketNotification("EXT_DB-UPDATE", payload);
        break;
      case "EXT_STATUS":
        this.sendSocketNotification("EXT_STATUS", payload);
        break;
    }
  },

  getDom () {
    var dom = document.createElement("div");
    dom.style.display = "none";
    return dom;
  },

  async websiteInit () {
    this.sendSocketNotification("INIT", this.config);
  },
});
