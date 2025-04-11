/*************
*  EXT-Screen *
*  Bugsounet  *
*  01/2025    *
*************/

/* global screenDisplayer, screenTouch, motionLib */

var _logScreen = () => { /* do nothing */ };

Module.register("EXT-Screen", {
  requiresVersion: "2.30.0",
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
    if (this.config.debug) _logScreen = (...args) => { console.log("[Screen]", ...args); };
    this.ready = false;
    this.isForceLocked = false;
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
        this.sendNotification("Bugsounet_USER-PRESENCE", true);
      }
    };

    this.config = configMerge({}, this.defaults, this.config);

    this.screenDisplay = new screenDisplayer(this.config.Display, Tools);
    this.screenTouch = new screenTouch(this.config.Touch, Tools);
    this.motionDetect = new motionLib(this.config.Motion, Tools);
    this.sound = new Audio();
    this.sound.autoplay = true;
    this.getUpdatesNotifications = false;
    _logScreen("is now started!");
  },

  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case "INITIALIZED":
        _logScreen("Ready to fight MagicMirror²!");
        this.screenTouch.touch();
        if (this.config.Motion.deviceId !== 0) this.motionDetect.start();
        this.ready = true;
        this.sendNotification("Bugsounet_HELLO");
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
          this.sound.src = this.file(`sounds/${this.config.Sounds.on}?seed=${Date.now}`);
        } else if (this.config.Sounds.off !== 0) {
          this.sound.src = this.file(`sounds/${this.config.Sounds.off}?seed=${Date.now}`);
        }
        break;
      case "SCREEN_POWERSTATUS":
        this.sendNotification("Bugsounet_SCREEN-POWER", payload);
        if (payload) {
          this.sendInformation(this.translate("ScreenPowerOn"));
        } else {
          this.sendInformation(this.translate("ScreenPowerOff"));
        }
        break;
      case "SCREEN_ERROR":
        this.sendNotification("Bugsounet_ALERT", {
          type: "error",
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
        this.sendNotification("Bugsounet_ALERT", {
          type: "error",
          message: `Pir Error detected: ${payload}`,
          timer: 15000
        });
        break;
      case "PIR_DETECTED":
        this.sendNotification("Bugsounet_USER-PRESENCE", true);
        break;
      case "PIR_ANIMATE":
        this.screenDisplay.animateModule();
        break;
      case "GOVERNOR_ERROR":
        this.sendNotification("Bugsounet_ALERT", {
          type: "error",
          message: `Governor Error detected: ${payload}`,
          timer: 15000
        });
        break;
      case "CRON_ERROR":
        this.sendNotification("Bugsounet_ALERT", {
          type: "error",
          message: `Cron Error detected: ${payload}`,
          timer: 15000
        });
        break;
      case "CRON_ERROR_UNSPECIFIED":
        this.sendNotification("Bugsounet_ALERT", {
          type: "error",
          message: `Cron Configuration Error Code:${payload} - ${this.translate("MODULE_ERROR_UNSPECIFIED")}`,
          timer: 15000
        });
        break;
    }
  },

  notificationReceived (notification, payload, sender) {
    if (notification === "MODULE_DOM_CREATED") {
      this.screenDisplay.prepareStyle();
      this.enforceUpdateNotificationConfig();
    }
    if (notification === "Bugsounet_READY") {
      this.sendSocketNotification("INIT", this.config);
    }
    if (!this.ready) return;
    switch (notification) {
      // only available if not force-locked
      case "Bugsounet_SCREEN-END":
        if (this.isForceLocked) return;
        this.sendSocketNotification("FORCE_END");
        break;
      case "UPDATES":
        if (sender?.name === "updatenotification" && this.getUpdatesNotifications) this.sendSocketNotification("WAKEUP");
        break;
      case "Bugsounet_SCREEN-WAKEUP":
        if (this.isForceLocked) return;
        this.sendInformation(this.translate("ScreenWakeUp", { VALUES: sender.name }));
        this.sendSocketNotification("WAKEUP");
        break;
      case "Bugsounet_SCREEN-LOCK":
        if (this.isForceLocked) return;
        if (sender.name !== "MMM-Bugsounet") this.sendInformation(this.translate("ScreenLock", { VALUES: sender.name }));
        this.screenDisplay.hideMe();
        this.sendSocketNotification("LOCK");
        break;
      case "Bugsounet_SCREEN-UNLOCK":
        if (this.isForceLocked) return;
        if (sender.name !== "MMM-Bugsounet") this.sendInformation(this.translate("ScreenUnLock", { VALUES: sender.name }));
        this.screenDisplay.showMe();
        this.sendSocketNotification("UNLOCK");
        break;
      case "Bugsounet_SCREEN-FORCE_END":
        this.isForceLocked = true;
        this.sendSocketNotification("LOCK_FORCE_END");
        break;
      case "Bugsounet_SCREEN-FORCE_WAKEUP":
        this.isForceLocked = false;
        this.sendSocketNotification("LOCK_FORCE_WAKEUP");
        break;
      case "Bugsounet_SCREEN-FORCE_TOGGLE":
        this.isForceLocked = !this.isForceLocked;
        this.sendSocketNotification("LOCK_FORCE_TOOGLE");
        break;
    }
  },

  getDom () {
    return this.screenDisplay.prepareDom();
  },

  getStyles () {
    return ["EXT-Screen.css"];
  },

  getScripts () {
    return [
      this.file("components/screenDisplayer.js"),
      this.file("components/screenTouch.js"),
      this.file("node_modules/long-press-event/dist/long-press-event.min.js"),
      this.file("node_modules/progressbar.js/dist/progressbar.min.js"),
      this.file("components/motion.js"),
      this.file("components/motionLib.js")
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
          console.log("[Screen] Enforce updatenotification config: set sendUpdatesNotifications to true");
          module.config.sendUpdatesNotifications = true;
          module.sendSocketNotification("CONFIG", module.config);
          module.sendSocketNotification("SCAN_UPDATES");
        }
      }
    });
  },

  sendInformation (message) {
    this.sendNotification("Bugsounet_ALERT", {
      message: message,
      type: "information"
    });
  },

  /** EXT-TelegramBot Commands **/
  EXT_TELBOTCommands (commander) {
    commander.add({
      command: "screen",
      description: "Screen power control",
      callback: "tbScreen"
    });
  },
  tbScreen (command, handler) {
    if (handler.args) {
      var args = handler.args.toLowerCase().split(" ");
      if (args[0] === "on") {
        this.isForceLocked = false;
        this.sendSocketNotification("LOCK_FORCE_WAKEUP");
        handler.reply("TEXT", this.translate("ScreenPowerOn"));
        return;
      }
      if (args[0] === "off") {
        this.isForceLocked = true;
        this.sendSocketNotification("LOCK_FORCE_END");
        handler.reply("TEXT", this.translate("ScreenPowerOff"));
        return;
      }
    }
    handler.reply("TEXT", "Need Help for /screen commands ?\n\n\
  *on*: Power on the screen\n\
  *off*: Power off the screen\n\
  ", { parse_mode: "Markdown" });
  }
});
