/********************
* Screen management *
* Bugsounet         *
*********************/

const exec = require("child_process").exec;
const process = require("process");
const dayjs = require("dayjs");
const Utils = require("./utils");

var log = () => { /* do nothing */ };

class SCREEN {
  constructor (config, callback) {
    this.config = config;
    this.sendSocketNotification = callback.sendSocketNotification;
    this.governor = callback.governor;
    this.interval = null;
    this.default = {
      debug: false,
      timeout: 5 * 60 * 1000,
      mode: 1,
      ecoMode: true,
      relayGPIOPin: 0,
      availability: true,
      autoDimmer: false,
      xrandrForceRotation: "normal",
      wrandrForceRotation: "normal",
      wrandrForceMode: null,
      waylandDisplayName: "wayland-0",
      ddcutil: {
        powerOnCode: "01",
        powerOffCode: "04",
        skipSetVcpCheck: false,
        setPowerRetries: 0
      }
    };
    this.config = Utils.configMerge({}, this.default, this.config);
    if (this.config.debug) log = (...args) => { console.log("[Screen] [LIB] [SCREEN]", ...args); };
    this.screen = {
      mode: this.config.mode,
      running: false,
      locked: false,
      power: false,
      awaitBeforeTurnOff: this.config.animate,
      awaitBeforeTurnOffTimer: null,
      awaitBeforeTurnOffTime: 1000, //2000,
      uptime: Math.floor(process.uptime()),
      availabilityCounter: Math.floor(process.uptime()),
      availabilityPercent: 0,
      availabilityTimeHuman: 0,
      availabilityTimeSec: 0,
      forceLocked: false,
      cronStarted: false,
      cronON: false,
      cronOFF: false,
      cronMode: 0,
      xrandrRotation: null,
      wrandrRotation: null,
      wrandrForceMode: null,
      waylandDisplayName: null,
      hdmiPort: null,
      forceOnStart: true,
      dimmerFrom: this.config.timeout / 4,
      output: {
        timer: "--:--",
        bar: 1,
        dimmer: 1,
        availabilityPercent: 100,
        availability: 0
      }
    };

    this.status = false;

    this.xrandrRotation = ["normal", "left", "right", "inverted"];
    this.wrandrRotation = ["normal", "90", "180", "270", "flipped", "flipped-90", "flipped-180", "flipped-270"];

    switch (this.config.mode) {
      case 0:
        console.log("[Screen] [LIB] [SCREEN] Mode 0: Disabled");
        break;
      case 1:
        console.log("[Screen] [LIB] [SCREEN] Mode 1: dpms rpi");
        break;
      case 2:
        if (this.xrandrRotation.indexOf(this.config.xrandrForceRotation) === -1) {
          console.error(`[Screen] [LIB] [SCREEN] Mode 2: xrandr invalid Rotation --> ${this.config.xrandrForceRotation}, Set to default: normal`);
          this.sendSocketNotification("SCREEN_ERROR", `Mode 2: xrandr invalid Rotation --> ${this.config.xrandrForceRotation}, Set to default: normal`);
          this.screen.xrandrRotation = "normal";
        } else {
          console.log(`[Screen] [LIB] [SCREEN] Mode 2: xrandr (primary display) -- Rotation: ${this.config.xrandrForceRotation}`);
          this.screen.xrandrRotation = this.config.xrandrForceRotation;
        }
        break;
      case 3:
        if (this.wrandrRotation.indexOf(this.config.wrandrForceRotation) === -1) {
          console.error(`[Screen] [LIB] [SCREEN] Mode 3: wlr-randr invalid Rotation --> ${this.config.wrandrForceRotation}, Set to default: normal`);
          this.sendSocketNotification("SCREEN_ERROR", `Mode 3: wlr-randr invalid Rotation --> ${this.config.wrandrForceRotation}, Set to default: normal`);
          this.screen.wrandrRotation = "normal";
        } else {
          console.log(`[Screen] [LIB] [SCREEN] Mode 3: wlr-randr (primary display) -- Rotation: ${this.config.wrandrForceRotation}`);
          this.screen.wrandrRotation = this.config.wrandrForceRotation;
        }
        if (this.config.wrandrForceMode) {
          console.log(`[Screen] [LIB] [SCREEN] Mode 3: wlr-randr -- ForceMode: ${this.config.wrandrForceMode}`);
          this.screen.wrandrForceMode = this.config.wrandrForceMode;
        }
        if (this.config.waylandDisplayName.startsWith("wayland")) {
          console.log(`[Screen] [LIB] [SCREEN] Mode 3: wlr-randr -- DisplayName : ${this.config.waylandDisplayName}`);
          this.screen.waylandDisplayName = this.config.waylandDisplayName;
        } else {
          console.error(`[Screen] [LIB] [SCREEN] Mode 3: wlr-randr invalid DisplayName --> ${this.config.waylandDisplayName}, Set to default: wayland-0`);
          this.screen.waylandDisplayName = "wayland-0";
        }
        break;
      case 4:
        console.log("[Screen] [LIB] [SCREEN] Mode 4: HDMI CEC");
        break;
      case 5:
        console.log("[Screen] [LIB] [SCREEN] Mode 5: ddcutil");
        break;
      case 6:
        console.log("[Screen] [LIB] [SCREEN] Mode 6: dpms linux");
        break;
      case 7:
        if (this.config.waylandDisplayName.startsWith("wayland")) {
          console.log(`[Screen] [LIB] [SCREEN] Mode 7: labwc -- DisplayName : ${this.config.waylandDisplayName}`);
          this.screen.waylandDisplayName = this.config.waylandDisplayName;
        } else {
          console.error(`[Screen] [LIB] [SCREEN] Mode 7: labwc invalid DisplayName --> ${this.config.waylandDisplayName}, Set to default: wayland-0`);
          this.screen.waylandDisplayName = "wayland-0";
        }
        break;
      case 8:
        console.log("[Screen] [LIB] [SCREEN] Mode 8: relais");
        break;
      case 9:
        if (Utils.isWin()) {
          console.log("[Screen] [LIB] [SCREEN] Mode 9: Windows (test)");
        } else {
          console.error("[Screen] [LIB] [SCREEN] Mode 9 is reserved for windows OS -- Set mode to 0 (Disabled)");
          this.sendSocketNotification("SCREEN_ERROR", "Mode 9 is reserved for windows OS -- Set mode to 0 (Disabled)");
          this.config.mode = 0;
        }
        break;
      default:
        console.error(`[Screen] [LIB] [SCREEN] Unknow Mode (${this.config.mode}) Set to 0 (Disabled)`);
        this.sendSocketNotification("SCREEN_ERROR", `Unknow Mode (${this.config.mode}) Set to 0 (Disabled)`);
        this.config.mode = 0;
        break;
    }

    if (this.config.availability) {
      Number.prototype.toHHMMSS = function () {
        var sec_num = parseInt(this, 10); // don't forget the second param
        var hours = Math.floor(sec_num / 3600);
        var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        var seconds = sec_num - (hours * 3600) - (minutes * 60);

        if (hours < 10) { hours = `0${hours}`; }
        if (minutes < 10) { minutes = `0${minutes}`; }
        if (seconds < 10) { seconds = `0${seconds}`; }
        return `${hours}:${minutes}:${seconds}`;
      };
    }

    this.screenStatus();
  }

  async start (restart) {
    if (this.screen.locked || this.screen.running) return;
    if (!restart) log("Start.");
    else log("Restart.");
    clearTimeout(this.screen.awaitBeforeTurnOffTimer);
    this.screen.awaitBeforeTurnOffTimer = null;
    this.sendSocketNotification("SCREEN_PRESENCE", true);
    if (!this.screen.power) {
      this.governor("WORKING");
      if (this.config.mode) {
        if (this.config.mode === 5 && this.config.ddcutil.setPowerRetries > 0) {
          let retries = 0;
          let success = await this.wantedPowerDisplay(true);
          while (retries < this.config.ddcutil.setPowerRetries && !success) {
            console.info("[Screen] [LIB] [SCREEN] Retrying set power");
            await new Promise((resolve) => setTimeout(resolve, 2000));
            success = await this.wantedPowerDisplay(true);
            retries++;
          }
        } else this.wantedPowerDisplay(true);
      }
      this.sendSocketNotification("SCREEN_SHOWING");
      this.screen.power = true;
    }
    if (this.config.autoDimmer) {
      this.screen.output.dimmer = 1;
    }
    clearInterval(this.interval);
    this.interval = null;
    this.counter = this.config.timeout;

    //main loop
    this.interval = setInterval(() => {
      if (this.config.availability) {
        this.screen.uptime = Math.floor(process.uptime());
        this.screen.availabilityPercent = (this.screen.availabilityCounter * 100) / this.screen.uptime;
        this.screen.availabilityTimeSec = this.screen.uptime > 86400 ? ((this.screen.availabilityCounter * 86400) / this.screen.uptime) : this.screen.availabilityCounter;
        this.screen.availabilityTimeHuman = this.screen.availabilityTimeSec.toHHMMSS();
        this.screen.output.availabilityPercent = parseFloat(this.screen.availabilityPercent.toFixed(1));
        this.screen.output.availability = this.screen.availabilityTimeHuman;
      }

      this.screen.running = true;
      if (this.config.autoDimmer && (this.counter <= this.screen.dimmerFrom)) {
        this.screen.output.dimmer = 1 - ((this.screen.dimmerFrom - this.counter) / this.screen.dimmerFrom);
      }

      this.screen.output.timer = dayjs(new Date(this.counter)).format("mm:ss");
      this.screen.output.bar = (this.counter / this.config.timeout).toFixed(3);

      this.sendSocketNotification("SCREEN_OUTPUT", this.screen.output);

      if (this.counter <= 0) {
        clearInterval(this.interval);
        this.interval = null;
        this.screen.running = false;
        this.forceTurnOffScreen();
        log("Stops by counter.");
      }
      this.counter -= 1000;
    }, 1000);
  }

  forceTurnOffScreen () {
    if (!this.screen.power) return log("forceTurnOffScreen: already off");
    if (this.config.ecoMode) this.sendSocketNotification("SCREEN_HIDING");
    this.screen.power = false;
    if (this.config.mode) this.wantedPowerDisplay(false);
    this.screen.dimmer = 0;
    this.governor("SLEEPING");
    this.sendSocketNotification("SCREEN_PRESENCE", false);
  }

  stop () {
    if (this.screen.locked) return;

    if (!this.screen.power) {
      this.governor("WORKING");
      if (this.config.mode) this.wantedPowerDisplay(true);
      this.sendSocketNotification("SCREEN_SHOWING");
      this.screen.power = true;
    }
    this.sendSocketNotification("SCREEN_PRESENCE", true);
    if (!this.screen.running) return;
    clearInterval(this.interval);
    this.interval = null;
    this.screen.running = false;
    log("Stops.");
  }

  reset () {
    if (this.screen.locked) return;
    clearInterval(this.interval);
    this.interval = null;
    this.screen.running = false;
    this.start(true);
  }

  wakeup () {
    if (this.screen.locked) return;
    this.reset();
  }

  lock () {
    if (this.screen.locked) return;
    this.screen.locked = true;
    clearInterval(this.interval);
    this.interval = null;
    this.screen.running = false;
    log("Locked !");
  }

  unlock () {
    if (this.screen.forceLocked) return log("Unlock: ForceLocked");
    this.screen.locked = false;
    log("Unlocked !");
    this.start();
  }

  forceEnd () {
    if (this.screen.forceLocked) return log("forceEnd: ForceLocked");
    clearInterval(this.interval);
    this.interval = null;
    this.screen.running = false;
    this.counter = 0;
    this.forceTurnOffScreen();
  }

  async wantedPowerDisplay (wanted) {
    var actual = false;
    return new Promise((resolve) => {
      switch (this.config.mode) {
        case 0:
          // disabled
          log("Disabled mode");
          resolve(true);
          break;
        case 1:
          // dpms rpi
          actual = false;
          exec("DISPLAY=:0 xset q | grep Monitor", async (err, stdout) => {
            if (err) {
              console.error(`[Screen] [LIB] [SCREEN] ${err}`);
              this.sendSocketNotification("SCREEN_ERROR", "dpms command error (mode: 1)");
              resolve(false);
            }
            else {
              let responseSh = stdout.trim();
              var displaySh = responseSh.split(" ")[2];
              if (displaySh === "On") actual = true;
              resolve(await this.resultDisplay(actual, wanted));
            }
          });
          break;
        case 2:
          // xrandr on primary display
          exec("xrandr | grep 'connected primary'",
            async (err, stdout) => {
              if (err) {
                console.error(`[Screen] [LIB] [SCREEN] xrandr: ${err}`);
                this.sendSocketNotification("SCREEN_ERROR", "xrandr command error (mode: 2)");
                resolve(false);
              }
              else {
                let responseSh = stdout.trim();
                var power = "on";
                this.screen.hdmiPort = responseSh.split(" ")[0];
                if (responseSh.split(" ")[3] === "(normal") power = "off";
                if (power === "on") actual = true;
                log(`[MODE 2] Monitor on ${this.screen.hdmiPort} is ${power}`);
                resolve(await this.resultDisplay(actual, wanted));
              }
            });
          break;
        case 3:
          // wlr-randr
          exec(`WAYLAND_DISPLAY=${this.screen.waylandDisplayName} wlr-randr | grep 'Enabled'`,
            (err, stdout) => {
              if (err) {
                console.error(`[Screen] [LIB] [SCREEN] wlr-randr: ${err}`);
                this.sendSocketNotification("SCREEN_ERROR", "wlr-randr command error (mode: 3)");
                resolve(false);
              } else {
                let responseSh = stdout.trim();
                if (responseSh.split(" ")[1] === "yes") actual = true;
                exec(`WAYLAND_DISPLAY=${this.screen.waylandDisplayName} wlr-randr`,
                  async (err, stdout) => {
                    if (err) {
                      console.error(`[Screen] [LIB] [SCREEN] wlr-randr: ${err}`);
                      this.sendSocketNotification("SCREEN_ERROR", "wlr-randr scan screen command error (mode: 3)");
                      resolve(false);
                    } else {
                      let wResponse = stdout.trim();
                      this.screen.hdmiPort = wResponse.split(" ")[0];
                      log(`[MODE 3] Monitor on ${this.screen.hdmiPort} is ${actual}`);
                      resolve(await this.resultDisplay(actual, wanted));
                    }
                  });
              }
            });
          break;
        case 4:
          // CEC
          exec("echo 'pow 0' | cec-client -s -d 1", async (err, stdout) => {
            if (err) {
              console.error(`[Screen] [LIB] [SCREEN] ${err}`);
              console.error(`[Screen] [LIB] [SCREEN] HDMI CEC Error: ${stdout}`);
              this.sendSocketNotification("SCREEN_ERROR", "HDMI CEC command error (mode: 4)");
              resolve(false);
            } else {
              let responseSh = stdout.trim();
              var displaySh = responseSh.split("\n")[1].split(" ")[2];
              if (displaySh === "on") actual = true;
              if (displaySh === "unknown") log("HDMI CEC unknow state");
              resolve(await this.resultDisplay(actual, wanted));
            }
          });
          break;
        case 5:
          // ddcutil
          exec("ddcutil getvcp d6", async (err, stdout) => {
            if (err) {
              console.error(`[Screen] [LIB] [SCREEN] ddcutil Error ${err}`);
              this.sendSocketNotification("SCREEN_ERROR", "ddcutil command error (mode: 5)");
              resolve(false);
            }
            else {
              let responseSh = stdout.trim();
              var displaySh = responseSh.split("(sl=")[1];
              if (displaySh === "0x01)") actual = true;
              resolve(await this.resultDisplay(actual, wanted));
            }
          });
          break;
        case 6:
          // dmps linux
          exec("xset q | grep Monitor", async (err, stdout) => {
            if (err) {
              console.error(`[Screen] [LIB] [SCREEN] [Display Error] dpms linux: ${err}`);
              this.sendSocketNotification("SCREEN_ERROR", "dpms linux command error (mode: 6)");
              resolve(false);
            }
            else {
              let responseSh = stdout.trim();
              var displaySh = responseSh.split(" ")[2];
              if (displaySh === "On") actual = true;
              resolve(await this.resultDisplay(actual, wanted));
            }
          });
          break;
        case 7:
          // labwc
          exec(`WAYLAND_DISPLAY=${this.screen.waylandDisplayName} wlopm --json`,
            async (err, stdout) => {
              if (err) {
                console.error(`[Screen] [LIB] [SCREEN] wlopm: ${err}`);
                this.sendSocketNotification("SCREEN_ERROR", "wlopm command error (mode: 7)");
                resolve(false);
              } else {
                let responseSh = stdout.trim();
                try {
                  let responseJson = JSON.parse(responseSh);
                  let responseOutput = responseJson[0];
                  if (responseOutput.error) {
                    console.error(`[Screen] [LIB] [SCREEN] wlopm report arror: ${responseOutput.error}`);
                    this.sendSocketNotification("SCREEN_ERROR", "scan screen command report error (mode: 7)");
                    resolve(false);
                  } else {
                    this.screen.hdmiPort = responseOutput.output;
                    if (responseOutput["power-mode"] === "on") actual = true;
                    log(`[MODE 7] Monitor on ${this.screen.hdmiPort} from ${this.screen.waylandDisplayName} is ${actual}`);
                    resolve(await this.resultDisplay(actual, wanted));
                  }
                } catch (error) {
                  console.error(`[Screen] [LIB] [SCREEN] wlopm: ${error}`);
                  console.error(`[Screen] [LIB] [SCREEN] wlopm response: ${responseSh}`);
                  this.sendSocketNotification("SCREEN_ERROR", "scan screen command error (mode: 7)");
                  resolve(false);
                }
              }
            });
          break;
        case 8:
          // pinctrl
          exec(`pinctrl lev ${this.config.relayGPIOPin}`, async (err, stdout) => {
            if (err) {
              console.error(`[Screen] [LIB] [SCREEN] pinctrl get: ${err}`);
              this.sendSocketNotification("SCREEN_ERROR", "pinctrl linux command error (mode: 8)");
              resolve(false);
            }
            else {
              let responseSh = stdout.trim();
              if (responseSh === "1") {
                actual = true;
              } else {
                actual = false;
              }
              resolve(await this.resultDisplay(actual, wanted));
            }
          });
          break;
        case 9:
          console.log("[Screen] [LIB] [SCREEN] [Win Test] by pass check");
          // by pass check: need to find a command to find monitor state
          log("[Win Test] Actual:", this.status);
          log("[Win Test] Wanted:", wanted);
          resolve(this.resultDisplay(this.status, wanted));
          break;
      }
    });
  }

  async resultDisplay (actual, wanted) {
    if (this.screen.forceOnStart) {
      log("Display: Force On Start");
      let isOn = await this.setPowerDisplay(true);
      if (isOn) this.screen.forceOnStart = false;
      return isOn;
    } else {
      log(`Display -- Actual: ${actual} - Wanted: ${wanted}`);
      this.screen.power = actual;
      if (actual && !wanted) return await this.setPowerDisplay(false);
      else if (!actual && wanted) return await this.setPowerDisplay(true);
      else return true;
    }
  }

  /**
   *
   * @param {*} set
   * @returns a promise that always resolves a boolean, being true iff the power setting as successfully completed
   */
  async setPowerDisplay (set) {
    log(`Display ${set ? "ON." : "OFF."}`);
    this.screen.power = set;
    // and finally apply rules !
    this.SendScreenPowerState();
    if (this.screen.awaitBeforeTurnOff && !set) await this.sleep(this.screen.awaitBeforeTurnOffTime);
    return new Promise((resolve) => {
      switch (this.config.mode) {
        case 1:
          if (set) {
            exec("DISPLAY=:0 xset dpms force on", (err) => {
              if (err) {
                console.error(`[Screen] [LIB] [SCREEN] mode 1, power ON: ${err}`);
                this.sendSocketNotification("SCREEN_ERROR", "dpms command error (mode 1 power ON) ");
                resolve(false);
              } else resolve(true);
            });
          } else {
            exec("DISPLAY=:0 xset dpms force off", (err) => {
              if (err) {
                console.error(`[Screen] [LIB] [SCREEN] mode 1, power OFF: ${err}`);
                this.sendSocketNotification("SCREEN_ERROR", "dpms command error (mode 1 power OFF)");
                resolve(false);
              } else resolve(true);
            });
          }
          break;
        case 2:
          if (set) {
            exec(`xrandr --output ${this.screen.hdmiPort} --auto --rotate ${this.screen.xrandrRotation}`, (err) => {
              if (err) {
                console.error(`[Screen] [LIB] [SCREEN] mode 2, power ON: ${err}`);
                this.sendSocketNotification("SCREEN_ERROR", "xrandr command error (mode 2 power ON)");
                resolve(false);
              } else resolve(true);
            });
          } else {
            exec(`xrandr --output ${this.screen.hdmiPort} --off`, (err) => {
              if (err) {
                console.error(`[Screen] [LIB] [SCREEN] mode 2, power OFF: ${err}`);
                this.sendSocketNotification("SCREEN_ERROR", "xrandr command error (mode 2 power OFF)");
                resolve(false);
              } else resolve(true);
            });
          }
          break;
        case 3:
          if (set) {
            let wrandrOptions = [
              "--output",
              this.screen.hdmiPort,
              "--on",
              "--transform",
              this.screen.wrandrRotation
            ];
            if (this.screen.wrandrForceMode) wrandrOptions.push("--mode", this.screen.wrandrForceMode);
            wrandrOptions = wrandrOptions.join(" ");
            exec(`WAYLAND_DISPLAY=${this.screen.waylandDisplayName} wlr-randr ${wrandrOptions}`, (err) => {
              if (err) {
                console.error(`[Screen] [LIB] [SCREEN] mode 3, power ON: ${err}`);
                this.sendSocketNotification("SCREEN_ERROR", "wlr-randr command error (mode 3 power ON)");
                resolve(false);
              } else resolve(true);
            });
          }
          else {
            exec(`WAYLAND_DISPLAY=${this.screen.waylandDisplayName} wlr-randr --output ${this.screen.hdmiPort} --off`, (err) => {
              if (err) {
                console.error(`[Screen] [LIB] [SCREEN] mode 3, power OFF: ${err}`);
                this.sendSocketNotification("SCREEN_ERROR", "wlr-randr command error (mode 3 power OFF)");
                resolve(false);
              } else resolve(true);
            });
          }
          break;
        case 4:
          if (set) {
            exec("echo 'on 0' | cec-client -s", (err) => {
              if (err) {
                console.error(`[Screen] [LIB] [SCREEN] mode 4, power ON: ${err}`);
                this.sendSocketNotification("SCREEN_ERROR", "HDMI CEC command error (mode 4 power ON)");
                resolve(false);
              } else resolve(true);
            });
          } else {
            exec("echo 'standby 0' | cec-client -s", (err) => {
              if (err) {
                console.error(`[Screen] [LIB] [SCREEN] mode 4, power OFF: ${err}`);
                this.sendSocketNotification("SCREEN_ERROR", "HDMI CEC command error (mode 4 power OFF)");
                resolve(false);
              } else resolve(true);
            });
          }
          break;
        case 5:
          if (set) {
            exec(`ddcutil setvcp d6 ${this.config.ddcutil.powerOnCode} --noverify`, (err) => {
              if (err) {
                console.error(`[Screen] [LIB] [SCREEN] mode 5, power ON: ${err}`);
                this.sendSocketNotification("SCREEN_ERROR", "ddcutil command error (mode 5 power ON)");
                resolve(false);
              } else if (!this.config.ddcutil.skipSetVcpCheck) {
                // 5 second delay
                setTimeout(() => {
                  exec("ddcutil getvcp d6", (err, stdout) => {
                    if (err) {
                      console.error(`[Screen] [LIB] [SCREEN] ddcutil Error ${err}`);
                      this.sendSocketNotification("SCREEN_ERROR", "ddcutil command error (mode 5 power ON check)");
                      resolve(false);
                    }
                    else {
                      let responseSh = stdout.trim();
                      var displaySh = responseSh.split("(sl=")[1];
                      if (displaySh !== `0x${this.config.ddcutil.powerOnCode})`) {
                        console.error(`[Screen] [LIB] [SCREEN] ddcutil Error ${responseSh}`);
                        this.sendSocketNotification("SCREEN_ERROR", "ddcutil command error (mode 5 power ON verify)");
                        resolve(false);
                      } else resolve(true);
                    }
                  });
                }, 5000);
              } else resolve(true);
            });
          } else {
            exec(`ddcutil setvcp d6 ${this.config.ddcutil.powerOffCode} --noverify`, (err) => {
              if (err) {
                console.error(`[Screen] [LIB] [SCREEN] mode 5, power OFF: ${err}`);
                this.sendSocketNotification("SCREEN_ERROR", "ddcutil command error (mode 5 power OFF)");
                resolve(false);
              } else if (!this.config.ddcutil.skipSetVcpCheck) {
                // 1 second delay
                setTimeout(() => {
                  exec("ddcutil getvcp d6", (err, stdout) => {
                    if (err) {
                      console.error(`[Screen] [LIB] [SCREEN] ddcutil Error ${err}`);
                      this.sendSocketNotification("SCREEN_ERROR", "ddcutil command error (mode 5 power OFF check)");
                      resolve(false);
                    }
                    else {
                      let responseSh = stdout.trim();
                      var displaySh = responseSh.split("(sl=")[1];
                      if (displaySh !== `0x${this.config.ddcutil.powerOffCode})`) {
                        console.error(`[Screen] [LIB] [SCREEN] ddcutil Error ${responseSh}`);
                        this.sendSocketNotification("SCREEN_ERROR", "ddcutil command error (mode 5 power OFF verify)");
                        resolve(false);
                      } else resolve(true);
                    }
                  });
                }, 1000);
              } else resolve(true);
            });
          }
          break;
        case 6:
          if (set) {
            exec("xset dpms force on", (err) => {
              if (err) {
                console.error(`[Screen] [LIB] [SCREEN] mode 5, power ON: ${err}`);
                this.sendSocketNotification("SCREEN_ERROR", "dpms linux command error (mode 6 power ON)");
                resolve(false);
              } else resolve(true);
            });
          } else {
            exec("xset dpms force off", (err) => {
              if (err) {
                console.error(`[Screen] [LIB] [SCREEN] mode 5, power OFF: ${err}`);
                this.sendSocketNotification("SCREEN_ERROR", "dpms linux command error (mode 6 power OFF)");
                resolve(false);
              } else resolve(true);
            });
          }
          break;
        case 7:
          if (set) {
            exec(`WAYLAND_DISPLAY=${this.screen.waylandDisplayName} wlopm --on ${this.screen.hdmiPort}`, (err) => {
              if (err) {
                console.error(`[Screen] [LIB] [SCREEN] mode 7, power ON: ${err}`);
                this.sendSocketNotification("SCREEN_ERROR", "wlopm command error (mode 3 power ON)");
                resolve(false);
              } else resolve(true);
            });
          } else {
            exec(`WAYLAND_DISPLAY=${this.screen.waylandDisplayName} wlopm --off ${this.screen.hdmiPort}`, (err) => {
              if (err) {
                console.error(`[Screen] [LIB] [SCREEN] mode 7, power OFF: ${err}`);
                this.sendSocketNotification("SCREEN_ERROR", "wlopm command error (mode 3 power OFF)");
                resolve(false);
              } else resolve(true);
            });
          }
          break;
        case 8:
          if (set) {
            let cmd = `pinctrl set ${this.config.relayGPIOPin} op dh`;
            exec(cmd, (err) => {
              if (err) {
                console.error(`[Screen] [LIB] [SCREEN] mode 8, power ON: ${err}`);
                this.sendSocketNotification("SCREEN_ERROR", "pinctrl linux command error (mode 8 power ON)");
                resolve(false);
              } else resolve(true);
            });
          }
          else {
            let cmd = `pinctrl set ${this.config.relayGPIOPin} op dl`;
            exec(cmd, (err) => {
              if (err) {
                console.error(`[Screen] [LIB] [SCREEN] mode 8, power OFF: ${err}`);
                this.sendSocketNotification("SCREEN_ERROR", "pinctrl linux command error (mode 8 power OFF)");
                resolve(false);
              } else resolve(true);
            });
          }
          break;
        case 9:
          if (set) {
            log("[Win Test] Screen On");
            let ps = "(Add-Type '[DllImport(\"user32.dll\")]public static extern int PostMessage(int h,int m,int w,int l);' -Name a -Pas)::PostMessage(-1,0x0112,0xF170,-1)";
            exec(ps, { shell: "powershell.exe" }, (err) => {
              if (err) {
                console.error(`[Screen] [LIB] [SCREEN] mode 9, power ON: ${err}`);
                this.sendSocketNotification("SCREEN_ERROR", "windows command command error (mode 9 power ON)");
                resolve(false);
              } else resolve(true);
            });
          }
          else {
            log("[Win Test] Screen Off");
            let ps = "(Add-Type '[DllImport(\"user32.dll\")]public static extern int PostMessage(int h,int m,int w,int l);' -Name a -Pas)::PostMessage(-1,0x0112,0xF170,2)";
            exec(ps, { shell: "powershell.exe" }, (err) => {
              if (err) {
                console.error(`[Screen] [LIB] [SCREEN] mode 9, power OFF: ${err}`);
                this.sendSocketNotification("SCREEN_ERROR", "windows command error (mode 9 power OFF)");
                resolve(false);
              } else resolve(true);
            });
          }
          break;
      }
    });
  }

  state () {
    this.sendSocketNotification("SCREEN_STATE", this.screen);
  }

  SendScreenPowerState () {
    this.sendSocketNotification("SCREEN_POWER", this.screen.power);
  }

  sleep (ms = 1300) {
    return new Promise((resolve) => {
      this.screen.awaitBeforeTurnOffTimer = setTimeout(resolve, ms);
    });
  }

  /** Cron Rules **/
  cronState (state) {
    this.screen.cronStarted = state.started;
    this.screen.cronON = state.ON;
    this.screen.cronOFF = state.OFF;
    this.screen.cronMode = state.mode;
    log("[CRON] Turn cron state to", state);
    if (!this.screen.cronStarted) return;
    if ((!this.screen.cronON && !this.screen.cronOFF) || this.screen.cronON) {
      this.screen.cronON = true;
      this.screen.cronOFF = false;
      switch (this.screen.cronMode) {
        case 1:
          this.forceLockON();
          break;
        case 2:
          this.screen.locked = false;
          this.wakeup();
          this.lock();
          this.sendForceLockState(true);
          break;
        case 3:
          this.forceLockON();
          break;
      }
    } else {
      if (this.screen.cronOFF) {
        this.screen.cronON = false;
        this.screen.cronOFF = true;
        switch (this.screen.cronMode) {
          case 1:
          case 2:
            this.forceLockOFF();
            break;
          case 3:
            this.screen.locked = false;
            this.forceEnd();
            break;
        }
      }
    }
  }

  /** Force Lock ON/OFF display **/
  forceLockOFF () {
    if (!this.screen.power) return log("[Force OFF] Display Already OFF");
    if (this.screen.cronStarted && this.screen.cronON && this.screen.cronMode === 2) return log("[Force OFF] Display is Locked by cron!");
    this.sendForceLockState(true);
    this.screen.locked = true;
    clearInterval(this.interval);
    this.interval = null;
    if (this.screen.running) this.counter = 0;
    this.screen.running = false;
    this.forceTurnOffScreen();
    this.sendSocketNotification("SCREEN_OUTPUT", { timer: "00:00", bar: 0 });
    log("[Force OFF] Turn OFF Display");
  }

  forceLockON () {
    if (this.screen.locked && !this.screen.forceLocked) return log("[Force ON] Display is Locked!");
    if (this.screen.cronStarted) {
      if (this.screen.cronON) {
        // always lock on when cron on (mode 2 only)
        if (this.screen.cronMode === 2) return log("[Force ON] [mode 2] Display is Locked by cron!");
      }
      if (this.screen.cronOFF) {
        // always lock off when cron off (except mode 3)
        if (this.screen.cronMode < 3) return log("[Force ON] Display is Locked by cron!");
      }
    }
    this.sendForceLockState(false);
    this.screen.locked = false;
    this.wakeup();
    this.sendSocketNotification("FORCE_LOCK_END");
    log("[Force ON] Turn ON Display");
  }

  forceLockToggle () {
    if (this.screen.power) this.forceLockOFF();
    else this.forceLockON();
  }

  sendForceLockState (state) {
    this.screen.forceLocked = state;
    this.sendSocketNotification("SCREEN_FORCELOCKED", this.screen.forceLocked);
  }

  screenStatus () {
    setInterval(() => {
      if (this.screen.power && this.config.availability) this.screen.availabilityCounter++;
      let status = this.screen.power;
      if (status !== this.status) {
        this.sendSocketNotification("SCREEN_POWERSTATUS", status);
        if (this.config.mode === 0) this.sendSocketNotification("SCREEN_POWER", this.screen.power);
        log("[POWER] Display from", this.status, "--->", status);
      }
      this.status = status;
    }, 1000);
  }

  close () {
    if (this.config.mode) this.setPowerDisplay(true);
  }
}

module.exports = SCREEN;
