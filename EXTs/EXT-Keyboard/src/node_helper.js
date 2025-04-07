/****************
*  EXT-Keyboard *
*  Bugsounet    *
*  04/2025      *
*****************/

const exec = require("child_process").exec;
const path = require("path");

var log = () => { /* do nothing */ };

var NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
  initialize (payload) {
    console.log("[KEYBOARD] EXT-Keyboard Version:", require("./package.json").version, "rev:", require("./package.json").rev);
    this.config = payload;
    if (this.config.debug) log = (...args) => { console.log("[KEYBOARD]", ...args); };
    if (this.config.keys.length && Array.isArray(this.config.keys)) {
      log("keys:", this.config.keys);
    } else {
      console.warn("[KEYBOARD] No keys found in config!");
      this.sendSocketNotification("WARNING", { message: "No keys found in config!" });
    }
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "INIT":
        this.initialize(payload);
        break;
      case "SHELLEXEC":
        var cwdPath = path.resolve(__dirname, "scripts/");
        var command = payload;
        if (!command) {
          this.sendSocketNotification("WARNING", { message: "ShellExec: no command to execute!" });
          return console.warn("[KEYBOARD] ShellExec: no command to execute!");
        }
        exec(command, { cwd: cwdPath }, (e, so, se) => {
          log("ShellExec command:", command);
          if (e) {
            console.error(`[KEYBOARD] ShellExec Error:${e}`);
            this.sendSocketNotification("WARNING", { message: "ShellExec: execute Error !" });
          }

          log("SHELLEXEC_RESULT", {
            executed: payload,
            result: {
              error: e,
              stdOut: so,
              stdErr: se
            }
          });
        });
        break;
    }
  }
});
