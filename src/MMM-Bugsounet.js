/*
 * Module : MMM-Bugsounet
 * @bugsounet
 * ©2025
 */

/* global AlertCommander, EXTs, WebsiteTranslations, sysInfoPage */

var logBugsounet = () => { /* do nothing */ };

Module.register("MMM-Bugsounet", {
  requiresVersion: "2.30.0",
  defaults: {
    debug: false,
    username: "admin",
    password: "admin",
    useAPIDocs: false,
    useLimiter: true
  },

  start () {
    if (this.config.debug) logBugsounet = (...args) => { console.log("[Bugsounet]", ...args); };
    this.ready = false;
    this.config.translations = {};
    this.EXT_DB = [];
    this.callbacks = {
      translate: (text) => {
        return this.translate(text);
      }
    };
    this.AlertCommander = new AlertCommander(this.callbacks);
    this.sendSocketNotification("PRE-INIT");
  },

  getScripts () {
    return [
      this.file("/node_modules/sweetalert2/dist/sweetalert2.all.min.js"),
      this.file("components/AlertCommander.js"),
      this.file("components/EXTs.js"),
      this.file("components/WebsiteTranslations.js"),
      this.file("components/sysInfoPage.js")
    ];
  },

  getStyles () {
    return ["MMM-Bugsounet.css"];
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

  async socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "BUGSOUNET-INIT":
        await this.EXT_Config();
        await this.websiteInit();
        this.sendSocketNotification("INIT", this.config);
        break;
      case "INITIALIZED":
        this.EXTs.setBugsounet_Ready();
        this.sendSocketNotification("setEXTStatus", this.EXTs.Get_EXT_Status());
        this.sendNotification("Bugsounet_READY");
        logBugsounet("Initialized.");
        break;
      case "ERROR":
        this.sendAlert({
          message: this.translate(payload),
          type: "error"
        }, "MMM-Bugsounet");
        break;
      case "SENDALERT":
        this.sendAlert(payload, "MMM-Bugsounet");
        break;
    }
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
      sendAlert: (...args) => this.sendAlert(...args),
      sendEXTStatus: (...args) => this.sendSocketNotification("setEXTStatus", ...args)
    };
    this.EXTs = new EXTs(Tools); // a faire verifier les CB
    await this.EXTs.init();
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
  },

  async websiteInit () {
    const Tools = {
      translate: (...args) => this.translate(...args),
      sendNotification: (...args) => this.sendNotification(...args),
      sendSocketNotification: (...args) => this.sendSocketNotification(...args)
    };
    this.Translations = new WebsiteTranslations(Tools);
    let init = await this.Translations.init();
    if (!init) {
      this.sendNotification("Bugsounet_ALERT", { // <-- to modify
        message: "Translations Error",
        type: "error",
        timer: 5000
      });
      return;
    }
    this.session = {};
    this.config.EXT_DB = this.EXTs.Get_DB();
    this.config.translations = this.Translations.Get_EXT_Translation();
    this.sysInfo = new sysInfoPage(Tools);
    this.sysInfo.prepare();
  }
});
