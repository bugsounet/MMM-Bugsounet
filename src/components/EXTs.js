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
    this.sendEXTStatus = (...args) => Tools.sendEXTStatus(...args);
    this.sendHelloEXT = (...args) => Tools.sendHelloEXT(...args);

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
      "EXT-Volume"
    ];

    this.EXT = {
      Bugsounet_Ready: false
    };
    this.previousEXT = {};
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
    this.EXT["EXT-FreeboxTV"].channels = [];
    this.EXT["EXT-FreeboxTV"].playing = null;
    this.EXT["EXT-RadioPlayer"].channels = [];
    this.EXT["EXT-RadioPlayer"].playing = null;
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
        this.sendHelloEXT(module);
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

    let EXTNoti = [
      "Bugsounet_HELLO",
      "Bugsounet_ALERT",
      "Bugsounet_PAGES-Gateway",
      "Bugsounet_STOP",
      "Bugsounet_Restart",
      "Bugsounet_Close",
      "Bugsounet_Reboot",
      "Bugsounet_Shutdown",
      "Bugsounet_SCREEN-POWER",
      "Bugsounet_RADIO-CONNECTED",
      "Bugsounet_RADIO-DISCONNECTED",
      "Bugsounet_RADIO-CHANNELS",
      "Bugsounet_RADIO-PLAYING",
      "Bugsounet_SPOTIFY-CONNECTED",
      "Bugsounet_SPOTIFY-DISCONNECTED",
      "Bugsounet_SPOTIFY-PLAYING",
      "Bugsounet_SPOTIFY-PLAYER_CONNECTED",
      "Bugsounet_SPOTIFY-PLAYER_DISCONNECTED",
      "Bugsounet_FREEBOXTV-CONNECTED",
      "Bugsounet_FREEBOXTV-DISCONNECTED",
      "Bugsounet_FREEBOXTV-CHANNELS",
      "Bugsounet_FREEBOXTV-PLAYING",
      "Bugsounet_UPDATES-MODULE_UPDATE",
      "Bugsounet_VOLUME_GET",
      "Bugsounet_PAGES-NUMBER_IS"
    ];

    if (EXTNoti.indexOf(noti) === -1) {
      logBugsounet("[EXTs] Sorry, i don't understand what is", noti, payload || "");
      return;
    }

    this.previousEXT = JSON.stringify(this.EXT);

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
      case "Bugsounet_STOP":
        if (this.hasPluginConnected(this.EXT, "connected", true)) {
          this.sendAlert({ type: "information", message: this.translate("EXTStop") }, "MMM-Bugsounet");
        }
        break;
      case "Bugsounet_Restart":
        if (sender.name === "MMM-Bugsounet"
          || (sender.name === "EXT-Updates" && this.EXT["EXT-Updates"].hello)
          || (sender.name === "EXT-SmartHome" && this.EXT["EXT-SmartHome"].hello)
        ) {
          this.sendSocketNotification("RESTART");
        } else {
          this.sendWarn(`Bugsounet_Restart by ${sender.name} is not allowed`);
        }
        break;
      case "Bugsounet_Close":
        if (sender.name === "MMM-Bugsounet"
          || (sender.name === "EXT-SmartHome" && this.EXT["EXT-SmartHome"].hello)
        ) {
          this.sendSocketNotification("CLOSE");
        } else {
          this.sendWarn(`Bugsounet_Close by ${sender.name} is not allowed`);
        }
        break;
      case "Bugsounet_Reboot":
        if (sender.name === "MMM-Bugsounet"
          || (sender.name === "EXT-SmartHome" && this.EXT["EXT-SmartHome"].hello)
        ) {
          this.sendSocketNotification("REBOOT");
        } else {
          this.sendWarn(`Bugsounet_Reboot by ${sender.name} is not allowed`);
        }
        break;
      case "Bugsounet_Shutdown":
        if (sender.name === "MMM-Bugsounet"
          || (sender.name === "EXT-SmartHome" && this.EXT["EXT-SmartHome"].hello)
        ) {
          this.sendSocketNotification("SHUTDOWN");
        } else {
          this.sendWarn(`Bugsounet_Shutdown by ${sender.name} is not allowed`);
        }
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
      case "Bugsounet_RADIO-CONNECTED":
        if (!this.EXT["EXT-RadioPlayer"].hello) return this.sendWarn("[CONNECT] EXT-RadioPlayer don't say to me HELLO!");
        this.connectEXT("EXT-RadioPlayer");
        break;
      case "Bugsounet_RADIO-DISCONNECTED":
        if (!this.EXT["EXT-RadioPlayer"].hello) return this.sendWarn("[DISCONNECT] EXT-RadioPlayer don't say to me HELLO!");
        this.disconnectEXT("EXT-RadioPlayer");
        break;
      case "Bugsounet_RADIO-CHANNELS":
        if (!this.EXT["EXT-RadioPlayer"].hello) return this.sendWarn("[RULES] EXT-RadioPlayer don't say to me HELLO!");
        this.EXT["EXT-RadioPlayer"].channels = payload;
        break;
      case "Bugsounet_RADIO-PLAYING":
        if (!this.EXT["EXT-RadioPlayer"].hello) return this.sendWarn("[RULES] EXT-RadioPlayer don't say to me HELLO!");
        this.EXT["EXT-RadioPlayer"].playing = payload;
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
      case "Bugsounet_FREEBOXTV-CHANNELS":
        if (!this.EXT["EXT-FreeboxTV"].hello) return this.sendWarn("[RULES] EXT-FreeboxTV don't say to me HELLO!");
        this.EXT["EXT-FreeboxTV"].channels = payload;
        break;
      case "Bugsounet_FREEBOXTV-PLAYING":
        if (!this.EXT["EXT-FreeboxTV"].hello) return this.sendWarn("[RULES] EXT-FreeboxTV don't say to me HELLO!");
        this.EXT["EXT-FreeboxTV"].playing = payload;
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
    }

    let isEqual = this.previousEXT === JSON.stringify(this.EXT);
    if (!isEqual) {
      logBugsounet(`[${noti}] Status for ${sender?.name} is now:`, this.EXT[sender?.name]);
      this.sendEXTStatus(this.EXT);
      if (this.EXT["EXT-SmartHome"].hello) {
        this.sendNotification("Bugsounet_STATUS", this.EXT);
      }
    }
  }

  sendWarn (message) {
    this.sendAlert({ type: "warning", message: message }, "MMM-Bugsounet");
  }
}
