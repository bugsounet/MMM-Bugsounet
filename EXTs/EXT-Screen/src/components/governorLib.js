/** governor library **/
/** bugsounet **/

const exec = require("child_process").exec;
const Utils = require("./utils");

var log = () => { /* do nothing */ };

class GOVERNOR {
  constructor (config, callback) {
    this.config = config;
    this.error = callback.error;
    this.default = {
      debug: false,
      sleeping: 4,
      working: 2
    };
    this.config = Object.assign(this.default, this.config);
    if (this.config.debug === true) log = (...args) => { console.log("[Screen] [LIB] [GOVERNOR]", ...args); };
    if (Utils.isWin()) {
      if (this.config.sleeping || this.config.working) {
        this.config.sleeping = 0;
        this.config.working = 0;
        console.log("[Screen] [LIB] [GOVERNOR] [Windows] Governor library Disabled");
      }
    }
    this.MyGovernor = ["Disabled", "conservative", "ondemand", "userspace", "powersave", "performance"];
    this.Governor = {
      actived: false,
      wanted: "",
      actual: "",
      error: null
    };
    if (Utils.isWin()) {
      console.log("[Screen] [LIB] [GOVERNOR] [Windows] Governor library Disabled");
      if (this.config.sleeping || this.config.working) {
        this.config.sleeping = 0;
        this.config.working = 0;
      }
    } else {
      console.log("[Screen] [LIB] [GOVERNOR] Governor library initialized...");
    }
  }

  start () {
    log("Start");
    this.working();
  }

  working () {
    this.Governor.wanted = this.checkGovernor(this.config.working, "working");
    if (this.Governor.wanted !== "Disabled") this.apply("working");
  }

  sleeping () {
    this.Governor.wanted = this.checkGovernor(this.config.sleeping, "sleeping");
    if (this.Governor.wanted !== "Disabled") this.apply("sleeping");
  }

  apply (type) {
    exec("cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor", (error, stdout) => {
      if (error) {
        this.Governor.actived = false;
        this.Governor.error = "Incompatible with your system.";
        console.error(`[Screen] [LIB] [GOVERNOR] ${type} - Error: ${this.Governor.error}`);
        this.error(this.Governor.error);
        return;
      }
      this.Governor.actual = stdout.replace(/\n|\r|(\n\r)/g, "");
      log(`Actual: ${this.Governor.actual}`);
      if (this.Governor.actual === this.Governor.wanted) {
        this.Governor.error = null;
        this.Governor.actived = true;
        log("Already set");
      } else {
        this.MyGovernor.forEach((governor) => {
          if (governor === this.Governor.wanted) {
            exec(`echo ${governor} | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor`);
            this.Governor.error = null;
            this.Governor.actived = true;
            log(`${type} Set: ${governor}`);
          }
        });
        if (!this.Governor.actived) {
          this.Governor.error = `Unknow Governor (${this.Governor.wanted})`;
          this.Governor.actived = false;
          console.error(`[Screen] [LIB] [GOVERNOR] ${type} ${this.Governor.error}`);
          this.error(this.Governor.error);
        }
      }
    });
  }

  checkGovernor (wanted, type) {
    let found = this.MyGovernor.find((governor, value) => {
      return value === wanted;
    });
    if (found) {
      log(`${type} Governor: ${found}`);
      return found;
    } else {
      console.error(`[Screen] [LIB] [GOVERNOR] ${type} Governor Error ! [${wanted}]`);
      this.error(`${type} Governor Error ! [${wanted}]`);
      return "Disabled";
    }
  }
}

module.exports = GOVERNOR;
