/*
 **************************
 * Snowboy library
 * multi-keyword listener
 * @bugsounet
 * 2024-02-08
 *************************
 */

"use strict";
const path = require("path");
const fs = require("fs");
const Detector = require("./lib/node/index").Detector;
const Models = require("./lib/node/index").Models;
const Recorder = require("./lpcm16");

const snowboyDict = {
  smart_mirror: {
    hotwords: "smart_mirror",
    file: "smart_mirror.umdl",
    sensitivity: "0.5"
  },
  computer: {
    hotwords: "computer",
    file: "computer.umdl",
    sensitivity: "0.6"
  },
  snowboy: {
    hotwords: "snowboy",
    file: "snowboy.umdl",
    sensitivity: "0.5"
  },
  jarvis: {
    hotwords: ["jarvis", "jarvis"],
    file: "jarvis.umdl",
    sensitivity: "0.7,0.7"
  },
  subex: {
    hotwords: "subex",
    file: "subex.umdl",
    sensitivity: "0.6"
  },
  neo_ya: {
    hotwords: ["neo_ya", "neo_ya"],
    file: "neoya.umdl",
    sensitivity: "0.7,0.7"
  },
  hey_extreme: {
    hotwords: "hey_extreme",
    file: "hey_extreme.umdl",
    sensitivity: "0.6"
  },
  view_glass: {
    hotwords: "view_glass",
    file: "view_glass.umdl",
    sensitivity: "0.7"
  }
};

let log = () => { /* do nothing */ };

class Snowboy {
  constructor (config, mic, callback = () => {}, debug) {
    this.micConfig = mic;
    this.config = config;
    this.callback = callback;
    this.model = [];
    this.models = [];
    this.mic = null;
    this.detector = null;
    this.debug = debug;
    if (this.debug) {
      log = (...args) => { console.log("[DETECTOR] [SNOWBOY]", ...args); };
    }
    this.defaultConfig = {
      usePMDL: false,
      Model: "jarvis",
      Sensitivity: null
    };
    this.defaultMicOption = {
      audioGain: 2.0,
      applyFrontend: true,
      recorder: "arecord",
      device: "plughw:1",
      sampleRate: 16000,
      channels: 1,
      threshold: 0.5,
      thresholdStart: null,
      thresholdEnd: null,
      silence: "1.0",
      verbose: false,
      debug: this.debug
    };
    this.recorderOptions = Object.assign({}, this.defaultMicOption, this.micConfig);
  }

  init () {
    const modelPath = path.resolve(__dirname, "../resources/models");
    this.models = new Models();
    log("Checking models");
    this.config.forEach((config, nb) => {
      /* eslint-disable no-param-reassign */
      config = Object.assign(this.defaultConfig, config);
      /* eslint-enable no-param-reassign */
      let found = 0;
      if (!config.usePMDL) {
        if (config.Model) {
          for (const [item, value] of Object.entries(snowboyDict)) {
            if (config.Model === item) {
              log("Model selected:", item);
              if (config.Sensitivity) {
                if ((isNaN(config.Sensitivity)) || (Math.ceil(config.Sensitivity) > 1)) {
                  console.error("[DETECTOR] [SNOWBOY] Wrong Sensitivity value in", config.Model);
                } else if (item === "jarvis" || item === "neo_ya") {
                  value.sensitivity = `${config.Sensitivity},${config.Sensitivity}`;
                }
                else { value.sensitivity = config.Sensitivity; }
              }
              log("Sensitivity set:", value.sensitivity);
              this.model[nb] = value;
              found = 1;
            }
          }
        }
        if (this.model.length === 0 || !found) { return console.error("[DETECTOR] [SNOWBOY] Error: model not found:", config.Model); }
        this.model.forEach(() => {
          this.model[nb].file = path.resolve(modelPath, `${config.Model}.umdl`);
          this.models.add(this.model[nb]);
        });
      } else if (config.Model && config.usePMDL) {
        const PMDLPath = path.resolve(__dirname, "../custom"); // personal PMDL are inside resources directory
        if (!fs.existsSync(`${PMDLPath}/${config.Model}.pmdl`)) {
          return console.error(`[DETECTOR] [SNOWBOY] ${PMDLPath}/${config.Model}.pmdl file not found !`);
        } log(`Personal Model selected: ${config.Model}.pmdl`);
        const pmdl = {
          hotwords: config.Model,
          file: `${PMDLPath}/${config.Model}.pmdl`,
          sensitivity: "0.5"
        };
        if (config.Sensitivity) {
          if ((isNaN(config.Sensitivity)) || (Math.ceil(config.Sensitivity) > 1)) {
            console.error("[DETECTOR] [SNOWBOY] Wrong Sensitivity value in", config.Model);
          } else {
            pmdl.sensitivity = config.Sensitivity;
          }
        }
        log("Sensitivity set:", pmdl.sensitivity);
        this.model[nb] = pmdl;
        this.models.add(this.model[nb]);
      }
    });
    if (!this.model.length) { console.error("[DETECTOR] [SNOWBOY] No models found!"); }
  }

  start () {
    if (!this.models.models.length) { return console.error("[DETECTOR] [SNOWBOY] Constructor Error: No Model is set... I can't start Listening!"); }
    this.detector = new Detector({
      resource: path.resolve(__dirname, "../resources/common.res"),
      models: this.models,
      audioGain: this.recorderOptions.audioGain,
      applyFrontend: this.recorderOptions.applyFrontend
    });

    this.detector
      .on("error", (err) => {
        this.error(err);

      })
      .on("hotword", (index, hotword) => {
        log("Detected:", hotword);
        this.stopListening();
        this.callback(hotword);
      });

    this.startListening();
  }

  stop () {
    this.stopListening();
  }

  modelsNumber () {
    return this.model.length;
  }

  modelsNames () {
    const keywordsName = [];
    this.model.forEach((value) => {
      keywordsName.push(value.hotwords[0]);
    });
    return keywordsName.toString();
  }

  error (err, code) {
    if (err || (code === "1")) {
      if (err) { console.error(`[DETECTOR] [SNOWBOY] ${err}`); }
      this.stop();
      log("Retry restarting...");
      setTimeout(() => { this.start(); }, 2000);
      return;
    }
    if (code === "255") {
      this.stop();
      log("Timeout waiting restarting !");
      setTimeout(() => { this.start(); }, 1000);

    }
  }

  startListening () {
    if (this.mic) { return; }
    this.mic = null;
    this.mic = new Recorder(this.recorderOptions, this.detector, (err, code) => { this.error(err, code); });
    log("Starts listening.");
    this.mic.start();
  }

  stopListening () {
    if (!this.mic) { return; }
    this.mic.stop();
    this.mic = null;
    log("Stops listening.");
  }
}

module.exports = require("./lib/node/index");

module.exports.Snowboy = Snowboy;
