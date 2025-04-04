/*******************
* EXT-Background   *
* BuGsounet ©02/22 *
*******************/

const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
  socketNotificationReceived (notification) {
    switch (notification) {
      case "INIT":
        console.log("[BACKGROUND] EXT-Background Version:", require("./package.json").version, "rev:", require("./package.json").rev);
        break;
    }
  }
});
