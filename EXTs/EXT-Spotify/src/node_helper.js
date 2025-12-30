"use strict";

var NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
  socketNotificationReceived (noti) {
    switch (noti) {
      case "INIT":
        console.log("[SPOTIFY] EXT-Spotify Version:", require("./package.json").version, "rev:", require("./package.json").rev);
        break;
    }
  }
});
