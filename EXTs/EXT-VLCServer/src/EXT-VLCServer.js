/**
 ** Module: EXT-VLCServer
 ** @bugsounet
 **/

Module.register("EXT-VLCServer", {
  defaults: {
    debug: false,
    vlcPath: "/usr/bin"
  },

  getDom () {
    var dom = document.createElement("div");
    dom.style.display = "none";
    return dom;
  },

  getTranslations () {
    return {
      en: "translations/en.json",
      fr: "translations/fr.json"
    };
  },

  notificationReceived (noti, payload, sender) {
    switch (noti) {
      case "Bugsounet_READY":
        if (sender.name === "MMM-Bugsounet") {
          this.sendSocketNotification("INIT", this.config);
          this.sendNotification("Bugsounet_HELLO", this.name);
        }
        break;
    }
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "ERROR":
        this.sendNotification("Bugsounet_ALERT", {
          type: "error",
          message: this.translate(payload.message),
          timer: 10000
        });
        console.error(`[VLC] [ERROR] ${this.translate(payload.message)}`);
        break;
      case "WARNING":
        this.sendNotification("Bugsounet_ALERT", {
          type: "warning",
          message: this.translate(payload.message, { VALUES: payload.values }),
          timer: 10000
        });
        console.warn(`[VLC] [WARNING] ${this.translate(payload.message, { VALUES: payload.values })}`);
        break;
      case "STARTED":
        this.sendNotification("Bugsounet_VLCSERVER-START");
        break;
      case "CLOSED":
        this.sendNotification("Bugsounet_VLCSERVER-CLOSE");
        break;
    }
  }
});
