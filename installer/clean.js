const utils = require("./utils");

async function main () {
  // Let's start !
  utils.empty();
  utils.info(`Clean ${utils.moduleName()} v${utils.moduleVersion()}`);
  utils.empty();
  await utils.moduleClean();
  utils.success("Done!");
}

main();
