/**************
*  EXT-Screen *
*  Bugsounet  *
**************/

Module.register("EXT-Screen", {
  defaults: {
    detectorSleeping: false
  },

  start () {
    this.ignoreSender = [
      "EXT-Pir",
      "EXT-Screen"
    ];

    this.ready = false;
    this.isForceLocked = false;
  },

  socketNotificationReceived (notification) {
    switch (notification) {
      case "INITIALIZED":
        this.sendNotification("Bugsounet_HELLO", this.name);
        this.ready = true;
        break;
    }
  },

  async notificationReceived (notification, payload, sender) {
    if (notification === "Bugsounet_READY") {
      if (sender.name === "MMM-Bugsounet") {
        try {
          await this.scanPir();
          this.sendSocketNotification("INIT");
        } catch (e) {
          this.sendNotification("Bugsounet_ALERT", {
            message: e,
            type: "error"
          });
        }
      }
    }
    if (!this.ready) return;
    switch (notification) {
      case "Bugsounet_SCREEN-END":
        if (this.isForceLocked) return;
        this.sendNotification("Bugsounet_PIR-END");
        break;
      case "Bugsounet_SCREEN-WAKEUP":
        if (this.isForceLocked) return;
        this.sendNotification("Bugsounet_PIR-WAKEUP");
        if (this.ignoreSender.indexOf(sender.name) === -1) {
          this.sendNotification("Bugsounet_ALERT", {
            message: this.translate("ScreenWakeUp", { VALUES: sender.name }),
            type: "information"
          });
        }
        break;
      case "Bugsounet_SCREEN-LOCK":
        if (this.isForceLocked) return;
        this.sendNotification("Bugsounet_PIR-LOCK");
        MM.getModules().withClass("MMM-Pir").enumerate((module) => {
          module.screenDisplay.hideMe();
        });
        if (this.ignoreSender.indexOf(sender.name) === -1) {
          this.sendNotification("Bugsounet_ALERT", {
            message: this.translate("ScreenLock", { VALUES: sender.name }),
            type: "information"
          });
        }
        break;
      case "Bugsounet_SCREEN-UNLOCK":
        if (this.isForceLocked) return;
        this.sendNotification("Bugsounet_PIR-UNLOCK");
        MM.getModules().withClass("EXT-Pir").enumerate((module) => {
          module.screenDisplay.showMe();
        });
        if (this.ignoreSender.indexOf(sender.name) === -1) {
          this.sendNotification("Bugsounet_ALERT", {
            message: this.translate("ScreenUnLock", { VALUES: sender.name }),
            type: "information"
          });
        }
        break;
      case "Bugsounet_PIR-SCREEN_POWERSTATUS":
        this.sendNotification("Bugsounet_SCREEN-POWER", payload);
        if (payload) {
          this.sendNotification("Bugsounet_ALERT", {
            message: this.translate("ScreenPowerOn"),
            type: "information"
          });
        } else {
          this.sendNotification("Bugsounet_ALERT", {
            message: this.translate("ScreenPowerOff"),
            type: "information"
          });
        }
        break;
      case "EXT_SCREEN-FORCE_END":
        this.isForceLocked = true;
        MM.getModules().withClass("EXT-Pir").enumerate((module) => {
          module.sendSocketNotification("LOCK_FORCE_END");
        });
        break;
      case "EXT_SCREEN-FORCE_WAKEUP":
        this.isForceLocked = false;
        MM.getModules().withClass("EXT-Pir").enumerate((module) => {
          module.sendSocketNotification("LOCK_FORCE_WAKEUP");
        });
        break;
      case "EXT_SCREEN-FORCE_TOGGLE":
        this.isForceLocked = !this.isForceLocked;
        MM.getModules().withClass("EXT-Pir").enumerate((module) => {
          module.sendSocketNotification("LOCK_FORCE_TOOGLE");
        });
        break;
    }
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
      el: "translations/el.json",
      "zh-cn": "translations/zh-cn.json",
      tr: "translations/tr.json"
    };
  },

  getDom () {
    var dom = document.createElement("div");
    dom.style.display = "none";
    return dom;
  },

  scanPir () {
    return new Promise((resolve, reject) => {
      var PIR = 0;
      MM.getModules().withClass("EXT-Pir").enumerate(() => { PIR++; });
      if (!PIR) reject("You can't start EXT-Screen without EXT-Pir. Please install it");
      else resolve(true);
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
        this.sendNotification("Bugsounet_PIR-WAKEUP");
        handler.reply("TEXT", this.translate("ScreenPowerOn"));
        return;
      }
      if (args[0] === "off") {
        this.sendNotification("Bugsounet_PIR-END");
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
