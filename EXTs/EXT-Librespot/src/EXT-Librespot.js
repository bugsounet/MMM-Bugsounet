/**
 ** Module: EXT-Librespot
 ** @bugsounet
 **/

Module.register("EXT-Librespot", {
  defaults: {
    debug: false,
    deviceName: "MagicMirror",
    minVolume: 40,
    maxVolume: 100
  },

  start () {
    this.ready = false;
  },

  getDom () {
    var dom = document.createElement("div");
    dom.style.display = "none";
    return dom;
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

  notificationReceived (noti, payload, sender) {
    switch (noti) {
      case "Bugsounet_READY":
        if (sender.name === "MMM-Bugsounet") {
          this.sendSocketNotification("INIT", this.config);
          this.ready = true;
          this.sendNotification("Bugsounet_HELLO");
        }
        break;
      case "Bugsounet_PLAYER-SPOTIFY_RECONNECT":
        if (this.ready) this.sendSocketNotification("PLAYER-RECONNECT");
        break;
    }
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "WARNING":
        this.sendNotification("Bugsounet_ALERT", {
          type: "warning",
          message: this.translate(payload.message, { VALUES: payload.values }),
          icon: this.file("resources/Spotify-Logo.png")
        });
        break;
      case "PLAYING":
        this.sendNotification("Bugsounet_LIBRESPOT-PLAYING", payload);
        break;
    }
  },

  EXT_TELBOTCommands (commander) {
    commander.add({
      command: "librespot",
      description: this.translate("TBRestart"),
      callback: "tbLibrespot"
    });
  },

  tbLibrespot (command, handler) {
    this.sendSocketNotification("PLAYER-REFRESH");
    handler.reply("TEXT", this.translate("TBRestarted"));
  }
});
