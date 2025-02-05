/********************************
* node_helper for EXT-SmartHome *
********************************/

"use strict";
var log = () => { /* do nothing */ };
const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
  start () {
    this.config = {};
    this.lib = { error: 0 };
  },

  async socketNotificationReceived (notification, payload) {
    switch (notification) {
      case "INIT":
        this.config = payload;
        this.initialize();
        break;
      case "Bugsounet_STATUS":
        if (this.smarthome) {
          this.smarthome.setEXTStatus(payload);
          this.updateSmartHome();
        } else {
          // library is not loaded ... retry (not needed but...)
          setTimeout(() => {
            console.log("retry...");
            this.socketNotificationReceived("Bugsounet_STATUS", payload);
          }, 1000);
        }
        break;
    }
  },

  initialize () {
    console.log(`[SMARTHOME] EXT-SmartHome Version: ${require("./package.json").version} rev: ${require("./package.json").rev}`);
    if (this.config.debug) log = (...args) => { console.log("[SMARTHOME]", ...args); };
    this.parseSmartHome();
  },

  async parseSmartHome () {
    const bugsounet = await this.libraries("smarthome");

    if (bugsounet) return this.bugsounetError(bugsounet, "smarthome");
    let HelperConfig = {
      username: this.config.username,
      password: this.config.password,
      CLIENT_ID: this.config.CLIENT_ID,
      debug: this.config.debug,
      lang: config.language
    };

    let callbacks = {
      sendSocketNotification: (...args) => this.sendSocketNotification(...args)
    };

    this.smarthome = new this.lib.smarthome(HelperConfig, callbacks);
    await this.smarthome.init();
    this.smarthome.createMiddleware();
  },

  updateSmartHome () {
    if (this.smarthome.smarthome.use) {
      if (this.smarthome.smarthome.initialized) this.smarthome.refreshData();
      if (this.smarthome.smarthome.ready) this.smarthome.updateGraph();
    }
  },

  libraries (type) {
    let Libraries = [];

    let smarthome = [{ "./components/smarthome.js": "smarthome" }];
    let errors = 0;

    switch (type) {
      case "smarthome":
        log("Loading smarhome Libraries...");
        Libraries = smarthome;
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
              log(`[LIB] Loaded: ${libraryToLoad} --> this.lib.${libraryName}`);
            }
          } catch (e) {
            console.error(`[SMARTHOME] [LIB] ${libraryToLoad} Loading error!`, e);
            this.sendSocketNotification("ERROR", `Loading error! library: ${libraryToLoad}`);
            errors++;
            this.lib.error = errors;
          }
        }
      });
      resolve(errors);
      if (errors) {
        console.error("[SMARTHOME] [LIB] Some libraries missing!");
      } else console.log(`[SMARTHOME] [LIB] All ${type} libraries loaded!`);
    });
  },

  bugsounetError (bugsounet, family) {
    console.error(`[SMARTHOME] [DATA] [${family}] Warning: ${bugsounet} needed library not loaded !`);
    console.error("[SMARTHOME] [DATA] Try to solve it with `npm install` in EXT-SmartHome folder");
    this.sendSocketNotification("WARNING", `[${family}] Try to solve it with 'npm install' in EXT-SmartHome folder`);
  }
});
