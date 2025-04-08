"use strict";
const fs = require("fs");
const path = require("path");
const GP = require("../components/GooglePhotosLib");

console.log("[GPHOTOS] Check credentials.json...");
if (fs.existsSync(path.resolve(`${__dirname}/../credentials.json`))) {
  this.CREDENTIALS = path.resolve(`${__dirname}/../credentials.json`);
} else if (fs.existsSync(path.resolve(`${__dirname}/../../EXT-Assistant/credentials.json`))) {
  this.CREDENTIALS = path.resolve(`${__dirname}/../../EXT-Assistant/credentials.json`);
}

if (!this.CREDENTIALS) {
  console.log("[GPHOTOS] credentials.json file not found !");
  process.exit();
} else {
  console.log("[GPHOTOS] credentials.json found in", this.CREDENTIALS);
}

const authOption = {
  CREDENTIALS: this.CREDENTIALS,
  TOKEN: path.resolve(__dirname, "../tokenGP.json")
};

var GPhotos = new GP(authOption, true);

GPhotos.generateToken(
  function success () {
    console.log("[GPHOTOS] TokenGP is generated.");
    process.exit();
  },
  function fail () {
    console.log("[GPHOTOS] TokenGP file doesn't exist. Check the permission.");
    process.exit();
  }
);
