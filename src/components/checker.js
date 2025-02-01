"use strict";
const { exec } = require("node:child_process");
const fs = require("node:fs");
const MMPackage = require("../../../package-lock.json");

function secure () {
  let BugsounetPath = `${global.root_path}/modules/MMM-Bugsounet`;
  return new Promise((resolve) => {
    console.log("[Bugsounet] [SECURE] Check fingerprint...");
    exec(`cd ${BugsounetPath} && git config --get remote.origin.url`, (e, so) => {
      if (e) {
        console.log("[Bugsounet] [SECURE] Unknow error!");
        process.exit(1);
      }
      let output = new RegExp("bugs");
      let electronVersion = MMPackage.packages?.["node_modules/electron"]?.version || "0.0.0";
      let cmp = compare(electronVersion, ">", "34");
      if (!output.test(so) || !MMPackage.version.endsWith("+bugsounet") || !cmp) {
        fs.rm(BugsounetPath, { recursive: true, force: true }, () => {
          console.warn("[Bugsounet] [SECURE] Open your fridge, take a beer and try again...");
          process.exit(1);
        });
      } else {
        console.log("[Bugsounet] [SECURE] Happy use !");
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
