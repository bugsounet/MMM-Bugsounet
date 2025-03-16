"use strict";

const path = require("path");
const fs = require("fs");
var NodeHelper = require("node_helper");
const pm2 = require("pm2");

var log = () => { /* do nothing */ };

module.exports = NodeHelper.create({
  start () {
    this.pm2 = pm2;
    this.VLCPath = null;
    this.ServerStarted = false;
  },

  stop () {
    console.log("[VLC] Try to close VLCServer!");
    this.pm2.stop("VLCServer", (e) => {
      if (e) {
        console.error("[VLC] Error: VLCServer can't stop !");
        console.error("[VLC] Detail:", e);
      }
    });
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "INIT":
        this.config = payload;
        console.log("[VLC] EXT-VLCServer Version:", require("./package.json").version, "rev:", require("./package.json").rev);
        this.initialize();
        break;
      case "RESTART":
        this.VLCRestart();
        break;
    }
  },

  initialize () {
    if (this.config.debug) log = (...args) => { console.log("[VLC]", ...args); };
    console.log("[VLC] Launch VLC Http Server...");
    this.VLC();
  },

  /** launch vlc with pm2 **/
  VLC () {
    this.VLCPath = path.resolve(this.config.vlcPath, "vlc");

    if (!fs.existsSync(this.VLCPath)) {
      console.error("[VLC] VLC is not installed or not found!");
      this.sendSocketNotification("WARNING", { message: "VLC_NotInstalled" });
      return;
    }
    log("Found VLC in", this.VLCPath);
    this.pm2.connect((err) => {
      if (err) return console.error("[VLC]", err);
      this.VLCStart();

      this.pm2.launchBus((err, pm2_bus) => {
        if (err) return console.error("[VLC] Bus connect error", err);
        log("Bus Listener connected");
        pm2_bus.on("process:event", (packet) => {
          if (packet.process.name === "VLCServer") {
            //console.log(`[VLC] Event: ${packet.event} Status: ${packet.process.status}`)
            if (packet.process.status === "online") {
              if (!this.ServerStarted) {
                console.log(`[VLC] VLC Http Server Started! (id:${packet.process.pm_id})`);
                this.sendSocketNotification("STARTED");
              }
              this.ServerStarted = true;
            } else {
              if (this.ServerStarted) {
                console.error(`[VLC] VLC Http Server Closed! (id:${packet.process.pm_id})`);
                this.sendSocketNotification("ERROR", { message: "VLC_Close" });
                this.sendSocketNotification("CLOSED");
              }
              this.ServerStarted = false;
            }
          }
        });
        pm2_bus.on("log:err", (packet) => {
          if (packet.process.name === "VLCServer") {
            if (packet.data.includes("main interface error:")) {
              console.error("[VLC]", packet.data);
              this.sendSocketNotification("ERROR", { message: "VLC_ErrorPacket" });
            } else {
              log("[PACKET DATA]", packet.data);
            }
          }
        });
      });
    });
  },

  VLCStart () {
    this.pm2.start({
      script: this.VLCPath,
      name: "VLCServer",
      out_file: "/dev/null",
      /* eslint-disable @stylistic/array-element-newline */
      args: [
        "-I http",
        "--extraintf", "http",
        "--http-port", 8082,
        "--http-host", "127.0.0.1",
        "--http-password", "EXT-VLCServer"
      ]
      /* eslint-enable @stylistic/array-element-newline */
    }, (err) => {
      if (err) {
        this.sendSocketNotification("WARNING", { message: "VLCError", values: err.message });
        console.error(`[VLC] ${err}`);
      } else {
        console.log("[VLC] Start listening on port 8082");
      }
    });
  },

  VLCRestart () {
    this.pm2.restart("VLCServer", (err) => {
      if (err) return console.error(`[VLC] Error: ${err}`);
      console.log("[VLC] VLC Http Server Restarted!");
    });
  }
});
