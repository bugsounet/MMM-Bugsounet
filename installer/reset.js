const utils = require("./utils");

async function main () {
  // Let's start !
  utils.empty();
  utils.info(`Reset ${utils.moduleName()} v${utils.moduleVersion()}`);
  utils.empty();
  await utils.moduleReset();
  utils.success("Done!");
}

main();
