"use strict";
const { exec } = require("node:child_process");
const fs = require("node:fs");

function secure () {
  console.log("[Bugsounet] [SECURE] 🛡️ Check fingerprint...");
  let BugsounetPath = `${global.root_path}/modules/MMM-Bugsounet`;
  return new Promise((resolve) => {
    exec("git config --get remote.origin.url", { cwd: BugsounetPath }, (e, so) => {
      if (e) {
        console.log("[Bugsounet] [SECURE] 💀 Unknow error!");
        process.exit(1);
      }
      let output = new RegExp("bugs");
      if (!output.test(so)) {
        fs.rm(BugsounetPath, { recursive: true, force: true }, () => {
          console.warn("[Bugsounet] [SECURE] 🍺 Open your fridge, take a beer and try again...");
          process.exit(1);
        });
        console.log("[Bugsounet] [SECURE] 💀 error!");
      } else {
        console.log("[Bugsounet] [SECURE] ✅ Happy use !");
        resolve();
      }
    });
  });
}

exports.secure = secure;
