/*
 ***************************
 * Porcupine library v2.0.0
 * @bugsounet
 * 2024-02-08
 **************************
 */

"use strict";
const PassThrough = require("stream").PassThrough;
const { Porcupine } = require("@picovoice/porcupine-node");
const { getPlatform } = require("@picovoice/porcupine-node/dist/platforms");
const { BuiltinKeyword, getBuiltinKeywordPath } = require("@picovoice/porcupine-node/dist/builtin_keywords");

const keywordStringMap = new Map(Array.from(new Map(Object.entries(BuiltinKeyword)), (keywords) => keywords.reverse()));

const PLATFORM_RECORDER_MAP = new Map();
PLATFORM_RECORDER_MAP.set("linux", "arecord");
PLATFORM_RECORDER_MAP.set("mac", "sox");
PLATFORM_RECORDER_MAP.set("raspberry-pi", "arecord");
PLATFORM_RECORDER_MAP.set("windows", "sox");

const Recorder = require("./lpcm16");

let log = () => { /* do nothing */ };

class PORCUPINE {
  constructor (config, mic, callback = () => {}, debug) {
    this.micConfig = mic;
    this.config = config;
    this.callback = callback;
    this.debug = debug;
    this.initialized = false;
    if (this.debug) {
      log = (...args) => { console.log("[DETECTOR] [PORCUPINE]", ...args); };
    }
    if (this.config.dev) { log("DetectorConfig:", this.config); }

    this.defaultMicOption = {
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

    let platform;
    try {
      platform = getPlatform();
    } catch (error) {
      console.error("[DETECTOR] [PORCUPINE] The NodeJS binding does not support this platform. Supported platforms include macOS (x86_64), Windows (x86_64), Linux (x86_64), and Raspberry Pi (1-4)");
      console.error(error);
      return;
    }
    if (!this.config.accessKey) {
      console.error("[DETECTOR] [PORCUPINE] Error: No AccessKey provided in config!");
      return;
    }

    if (this.micConfig.recorder === "auto") {
      const recorderType = PLATFORM_RECORDER_MAP.get(platform);
      console.log(`[PORCUPINE] Platform: '${platform}'; attempting to use '${recorderType}' to access microphone ...`);
      this.micConfig.recorder = recorderType;
    }
    this.recorderOptions = { ...this.defaultMicOption, ...this.micConfig };
    if (this.config.dev) { log("recorderOptions", this.recorderOptions); }

    this.keywordNames = [];
    this.running = false;
    this.mic = null;
    this.initialized = true;
  }

  init () {
    if (!this.initialized) { return console.error("[DETECTOR] [PORCUPINE] Can't init Porcupine! (missing accessKey)"); }
    let keywordPaths = [];
    const sensitivities = [];

    /* build keyword list */
    this.config.detectors.forEach((detector) => {
      if (detector.Model) {
        const keywordString = detector.Model.trim().toLowerCase();

        if (keywordString === "custom") {
          keywordPaths.push(this.config.customModel);
        } else if (keywordStringMap.has(keywordString)) {
          keywordPaths.push(getBuiltinKeywordPath(keywordString));
        } else {
          return console.error(`[PORCUPINE] Keyword argument ${detector.Model} is not in the list of built-in keywords`);
        }
      }
      if (detector.Sensitivity === null || isNaN(detector.Sensitivity) || detector.Sensitivity < 0 || detector.Sensitivity > 1) {
        console.error(`[PORCUPINE] ${detector.Model}: Sensitivity must be a number in the range [0,1]`, detector.Sensitivity);
        console.error(`[PORCUPINE] Set Sensitivity for ${detector.Model} to 0.5`);
        sensitivities.push(0.5);
      }
      else { sensitivities.push(detector.Sensitivity); }
    });

    const keywordPathsDefined = typeof keywordPaths !== "undefined";

    if (!Array.isArray(keywordPaths)) {
      keywordPaths = keywordPaths.split(",");
    }

    for (const keywordPath of keywordPaths) {
      if (keywordPathsDefined && keywordStringMap.has(keywordPath)) {
        console.warn(`[PORCUPINE] --keyword_path argument '${keywordPath}' matches a built-in keyword. Did you mean to use --keywords ?`);
      }
      /* eslint-disable no-useless-escape */
      const keywordName = keywordPath
        .split(/[\\|\/]/)
        .pop()
        .split("_")[0];
      /* eslint-enable no-useless-escape */
      this.keywordNames.push(keywordName);
    }
    if (!keywordPaths.length) { return console.error("[DETECTOR] [PORCUPINE] No keyword found!"); }
    try {
      this.porcupine = new Porcupine(this.config.accessKey, keywordPaths, sensitivities);
      log(`Ready for listening this wake word(s): ${this.keywordNames}`);
    } catch (err) {
      console.error("[PORCUPINE] Error:", err.message);
      this.initialized = false;
    }
  }

  async start () {
    if (!this.initialized) { return console.error("[DETECTOR] [PORCUPINE] Can't start Porcupine! (missing accessKey)"); }
    if (!this.porcupine) { await this.init(); }
    this.startListening();
    this.running = true;
  }

  stop () {
    this.stopListening();
    this.running = false;
  }

  /** secondary code **/

  Detector () {
    if (!this.mic) { return console.log("[DETECTOR] [PORCUPINE] Mic not activated!"); }
    if (!this.porcupine) { return console.error("[DETECTOR] [PORCUPINE] Porpucine is not initialized !"); }
    const frameLength = this.porcupine.frameLength;
    let frameAccumulator = [];
    this.infoStream.on("data", (data) => {
      //log("Received datas: " + data.length)
      const newFrames16 = new Array(data.length / 2);
      for (let i = 0; i < data.length; i += 2) {
        newFrames16[i / 2] = data.readInt16LE(i);
      }

      frameAccumulator = frameAccumulator.concat(newFrames16);
      const frames = this.chunkArray(frameAccumulator, frameLength);

      if (frames[frames.length - 1].length === frameLength) {
        frameAccumulator = [];
      } else {
        frameAccumulator = frames.pop();
      }

      for (const frame of frames) {
        if (!this.porcupine) { return; }
        const index = this.porcupine.process(frame);
        if (index !== -1 && this.running) {
          log(`Detected '${this.keywordNames[index]}'`);
          this.callback(this.keywordNames[index]);
          this.stopListening();
        }
      }
    });
    this.infoStream.on("error", (error) => {
      log(`Error in Info Stream: ${error}`);
      this.stopListening();
      log("waiting before restarting...");
      setTimeout(() => { this.startListening(); }, 10 * 1000);
    });
  }

  error (err, code) {
    if (err || (code === "1")) {
      if (err) { console.error(`[DETECTOR] [PORCUPINE] ${err}`); }
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
    this.infoStream = new PassThrough();
    this.mic = new Recorder(this.recorderOptions, this.infoStream, (err, code) => { this.error(err, code); });
    log("Starts listening.");
    this.mic.start();
    this.Detector();
  }

  stopListening () {
    if (!this.mic) { return; }
    this.porcupine.release();
    this.porcupine = null;
    this.infoStream = null;
    this.keywordNames = [];
    this.mic.stop();
    this.mic = null;
    log("Stops listening.");
  }

  /** Tools **/
  chunkArray (array, size) {
    return Array.from({ length: Math.ceil(array.length / size) }, (v, index) => array.slice(index * size, index * size + size));
  }
}

module.exports = PORCUPINE;
