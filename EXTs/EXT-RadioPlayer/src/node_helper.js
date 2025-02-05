"use strict";

const fs = require("node:fs");
const path = require("node:path");
var NodeHelper = require("node_helper");
const VLC = require("vlc-client");

var log = () => { /* do nothing */ };

module.exports = NodeHelper.create({
  start () {
    this.config = {};
    this.Radio = {};
    this.Channels = {};
    this.vlc = null;
    this.statusInterval = null;
    this.warn = 0;
    this.radio = {
      is_playing: false,
      link: null,
      filemame: null
    };
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "INIT":
        this.config = payload;
        this.initialize();
        break;
      case "START":
        this.startRadio();
        break;
      case "PLAY":
        this.playWithVlc(payload);
        break;
      case "STOP":
        this.CloseVlc();
        break;
      case "VOLUME":
        this.VolumeVLC(payload);
        break;
    }
  },

  initialize () {
    if (this.config.debug) log = (...args) => { console.log("[RADIO]", ...args); };
    console.log(`[RADIO] EXT-RadioPlayer Version: ${require("./package.json").version} rev: ${require("./package.json").rev}`);
    this.scanStreamsConfig();
  },

  startRadio () {
    console.log("[RADIO] Starting Radio module...");
    this.vlc = new VLC.Client({
      ip: "127.0.0.1",
      port: 8082,
      password: "EXT-VLCServer",
      log: this.config.debug
    });
    console.log("[RADIO] EXT-Radio is Ready.");
    this.sendSocketNotification("READY", this.Radio);
  },

  pulse () {
    log("Launch pulse");
    this.statusInterval = setInterval(() => this.status(), 1000);
  },

  async status () {
    const status = await this.vlc.status().catch(
      (err) => {
        if (err.code === "ECONNREFUSED" || err.message.includes("Unauthorized")) {
          this.warn++;
          console.error(`[RADIO] Can't start VLC Client! Reason: ${err.message}`);
          if (this.warn > 5) {
            clearTimeout(this.statusInterval);
            this.sendSocketNotification("ERROR", `Can't start VLC Client! Reason: ${err.message}`);
            this.sendSocketNotification("FINISH");
            this.radio.is_playing = false;
          } else console.warn(`[RADIO] Wait for response... (${this.warn}/5)`);
        } else {
          console.error(`[RADIO] ${err.message}`);
          this.sendSocketNotification("ERROR", `VLC Client error: ${err.message}`);
          this.sendSocketNotification("FINISH");
          this.radio.is_playing = false;
        }
      }
    );

    if (!status) return;
    else this.warn = 0;

    if (status.state === "playing") {
      if (status.information.category.meta.filename !== this.radio.filename) {
        if (this.radio.is_playing) this.sendSocketNotification("FINISH");
        this.radio.is_playing = false;
        log("Not played by EXT-RadioPlayer");
        clearTimeout(this.statusInterval);
        return;
      }
      if (!this.radio.is_playing) {
        log(`Set volume to ${this.config.maxVolume}`);
        await this.vlc.setVolumeRaw(this.config.maxVolume);
        this.sendSocketNotification("PLAYING");
      }
      // Search meta
      if (status.information.category.meta.title) {
        if (this.radio.title !== status.information.category.meta.title) {
          this.radio.title = status.information.category.meta.title;
          this.sendSocketNotification("META", { title: this.radio.title });
        }
      }
      if (status.information.category.meta.now_playing) {
        if (this.radio.now_playing !== status.information.category.meta.now_playing) {
          this.radio.now_playing = status.information.category.meta.now_playing;
          this.sendSocketNotification("META", { now_playing: this.radio.now_playing });
        }
      }
      this.radio.is_playing = true;
      log(`Playing: ${this.radio.link}`);
      log(`Meta: ${status.information.category.meta}`);
    }
    if (status.state === "stopped") {
      if (this.radio.is_playing) this.sendSocketNotification("FINISH");
      this.radio.is_playing = false;
      log("Stopped");
      clearTimeout(this.statusInterval);
    }
  },

  /** radio with VLC **/
  async playWithVlc (link) {
    clearTimeout(this.statusInterval);
    this.sendSocketNotification("WILL_PLAYING");
    this.radio.link = link;
    this.radio.filename = this.radio.link?.split("/").pop();

    await this.vlc.playFile(link, { novideo: true, wait: true, timeout: 300 });
    this.pulse();
  },

  CloseVlc () {
    if (this.radio.is_playing) {
      log("Stop");
      this.vlc.stop();
    }
  },

  VolumeVLC (volume) {
    if (this.radio.is_playing) {
      log(`Set Volume ${volume}`);
      this.vlc.setVolumeRaw(volume);
    }
  },

  scanStreamsConfig () {
    if (!this.config.streams) {
      console.warn("[RADIO] No Streams File found");
      this.sendSocketNotification("WARN", "No Streams File found!");
      return;
    }
    console.log(`[RADIO] Reading Streams file: ${this.config.streams}`);
    let file = path.resolve(__dirname, this.config.streams);
    if (fs.existsSync(file)) {
      try {
        let streams = JSON.parse(fs.readFileSync(file));
        Object.keys(streams).forEach((key) => {
          if (streams[key].link) {
            if (streams[key].link.endsWith(".m3u")) {
              console.warn(`[RADIO] Ignore .m3u link for: ${key}`);
            } else {
              this.Radio[key] = {};
              this.Radio[key].link = streams[key].link;
              if (streams[key].img) {
                this.Radio[key].img = streams[key].img;
              } else {
                console.warn(`[RADIO] No img found for: ${key}`);
              }
              log(`Added: ${key}`);
            }
          } else {
            console.warn(`[RADIO] No link found for: ${key}`);
            this.sendSocketNotification("WARN", `No link found for: ${key}`);
          }
        });
        console.log(`[RADIO] Number of radio found: ${Object.keys(this.Radio).length}`);
      } catch (e) {
        console.error(`[RADIO] ERROR: ${this.config.streams}: ${e.message}`);
        this.sendSocketNotification("ERROR", `Error on streams file: ${this.config.streams}`);
      }
    } else {
      console.error(`[RADIO] ERROR: missing ${this.config.streams} configuration file!`);
      this.sendSocketNotification("ERROR", `ERROR: missing ${this.config.streams} configuration file!`);
    }
  }
});
