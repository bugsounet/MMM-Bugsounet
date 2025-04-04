"use strict";

const fs = require("fs");
const path = require("path");
var NodeHelper = require("node_helper");
const GPhotos = require("./components/GooglePhotosLib");

var logGP = () => { /* do nothing */ };

module.exports = NodeHelper.create({
  start () {
    this.photo = null;
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "INIT":
        console.log("[GPHOTOS] EXT-GooglePhotos Version:", require("./package.json").version, "rev:", require("./package.json").rev);
        this.initialize(payload);
        break;

      /** GPhotos callbacks **/
      case "GP_MORE_PICTS":
      case "GP_LOAD_FAIL":
        if (this.photos) this.photos.prepAndSendChunk(Math.ceil(20 * 60 * 1000 / this.config.displayDelay));
        break;
      case "STOP_SCAN":
        if (this.photos) {
          console.log("[GPHOTOS] STOP!");
          this.photos.stop();
        }
        break;
      case "START_SCAN":
        if (this.photos) {
          console.log("[GPHOTOS] Restart!");
          this.photos.startScanning();
        }
        break;
      case "UPLOAD":
        this.upload(payload);
        break;
    }
  },

  async initialize (config) {
    this.config = config;
    if (this.config.debug) logGP = (...args) => { console.log("[GPHOTOS]", ...args); };
    logGP("Check credentials.json...");
    if (fs.existsSync(path.resolve(`${__dirname}/../../credentials.json`))) {
      this.config.CREDENTIALS = path.resolve(`${__dirname}/../../credentials.json`);
    }
    if (!this.config.CREDENTIALS) {
      this.sendSocketNotification("GPError", "Error: credentials.json file not found !");
      console.error("[GPHOTOS] credentials.json file not found !");
    }
    else logGP("credentials.json found in", this.config.CREDENTIALS);

    if (!fs.existsSync(`${__dirname}/tokenGP.json`)) {
      this.sendSocketNotification("GPError", "Error: tokenGP.json file not found !");
      console.error("[GPHOTOS] tokenGP.json file not found !");
      return;
    }

    this.config.TOKEN = `${__dirname}/tokenGP.json`;
    this.config.CACHE = `${__dirname}/tmp`;
    this.photos = new GPhotos(this.config, this.config.debug, (noti, params) => this.sendSocketNotification(noti, params));
    this.photos.start();
  },

  upload (path) {
    this.photos.prepareUpload(path);
  }
});
