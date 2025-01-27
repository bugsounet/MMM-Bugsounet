//
// Module : MMM-Bugsounet
//

const fs = require("node:fs");
const { exec } = require("node:child_process");
var NodeHelper = require("node_helper");
const checker = require("./components/checker");
const controler = require("./components/controler");

var log = () => { /* do nothing */ };

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
        if (this.config.debug) log = (...args) => { console.log("[Bugsounet]", ...args); };
        this.alreadyInitialized = true;
        await checker.secure();
        this.sendSocketNotification("BUGSOUNET-INIT")
        break;
      case "INIT":
        var Version = {
          version: require("./package.json").version,
          rev: require("./package.json").rev,
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
  },

  libraries (type) {
    let Libraries = [];
    let GA = [
      // { "library to load" : "store library name" }
      { "./components/googleSearch.js": "googleSearch" },
      { "./components/assistant.js": "Assistant" },
      { "./components/screenParser.js": "ScreenParser" },
      { "./components/controler.js": "Controler" }
    ];

    let errors = 0;

    switch (type) {
      case "GA":
        logGA("Loading GA Libraries...");
        Libraries = GA;
        break;
      default:
        console.log(`[Bugsounet] ${type}: Unknow library database...`);
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
              logGA(`[LIB] Loaded: ${libraryToLoad} --> this.lib.${libraryName}`);
            }
          } catch (e) {
            console.error(`[Bugsounet] [LIB] ${libraryToLoad} Loading error!`, e.message, e);
            this.sendSocketNotification("ERROR", `Loading error! library: ${libraryToLoad}`);
            errors++;
            this.lib.error = errors;
          }
        }
      });
      resolve(errors);
      if (errors) {
        console.error("[Bugsounet] [LIB] Some libraries missing!");
        if (type === "GA") this.sendSocketNotification("NOT_INITIALIZED", { message: "Library loading Error!" });
      } else console.log(`[Bugsounet] [LIB] All ${type} libraries loaded!`);
    });
  },

  bugsounetError (bugsounet, family) {
    console.error(`[Bugsounet] [DATA] [${family}] Warning: ${bugsounet} needed library not loaded !`);
    console.error("[Bugsounet] [DATA] Try to solve it with `npm run rebuild` in MMM-GoogleAssistant folder");
    this.sendSocketNotification("WARNING", `[${family}] Try to solve it with 'npm run rebuild' in MMM-GoogleAssistant folder`);
  },

  loadRecipes () {
    return new Promise((resolve) => {
      if (this.config.recipes) {
        let replacer = (key, value) => {
          if (typeof value === "function") {
            return `__FUNC__${value.toString()}`;
          }
          return value;
        };
        var recipes = this.config.recipes;
        var nb_Err = 0;
        for (var i = 0; i < recipes.length; i++) {
          try {
            var p = require(`./recipes/${recipes[i]}`).recipe;
            this.sendSocketNotification("LOAD_RECIPE", JSON.stringify(p, replacer, 2));
            console.log("[Bugsounet] [RECIPES] LOADED:", recipes[i]);
          } catch (e) {
            console.error("[Bugsounet] [RECIPES] LOADING ERROR:", recipes[i]);
            console.error("[Bugsounet] [RECIPES] DETAIL:", e.message);
            this.sendSocketNotification("RECIPE_ERROR", recipes[i]);
            nb_Err++;
          }
        }
        if (!nb_Err) console.log("[Bugsounet] Recipes loaded!");
        else console.log(`[Bugsounet] Recipes loaded but ${nb_Err} error(s) detected!`);
        resolve();
      } else {
        logGA("[RECIPES] No Recipes to Load...");
        resolve();
      }
    });
  },

  shellExec (payload) {
    var command = payload.command;
    if (!command) return console.error("[Bugsounet] [SHELLEXEC] no command to execute!");
    command += (payload.options) ? (`${payload.options}`) : "";
    exec(command, (e, so, se) => {
      logGA("[SHELLEXEC] command:", command);
      if (e) {
        console.error(`[Bugsounet] [SHELL_EXEC] ${e.message}`);
        this.sendSocketNotification("WARNING", "ShellExecError");
      }
      logGA("[SHELL_EXEC] RESULT", {
        executed: payload,
        result: {
          error: e,
          stdOut: so,
          stdErr: se
        }
      });
    });
  },

  activate (payload) {
    logGA("[ACTIVATE_ASSISTANT] QUERY:", payload);
    var assistantConfig = Object.assign({}, this.config.assistantConfig);
    assistantConfig.debug = this.config.debug;
    assistantConfig.lang = payload.lang;
    assistantConfig.micConfig = this.config.micConfig;
    this.assistant = new this.lib.Assistant(assistantConfig, (obj) => { this.sendSocketNotification("TUNNEL", obj); });

    var parserConfig = {
      responseOutputCSS: this.config.responseConfig.responseOutputCSS,
      responseOutputURI: "tmp/responseOutput.html",
      responseOutputZoom: this.config.responseConfig.zoom.responseOutput
    };
    var parser = new this.lib.ScreenParser(parserConfig, this.config.debug);
    this.assistant.activate(payload, (response) => {
      response.lastQuery = payload;

      if (!(response.screen || response.audio)) {
        if (!response.audio && !response.screen && !response.text) response.error.error = "NO_RESPONSE";
        if (response.transcription && response.transcription.transcription && !response.transcription.done) {
          response.error.error = "TRANSCRIPTION_FAILS";
        }
      }
      if (response && response.error.audio && !response.error.message) response.error.error = "TOO_SHORT";

      if (response.screen) {
        parser.parse(response, (result) => {
          delete result.screen.originalContent;
          logGA("[ACTIVATE_ASSISTANT] RESULT", result);
          this.sendSocketNotification("ASSISTANT_RESULT", result);
        });
      } else {
        logGA("[ACTIVATE_ASSISTANT] RESULT", response);
        this.sendSocketNotification("ASSISTANT_RESULT", response);
      }
    });
  }
});
