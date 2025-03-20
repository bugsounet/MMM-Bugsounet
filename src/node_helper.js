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
    }
  },

  async parseWebsite () {
    const bugsounet = await this.libraries("website");
    return new Promise((resolve) => {
      if (bugsounet) return this.bugsounetError(bugsounet, "Website");
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

  libraries (type) {
    let Libraries = [];

    let website = [
      { "./components/hyperwatch.js": "HyperWatch" },
      { "./components/systemInformation.js": "SystemInformation" },
      { "./components/website.js": "website" }
    ];

    let errors = 0;

    switch (type) {
      case "website":
        log("Loading website Libraries...");
        Libraries = website;
        break;
      default:
        console.log(`${type}: Unknow library database...`);
        return;
    }

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
        //this.sendSocketNotification("NOT_INITIALIZED", { message: "Library loading Error!" });
      } else console.log(`[Bugsounet] [Lib] All ${type} libraries loaded!`);
    });
  },

  bugsounetError (bugsounet, family) {
    console.error(`[Bugsounet] [Lib] [${family}] Warning: ${bugsounet} needed library not loaded !`);
    console.error("[Bugsounet] [Lib] Try to solve it with `npm run rebuild` in MMM-Bugsounet folder");
    this.sendSocketNotification("WARNING", `[${family}] Try to solve it with 'npm run rebuild' in MMM-Bugsounet folder`);
  }
});
