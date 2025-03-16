const { empty, info, success, moduleName, moduleVersion, moduleClean } = require("./utils");

async function main () {
  empty();
  info(`Clean ${moduleName()} v${moduleVersion()}`);
  empty();
  await moduleClean();
  success("Done!");
}

main();
