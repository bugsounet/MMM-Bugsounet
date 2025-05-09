/******************************
* node_helper for EXT-Website *
******************************/

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
    }
  },

  async initialize () {
    console.log(`[WEBSITE] EXT-Website Version: ${require("./package.json").version} rev: ${require("./package.json").rev}`);
    if (this.config.debug) log = (...args) => { console.log("[WEBSITE]", ...args); };
    await this.parseWebsite();
    this.lib.HyperWatch.enable();
    this.website.init(this.config);
  },

  async parseWebsite () {
    const bugsounet = await this.libraries("website");
    return new Promise((resolve) => {
      if (bugsounet) return this.bugsounetError(bugsounet, "Website");
      let WebsiteHelperConfig = {
        debug: this.config.debug,
        lib: this.lib
      };

      this.website = new this.lib.website(WebsiteHelperConfig, (...args) => this.sendSocketNotification(...args));
      resolve();
    });
  },

  libraries (type) {
    let Libraries = [];

    let website = [
      { "./components/hyperwatch.js": "HyperWatch" },
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
              log(`[LIB] Loaded: ${libraryToLoad} --> this.lib.${libraryName}`);
            }
          } catch (e) {
            //console.error(`[WEBSITE] [LIB] ${libraryToLoad} Loading error!`, e.message);
            console.error(`[WEBSITE] [LIB] ${libraryToLoad} Loading error!`, e);
            this.sendSocketNotification("ERROR", `Loading error! library: ${libraryToLoad}`);
            errors++;
            this.lib.error = errors;
          }
        }
      });
      resolve(errors);
      if (errors) {
        console.error("[WEBSITE] [LIB] Some libraries missing!");
      } else console.log(`[WEBSITE] [LIB] All ${type} libraries loaded!`);
    });
  },

  bugsounetError (bugsounet, family) {
    console.error(`[WEBSITE] [DATA] [${family}] Warning: ${bugsounet} needed library not loaded !`);
    console.error("[WEBSITE] [DATA] Try to solve it with `npm run rebuild` in EXT-Website folder");
    this.sendSocketNotification("WARNING", `[${family}] Try to solve it with 'npm run rebuild' in EXT-Website folder`);
  }
});
