/**
 ** Plugin: EXT-Spotify
 ** @bugsounet
 **/

/* global Spotify */

Module.register("EXT-Spotify", {
  defaults: {
    debug: false,
    mini: true
  },

  start () {
    this.init = false;

    var callbacks = {
      spotifyStatus: (status) => {
        if (status) {
          this.sendNotification("Bugsounet_SPOTIFY-CONNECTED");
        } else {
          this.sendNotification("Bugsounet_SPOTIFY-DISCONNECTED");
        }
      },
      hide: (...args) => this.hide(...args),
      show: (...args) => this.show(...args)
    };

    this.Spotify = new Spotify(this.config, callbacks);
  },

  getScripts () {
    return [this.file("components/spotifyClass.js")];
  },

  getStyles () {
    return [
      "EXT-Spotify.css",
      "modules/MMM-Bugsounet/node_modules/@mdi/font/css/materialdesignicons.min.css",
      "font-awesome.css"
    ];
  },

  getDom () {
    return this.Spotify.prepare();
  },

  notificationReceived (noti, payload, sender) {
    switch (noti) {
      case "Bugsounet_READY":
        if (sender.name === "MMM-Bugsounet") {
          this.sendSocketNotification("INIT");
          this.init = true;
          this.sendNotification("Bugsounet_HELLO");
        }
        break;
      case "Bugsounet_LIBRESPOT-EVENTS":
        if (this.init) this.Spotify.updateCurrentSpotify(payload);
        break;
      case "Bugsounet_LIBRESPOT-IDLE":
        if (this.init) this.Spotify.updatePlayback(false);
        break;
    }
  }
});
