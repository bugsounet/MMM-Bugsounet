//
// Module : MMM-Bugsounet
//

"use strict";
var NodeHelper = require("node_helper");
const checker = require("./components/checker");
const controler = require("./components/controler");
const api = require("./components/api");

module.exports = NodeHelper.create({
  requiresVersion: "2.31.0",
  start () {
    this.lib = { error: 0 };
    this.config = {};
    this.alreadyInitialized = false;
    this.lib = { error: 0 };
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

        this.alreadyInitialized = true;
        this.sendSocketNotification("BUGSOUNET-INIT");
        break;
      case "INIT":
        this.config = payload;
        await checker.secure(this);
        this.controler = new controler();
        await this.controler.check_PM2_Process();
        await this.parserAPI();
        await this.api.init(this.config);
        this.sendSocketNotification("INITIALIZED");
        console.log("[Bugsounet] MMM-Bugsounet Ready!");
        break;
      case "setEXTStatus":
        this.api.setEXTStatus(payload);
        break;
      case "setHelloEXT":
        this.api.setEXTVersions(payload);
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
      case "GET-SYSINFO":
        this.sendSocketNotification("SYSINFO-RESULT", await this.api.website.systemInformation.lib.Get());
        break;
      case "TB_SYSINFO":
        var result = await this.api.website.systemInformation.lib.Get();
        result.sessionId = payload;
        this.sendSocketNotification("TB_SYSINFO-RESULT", result);
        break;
    }
  },

  parserAPI () {
    return new Promise((resolve) => {
      let APIHelperConfig = {
        config: {
          username: this.config.username,
          password: this.config.password,
          useLimiter: this.config.useLimiter
        },
        debug: this.config.debug
      };
      let callback = {
        sendSocketNotification: (...args) => this.sendSocketNotification(...args),
        sendInternalCallback: (value) => {
          switch (value) {
            case "STOP":
              this.sendSocketNotification("BUGSOUNET-STOP");
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
            case "DIE":
              this.controler.doClose();
              break;
          }
        }
      };

      this.api = new api(APIHelperConfig, callback);
      resolve();
    });
  }
});
