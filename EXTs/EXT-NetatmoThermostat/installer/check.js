/** MMM-NetatmoThermostat search home_id **/
/** @bugsounet **/

const fs = require("fs");
const path = require("path");
var netatmo = require("../components/netatmo");

let file = path.resolve(__dirname, "../../../../../config/config.js");
let found = false;

if (fs.existsSync(file)) {
  var MMConfig = require(file);
  var MMModules = MMConfig.modules;
} else {
  console.log("[NETATMO] config.js not found !?");
  process.exit();
}

for (let [nb, module] of Object.entries(MMModules)) {
  if (module.module === "MMM-Bugsounet/EXTs/EXT-NetatmoThermostat") {
    console.log(`Found: EXT-NetatmoThermostat -- module id:${nb}`);
    if (!module.config.api.client_id) {
      console.log("client_id not defined in config.js");
      process.exit(1);
    }
    if (!module.config.api.client_secret) {
      console.log("client_secret not defined in config.js");
      process.exit(1);
    }
    if (!module.config.api.refresh_token) {
      console.log("refresh_token not defined in config.js");
      process.exit(1);
    }
    found = true;
    var auth = module.config.api;
  }
}
if (!found) {
  console.log("EXT-NetatmoThermostat not configured in config.js");
  process.exit(1);
}

console.log("[NETATMO] Try to login to Netatmo Servers...");

var api = new netatmo(auth);

api
  .on("get-homesdata", (err, data) => {
    let found = false;
    if (data?.homes.length) {
      data.homes.forEach((home) => {
        home?.modules.forEach((module) => {
          if (module.type === "NATherm1") {
            console.log(`[NETATMO] --> [${home.name} - ${module.name}] home_id: "${home.id}",`);
            found = true;
          }
        });
      });
    } else {
      console.error("[NETATMO] No datas !");
      process.exit();
    }
    if (found) console.log("\n[NETATMO] Select your 'home_id' key and past it in your config.");
    else console.log("[NETATMO] No Thermostat found.");
    process.exit();
  })
  .on("error", (error) => {
    console.error(`[NETATMO] Netatmo Servers threw an error: ${error}`);
  })
  .on("warning", (warning) => {
    console.warn(`[NETATMO] Netatmo Servers threw a warning: ${warning}`);
  })
  .on("authenticated", () => {
    console.log("[NETATMO] Authenticated!\n");
  });

api.getHomesData();
