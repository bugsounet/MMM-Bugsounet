const { empty, info, error, success, moduleName, moduleVersion, moduleRebuild } = require("./utils");
const { rebuildEXTs } = require("./EXTs_Rebuild");

async function main () {
  empty();
  info(`Rebuild ${moduleName()} v${moduleVersion()}`);
  empty();
  await moduleRebuild((err) => {
    if (err) {
      error("Error Detected!");
      process.exit(1);
    }
    success("MMM-Bugsounet: Rebuild Done!");
    empty();
    rebuildEXTs();
  });
}

main();
