/** Spotify setup **/
/** @bugsounet **/

const fs = require("fs");
const path = require("path");
const Spotify = require("../components/spotifyLib");

let file = path.resolve(__dirname, "../../../../../config/config.js");
let found = false;
let config = {};

if (fs.existsSync(file)) {
  var MMConfig = require(file);
  var MMModules = MMConfig.modules;
} else {
  console.log("config.js not found !?");
  process.exit();
}

MMModules.forEach((module) => {
  if (module.module === "MMM-Bugsounet/EXTs/EXT-Spotify") {
    found = true;
    if (!module.config) {
      console.log("Please configure this module in config.js file before!");
      process.exit();
    }
    if (!module.config.CLIENT_SECRET) {
      console.log("CLIENT_SECRET is not defined in spotify module config !");
      process.exit();
    }
    if (!module.config.CLIENT_ID) {
      console.log("CLIENT_ID is not defined in spotify module config !");
      process.exit();
    }

    /** All is Good ! **/
    config.TOKEN = "./tokenSpotify.json";
    config.CLIENT_SECRET = module.config.CLIENT_SECRET;
    config.CLIENT_ID = module.config.CLIENT_ID;
    config.PATH = "../";
  }
});

if (!found) {
  console.log("EXT-Spotify not configured in config.js");
  process.exit();
}

let Auth = new Spotify(config, null, true, true);

Auth.authFlow(() => {
  console.log("[SPOTIFY_AUTH] Authorization is finished. Check ", config.TOKEN);
}, (e) => {
  console.error(e);
});
