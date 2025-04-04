/*
 * EXT-Touch helper
 * @bugsounet
 * 2024-03-22
 */

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
    console.log("[TOUCH] EXT-Touch Version:", require("./package.json").version, "rev:", require("./package.json").rev);
    console.log("[TOUCH] Ready with Touch Screen");
    this.sendSocketNotification("INITIALIZED");
  }
});
