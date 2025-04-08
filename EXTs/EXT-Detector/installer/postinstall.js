const { success, error, out, execPathCMD, getModuleRoot } = require("../../../installer/utils");

async function main () {
  const commands = [
    "tsc -p tsconfig.json",
    "esbuild components/lib/node/index.js --minify --outfile=components/lib/node/index.js --banner:js=\"/** ⚠ This file must not be modified ⚠ **/\" --allow-overwrite --log-level=silent"
  ];

  for (const command of commands) {
    await execCMD(command);
  }
  success("Done");
}

async function execCMD (command) {
  return new Promise((resolve) => {
    execPathCMD(command, `${getModuleRoot()}`, (err) => {
      if (err) {
        error("Error Detected!");
        process.exit(1);
      }
      resolve();
    })
      .on("stdout", function (data) {
        out(data.trim());
      })
      .on("stderr", function (data) {
        error(data.trim());
      });
  });
}

main();
