const { isWin, empty, info, success, moduleName, moduleVersion } = require("./utils");
const { updatePackageInfoLinux, installLinuxDeps } = require("./functions");

async function main () {
  if (isWin()) return;
  empty();
  info(`Welcome to ${moduleName()} v${moduleVersion()} apt dependencies installer`);
  empty();
  await updatePackageInfoLinux();
  await installLinuxDeps();
  empty();
  success("All dependencies are installed.");
  empty();
}

main();
