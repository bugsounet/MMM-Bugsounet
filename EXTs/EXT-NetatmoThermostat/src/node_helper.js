/*
 * Node Helper: EXT-NetatmoThermostat
 *
 * By bugsounet ©2025
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
var moment = require("dayjs");
var netatmo = require("./components/netatmo");

var logNT = () => { /* do nothing ! */ };

module.exports = NodeHelper.create({
  start () {
    this.thermostat = {
      name: "NATherm1",
      batteryState: null,
      temp: null,
      tendency: null,
      tempSet: null,
      heating: false,
      id: null,
      mode: null,
      signal: 0,
      //signalState: null,
      signalPercent: 0,
      firmware: 0
    };
    this.tempHistory = {
      data: [],
      average: null,
      lastAverage: null
    };
    this.Authenticated = false;
    this.api = null;
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "INIT":
        console.log("[NETATMO] MMM-NetatmoThermostat Version:", require("./package.json").version, "rev:", require("./package.json").rev);
        this.initialize(payload);
        break;
    }
  },

  async initialize (config) {
    this.config = config;
    if (this.config.debug) logNT = (...args) => { console.log("[NETATMO]", ...args); };
    let checkErrorConfig = await this.checkConfig();
    if (checkErrorConfig) return;
    console.log("[NETATMO] Starting MMM-NetatmoThermostat module...");
    this.api = new netatmo(this.config.api);
    this.api
      .on("get-homestatus", (err, data) => this.getHomeStatus(err, data))
      .on("get-homesdata", (err, data) => this.getHomesData(err, data))
      .on("error", (error) => {
        console.error(`[NETATMO] threw an error: ${error}`);
      })
      .on("warning", (error) => {
        console.warn(`[NETATMO] threw a warning: ${error}`);
      })
      .on("authenticated", (expire) => {
        logNT("Authenticated!");
        let expire_at = moment(Date.now() + (expire * 1000)).format("LLLL");
        logNT("Token Expire", expire_at);
        this.Authenticated = true;
      })
      .on("refreshed", (expire) => {
        logNT("Token refreshed!");
        let expire_at = moment(Date.now() + (expire * 1000)).format("LLLL");
        logNT("New Token Expire", expire_at);
      });

    this.api.homeStatus({ home_id: this.config.home_id });
    this.sendSocketNotification("INITIALIZED");

    setInterval(() => {
      if (this.Authenticated) { // auth only ?
        logNT("Updating...");
        this.api.homeStatus({ home_id: this.config.home_id });
      }
    }, this.config.updateInterval);
  },

  getHomeStatus (err, data) {
    if (this.config.verbose) logNT("HomeStatus:", data.home);
    if (data.home.rooms.length && data.home.rooms.length - 1 >= this.config.room_id) {
      this.thermostat.temp = data.home.rooms[this.config.room_id].therm_measured_temperature;
      this.thermostat.tempSet = data.home.rooms[this.config.room_id].therm_setpoint_temperature;
      this.thermostat.mode = data.home.rooms[this.config.room_id].therm_setpoint_mode;
      this.thermostat.tendency = this.averageTemp(this.thermostat.temp);
      data.home.modules.forEach((module) => {
        if (module.type === "NATherm1") {
          this.thermostat.id = module.id;
          this.thermostat.heating = module.boiler_status;
          this.thermostat.signal = module.rf_strength;
          this.thermostat.signalPercent = this.signalPercent(this.thermostat.signal);
          //this.thermostat.signalState = (this.thermostat.signal < 60 ? "full" : this.thermostat.signal < 70 ? "high" : this.thermostat.signal < 80 ? "medium" : "low") || null
          this.thermostat.firmware = module.firmware_revision;
          this.thermostat.batteryState = module.battery_state;
          this.api.getHomesData({ home_id: this.config.home_id });
        }
      });
    } else console.error(`[NETATMO] room ${this.config.room_id} not found!`, data.home.rooms);
  },

  signalPercent (value) {
    if (isNaN(value)) return 0;
    const min = 50;
    const max = 90;
    var percent = 100 - ((value - min) / (max - min)) * 100;
    if (percent > 100) percent = 100;
    if (percent < 0) percent = 0;
    const result = parseInt(percent.toFixed(0));
    return result;
  },

  getHomesData (err, data) {
    if (this.config.verbose) logNT("getHomesData:", data);
    const home = data.homes[0];
    home?.modules.forEach((module) => {
      if (module.type === "NATherm1" && module.id === this.thermostat.id) {
        this.thermostat.name = module.name;
      }
    });
    logNT("Final Result:", this.thermostat);
    this.sendSocketNotification("DATA", this.thermostat);
  },

  averageTemp (temp) {
    if (!temp) return;
    let average = 0;

    /** do Array of last 10 Temp **/
    if (this.tempHistory.data.length >= 10) this.tempHistory.data.splice(0, 1);
    this.tempHistory.data.push(temp);

    /** do the average **/
    this.tempHistory.data.forEach((value) => {
      average += value;
    });
    average = (average / this.tempHistory.data.length).toFixed(2);
    this.tempHistory.lastAverage = this.tempHistory.average ? this.tempHistory.average : average;
    this.tempHistory.average = average;
    logNT("tempHistory:", this.tempHistory);
    if (this.tempHistory.average > this.tempHistory.lastAverage) return 1;
    if (this.tempHistory.average < this.tempHistory.lastAverage) return 2;
    return 0;
  },

  checkConfig () {
    var err = 0;
    return new Promise((resolve) => {
      if (!this.config.home_id) {
        console.error("[NETATMO] 'home_id' configuration missing!");
        err++;
      }
      if (isNaN(this.config.room_id)) {
        console.error("[NETATMO] 'room_id' must be a Number!");
        err++;
      }
      if (typeof (this.config.api) !== "object") {
        console.error("[NETATMO] 'api: {...}' configuration missing!");
        err++;
      }
      if (!this.config.api.client_id) {
        console.error("[NETATMO] 'client_id' configuration missing in api!");
        err++;
      }
      if (!this.config.api.client_secret) {
        console.error("[NETATMO] 'client_secret' configuration missing in api!");
        err++;
      }
      if (!this.config.api.refresh_token) {
        console.error("[NETATMO] 'refresh_token' configuration missing in api!");
        err++;
      }

      if (err) console.warn("[NETATMO] Config:", this.config);
      else logNT("[NETATMO] Config:", this.config);

      resolve(err);
    });
  }
});
