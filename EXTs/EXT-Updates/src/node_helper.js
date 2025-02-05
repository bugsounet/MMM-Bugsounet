/*
 * EXT-Updates
 */

const NodeHelper = require("node_helper");
const Updater = require("./components/update");
const WatchDog = require("./components/watchdog");

module.exports = NodeHelper.create({
  start () {
    this.config = {};
    this.updateProcessStarted = false;
    this.init = false;
    this.version = global.version;
    this.root_path = global.root_path;
  },

  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case "CONFIG":
        this.config = payload;
        this.config.root_path = this.root_path;
        this.initialize();
        break;
      case "MODULES":
        if (!this.updateProcessStarted) {
          this.sendSocketNotification("INITIALIZED", require("./package.json").version);
          this.updateProcessStarted = true;
        }
        break;
      case "DISPLAY_ERROR":
        console.error(`[UPDATES] Callbacks errors:\n\n${payload}`);
        break;
      case "UPDATE":
        this.update.process(payload);
        break;
      case "CLOSE":
        this.update.close();
        break;
      case "RESTART":
        this.update.restart();
        break;
    }
  },

  initialize () {
    console.log(`[UPDATES] EXT-Updates Version: ${require("./package.json").version} rev: ${require("./package.json").rev}`);
    console.log(`[UPDATES] MagicMirror is running on pid: ${process.pid}`);
    let Tools = {
      sendSocketNotification: (...args) => { this.sendSocketNotification(...args); }
    };
    this.update = new Updater(this.config, Tools);
    this.watch = new WatchDog(this.config);
    this.watch.start();
    this.sendSocketNotification("WELCOME", { PID: process.pid });
    this.sendSocketNotification("READY");
  }
});
