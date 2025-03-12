//
// Module : MMM-Bugsounet
//

var NodeHelper = require("node_helper");
const checker = require("./components/checker");
const controler = require("./components/controler");

module.exports = NodeHelper.create({
  requiresVersion: "2.30.0",
  start () {
    this.lib = { error: 0 };
    this.config = {};
    this.alreadyInitialized = false;
  },

  async socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "PRE-INIT":
        if (this.alreadyInitialized) {
          console.error("[Bugsounet] You can't use MMM-Bugsounet in server mode");
          this.sendSocketNotification("ERROR", "You can't use MMM-Bugsounet in server mode");
          setTimeout(() => process.exit(), 5000);
          return;
        }
        console.log(`[Bugsounet] MMM-Bugsounet Version: ${require("./package.json").version} rev: ${require("./package.json").rev}`);
        this.config = payload;
        this.alreadyInitialized = true;
        await checker.secure(this);
        this.sendSocketNotification("BUGSOUNET-INIT");
        break;
      case "INIT":
        var Version = {
          version: require("./package.json").version,
          rev: require("./package.json").rev
        };
        this.controler = new controler();
        await this.controler.check_PM2_Process();
        this.sendSocketNotification("INITIALIZED", Version);
        console.log("[Bugsounet] MMM-Bugsounet Ready!");
        break;
      case "REBOOT":
        this.controler.SystemReboot();
        break;
      case "SHUTDOWN":
        this.controler.SystemShutdown();
        break;
      case "RESTART":
        this.controler.restartMM();
        break;
      case "CLOSE":
        this.controler.doClose();
        break;
    }
  }
});
