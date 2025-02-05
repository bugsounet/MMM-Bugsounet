/** PIR library **/
/** bugsounet **/

var log = () => { /* do nothing */ };
const Utils = require("./utils");

class PIR {
  constructor (config, callback) {
    this.config = config;
    this.callback = callback;
    this.default = {
      debug: false,
      gpio: 21,
      mode: 0,
      chip: "auto",
      triggerMode: "LH"
    };
    this.config = Object.assign({}, this.default, this.config);
    if (this.config.debug) log = (...args) => { console.log("[Screen] [LIB] [PIR]", ...args); };
    this.pir = null;
    this.running = false;
    this.pirChip = null;
    this.pirLine = null;
    this.pirChipNumber = -1;
    this.pirInterval = null;
    this.pirReadyToDetect = false;
    if (Utils.isWin()) {
      console.log("[Screen] [LIB] [PIR] [Windows] Pir library Disabled.");
      if (this.config.gpio) this.config.gpio = 0;
    }
  }

  start () {
    if (this.running) return;
    if (this.config.gpio === 0) return console.log("[Screen] [LIB] [PIR] Disabled.");
    switch (this.config.triggerMode) {
      case "LH":
        console.log("[Screen] [LIB] [PIR] triggerMode LH Selected: Read LOW (0, no-motion) to HIGH (1, motion)");
        break;
      case "H":
        console.log("[Screen] [LIB] [PIR] triggerMode H Selected: Read HIGH (1, motion)");
        break;
      default:
        console.warn(`[Screen] [LIB] [PIR] triggerMode: ${this.config.mode} is not a valid value`);
        console.warn("[Screen] [LIB] [PIR] set triggerMode LH");
        this.config.triggerMode = "LH";
        break;
    }
    switch (this.config.mode) {
      case 0:
        console.log("[Screen] [LIB] [PIR] Mode 0 Selected (gpiod library)");
        this.gpiodDetect();
        break;
      case 1:
        console.log("[Screen] [LIB] [PIR] Mode 1 Selected (gpiozero)");
        this.gpiozeroDetect();
        break;
      default:
        console.warn(`[Screen] [LIB] [PIR] mode: ${this.config.mode} is not a valid value`);
        console.warn("[Screen] [LIB] [PIR] set mode 0");
        this.config.mode = 0;
        this.gpiodDetect();
        break;
    }
  }

  stop () {
    if (!this.running) return;
    if (this.config.mode === 0 && this.pirLine) {
      clearInterval(this.pirInterval);
      this.pirLine.release();
      this.pirLine = null;
    }

    if (this.config.mode === 1) {
      this.pir.kill();
    }

    this.pir = null;
    this.running = false;
    this.callback("PIR_STOP");
    log("Stop");
  }

  gpiozeroDetect () {
    const { PythonShell } = require("python-shell");
    let options = {
      mode: "text",
      scriptPath: __dirname,
      pythonOptions: ["-u"],
      args: ["-g", this.config.gpio]
    };

    this.pir = new PythonShell("MotionSensor.py", options);
    this.callback("PIR_STARTED");
    console.log("[Screen] [LIB] [PIR] Started!");
    this.pirReadyToDetect = true;
    this.running = true;

    this.pir.on("message", (message) => {
      // detect pir
      switch (message) {
        case "Motion":
          log("Debug: Motion detect ready is", this.pirReadyToDetect);
          if (this.pirReadyToDetect) {
            log("Motion Detected");
            this.callback("PIR_DETECTED");
            if (this.config.triggerMode === "LH") {
              this.pirReadyToDetect = false;
              log("Debug: Set motion detect ready to:", this.pirReadyToDetect);
            }
          }
          break;
        case "NoMotion":
          log("No Motion Detected");
          this.pirReadyToDetect = true;
          log("Debug: Set motion detect ready to:", this.pirReadyToDetect);
          break;
        default:
          console.error("[Screen] [LIB] [PIR] ", message);
          this.callback("PIR_ERROR", message);
          this.running = false;
          break;
      }
    });

    this.pir.on("stderr", (stderr) => {
      // handle stderr (a line of text from stderr)
      if (this.config.debug) console.error("[Screen] [LIB] [PIR]", stderr);
      this.running = false;
    });

    this.pir.end((err, code, signal) => {
      if (err) {
        console.error("[Screen] [LIB] [PIR] [PYTHON]", err);
        this.callback("PIR_ERROR", err.message);
      }
      console.warn(`[Screen] [LIB] [PIR] [PYTHON] The exit code was: ${code}`);
      console.warn(`[Screen] [LIB] [PIR] [PYTHON] The exit signal was: ${signal}`);
    });
  }

  /* experimental */

  gpiodDetect () {
    try {
      const { Chip, Line } = require("node-libgpiod");
      const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      numbers.every((number) => {
        try {
          this.pirChip = new Chip(number);
          const label = this.pirChip.getChipLabel();
          log(`[GPIOD] Check chip ${number}: ${label}`);
          const isAuto = this.config.chip === "auto" && label.includes("pinctrl-");
          const isManual = this.config.chip !== "auto" && label.includes(this.config.chip);

          if (isAuto || isManual) {
            // found chip
            console.log(`[Screen] [LIB] [PIR] [GPIOD] - ${isAuto ? "Auto" : "Manual"} - Found chip ${number}: ${label}`);
            this.pirChipNumber = number;
            return false;
          }
        } catch {
          // out of chip
          return false;
        }
        // try next chip
        return true;
      });

      if (this.pirChipNumber === -1) {
        console.error("[Screen] [LIB] [PIR] [GPIOD] No Chip Found!");
        this.running = false;
        return this.callback("PIR_ERROR", "No Chip Found!");
      }

      this.pirLine = new Line(this.pirChip, this.config.gpio);
      this.pirLine.requestInputMode();
      this.callback("PIR_STARTED");
      console.log("[Screen] [LIB] [PIR] Started!");
    } catch (err) {
      if (this.pirLine) {
        this.pirLine.release();
        this.pirLine = null;
      }

      console.error(`[Screen] [LIB] [PIR] [GPIOD] ${err}`);
      this.running = false;
      return this.callback("PIR_ERROR", err.message);
    }

    this.running = true;

    this.pir = () => {
      var line = this.pirLine;
      if (this.running) {
        try {
          var value = line.getValue();
          if (value !== this.oldstate || this.config.triggerMode === "H") {
            this.oldstate = value;
            log(`Sensor read value: ${value}`);
            if (value === 1) {
              this.callback("PIR_DETECTED");
              log("Detected presence");
            }
          }
        } catch (err) {
          console.error(`[Screen] [LIB] [PIR] [GPIOD] ${err}`);
          this.callback("PIR_ERROR", err);
        }
      }
    };
    this.pirInterval = setInterval(() => this.pir(), 1000);
  }
}

module.exports = PIR;
