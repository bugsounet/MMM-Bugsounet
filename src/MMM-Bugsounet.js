/*
 * Module : MMM-Bugsounet
 * @bugsounet
 * ©2025
 */

/* global AlertCommander, EXTs */

var logBugsounet = () => { /* do nothing */ };

Module.register("MMM-Bugsounet", {
  requiresVersion: "2.30.0",
  defaults: {
    debug: false
  },

  getScripts () {
    return [
      "/modules/MMM-Bugsounet/components/AlertCommander.js",
      "/modules/MMM-Bugsounet/node_modules/sweetalert2/dist/sweetalert2.all.min.js",
      "/modules/MMM-Bugsounet/components/EXTs.js"
    ];
  },

  getStyles () {
    return ["/modules/MMM-Bugsounet/MMM-Bugsounet.css"];
  },

  getTranslations () {
    return {
      en: "translations/en.json",
      fr: "translations/fr.json"
    };
  },

  getDom () {
    var dom = document.createElement("div");
    dom.style.display = "none";
    return dom;
  },

  notificationReceived (noti, payload = null, sender = null) {
    if (noti.startsWith("Bugsounet_") && this.EXTs) return this.EXTs.ActionsEXTs(noti, payload, sender);
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "BUGSOUNET-INIT":
        this.EXT_Config();
        break;
      case "INITIALIZED":
        this.EXTs.setBugsounet_Ready();
        this.sendNotification("Bugsounet_READY");
        logBugsounet("Initialized.");
        break;
      case "ERROR":
        this.sendAlert({
          message: this.translate(payload),
          type: "error"
        }, "MMM-Bugsounet");
        break;
    }
  },

  start () {
    if (this.config.debug) logBugsounet = (...args) => { console.log("[Bugsounet]", ...args); };
    this.callbacks = {
      translate: (text) => {
        return this.translate(text);
      }
    };
    this.AlertCommander = new AlertCommander(this.callbacks);
    this.sendSocketNotification("PRE-INIT", this.config);
  },

  async EXT_Config () {
    const Tools = {
      translate: (...args) => this.translate(...args),
      sendNotification: (...args) => this.sendNotification(...args),
      sendSocketNotification: (...args) => this.sendSocketNotification(...args),
      socketNotificationReceived: (...args) => this.socketNotificationReceived(...args),
      notificationReceived: (...args) => this.notificationReceived(...args),
      lock: () => this.EXTs.forceLockPagesAndScreen(),
      unLock: () => this.EXTs.forceUnLockPagesAndScreen(),
      sendAlert: (...args) => this.sendAlert(...args)
    };
    this.EXTs = new EXTs(Tools); // a faire verifier les CB
    await this.EXTs.init();
    this.sendNotification("Bugsounet_DB", this.EXTs.Get_DB());
    this.sendSocketNotification("INIT");
  },

  sendAlert (payload, sender) {
    if (!sender) return this.AlertCommander.Alert({ type: "error", message: "Alert error: no sender specified" });
    if (sender === "MMM-Bugsounet" || sender.startsWith("EXT")) {
      if (!payload) return this.AlertCommander.Alert({ type: "error", message: `Alert error by: ${sender}` });
      this.AlertCommander.Alert({
        type: payload.type ? payload.type : "error",
        message: payload.message ? payload.message : "Unknow message",
        timer: payload.timer ? payload.timer : null,
        sender: payload.sender ? payload.sender : sender,
        icon: payload.icon ? payload.icon : null,
        sound: payload.sound ? payload.sound : null
      });
    }
  }
});
