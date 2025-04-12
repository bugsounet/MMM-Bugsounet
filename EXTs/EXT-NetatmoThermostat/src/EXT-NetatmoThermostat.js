/*
 * Module: EXT-NetatmoThermostat
 *
 * By bugsounet ©2025
 * MIT Licensed.
 */
var logNT = () => { /* do nothing */ };

Module.register("EXT-NetatmoThermostat", {
  defaults: {
    debug: false,
    verbose: false,
    updateInterval: 30000,
    home_id: null,
    room_id: 0,
    api: {
      client_id: null,
      client_secret: null,
      refresh_token: null
    },
    display: {
      name: true,
      mode: true,
      battery: true,
      firmware: false,
      signal: true,
      tendency: true
    }
  },

  start () {
    this.Thermostat = null;
  },

  getDom () {
    var wrapper = document.createElement("div");
    wrapper.id = "NETATMO";

    var thermostat = document.createElement("div");
    thermostat.id = "NETATMO_THERMOSTAT";

    var zone1 = document.createElement("div");
    zone1.id = "NETATMO_ZONE1";

    var tempset = document.createElement("div");
    tempset.id = "NETATMO_TEMPSET";
    var tempsetIcon = document.createElement("div");
    tempsetIcon.id = "NETATMO_TEMPSET_ICON";
    tempset.appendChild(tempsetIcon);
    var tempsetValue = document.createElement("div");
    tempsetValue.id = "NETATMO_TEMPSET_VALUE";
    tempset.appendChild(tempsetValue);
    if (!this.config.display.mode) {
      tempsetIcon.className = "hidden";
      tempsetValue.className = "hidden";
    }
    zone1.appendChild(tempset);

    var firmware = document.createElement("div");
    firmware.id = "NETATMO_FIRMWARE";
    var firmwareIcon = document.createElement("div");
    firmwareIcon.id = "NETATMO_FIRMWARE_ICON";
    firmware.appendChild(firmwareIcon);
    var firmwareValue = document.createElement("div");
    firmwareValue.id = "NETATMO_FIRMWARE_VALUE";
    firmware.appendChild(firmwareValue);
    if (!this.config.display.firmware) {
      firmwareIcon.className = "hidden";
      firmwareValue.className = "hidden";
    }
    zone1.appendChild(firmware);

    thermostat.appendChild(zone1);

    var zone2 = document.createElement("div");
    zone2.id = "NETATMO_ZONE2";

    var name = document.createElement("div");
    name.id = "NETATMO_NAME";
    zone2.appendChild(name);

    var tempValue = document.createElement("div");
    tempValue.id = "NETATMO_TEMP_VALUE";
    tempValue.innerHTML = "<img src ='modules/MMM-Bugsounet/EXTs/EXT-NetatmoThermostat/resources/netatmo-logo.png' style='width: 200px;'>";
    zone2.appendChild(tempValue);

    var empty = document.createElement("div");
    empty.id = "NETATMO_EMPTY";
    zone2.appendChild(empty);

    thermostat.appendChild(zone2);

    var zone3 = document.createElement("div");
    zone3.id = "NETATMO_ZONE3";

    var battery = document.createElement("div");
    battery.id = "NETATMO_BATTERY";
    var batteryIcon = document.createElement("div");
    batteryIcon.id = "NETATMO_BATTERY_ICON";
    battery.appendChild(batteryIcon);
    if (!this.config.display.battery) {
      batteryIcon.className = "hidden";
    }
    zone3.appendChild(battery);

    var tempTendency = document.createElement("div");
    tempTendency.id = "NETATMO_TEMP_TENDENCY";
    var tempTendencyIcon = document.createElement("div");
    tempTendencyIcon.id = "NETATMO_TEMP_TENDENCY_ICON";
    tempTendency.appendChild(tempTendencyIcon);
    if (!this.config.display.tendency) tempTendencyIcon.className = "hidden";
    zone3.appendChild(tempTendency);

    var signal = document.createElement("div");
    signal.id = "NETATMO_RADIO";
    var signalIcon = document.createElement("div");
    signalIcon.id = "NETATMO_RADIO_ICON";
    signal.appendChild(signalIcon);
    var signalValue = document.createElement("div");
    signalValue.id = "NETATMO_RADIO_VALUE";
    signal.appendChild(signalValue);
    if (!this.config.display.signal) {
      signalIcon.className = "hidden";
      signalValue.className = "hidden";
    }
    zone3.appendChild(signal);

    thermostat.appendChild(zone3);
    wrapper.appendChild(thermostat);

    return wrapper;
  },

  getStyles () {
    return [
      "EXT-NetatmoThermostat.css",
      "font-awesome.css"
    ];
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "INITIALIZED":
        this.sendNotification("Bugsounet_HELLO");
        break;
      case "DATA":
        this.updateData(payload);
        break;
    }
  },

  notificationReceived (noti, payload, sender) {
    switch (noti) {
      case "DOM_OBJECTS_CREATED":
        if (this.config.debug) logNT = (...args) => { console.log("[NETATMO]", ...args); };
        if (this.config.updateInterval < 30000) this.config.updateInterval = 30000;
        break;
      case "Bugsounet_READY":
        if (sender.name === "MMM-Bugsounet") this.sendSocketNotification("INIT", this.config);
        break;
    }
  },

  updateData (data) {
    if (!data) return console.error("[NETATMO] No Data!");
    this.Thermostat = data;
    logNT(this.Thermostat);

    var name = document.getElementById("NETATMO_NAME");
    var batteryIcon = document.getElementById("NETATMO_BATTERY_ICON");
    var signalIcon = document.getElementById("NETATMO_RADIO_ICON");
    var signalValue = document.getElementById("NETATMO_RADIO_VALUE");
    var tempTendencyIcon = document.getElementById("NETATMO_TEMP_TENDENCY_ICON");
    var thermostat = document.getElementById("NETATMO_THERMOSTAT");
    var tempValue = document.getElementById("NETATMO_TEMP_VALUE");
    var tempsetValue = document.getElementById("NETATMO_TEMPSET_VALUE");
    var tempsetIcon = document.getElementById("NETATMO_TEMPSET_ICON");
    var firmwareIcon = document.getElementById("NETATMO_FIRMWARE_ICON");
    var firmwareValue = document.getElementById("NETATMO_FIRMWARE_VALUE");

    if (this.config.display.name) name.textContent = this.Thermostat.name;

    tempValue.textContent = `${this.Thermostat.temp.toFixed(1)}°`;
    if (this.config.display.tendency) {
      tempTendencyIcon.className = this.tempTendency(this.Thermostat.tendency);
    }

    if (this.config.display.mode) {
      tempsetValue.textContent = `${this.Thermostat.tempSet}°`;
      switch (this.Thermostat.mode) {
        case "schedule":
          tempsetIcon.className = "far fa-calendar-check";
          break;
        case "manual":
          tempsetIcon.className = "fas fa-hand-paper";
          break;
        case "off":
          tempsetIcon.className = "fas fa-power-off";
          tempsetValue.textContent = "OFF";
          break;
        case "max":
          tempsetIcon.className = "fas fa-thermometer-full";
          tempsetValue.textContent = "MAX";
          break;
        case "away":
          tempsetIcon.className = "fas fa-person-walking-arrow-right";
          break;
        case "hg":
          tempsetIcon.className = "fas fa-snowflake";
          break;
      }
    }

    if (this.config.display.signal) {
      signalIcon.className = "fas fa-signal";
      signalValue.textContent = `${this.Thermostat.signalPercent}%`;
    }

    if (this.config.display.battery) {
      switch (this.Thermostat.batteryState) {
        case "full":
          batteryIcon.className = "fa fa-battery-full";
          break;
        case "high":
          batteryIcon.className = "fa fa-battery-three-quarters";
          break;
        case "medium":
          batteryIcon.className = "fa fa-battery-half";
          break;
        case "low":
          batteryIcon.className = "fa fa-battery-quarter";
          break;
        case "very_low":
          batteryIcon.className = "fa fa-battery-empty";
          break;
      }
    }

    if (this.config.display.firmware) {
      firmwareIcon.className = "fas fa-microchip";
      firmwareValue.textContent = this.Thermostat.firmware;
    }

    if (this.Thermostat.heating) thermostat.className = "heating";
    else thermostat.classList.remove("heating");
  },

  tempTendency (tendency) {
    var icon = "fa fa-caret-right";
    if (tendency === 1) icon = "fa fa-caret-up";
    else if (tendency === 2) icon = "fa fa-caret-down";
    return icon;
  }
});
