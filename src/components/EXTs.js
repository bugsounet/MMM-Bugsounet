/*********************/
/** EXTs Management **/
/*********************/

/* global logBugsounet */
/* eslint-disable-next-line */
class EXTs {
  constructor (Tools) {
    this.translate = (...args) => Tools.translate(...args);
    this.sendNotification = (...args) => Tools.sendNotification(...args);
    this.sendSocketNotification = (...args) => Tools.sendSocketNotification(...args);
    this.notificationReceived = (...args) => Tools.notificationReceived(...args);
    this.socketNotificationReceived = (...args) => Tools.socketNotificationReceived(...args);
    this.sendAlert = (...args) => Tools.sendAlert(...args);

    this.ExtDB = [
      "EXT-Freebox",
      "EXT-FreeboxTV",
      "EXT-Glassy",
      "EXT-Librespot",
      "EXT-MeteoFrance",
      "EXT-NetatmoThermostat",
      "EXT-Pages",
      "EXT-PrixCarburants",
      "EXT-RadioPlayer",
      "EXT-Saint",
      "EXT-Screen",
      "EXT-SmartHome",
      "EXT-Spotify",
      "EXT-TelegramBot",
      "EXT-Updates",
      "EXT-VLCServer",
      "EXT-Volume",
      "EXT-Website"
    ];

    this.EXT = {
      Bugsounet_Ready: false
    };
    this.sendStatusTimeout = null;
    console.log("[Bugsounet] EXTs Ready");
  }

  async init () {
    await this.createDB();
  }

  async createDB () {
    await Promise.all(this.ExtDB.map((Ext) => {
      this.EXT[Ext] = {
        hello: false,
        connected: false
      };
    }));

    /** special rules **/
    this.EXT["EXT-Screen"].power = true;
    this.EXT["EXT-Updates"].module = {};
    this.EXT["EXT-Spotify"].remote = false;
    this.EXT["EXT-Spotify"].play = false;
    this.EXT["EXT-Volume"].speaker = 0;
    this.EXT["EXT-Volume"].isMuted = false;
    this.EXT["EXT-Volume"].recorder = 0;
    this.EXT["EXT-Pages"].actual = 0;
    this.EXT["EXT-Pages"].total = 0;
  }

  setBugsounet_Ready () {
    this.EXT.Bugsounet_Ready = true;
  }

  Get_EXT_Status () {
    return this.EXT;
  }

  Get_DB () {
    return this.ExtDB;
  }

  /** Activate automaticaly any plugins **/
  helloEXT (module) {
    switch (module) {
      case this.ExtDB.find((name) => name === module): //read DB and find module
        this.EXT[module].hello = true;
        this.sendNotification("Bugsounet_DB-UPDATE", module);
        logBugsounet("[EXTs] Hello,", module);
        this.onStartPlugin(module);
        break;
      default:
        logBugsounet(`[EXTs] Hi, who are you ${module}?`);
        this.sendAlert({
          message: `Unknow EXT: who are you ${module} !?, are you lost in space ?`,
          type: "warning",
          timer: 10000
        }, "MMM-Bugsounet");
        break;
    }
  }

  /** Rule when a plugin send Hello **/
  onStartPlugin (plugin) {
    if (!plugin) return;
    if (plugin === "EXT-Pages") this.sendNotification("Bugsounet_PAGES-Gateway");
  }

  /** Connect rules **/
  connectEXT (extName) {
    if (!this.EXT.Bugsounet_Ready) return this.sendWarn(`Hey ${extName}!, MMM-Bugsounet is not ready`);
    if (!this.EXT[extName] || this.EXT[extName].connected) return;

    if (this.EXT["EXT-Screen"].hello && !this.hasPluginConnected(this.EXT, "connected", true)) {
      if (!this.EXT["EXT-Screen"].power) this.sendNotification("Bugsounet_SCREEN-WAKEUP");
      this.sendNotification("Bugsounet_SCREEN-LOCK");
    }

    if (this.byPassIsConnected()) {
      logBugsounet("[EXTs] Connected:", extName, "[byPass Mode]");
      this.EXT[extName].connected = true;
      this.lockPagesByGW(extName);
      if (this.EXT["EXT-Website"].hello || this.EXT["EXT-SmartHome"].hello) this.sendNotification("Bugsounet_STATUS", this.EXT);
      return;
    }

    if (this.EXT["EXT-Spotify"].hello && this.EXT["EXT-Spotify"].connected) this.sendNotification("Bugsounet_SPOTIFY-STOP");
    if (this.EXT["EXT-RadioPlayer"].hello && this.EXT["EXT-RadioPlayer"].connected) this.sendNotification("Bugsounet_RADIO-STOP");
    if (this.EXT["EXT-FreeboxTV"].hello && this.EXT["EXT-FreeboxTV"].connected) this.sendNotification("Bugsounet_FREEBOXTV-STOP");

    logBugsounet("[EXTs] Connected:", extName);
    logBugsounet("[EXTs] Debug:", this.EXT);
    this.EXT[extName].connected = true;
    this.lockPagesByGW(extName);
  }

  /** disconnected rules **/
  disconnectEXT (extName) {
    if (!this.EXT.Bugsounet_Ready) return this.sendWarn("MMM-Bugsounet is not ready");
    if (!this.EXT[extName] || !this.EXT[extName].connected) return;
    this.EXT[extName].connected = false;

    // sport time ... verify if there is again an EXT module connected !
    setTimeout(() => { // wait 1 sec before scan ...
      if (this.EXT["EXT-Screen"].hello && !this.hasPluginConnected(this.EXT, "connected", true)) {
        this.sendNotification("Bugsounet_SCREEN-UNLOCK");
      }
      if (this.EXT["EXT-Pages"].hello && !this.hasPluginConnected(this.EXT, "connected", true)) this.sendNotification("Bugsounet_PAGES-UNLOCK");
      logBugsounet("[EXTs] Disconnected:", extName);
    }, 1000);
  }

  /** need to lock EXT-Pages ? **/
  lockPagesByGW (extName) {
    if (this.EXT["EXT-Pages"].hello) {
      if (this.EXT[extName].hello && this.EXT[extName].connected && typeof this.EXT["EXT-Pages"][extName] === "number") {
        this.sendNotification("Bugsounet_PAGES-CHANGED", this.EXT["EXT-Pages"][extName]);
        this.sendNotification("Bugsounet_PAGES-LOCK");
      }
      else this.sendNotification("Bugsounet_PAGES-PAUSE");
    }
  }

  /** need to force lock/unlock Pages and Screen ? **/
  forceLockPagesAndScreen () {
    if (this.EXT["EXT-Pages"].hello) this.sendNotification("Bugsounet_PAGES-LOCK");
    if (this.EXT["EXT-Screen"].hello) {
      if (!this.EXT["EXT-Screen"].power) this.sendNotification("Bugsounet_SCREEN-WAKEUP");
      this.sendNotification("Bugsounet_SCREEN-LOCK");
    }
  }

  forceUnLockPagesAndScreen () {
    if (this.EXT["EXT-Pages"].hello) this.sendNotification("Bugsounet_PAGES-UNLOCK");
    if (this.EXT["EXT-Screen"].hello) this.sendNotification("Bugsounet_SCREEN-UNLOCK");
  }

  // exception with EXT-Website
  byPassIsConnected () {
    if (this.EXT["EXT-Website"].hello && this.EXT["EXT-Website"].connected) {
      logBugsounet("[EXTs] byPass", true);
      return true;
    }
    return false;
  }

  /** hasPluginConnected(obj, key, value)
   * obj: object to check
   * key: key to check in deep
   * value: value to check with associated key
   * @bugsounet 09/01/2022
  **/
  hasPluginConnected (obj, key, value) {
    if (typeof obj === "object" && obj !== null) {
      if (obj.hasOwnProperty(key)) return true;
      for (var p in obj) {
        if (obj.hasOwnProperty(p) && this.hasPluginConnected(obj[p], key, value)) {
          //logBugsounet("check", key+":"+value, "in", p)
          if (obj[p][key] === value) {
            //logBugsounet(p, "is connected")
            return true;
          }
        }
      }
    }
    return false;
  }

  /** Notification Actions **/
  ActionsEXTs (noti, payload, sender) {
    if (!this.EXT.Bugsounet_Ready) return this.sendWarn("MMM-Bugsounet is not ready");
    clearTimeout(this.sendStatusTimeout);
    switch (noti) {
      case "Bugsounet_HELLO":
        this.helloEXT(sender.name);
        break;
      case "Bugsounet_ALERT":
        this.sendAlert(payload, sender.name);
        break;
      case "Bugsounet_PAGES-Gateway":
        if (sender.name === "EXT-Pages") Object.assign(this.EXT["EXT-Pages"], payload);
        break;
      case "Bugsounet_GATEWAY-Restart":
        if (sender.name === "MMM-Bugsounet" || (sender.name === "EXT-Updates" && this.EXT["EXT-Updates"].hello) || (sender.name === "EXT-Website" && this.EXT["EXT-Website"].hello) || (sender.name === "EXT-SmartHome" && this.EXT["EXT-SmartHome"].hello)) {
          this.sendSocketNotification("RESTART");
        }
        break;
      case "Bugsounet_GATEWAY-Close":
        if (sender.name === "MMM-Bugsounet" || (sender.name === "EXT-Website" && this.EXT["EXT-Website"].hello)) this.sendSocketNotification("CLOSE");
        break;
      case "Bugsounet_GATEWAY-Reboot":
        if (sender.name === "MMM-Bugsounet" || (sender.name === "EXT-Website" && this.EXT["EXT-Website"].hello)) this.sendSocketNotification("REBOOT");
        break;
      case "Bugsounet_GATEWAY-Shutdown":
        if (sender.name === "MMM-Bugsounet" || (sender.name === "EXT-Website" && this.EXT["EXT-Website"].hello)) this.sendSocketNotification("SHUTDOWN");
        break;
      case "Bugsounet_SCREEN-POWER":
        if (!this.EXT["EXT-Screen"].hello) return this.sendWarn("EXT-Screen don't say to me HELLO!");
        this.EXT["EXT-Screen"].power = payload;
        if (this.EXT["EXT-Pages"].hello) {
          if (this.EXT["EXT-Screen"].power) {
            this.sendNotification("Bugsounet_PAGES-RESUME");
            this.sendNotification("Bugsounet_PAGES-HOME");
          }
          else this.sendNotification("Bugsounet_PAGES-PAUSE");
        }
        break;
      case "Bugsounet_STOP":
        if (this.hasPluginConnected(this.EXT, "connected", true)) {
          this.sendAlert({ type: "information", message: this.translate("EXTStop") }, "MMM-Bugsounet");
        }
        break;
      case "Bugsounet_RADIO-CONNECTED":
        if (!this.EXT["EXT-RadioPlayer"].hello) return this.sendWarn("[CONNECT] EXT-RadioPlayer don't say to me HELLO!");
        this.connectEXT("EXT-RadioPlayer");
        break;
      case "Bugsounet_RADIO-DISCONNECTED":
        if (!this.EXT["EXT-RadioPlayer"].hello) return this.sendWarn("[DISCONNECT] EXT-RadioPlayer don't say to me HELLO!");
        this.disconnectEXT("EXT-RadioPlayer");
        break;
      case "Bugsounet_SPOTIFY-CONNECTED":
        if (!this.EXT["EXT-Spotify"].hello) return this.sendWarn("[CONNECT] EXT-Spotify don't say to me HELLO!");
        this.EXT["EXT-Spotify"].remote = true;
        break;
      case "Bugsounet_SPOTIFY-DISCONNECTED":
        if (!this.EXT["EXT-Spotify"].hello) return this.sendWarn("[DISCONNECT] EXT-Spotify don't say to me HELLO!");
        this.EXT["EXT-Spotify"].remote = false;
        break;
      case "Bugsounet_SPOTIFY-PLAYING":
        if (!this.EXT["EXT-Spotify"].hello) return this.sendWarn("[RULES] EXT-Spotify don't say to me HELLO!");
        this.EXT["EXT-Spotify"].play = payload;
        break;
      case "Bugsounet_SPOTIFY-PLAYER_CONNECTED":
        if (!this.EXT["EXT-Spotify"].hello) return this.sendWarn("[RULES] EXT-Spotify don't say to me HELLO!");
        this.connectEXT("EXT-Spotify");
        break;
      case "Bugsounet_SPOTIFY-PLAYER_DISCONNECTED":
        if (!this.EXT["EXT-Spotify"].hello) return this.sendWarn("[RULES] EXT-Spotify don't say to me HELLO!");
        this.disconnectEXT("EXT-Spotify");
        break;
      case "Bugsounet_FREEBOXTV-CONNECTED":
        if (!this.EXT["EXT-FreeboxTV"].hello) return this.sendWarn("[CONNECT] EXT-FreeboxTV don't say to me HELLO!");
        this.connectEXT("EXT-FreeboxTV");
        break;
      case "Bugsounet_FREEBOXTV-DISCONNECTED":
        if (!this.EXT["EXT-FreeboxTV"].hello) return this.sendWarn("[DISCONNECT] EXT-FreeboxTV don't say to me HELLO!");
        this.disconnectEXT("EXT-FreeboxTV");
        break;
      case "Bugsounet_UPDATES-MODULE_UPDATE":
        if (!this.EXT || !this.EXT["EXT-Updates"].hello) return this.sendWarn("[RULES] EXT-Updates don't say to me HELLO!");
        this.EXT["EXT-Updates"].module = payload;
        break;
      case "Bugsounet_VOLUME_GET":
        if (!this.EXT["EXT-Volume"].hello) return this.sendWarn("[RULES] EXT-Volume don't say to me HELLO!");
        this.EXT["EXT-Volume"].speaker = payload.Speaker;
        this.EXT["EXT-Volume"].isMuted = payload.SpeakerIsMuted;
        this.EXT["EXT-Volume"].recorder = payload.Recorder;
        break;
      case "Bugsounet_PAGES-NUMBER_IS":
        if (!this.EXT["EXT-Pages"].hello) return this.sendWarn("[RULES] EXT-Pages don't say to me HELLO!");
        this.EXT["EXT-Pages"].actual = payload.Actual;
        this.EXT["EXT-Pages"].total = payload.Total;
        break;
      case "Bugsounet_WEBSITE-CONNECTED":
        if (!this.EXT["EXT-Website"].hello) return this.sendWarn("[CONNECT] EXT-Website don't say to me HELLO!");
        this.connectEXT("EXT-Website");
        break;
      case "Bugsounet_WEBSITE-DISCONNECTED":
        if (!this.EXT["EXT-Website"].hello) return this.sendWarn("[DISCONNECT] EXT-Website don't say to me HELLO!");
        this.disconnectEXT("EXT-Website");
        break;

      /** Warn if not in db **/
      default:
        logBugsounet("[EXTs] Sorry, i don't understand what is", noti, payload || "");
        break;
    }
    if (this.EXT["EXT-Website"].hello || this.EXT["EXT-SmartHome"].hello) {
      this.sendStatusTimeout = setTimeout(() => {
        this.sendNotification("Bugsounet_STATUS", this.EXT);
      }, 300);
    }
    logBugsounet("[EXTs] Status:", this.EXT);
  }

  sendWarn (message) {
    this.sendAlert({ type: "warning", message: message }, "MMM-Bugsounet");
  }
}
