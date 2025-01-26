/*************
*  MMM-Screen *
*  Bugsounet  *
*  01/2025    *
*************/

/* global screenDisplayer, screenTouch, motionLib */

var _logPIR = () => { /* do nothing */ };

Module.register("MMM-Screen", {
  requiresVersion: "2.28.0",
  defaults: {
    debug: false,
    Display: {
      animate: true,
      colorFrom: "#FF0000",
      colorTo: "#00FF00",
      timeout: 2 * 60 * 1000,
      mode: 1,
      ecoMode: true,
      counter: true,
      style: 1,
      lastPresence: true,
      lastPresenceTimeFormat: "LL H:mm",
      availability: true,
      autoDimmer: false,
      xrandrForceRotation: "normal",
      wrandrForceRotation: "normal",
      wrandrForceMode: null,
      waylandDisplayName: "wayland-0",
      relayGPIOPin: 0,
      ddcutil: {
        powerOnCode: "01",
        powerOffCode: "04",
        skipSetVcpCheck: false,
        setPowerRetries: 0
      }
    },
    Pir: {
      animate: true,
      mode: 0,
      gpio: 21,
      chip: "auto",
      triggerMode: "LH"
    },
    Motion: {
      animate: true,
      deviceId: 0,
      captureIntervalTime: 1000,
      scoreThreshold: 100
    },
    Cron: {
      mode: 0,
      ON: [],
      OFF: []
    },
    Touch: {
      mode: 3
    },
    Governor: {
      sleeping: 4,
      working: 2
    },
    Sounds: {
      on: "open.mp3",
      off: "close.mp3"
    }
  },

  start () {
    if (this.config.debug) _logPIR = (...args) => { console.log("[MMM-Screen]", ...args); };
    this.ready = false;
    let Tools = {
      sendSocketNotification: (...args) => this.sendSocketNotification(...args),
      sendNotification: (...args) => this.sendNotification(...args),
      hidden: () => { return this.hidden; },
      translate: (...args) => this.translate(...args),
      hide: (...args) => this.hide(...args),
      show: (...args) => this.show(...args),
      wakeup: () => {
        this.sendSocketNotification("WAKEUP");
        if (this.config.Motion.animate) this.screenDisplay.animateModule();
        this.sendNotification("MMM_PIR-USER_PRESENCE", true);
      }
    };

    this.config = configMerge({}, this.defaults, this.config);

    this.screenDisplay = new screenDisplayer(this.config.Display, Tools);
    this.screenTouch = new screenTouch(this.config.Touch, Tools);
    this.motionDetect = new motionLib(this.config.Motion, Tools);
    this.sound = new Audio();
    this.sound.autoplay = true;
    this.getUpdatesNotifications = false;
    _logPIR("is now started!");
  },

  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case "INITIALIZED":
        _logPIR("Ready to fight MagicMirror²!");
        this.screenTouch.touch();
        if (this.config.Motion.deviceId !== 0) this.motionDetect.start();
        this.ready = true;
        break;
      case "SCREEN_SHOWING":
        this.screenDisplay.screenShowing();
        break;
      case "SCREEN_HIDING":
        this.screenDisplay.screenHiding();
        break;
      case "SCREEN_OUTPUT":
        this.screenDisplay.updateDisplay(payload);
        break;
      case "SCREEN_PRESENCE":
        this.screenDisplay.updatePresence(payload);
        break;
      case "SCREEN_POWER":
        if (payload && this.config.Sounds.on !== 0) {
          this.sound.src = `modules/MMM-Screen/sounds/${this.config.Sounds.on}?seed=${Date.now}`;
        } else if (this.config.Sounds.off !== 0) {
          this.sound.src = `modules/MMM-Screen/sounds/${this.config.Sounds.off}?seed=${Date.now}`;
        }
        break;
      case "SCREEN_POWERSTATUS":
        this.sendNotification("MMM_PIR-SCREEN_POWERSTATUS", payload);
        break;
      case "SCREEN_ERROR":
        this.sendNotification("SHOW_ALERT", {
          type: "notification",
          title: "MMM-Screen",
          message: `Screen Error detected: ${payload}`,
          timer: 15000
        });
        break;
      case "SCREEN_FORCELOCKED":
        if (payload) this.screenDisplay.hideMe();
        else this.screenDisplay.showMe();
        break;
      case "FORCE_LOCK_END":
        this.screenDisplay.showMe();
        break;
      case "PIR_ERROR":
        this.sendNotification("SHOW_ALERT", {
          type: "notification",
          title: "MMM-Screen",
          message: `Pir Error detected: ${payload}`,
          timer: 15000
        });
        break;
      case "PIR_DETECTED":
        this.sendNotification("MMM_PIR-USER_PRESENCE", true);
        break;
      case "PIR_ANIMATE":
        this.screenDisplay.animateModule();
        break;
      case "GOVERNOR_ERROR":
        this.sendNotification("SHOW_ALERT", {
          type: "notification",
          title: "MMM-Screen",
          message: `Governor Error detected: ${payload}`,
          timer: 15000
        });
        break;
      case "CRON_ERROR":
        this.sendNotification("SHOW_ALERT", {
          type: "notification",
          title: "MMM-Screen",
          message: `Cron Error detected: ${payload}`,
          timer: 15000
        });
        break;
      case "CRON_ERROR_UNSPECIFIED":
        this.sendNotification("SHOW_ALERT", {
          type: "notification",
          title: this.translate("MODULE_CONFIG_ERROR", { MODULE_NAME: "MMM-Screen", ERROR: "Cron Configuration" }),
          message: `Code:${payload} - ${this.translate("MODULE_ERROR_UNSPECIFIED")}`,
          timer: 15000
        });
        break;
    }
  },

  notificationReceived (notification, payload, sender) {
    if (notification === "MODULE_DOM_CREATED") {
      this.screenDisplay.prepareStyle();
      this.sendSocketNotification("INIT", this.config);
      this.enforceUpdateNotificationConfig();
    }
    if (!this.ready) return;
    switch (notification) {
      // only available if not force-locked
      case "MMM_PIR-END":
        this.sendSocketNotification("FORCE_END");
        break;
      case "UPDATES":
        if (sender?.name === "updatenotification" && this.getUpdatesNotifications) this.sendSocketNotification("WAKEUP");
        break;
      case "MMM_PIR-WAKEUP":
        this.sendSocketNotification("WAKEUP");
        break;
      case "MMM_PIR-LOCK":
        this.sendSocketNotification("LOCK");
        break;
      case "MMM_PIR-UNLOCK":
        this.sendSocketNotification("UNLOCK");
        break;
    }
  },

  getDom () {
    return this.screenDisplay.prepareDom();
  },

  getStyles () {
    return ["MMM-Screen.css"];
  },

  getScripts () {
    return [
      "/modules/MMM-Screen/components/screenDisplayer.js",
      "/modules/MMM-Screen/components/screenTouch.js",
      "/modules/MMM-Screen/node_modules/long-press-event/dist/long-press-event.min.js",
      "/modules/MMM-Screen/node_modules/progressbar.js/dist/progressbar.min.js",
      "/modules/MMM-Screen/components/motion.js",
      "/modules/MMM-Screen/components/motionLib.js"
    ];
  },

  getTranslations () {
    return {
      en: "translations/en.json",
      fr: "translations/fr.json",
      it: "translations/it.json",
      de: "translations/de.json",
      es: "translations/es.json",
      nl: "translations/nl.json",
      pt: "translations/pt.json",
      ko: "translations/ko.json",
      el: "translations/el.json"
    };
  },

  // force to set `sendUpdatesNotifications: true` in updatenotification module
  // needed for labwc using for auto-restart after updating.
  // without -> labwc can't display MM in full screen
  // Best way: set sendUpdatesNotifications only if updateAutorestart and read UPDATES notification for wakeup screen
  enforceUpdateNotificationConfig () {
    MM.getModules().enumerate((module) => {
      if (module.name === "updatenotification" && module.config.updateAutorestart === true) {
        this.getUpdatesNotifications = true;
        if (module.config.sendUpdatesNotifications === false) {
          console.log("[MMM-Screen] Enforce updatenotification config: set sendUpdatesNotifications to true");
          module.config.sendUpdatesNotifications = true;
          module.sendSocketNotification("CONFIG", module.config);
          module.sendSocketNotification("SCAN_UPDATES");
        }
      }
    });
  }
});
