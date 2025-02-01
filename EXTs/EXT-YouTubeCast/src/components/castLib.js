/** Cast library with DIAL protocol **/
/** @bugsounet **/

const express = require("express");
const dial = require("../components/peer-dial");

const app = express();

var _log = (function () {
  var context = "[CAST]";
  return Function.prototype.bind.call(console.log, console, context);
}());

var log = function () {
  //do nothing
};

class DialServer {
  constructor (config, callbacks, debug) {
    this.dialServer = null;
    this.config = config;
    this.callbacks = callbacks;
    if (debug === true) log = _log;
    this.default = {
      castName: "MagicMirror_Cast",
      port: 8569
    };
    this.config = Object.assign(this.default, this.config);
    this.apps = {
      YouTube: {
        name: "YouTube",
        state: "stopped",
        allowStop: true,
        pid: null,
        launch: (data) => {
          this.callbacks("CAST_START", `https://www.youtube.com/tv?${data}`);
        }
      }
    };
    this.server = null;
  }

  initDialServer () {
    this.dialServer = new dial.Server({
      expressApp: app,
      port: this.config.port,
      prefix: "/dial",
      corsAllowOrigins: true,
      manufacturer: "@bugsounet",
      modelName: "EXT-YouTubeCast",
      delegate: {
        getApp: (appName) => {
          var app = this.apps[appName] ? this.apps[appName] : "[unknow protocol]";
          log(`PONG ${appName}`, app);
          return app;
        },
        launchApp: (appName, data, callback) => {
          log(`Launch ${appName} with data:`, data);
          var app = this.apps[appName];
          if (app) {
            app.pid = "run";
            app.state = "starting";
            app.launch(data);
            app.state = "running";
          }
          callback(app.pid);
        },
        stopApp: (appName, pid, callback) => {
          log("Stop", appName);
          var app = this.apps[appName];
          if (app && app.pid === pid) {
            app.pid = null;
            app.state = "stopped";
            this.callbacks("CAST_STOP");
            callback(true);
          }
          else {
            callback(false);
          }
        }
      }
    });
  }

  start () {
    this.initDialServer(this.config.port);
    this.dialServer.friendlyName = this.config.castName;
    this.server = app.listen(this.config.port, () => {
      this.dialServer.start();
      log(`${this.config.castName} is listening on port`, this.config.port);
    })
      .on("error", (e) => {
        if (e.code === "EADDRINUSE") this.callbacks("ERROR", `Cast: Port already in use ${this.config.port}`);
        else this.callbacks("WARNING", `Cast: ${e.toString()}`);
        console.log("[CAST]", e.toString());
      });
  }

  stop () {
    this.dialServer.stop();
    this.server.close();
    log("Stop listening");
  }

}

module.exports = DialServer;
