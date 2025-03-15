/*
 * Node Helper: EXT-FreeboxTV
 */

const fs = require("fs");
const path = require("path");
const VLC = require("vlc-client");
var NodeHelper = require("node_helper");

var log = () => { /* do nothing */ };

module.exports = NodeHelper.create({

  start () {
    this.FreeboxTV = {};
    this.volumeControl = null;
    this.Channels = [];
    this.vlc = null;
    this.statusInterval = null;
    this.warn = 0;
    this.TV = {
      is_playing: false,
      link: null,
      filemame: null
    };
  },

  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case "CONFIG":
        this.config = payload;
        console.log(`[FreeboxTV] EXT-FreeboxTV Version: ${require("./package.json").version} rev: ${require("./package.json").rev}`);
        if (this.config.debug) log = (...args) => { console.log("[FreeboxTV]", ...args); };
        this.scanStreamsConfig();
        break;
      case "START":
        console.log("[FreeboxTV] Starting TV module...");
        this.vlc = new VLC.Client({
          ip: "127.0.0.1",
          port: 8082,
          password: "EXT-VLCServer",
          log: this.config.debug
        });
        console.log("[FreeboxTV] FreeboxTV is initialized.");
        this.sendSocketNotification("INITIALIZED", this.Channels);
        break;
      case "PLAY":
        this.startPlayer(payload);
        break;
      case "STOP":
        this.stopPlayer();
        break;
      case "VOLUME_CONTROL":
        this.volume(payload);
        break;
      case "VOLUME_LAST":
        this.volumeControl = payload;
        break;
    }
  },

  pulse () {
    if (this.statusInterval) {
      log("Kill old pulse...");
      clearInterval(this.statusInterval);
      this.statusInterval = null;
    }
    log("Launch pulse");
    this.statusInterval = setInterval(() => this.status(), 1000);
  },

  async status () {
    const status = await this.vlc.status().catch(
      (err) => {
        if (err.code === "ECONNREFUSED" || err.message.includes("Unauthorized")) {
          this.warn++;
          console.error(`[FreeboxTV] Can't start VLC Client! Reason: ${err.message}`);
          if (this.warn > 5) {
            clearTimeout(this.statusInterval);
            this.statusInterval = null;
            this.sendSocketNotification("ERROR", `Can't start VLC Client! Reason: ${err.message}`);
            this.sendSocketNotification("ENDED");
            this.TV.is_playing = false;
          }
        } else {
          console.error(`[FreeboxTV] ${err.message}`);
          this.sendSocketNotification("ERROR", `VLC Client error: ${err.message}`);
          this.sendSocketNotification("ENDED");
          this.TV.is_playing = false;
        }
      }
    );

    if (!status) return;
    else this.warn = 0;

    if (status.state === "playing") {
      if (!status.information.category.meta.filename.startsWith("stream?namespace=1&service=")) {
        if (this.TV.is_playing) this.sendSocketNotification("ENDED");
        this.TV.is_playing = false;
        log("Not played by EXT-FreeboxTV");
        clearInterval(this.statusInterval);
        this.statusInterval = null;
        return;
      }
      if (!this.TV.is_playing) {
        log("Set volume to", this.volumeControl ? this.volumeControl : this.config.volume.start);
        await this.vlc.setVolumeRaw(this.volumeControl ? this.volumeControl : this.config.volume.start);
        this.sendSocketNotification("STARTED");
      }
      if (status.fullscreen === false) await this.vlc.setFullscreen(true);
      this.TV.is_playing = true;
      log("Playing");
    }
    if (status.state === "stopped") {
      if (this.TV.is_playing) this.sendSocketNotification("ENDED");
      this.TV.is_playing = false;
      clearInterval(this.statusInterval);
      this.statusInterval = null;
      log("Stopped");
    }
  },

  stop () {
    log("Stop TV...");
    this.stopPlayer();
  },

  async startPlayer (name) {
    if (!this.FreeboxTV[name]) return log(`Channel not found: ${name}`);
    this.sendSocketNotification("WILL_PLAYING", name);
    var link = this.FreeboxTV[name];
    this.TV.link = link;
    this.TV.filename = this.TV.link?.split("/").pop();

    await this.vlc.playFile(link);
    this.pulse();
  },

  stopPlayer () {
    if (this.TV.is_playing) {
      this.vlc.stop();
      log("Stop streaming");
    }
  },

  scanStreamsConfig () {
    console.log(`[FreeboxTV] Reading: ${this.config.streams}`);
    let file = path.resolve(__dirname, this.config.streams);
    if (fs.existsSync(file)) {
      try {
        this.FreeboxTV = JSON.parse(fs.readFileSync(file));
        //console.log("[FreeboxTV] Channels:", this.FreeboxTV)
        this.Channels = Object.keys(this.FreeboxTV);
        console.log(`[FreeboxTV] Number of channels found: ${this.Channels.length}`);
      } catch (e) {
        return console.log(`[FreeboxTV] ERROR: ${this.config.streams}:`, e.message);
      }
    } else console.log(`[FreeboxTV] ERROR: missing ${this.config.streams} configuration file!`);
  },

  volume (volume) {
    if (this.TV.is_playing) {
      log(`Set VLC Volume to: ${volume}`);
      this.vlc.setVolumeRaw(volume);
    }
  }
});
