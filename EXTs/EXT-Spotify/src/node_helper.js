"use strict";

var NodeHelper = require("node_helper");

const spotify = require("./components/spotifyLib");

module.exports = NodeHelper.create({
  socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "INIT":
        console.log("[SPOTIFY] EXT-Spotify Version:", require("./package.json").version, "rev:", require("./package.json").rev);
        this.initialize(payload);
        break;
      case "LIBRESPOT-EVENTS":
        this.spotify.librespot(payload);
        break;
    }
  },

  async initialize (config) {
    this.config = config;

    try {
      this.spotify = new spotify(this.config.visual,
        (noti, params) => {
          this.sendSocketNotification(noti, params);
        },
        this.config.debug);
    } catch (e) {
      console.log(`[SPOTIFY] Error From library: ${e}`);
    }
  }
});
