/**
 ** Module: EXT-Librespot
 ** @bugsounet
 **/

/* global Bugsounet_translate */

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

  notificationReceived (noti, payload, sender) {
    switch (noti) {
      case "Bugsounet_READY":
        if (sender.name === "MMM-Bugsounet") {
          this.sendSocketNotification("INIT", this.config);
          this.ready = true;
          this.sendNotification("Bugsounet_HELLO");
        }
        break;
      case "Bugsounet_STOP":
      case "Bugsounet_LIBRESPOT_RECONNECT":
        if (this.ready) this.sendSocketNotification("PLAYER-RECONNECT");
        break;
    }
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "WARNING":
        this.sendNotification("Bugsounet_ALERT", {
          type: "warning",
          message: Bugsounet_translate(payload.message, { VALUES: payload.values }),
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
      description: Bugsounet_translate("EXT-Librespot_TBRestart"),
      callback: "tbLibrespot"
    });
  },

  tbLibrespot (command, handler) {
    this.sendSocketNotification("PLAYER-REFRESH");
    handler.reply("TEXT", Bugsounet_translate("EXT-Librespot_TBRestarted"));
  }
});
