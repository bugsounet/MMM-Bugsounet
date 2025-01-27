const utils = require("./utils");

async function main () {
  // Let's start !
  utils.empty();
  utils.info(`Rebuild ${utils.moduleName()} v${utils.moduleVersion()}`);
  utils.empty();
  await utils.moduleRebuild((err) => {
    if (err) {
      utils.error("Error Detected!");
      process.exit(1);
    }
    utils.success("Rebuild Done!");
  });
}

main();
