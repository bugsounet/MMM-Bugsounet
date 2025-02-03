var log = () => { /* do nothing */ };
var ps = require("ps-node");

class WatchDog {
  constructor (config) {
    this.config = config;
    if (this.config.debug) log = (...args) => { console.log("[UPDATES] [UPDATE]", ...args); };
    this.watcher = null;
  }

  start () {
    if (this.config.watchdog) {
      console.log("[UPDATES] [WATCHDOG] Started");
      this.lookup();
      this.watcher = setInterval(() => {
        this.lookup();
      }, 1000 * 30);
    } else {
      console.log("[UPDATES] [WATCHDOG] Disabled");
    }
  }

  lookup () {
    log("Checking");
    ps.lookup({
      command: "electron",
      arguments: "js/electron.js",
      psargs: "ux"
    }, (err, resultList) => {
      if (err) {
        console.error("[UPDATES] [WATCHDOG] lookup error:", err);
      } else {
        log(`Found: ${resultList.length} MagicMirror² process`);
        if (resultList.length >= 2) {
          console.log(`[UPDATES] [WATCHDOG] kill excess of MagicMirror² process! (${resultList.length})`);
          console.log("[UPDATES] [WATCHDOG] Let's restart from start ;)");
          resultList.forEach((process) => {
            if (process) {
              log("PID: ${process.pid}, COMMAND: ${process.command}, ARGUMENTS: ${process.arguments}");
              this.kill(Number(process.pid));
            }
          });
        }
      }
    });
  }

  kill (pid) {
    let timeout = (process.pid === pid) ? 2000 : 0;
    setTimeout(() => {
      ps.kill(pid, "SIGKILL", (err) => {
        if (err) {
          console.error("[UPDATES] [WATCHDOG] kill error:", err);
        }
        else {
          console.log("[UPDATES] [WATCHDOG] Process %s has been killed!", pid);
        }
      });
    }, timeout);
  }
}

module.exports = WatchDog;
