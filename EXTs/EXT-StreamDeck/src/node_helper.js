/******************
*  EXT-StreamDeck *
*  Bugsounet      *
*******************/

const exec = require("child_process").exec;
const path = require("path");
const { listStreamDecks, openStreamDeck } = require("@elgato-stream-deck/node");
const Jimp = require("jimp");

var log = () => { /* do nothing */ };

var NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
  start () {
    this.streamDeck = null;
    this.streamDecks = [];
    this.ecoTimer = null;
    this.isInDeep = false;
  },

  async initialize (payload) {
    console.log("[STREAMDECK] EXT-StreamDeck Version:", require("./package.json").version, "rev:", require("./package.json").rev);
    this.config = payload;
    if (this.config.debug) log = (...args) => { console.log("[STREAMDECK]", ...args); };
    if (this.config.keys.length && Array.isArray(this.config.keys)) log("keys:", this.config.keys);
    else {
      console.log("[STREAMDECK] No keys found in config!");
      this.sendSocketNotification("WARNING", { message: "No keys found in config!" });
      return;
    }
    console.log("[STREAMDECK] Search and open StreamDeck...");
    const streamDecksList = await listStreamDecks();
    if (!streamDecksList.length) {
      this.sendSocketNotification("WARNING", { message: "No Stream Deck Found!" });
      return console.error("[STREAMDECK] No Stream Deck Found!");
    }

    var promise = streamDecksList.map((device) => this.addDevice(device).catch((e) => console.error("[STREAMDECK] AddDevice failed:", e)));
    Promise.all(promise).then(async () => {
      if (!this.config.device) this.streamDeck = await this.streamDecks["/dev/hidraw0"]; // maybe default !?
      else this.streamDeck = await this.streamDecks[this.config.device];
      if (!this.streamDeck) {
        this.sendSocketNotification("WARNING", { message: "Stream Deck NOT Found!" });
        return console.error("[STREAMDECK] device:", this.config.device, "--> Stream Deck NOT Found!");
      }
      this.initStreamDeck();
    });
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "INIT":
        this.initialize(payload);
        break;
      case "ON":
        this.deckSetBrightness();
        break;
      case "OFF":
        this.deckStandby();
        break;
    }
  },

  /* eslint-disable no-async-promise-executor */
  // to do better, I have no StreamDeck for resolve and testing
  addDevice (info) {
    const path = info.path;
    return new Promise(async (resolve) => {
      console.log("[STREAMDECK] Found model:", info.model, "Path:", info.path, "serialNumber:", info.serialNumber);
      this.streamDecks[path] = await openStreamDeck(path);
      this.streamDecks[path].on("error", async (e) => {
        console.error("[STREAMDECK]", e);
        // assuming any error means we lost connection
        await this.streamDecks[path].removeAllListeners();
        delete this.streamDecks[path];
      });
      resolve();
    });
  },
  /* eslint-enable no-async-promise-executor */

  async initStreamDeck () {
    log("Reset Displayer...");
    await this.streamDeck.resetToLogo();
    if (this.config.Brightness > 100) this.config.Brightness = 100;
    if (this.config.Brightness <= 5) this.config.Brightness = 5;
    if (this.config.EcoBrightness > this.config.Brightness) this.config.EcoBrightness = this.config.Brightness;
    if (this.config.EcoBrightness < 0) this.config.EcoBrightness = 0;

    this.deckSetBrightness(true);

    /* Animation BuGs logos */
    log("Testing Displayer...");
    var bmpImg = await Jimp.read(path.resolve(__dirname, "resources/logo.png")).then((img) => {
      return img.resize(this.streamDeck.ICON_SIZE, this.streamDeck.ICON_SIZE);
    });
    var img = bmpImg.bitmap.data;
    for (let i = 0; i < this.streamDeck.NUM_KEYS; i++) {
      this.streamDeck.clearPanel();
      await this.streamDeck.fillKeyBuffer(i, img, { format: "rgba" }).catch((e) => console.error("[STREAMDECK] Fill failed:", e));
      await this.sleep(250);
    }
    this.streamDeck.clearPanel();
    await this.sleep(500);

    /* Full screen BuGs logo */
    bmpImg = await Jimp.read(path.resolve(__dirname, "resources/logo.png")).then((img) => {
      return img.resize(this.streamDeck.ICON_SIZE * this.streamDeck.KEY_COLUMNS, this.streamDeck.ICON_SIZE * this.streamDeck.KEY_ROWS);
    });
    img = bmpImg.bitmap.data;
    for (let i = 0; i < 2; i++) {
      this.streamDeck.clearPanel();
      await this.streamDeck.fillPanelBuffer(img, { format: "rgba" }).catch((e) => console.error("[STREAMDECK] Fill failed:", e));
      await this.sleep(125);
    }

    this.streamDeck.clearPanel();
    await this.sleep(500);

    log("Set Config...");
    if (!this.config.keys.length) {
      this.sendSocketNotification("WARNING", { message: "No keys defined!" });
      return console.log("[STREAMDECK] No keys defined!");
    }
    this.config.keys.forEach(async (key) => {
      var bmpImg = await Jimp.read(path.resolve(__dirname, `resources/${key.logo}.png`)).then((img) => {
        return img.resize(this.streamDeck.ICON_SIZE, this.streamDeck.ICON_SIZE);
      });
      var img = bmpImg.bitmap.data;
      await this.streamDeck.fillKeyBuffer(key.key, img, { format: "rgba" }).catch((e) => console.error("[STREAMDECK] Fill failed:", e));
    });
    this.streamDeck.on("down", async (keyIndex) => {
      log("Press Button", keyIndex);
      if (this.config.keyFinder) this.sendSocketNotification("KEYFINDER", { key: keyIndex });
      this.deckSetBrightness();
      this.config.keys.forEach(async (key) => {
        if (key.key === keyIndex) {
          if (key.notification) this.sendSocketNotification("NOTIFICATION", {
            notification: key.notification,
            payload: key.payload || undefined
          });
          if (key.command) this.shellExec(key.command);
          if (key.sound) this.sendSocketNotification("SOUND", key.sound);
        }
      });
      this.deckStandby();
    });
    log("StreamDeck is initialized!");
    this.sendSocketNotification("INITIALIZED");
    this.deckStandby();
  },

  sleep (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  shellExec (command) {
    let cwdPath = path.resolve(__dirname, "scripts/");
    if (!command) {
      this.sendSocketNotification("WARNING", { message: "ShellExec: no command to execute!" });
      return console.log("[STREAMDECK] ShellExec: no command to execute!");
    }
    exec(command, { cwd: cwdPath }, (e, so, se) => {
      log("ShellExec command:", command);
      if (e) {
        console.log(`[STREAMDECK] ShellExec Error:${e}`);
        this.sendSocketNotification("WARNING", { message: "ShellExec: execute Error !" });
      }

      log("SHELLEXEC_RESULT", {
        executed: command,
        result: {
          error: e,
          stdOut: so,
          stdErr: se
        }
      });
    });
  },

  deckStandby () {
    if (!this.streamDeck || this.config.EcoBrightness === null) return;
    clearTimeout(this.ecoTimer);
    this.ecoTimer = setTimeout(() => {
      log("Go in Deep...");
      this.streamDeck.setBrightness(this.config.EcoBrightness).catch((e) => console.error("[STREAMDECK] Set brightness failed:", e));
      this.isInDeep = true;
    }, this.config.EcoTime);
  },

  deckSetBrightness (force = false) {
    clearTimeout(this.ecoTimer);
    if (!this.streamDeck || (!force && !this.isInDeep)) return;
    log("Set Brightness...");
    this.streamDeck.setBrightness(this.config.Brightness).catch((e) => console.error("[STREAMDECK] Set brightness failed:", e));
    this.isInDeep = false;
  }
});
