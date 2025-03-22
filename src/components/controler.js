const { exec, spawn } = require("node:child_process");
const pm2 = require("pm2");

class Controler {
  constructor () {
    this.usePM2 = false;
    this.PM2Process = null;
  }

  /** Check using pm2 **/
  check_PM2_Process () {
    console.log("[Bugsounet] Checking PM2 using...");
    return new Promise((resolve) => {
      pm2.connect((err) => {
        if (err) {
          console.error("[Bugsounet]", err);
          resolve(false);
          return;
        }

        if (process.env.unique_id === undefined) {
          console.log("[Bugsounet] You don't use PM2");
          resolve(false);
          return;
        }

        pm2.list((err, list) => {
          if (err) {
            console.error("[Bugsounet] Can't get pm2 process List!", err);
            resolve(false);
            return;
          }
          list.forEach((pm) => {
            if (pm.pm2_env.status === "online" && process.env.name === pm.name && +process.env.pm_id === +pm.pm_id) {
              this.usePM2 = true;
              this.PM2Process = pm.pm_id;
              console.log(`[Bugsounet] You are using pm2 with id: ${this.PM2Process} (${pm.name})`);
              resolve(true);
            }
          });
          pm2.disconnect();
          if (!this.usePM2) {
            console.log("[Bugsounet] You don't use PM2");
            resolve(false);
          }
        });
      });
    });
  }

  /** MagicMirror restart and stop **/
  restartMM () {
    if (this.usePM2) {
      console.log("[Bugsounet] PM2 will restarting MagicMirror²...");
      pm2.restart(this.PM2Process, (err) => {
        if (err) {
          console.error(`[Bugsounet] Restart:${err}`);
        }
      });
    }
    else this.doRestart();
  }

  doRestart () {
    console.log("[Bugsounet] Restarting MagicMirror²...");
    const out = process.stdout;
    const err = process.stderr;
    const subprocess = spawn("npm start", { cwd: this.root_path, shell: true, detached: true, stdio: ["ignore", out, err] });
    subprocess.unref();
    process.exit();
  }

  doClose () {
    console.log("[Bugsounet] Closing MagicMirror²...");
    if (this.usePM2) {
      pm2.stop(this.PM2Process, (err) => {
        if (err) {
          console.error(`[Bugsounet] stop: ${err}`);
        }
      });
    }
    else process.exit();
  }

  /** Reboot or shutdown the Pi **/
  SystemReboot () {
    console.log("[Bugsounet] Restarting OS...");
    exec("sudo reboot now", (err) => {
      if (err) console.error("[Bugsounet] Error when restarting OS!", err);
    });
  }

  SystemShutdown () {
    console.log("[Bugsounet] Shutdown OS...");
    exec("sudo shutdown now", (err) => {
      if (err) console.error("[Bugsounet] Error when Shutdown OS!", err);
    });
  }
}

module.exports = Controler;
