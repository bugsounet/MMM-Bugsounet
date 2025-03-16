const { empty, info, error, success, moduleName, moduleVersion, moduleRebuild } = require("./utils");

async function main () {
  empty();
  info(`Rebuild ${moduleName()} v${moduleVersion()}`);
  empty();
  await moduleRebuild((err) => {
    if (err) {
      error("Error Detected!");
      process.exit(1);
    }
    success("Rebuild Done!");
  });
}

main();
