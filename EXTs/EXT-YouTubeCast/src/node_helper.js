"use strict";

var NodeHelper = require("node_helper");

var log = () => { /* do nothing */ };
var LibCast = require("./components/castLib");

module.exports = NodeHelper.create({
  socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "INIT":
        console.log("[CAST] EXT-YouTubeCast Version:", require("./package.json").version, "rev:", require("./package.json").rev);
        this.initialize(payload);
        break;
    }
  },

  async initialize (config) {
    this.config = config;
    if (this.config.debug) log = (...args) => { console.log("[CAST]", ...args); };
    this.serverStart();
  },

  serverStart () {
    log("Starting...");
    if (this.config.castName) {
      this.cast = new LibCast(
        this.config,
        (noti, params) => this.sendSocketNotification(noti, params),
        this.config.debug
      );
      this.cast.start();
    } else {
      this.sendSocketNotification("CAST_WARNING");
    }
  }
});
