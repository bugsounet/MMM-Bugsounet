/*
 * EXT-Detector helper
 * @bugsounet
 */

"use strict";
let log = () => { /* do nothing */ };
const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
  start () {
    this.config = {};
    this.porcupine = null;
    this.porcupineConfig = [];
    this.snowboyConfig = {};
    this.snowboy = null;
    this.Snowboy = [];
    this.Porcupine = [];
    this.porcupineCanRestart = false;
    this.detector = false;
    this.running = false;
    this.lib = {};
    this.detectorModel = 0;
  },

  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case "INIT":
        this.config = payload;
        this.initialize();
        break;
      case "START":
        if (!this.running) { this.activate(); }
        break;
      case "STOP":
        if (this.running) { this.deactivate(payload); }
        break;
    }
  },

  /** [DATA] **/
  async initialize () {
    console.log("[DETECTOR] EXT-Detector Version:", require("./package.json").version, "rev:", require("./package.json").rev);
    if (this.config.debug) {
      log = (...args) => { console.log("[DETECTOR]", ...args); };
    }
    await this.detectorFilter();
    const bugsounet = await this.libraries();
    if (bugsounet) {
      console.error(`[DETECTOR] [DATA] Warning: ${bugsounet} needed library not loaded !`);
      console.error("[DETECTOR] [DATA] Try to solve it with: npm run rebuild");
      return;
    }

    this.config.mic.recorder = "arecord";
    this.config.snowboyMicConfig.recorder = "arecord";

    if (this.Porcupine.length) {

      /* Porcupine init */
      this.porcupineConfig.accessKey = this.config.porcupineAccessKey || null;
      this.porcupineConfig.customModel = this.config.porcupineCustomModel ? `${__dirname}/custom/${this.config.porcupineCustomModel}` : null;
      this.porcupineConfig.detectors = [];

      if (!this.porcupineConfig.accessKey) {
        this.sendSocketNotification("ACCESSKEY");
      }
      this.Porcupine.forEach((detector) => {
        const values = {};
        if (detector.Model) {
          values.Model = detector.Model;
          values.Sensitivity = detector.Sensitivity ? detector.Sensitivity : 0.7;
          this.porcupineConfig.detectors.push(values);
        }
      });
      log("[DATA] Porcupine DetectorConfig:", this.porcupineConfig);
      this.porcupine = await new this.lib.Porcupine(this.porcupineConfig, this.config.mic, (detect) => this.onDetected("Porcupine", detect), this.config.debug);
      this.porcupine.init();
      if (!this.porcupine.initialized) {
        this.sendSocketNotification("PORCUPINENOTINIT");
      } else if (this.porcupine.keywordNames && this.porcupine.keywordNames.length) {
        console.log(`[DETECTOR] [DATA] Porcupine is initialized with ${this.porcupine.keywordNames.length} Models: ${this.porcupine.keywordNames.toString()}`);
        this.detectorModel += this.porcupine.keywordNames.length;
      }
    }

    if (this.Snowboy.length) {

      /* Snowboy init */
      this.snowboyConfig = this.Snowboy;
      log("[DATA] Snowboy DetectorConfig:", this.snowboyConfig);
      this.snowboy = await new this.lib.Snowboy.Snowboy(this.snowboyConfig, this.config.snowboyMicConfig, (detect) => this.onDetected("Snowboy", detect), this.config.debug);
      this.snowboy.init();
      if (this.snowboy.modelsNumber()) {
        console.log(`[DETECTOR] [DATA] Snowboy is initialized with ${this.snowboy.modelsNumber()} Models: ${this.snowboy.modelsNames()}`);
        this.detectorModel += this.snowboy.modelsNumber();
      }
    }

    if (this.detectorModel) {
      this.sendSocketNotification("INITIALIZED");
      console.log("[DETECTOR] [DATA] Initialized");
    } else {
      this.sendSocketNotification("NOT_INITIALIZED");
      console.error("[DETECTOR] [DATA] No detector initialized!");
    }
  },

  detectorFilter () {
    return new Promise((resolve) => {
      this.Snowboy = this.config.detectors.filter((detector) => detector.detector === "Snowboy");
      this.Porcupine = this.config.detectors.filter((detector) => detector.detector === "Porcupine");
      resolve();
    });
  },

  /** [LIBRARY]  **/
  libraries () {
    const libraries = [
      // { "library to load" : "store library name" }
      { "./components/porcupine": "Porcupine" },
      { "./components/snowboy": "Snowboy" }
    ];
    let errors = 0;
    return new Promise((resolve) => {
      libraries.forEach((library) => {
        for (const [name, configValues] of Object.entries(library)) {
          const libraryToLoad = name;
          const libraryName = configValues;

          try {
            if (!this.lib[libraryName]) {
              if ((libraryName === "Snowboy" && !this.Snowboy.length) || (libraryName === "Porcupine" && !this.Porcupine.length)) {
                log("[LIBRARY] Ignored:", libraryToLoad);
              } else {
                this.lib[libraryName] = require(libraryToLoad);
                log(`[LIBRARY] Loaded: ${libraryToLoad} --> this.lib.${libraryName}`);
              }
            }
          } catch (err) {
            console.error(`[DETECTOR] [LIBRARY] ${libraryToLoad} Loading error!`, err.message);
            this.sendSocketNotification("WARNING", { library: libraryToLoad });
            errors++;
            this.lib.error = errors;
          }
        }
      });
      if (!errors) { console.log("[DETECTOR] [LIBRARY] All libraries loaded!"); }
      resolve(errors);
    });
  },

  /** [RULES] **/
  activate () {
    if (this.porcupine && this.porcupine.initialized && (this.porcupine.keywordNames.length || this.porcupineCanRestart)) {
      this.porcupine.start();
      this.porcupineCanRestart = true;
      this.detector = true;
    }
    if (this.snowboy && this.snowboy.modelsNumber()) {
      this.snowboy.start();
      this.detector = true;
    }
    if (this.detector) {
      this.running = true;
      this.sendSocketNotification("LISTENING");
      console.log(`[DETECTOR] [RULES] Start listening. ${this.detectorModel} Models`);
      return true;
    }
    this.sendSocketNotification("NOT_INITIALIZED");
    console.error("[DETECTOR] [RULES] No detector initialized!");
    return false;
  },

  onDetected (from, detected) {
    this.deactivate();
    console.log(`[DETECTOR] [RULES] Detected: ${detected} from: ${from}`);
    this.sendSocketNotification("DETECTED");
  },

  deactivate (withNoti = true) {
    if (this.porcupine) {
      this.porcupine.stop();
      this.detector = false;
    }
    if (this.snowboy) {
      this.snowboy.stop();
      this.detector = false;
    }
    if (!this.detector) {
      this.running = false;
      if (withNoti) { this.sendSocketNotification("DISABLED"); }
      console.log("[DETECTOR] [RULES] Stop listening.");
    }
  }
});
