"use strict";
const { exec } = require("node:child_process");
const fs = require("node:fs");

function secure () {
  let file = `${global.root_path}/config/config.js`;
  let BugsounetPath = `${global.root_path}/modules/MMM-Bugsounet`;
  let MMConfig;
  return new Promise((resolve) => {
    console.log("[Bugsounet] [SECURE] Check digital footprint...");
    exec(`cd ${BugsounetPath} && git config --get remote.origin.url`, (e, so) => {
      if (e) {
        console.log("[Bugsounet] [SECURE] Unknow error!");
        process.exit(1);
      }
      let output = new RegExp("bugs");
      if (!output.test(so)) {
        fs.rm(GAPath, { recursive: true, force: true }, () => {
          console.warn("[Bugsounet] [SECURE] Open your fridge, take a beer and try again...");
          process.exit(1);
        });
      } else {
        console.log("[Bugsounet] [SECURE] Happy use !");
        resolve()
      }
    });
  });
}

exports.secure = secure;
