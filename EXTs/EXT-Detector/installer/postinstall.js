const utils = require("../../../installer/utils");

async function main () {
  const commands = [
    "tsc -p tsconfig.json",
    "esbuild components/lib/node/index.js --minify --outfile=components/lib/node/index.js --banner:js=\"/** ⚠ This file must not be modified ⚠ **/\" --allow-overwrite --log-level=silent"
  ];

  for (const command of commands) {
    await execCMD(command);
  }
  utils.success("Done");
}

async function execCMD (command) {
  return new Promise((resolve) => {
    utils.execPathCMD(command, `${utils.getModuleRoot()}`, (err) => {
      if (err) {
        utils.error("Error Detected!");
        process.exit(1);
      }
      resolve();
    })
      .on("stdout", function (data) {
        utils.out(data.trim());
      })
      .on("stderr", function (data) {
        utils.error(data.trim());
      });
  });
}

main();
