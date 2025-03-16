const { empty, info, success, moduleName, moduleVersion, moduleReset } = require("./utils");

async function main () {
  empty();
  info(`Reset ${moduleName()} v${moduleVersion()}`);
  empty();
  await moduleReset();
  success("Done!");
}

main();
