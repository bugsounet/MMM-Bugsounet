"use strict";

const path = require("path");
const fs = require("fs");
var NodeHelper = require("node_helper");
const pm2 = require("pm2");
const librespot = require("./components/librespotLib");

module.exports = NodeHelper.create({
  start () {
    this.pm2 = pm2;
  },

  stop () {
    console.log("[LIBRESPOT] Try to close Librespot!");
    this.pm2.stop("librespot", (e) => {
      if (e) {
        console.error("[LIBRESPOT] Error: Librespot can't stop !");
        console.error("[LIBRESPOT] Detail:", e);
      }
    });
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "INIT":
        this.config = payload;
        console.log("[LIBRESPOT] EXT-Librespot Version:", require("./package.json").version, "rev:", require("./package.json").rev);
        this.initialize();
        break;
      case "PLAYER-RECONNECT":
        this.LibrespotRestart();
        break;
      case "PLAYER-REFRESH":
        this.Librespot();
        break;
    }
  },

  initialize () {
    console.log("[LIBRESPOT] Launch Librespot...");
    this.Librespot();
    try {
      this.events = new librespot(this.config, (...args) => { this.sendSocketNotification(...args); });
    } catch (e) {
      console.log(`[LIBRESPOT] Error From library: ${e}`);
    }
  },

  /** launch librespot with pm2 **/
  Librespot () {
    var file = "librespot";
    var filePath = null;
    var LibrespotPath = path.resolve(__dirname, "components/librespot", file);
    var LibrespotPathOld = path.resolve(__dirname, "components/librespot/target/release", file);
    var cacheDir = `${__dirname}/components/librespot/cache`;

    /** back compatibility **/
    if (fs.existsSync(LibrespotPath)) filePath = LibrespotPath;
    else if (fs.existsSync(LibrespotPathOld)) filePath = LibrespotPathOld;

    if (!fs.existsSync(filePath)) {
      console.error("[LIBRESPOT] Librespot is not installed!");
      console.error("[LIBRESPOT] Please run `npm run setup` in EXT-Librespot Folder!");
      this.sendSocketNotification("WARNING", { message: "EXT-Librespot_NoInstalled" });
      return;
    } else {
      console.log("[LIBRESPOT] Found Librespot in", filePath);
    }

    this.pm2.connect((err) => {
      if (err) return console.error("[LIBRESPOT]", err);

      this.pm2.start({
        script: filePath,
        name: "librespot",
        out_file: "/dev/null",
        args: [
          "--name",
          this.config.deviceName,
          "--initial-volume",
          this.config.volume,
          "--cache",
          cacheDir,
          "--cache-size-limit",
          "2G",
          "--volume-ctrl",
          "cubic",
          "--volume-range",
          "40",
          `--onevent=${path.resolve(__dirname, "components/", "events.py")}`
        ]
      }, (err) => {
        if (err) {
          this.sendSocketNotification("WARNING", { message: "EXT-Librespot_Error", values: err.toString() });
          console.error(`[LIBRESPOT] ${err}`);
          return;
        }
        console.log("[LIBRESPOT] Librespot started!");
      });

      this.pm2.launchBus((err, pm2_bus) => {
        if (err) return console.error("[LIBRESPOT] Bus connect error", err);
        console.log("[LIBRESPOT] Bus Listener connected");
        pm2_bus.on("log:out", (packet) => {
          var events;
          try {
            events = JSON.parse(packet.data);
            this.events.librespot(events);
          } catch { /* not a json output */ }
        });
      });
    });
  },

  LibrespotRestart () {
    this.pm2.restart("librespot", (err) => {
      if (err) console.error(`[LIBRESPOT] Error: ${err}`);
      else console.log("[LIBRESPOT] Restart");
    });
  }
});
