const { empty, info, error, success, moduleName, moduleVersion, moduleUpdate } = require("./utils");
const { updateEXTs } = require("./EXTs_Update");

async function main () {
  empty();
  info(`Update ${moduleName()} v${moduleVersion()}`);
  empty();
  await moduleUpdate((err) => {
    if (err) {
      error("Error Detected!");
      process.exit(1);
    }
    success("MMM-Bugsounet: Update Done!");
    empty();
    updateEXTs();
  });
}

main();
