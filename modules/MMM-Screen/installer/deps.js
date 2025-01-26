const utils = require("./utils");
const functions = require("./functions");

async function main () {
  if (utils.isWin()) return;
  // Let's start !
  utils.empty();
  utils.info(`Welcome to ${utils.moduleName()} v${utils.moduleVersion()} apt dependencies installer`);
  utils.empty();
  await functions.updatePackageInfoLinux();
  await functions.installLinuxDeps();
  utils.empty();
  utils.success("All dependencies are installed.");
  utils.empty();
}

main();
