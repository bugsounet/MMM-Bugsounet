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
      case "BUGSOUNET-STOP":
        this.EXTs.ActionsEXTs("Bugsounet_STOP", undefined, { sender: { name: "MMM-Bugsounet" } });
        this.sendNotification("Bugsounet_STOP");
        break;
      case "SendNoti":
        if (payload.payload && payload.noti) this.sendNotification(payload.noti, payload.payload);
        else this.sendNotification(payload);
        break;
      case "SYSINFO-RESULT":
        this.sysInfo.updateSystemData(payload);
        break;
      case "TB_SYSINFO-RESULT":
        this.show_sysinfo(payload);
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
      sendEXTStatus: (...args) => this.sendSocketNotification("setEXTStatus", ...args),
      sendHelloEXT: (...args) => this.sendSocketNotification("setHelloEXT", ...args)
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
  },

  /********************************/
  /*** EXT-TelegramBot Commands ***/
  /********************************/
  EXT_TELBOTCommands (commander) {
    commander.add({
      command: "sysinfo",
      description: this.translate("TB_SYSINFO_DESCRIPTION"),
      callback: "cmd_sysinfo"
    });
  },

  cmd_sysinfo (command, handler) {
    if (handler.args) {
      var args = handler.args.toLowerCase().split(" ");
      if (args[0] === "show") {
        this.sysInfo.show();
        handler.reply("TEXT", "ok.");
        return;
      }
      if (args[0] === "hide") {
        this.sysInfo.hide();
        handler.reply("TEXT", "ok.");
        return;
      }
    }

    // try to manage session ...
    let chatId = handler.message.chat.id;
    let userId = handler.message.from.id;
    let messageId = handler.message.message_id;
    let sessionId = `${messageId}:${userId}:${chatId}`;
    this.session[sessionId] = handler;
    this.sendSocketNotification("TB_SYSINFO", sessionId);
  },

  show_sysinfo (result) {
    let session = result.sessionId;
    let handler = this.session[session];
    if (!handler || !session) return console.error("[Website] TB session not found!", handler, session);
    var text = "";
    text += `*${result["HOSTNAME"]}*\n\n`;
    // version
    text += `*-- ${this.translate("GW_System_Box_Version")} --*\n`;
    text += "*" + `MMM-Bugsounet:* \`${result["VERSION"]["Bugsounet"]}\`\n`;
    text += "*" + `MagicMirror²:* \`${result["VERSION"]["MagicMirror"]}\`\n`;
    text += "*" + `Electron:* \`${result["VERSION"]["ELECTRON"]}\`\n`;
    text += `*${this.translate("GW_System_NodeVersion")}* \`${result["VERSION"]["NODECORE"]}\`\n`;
    text += `*${this.translate("GW_System_NPMVersion")}* \`${result["VERSION"]["NPM"]}\`\n`;
    text += `*${this.translate("GW_System_OSVersion")}* \`${result["VERSION"]["OS"]}\`\n`;
    text += `*${this.translate("GW_System_KernelVersion")}* \`${result["VERSION"]["KERNEL"]}\`\n`;
    // GPU
    text += "*-- GPU --*\n";
    let GPU_INFO = result.GPU ? this.translate("GW_System_GPUAcceleration_Enabled") : (`WARN: ${this.translate("GW_System_GPUAcceleration_Disabled")}`);
    text += `*${GPU_INFO}*\n`;
    // CPU
    text += `*-- ${this.translate("GW_System_CPUSystem")} --*\n`;
    text += `*${this.translate("GW_System_TypeCPU")}* \`${result["CPU"]["type"]}\`\n`;
    text += `*${this.translate("GW_System_SpeedCPU")}* \`${result["CPU"]["speed"]}\`\n`;
    text += `*${this.translate("GW_System_CurrentLoadCPU")}* \`${result["CPU"]["usage"]}%\`\n`;
    text += `*${this.translate("GW_System_GovernorCPU")}* \`${result["CPU"]["governor"]}\`\n`;
    text += `*${this.translate("GW_System_TempCPU")}* \`${config.units === "metric" ? result["CPU"]["temp"]["C"] : result["CPU"]["temp"]["F"]}°\`\n`;
    // memory
    text += `*-- ${this.translate("GW_System_MemorySystem")} --*\n`;
    text += `*${this.translate("GW_System_TypeMemory")}* \`${result["MEMORY"]["used"]} / ${result["MEMORY"]["total"]} (${result["MEMORY"]["percent"]}%)\`\n`;
    text += `*${this.translate("GW_System_SwapMemory")}* \`${result["MEMORY"]["swapUsed"]} / ${result["MEMORY"]["swapTotal"]} (${result["MEMORY"]["swapPercent"]}%)\`\n`;
    // network
    text += `*-- ${this.translate("GW_System_NetworkSystem")} --*\n`;
    text += `*${this.translate("GW_System_IPNetwork")}* \`${result["NETWORK"]["ip"]}\`\n`;
    text += `*${this.translate("GW_System_InterfaceNetwork")}* \`${result["NETWORK"]["name"]} (${result["NETWORK"]["type"] === "wired" ? this.translate("TB_SYSINFO_ETHERNET") : this.translate("TB_SYSINFO_WLAN")})\`\n`;
    if (result["NETWORK"]["type"] === "wired") {
      text += `*${this.translate("GW_System_SpeedNetwork")}* \`${result["NETWORK"]["speed"]} Mbit/s\`\n`;
      text += `*${this.translate("GW_System_DuplexNetwork")}* \`${result["NETWORK"]["duplex"]}\`\n`;
    } else {
      text += `*${this.translate("GW_System_WirelessInfo")}:*\n`;
      text += `*  ${this.translate("GW_System_SSIDNetwork")}* \`${result["NETWORK"]["ssid"]}\`\n`;
      text += `*  ${this.translate("GW_System_FrequencyNetwork")}* \`${result["NETWORK"]["frequency"]} GHz\`\n`;
      text += `*  ${this.translate("GW_System_RateNetwork")}* \`${result["NETWORK"]["rate"]}\`\n`;
      text += `*  ${this.translate("GW_System_QualityNetwork")}* \`${result["NETWORK"]["quality"]}\`\n`;
      text += `*  ${this.translate("GW_System_SignalNetwork")}* \`${result["NETWORK"]["signalLevel"]} dBm (${result["NETWORK"]["barLevel"]})\`\n`;
    }
    // storage
    text += `*-- ${this.translate("GW_System_StorageSystem")} --*\n`;
    result["STORAGE"].forEach((partition) => {
      for (let [name, values] of Object.entries(partition)) {
        text += `*${this.translate("GW_System_MountStorage")} ${name}:* \`${values.used} / ${values.size} (${values.use}%)\`\n`;
      }
    });
    // uptimes
    text += `*-- ${this.translate("GW_System_UptimeSystem")} --*\n`;
    text += `*${this.translate("GW_System_CurrentUptime")}:*\n`;
    text += `*  ${this.translate("GW_System_System")}* \`${result["UPTIME"]["currentDHM"]}\`\n`;
    text += `*  MagicMirror²:* \`${result["UPTIME"]["MMDHM"]}\`\n`;
    text += `*${this.translate("GW_System_RecordUptime")}:*\n`;
    text += `*  ${this.translate("GW_System_System")}* \`${result["UPTIME"]["recordCurrentDHM"]}\`\n`;
    text += `*  MagicMirror²:* \`${result["UPTIME"]["recordMMDHM"]}\`\n`;

    handler.reply("TEXT", text, { parse_mode: "Markdown" });
    delete this.session[session];
  }
});
