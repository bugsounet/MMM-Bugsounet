//
// Module : MMM-Bugsounet
//

"use strict";
var log = () => { /* do nothing */ };
var NodeHelper = require("node_helper");
const checker = require("./components/checker");
const controler = require("./components/controler");

module.exports = NodeHelper.create({
  requiresVersion: "2.30.0",
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
        if (this.config.debug) log = (...args) => { console.log("[Bugsounet]", ...args); };
        await checker.secure(this);
        this.controler = new controler();
        await this.controler.check_PM2_Process();
        await this.parseWebsite();
        this.lib.HyperWatch.enable();
        await this.website.init(this.config);
        this.sendSocketNotification("INITIALIZED");
        console.log("[Bugsounet] MMM-Bugsounet Ready!");
        break;
      case "setEXTStatus":
        this.website.setEXTStatus(payload);
        break;
      case "setHelloEXT":
        this.website.setEXTVersions(payload);
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
        this.sendSocketNotification("SYSINFO-RESULT", await this.website.website.systemInformation.lib.Get());
        break;
      case "TB_SYSINFO":
        var result = await this.website.website.systemInformation.lib.Get();
        result.sessionId = payload;
        this.sendSocketNotification("TB_SYSINFO-RESULT", result);
        break;
    }
  },

  async parseWebsite () {
    const bugsounet = await this.libraries();
    return new Promise((resolve) => {
      if (bugsounet) return this.bugsounetError(bugsounet);
      let WebsiteHelperConfig = {
        config: {
          username: this.config.username,
          password: this.config.password,
          useLimiter: this.config.useLimiter
        },
        debug: this.config.debug,
        lib: this.lib
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

      this.website = new this.lib.website(WebsiteHelperConfig, callback);
      resolve();
    });
  },

  libraries () {
    let Libraries = [
      { "./components/hyperwatch.js": "HyperWatch" },
      { "./components/systemInformation.js": "SystemInformation" },
      { "./components/website.js": "website" }
    ];

    let errors = 0;

    log("Loading website Libraries...");

    return new Promise((resolve) => {
      Libraries.forEach((library) => {
        for (const [name, configValues] of Object.entries(library)) {
          let libraryToLoad = name;
          let libraryName = configValues;

          try {
            if (!this.lib[libraryName]) {
              this.lib[libraryName] = require(libraryToLoad);
              log(`[Lib] Loaded: ${libraryToLoad} --> this.lib.${libraryName}`);
            }
          } catch (e) {
            //console.error(`[Bugsounet] [Lib] ${libraryToLoad} Loading error!`, e.message);
            console.error(`[Bugsounet] [Lib] ${libraryToLoad} Loading error!`, e);
            this.sendSocketNotification("ERROR", `Loading error! library: ${libraryToLoad}`);
            errors++;
            this.lib.error = errors;
          }
        }
      });
      resolve(errors);
      if (errors) {
        console.error("[Bugsounet] [Lib] Some libraries missing!");
      } else console.log("[Bugsounet] [Lib] All website libraries loaded!");
    });
  },

  bugsounetError (bugsounet) {
    console.error(`[Bugsounet] [Lib] Warning: ${bugsounet} needed library not loaded !`);
    console.error("[Bugsounet] [Lib] Try to solve it with `npm run rebuild` in MMM-Bugsounet folder");
    this.sendSocketNotification("WARNING", "Try to solve it with 'npm run rebuild' in MMM-Bugsounet folder");
  }
});
