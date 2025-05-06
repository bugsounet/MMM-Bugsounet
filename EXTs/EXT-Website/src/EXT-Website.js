/******************
* EXT-Website
* bugsounet ©05/24
******************/

Module.register("EXT-Website", {
  defaults: {
    debug: false
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
        if (sender.name === "MMM-Bugsounet") this.sendSocketNotification("INIT", this.config);
        break;
    }
  },

  getDom () {
    var dom = document.createElement("div");
    dom.style.display = "none";
    return dom;
  }
});
