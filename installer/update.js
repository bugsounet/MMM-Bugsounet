const utils = require("./utils");
const { updateEXTs } = require("./EXTs_Update");

async function main () {
  // Let's start !
  utils.empty();
  utils.info(`Update ${utils.moduleName()} v${utils.moduleVersion()}`);
  utils.empty();
  await utils.moduleUpdate((err) => {
    if (err) {
      utils.error("Error Detected!");
      process.exit(1);
    }
    utils.success("MMM-Bugsounet Update Done!");
  });
  await updateEXTs();
}

main();
