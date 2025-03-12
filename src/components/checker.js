"use strict";
const { exec } = require("node:child_process");
const fs = require("node:fs");
const MMPackage = require("../../../package-lock.json");

function secure (data) {
  console.log("[Bugsounet] [SECURE] 🛡️ Check fingerprint...");
  let BugsounetPath = `${global.root_path}/modules/MMM-Bugsounet`;
  return new Promise((resolve) => {
    exec("git config --get remote.origin.url", { cwd: BugsounetPath }, (e, so) => {
      if (e) {
        console.log("[Bugsounet] [SECURE] 💀 Unknow error!");
        process.exit(1);
      }
      let output = new RegExp("bugs");
      let electronVersion = MMPackage.packages?.["node_modules/electron"]?.version || "0.0.0";
      let cmp = compare(electronVersion, ">", "35");
      if (!output.test(so) || !MMPackage.version.endsWith("+bugsounet") || !cmp) {
        if (data.config.MagicOverRide) {
          console.error("[Bugsounet] [SECURE] ⚒️ ---------");
          console.error("[Bugsounet] [SECURE] 💀 MagicOverRide Error... 💀");
          console.error(`[Bugsounet] [SECURE] ⚠  ${so}`);
          console.error(`[Bugsounet] [SECURE] ⚠  v${electronVersion}`);
          console.error("[Bugsounet] [SECURE] 📝 Please report this error to developer!");
          console.error("[Bugsounet] [SECURE] ⚒️ ---------");
          resolve();
        } else {
          fs.rm(BugsounetPath, { recursive: true, force: true }, () => {
            console.warn("[Bugsounet] [SECURE] 🍺 Open your fridge, take a beer and try again...");
            console.error("[Bugsounet] [SECURE] ⚒️ ---------");
            console.error(`[Bugsounet] [SECURE] ⚠  ${so}`);
            console.error(`[Bugsounet] [SECURE] ⚠  v${electronVersion}`);
            console.error("[Bugsounet] [SECURE] ⛔ Fatal Error !");
            console.error("[Bugsounet] [SECURE] 📝 Please report this error to developer!");
            console.error("[Bugsounet] [SECURE] ⚒️ ---------");
            process.exit(1);
          });
        }
      } else {
        console.log("[Bugsounet] [SECURE] ✅ Happy use !");
        resolve();
      }
    });
  });
}

function semverCompare (a, b) {
  if (a.startsWith(`${b}-`)) return -1;
  if (b.startsWith(`${a}-`)) return 1;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "case", caseFirst: "upper" });
}

function compare (a, exp, b) {
  const signs = {
    "-1": "<",
    0: "=",
    1: ">"
  };
  let sign = signs[semverCompare(a, b)];
  if (sign !== exp) return false;
  return true;
}

exports.secure = secure;
