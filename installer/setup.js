const { empty, info, error, success, moduleName, moduleVersion, checkOS, checkRoot } = require("./utils");
const { updatePackageInfoLinux, installLinuxDeps, installNPMDeps, postInstall, electronRebuild, installFiles, done } = require("./functions");

async function main () {
  empty();
  info(`Welcome to ${moduleName()} v${moduleVersion()}`);
  empty();
  info("➤ Checking OS...");
  const { type, name, version, arch } = await checkOS();
  switch (type) {
    case "Linux":
      if (name === "raspbian" && version < "11") {
        error(`OS Detected: Linux (${name} ${version} ${arch})`);
        empty();
        error("Unfortunately, this module is not compatible with your OS");
        error("Try to update your OS to the lasted version of raspbian");
        process.exit(1);
      } else {
        success(`OS Detected: Linux (${name} ${version} ${arch})`);
      }
      empty();
      await checkRoot();
      await updatePackageInfoLinux();
      await installLinuxDeps();
      await installNPMDeps();
      await postInstall();
      await electronRebuild();
      await installFiles();
      done();
      break;
    case "Darwin":
      error(`OS Detected: Darwin (${name} ${version} ${arch})`);
      error("Automatic installation is not included");
      empty();
      process.exit(1);
      break;
    case "Windows":
      error(`OS Detected: Windows (${name} ${version} ${arch})`);
      error("This OS is not supported");
      empty();
      process.exit(1);
      break;
  }
}

main();
