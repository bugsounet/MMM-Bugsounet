/*****************************
* node_helper for EXT-Screen *
* BuGsounet                  *
*****************************/

const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
  socketNotificationReceived (notification) {
    switch (notification) {
      case "INIT":
        this.initialize();
        break;
    }
  },

  initialize () {
    console.log("[SCREEN] EXT-Screen Version:", require("./package.json").version, "rev:", require("./package.json").rev);
    this.sendSocketNotification("INITIALIZED");
  }
});
