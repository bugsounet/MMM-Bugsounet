const packageJSON = require("../package.json");
const utils = require("./utils");

var options = packageJSON.installer || {};

async function updatePackageInfoLinux () {
  utils.empty();
  utils.info("➤ Update package informations");
  utils.empty();
  return new Promise((resolve) => {
    utils.update((err) => {
      if (err) {
        utils.error("Error Detected!");
        process.exit(1);
      }
      resolve();
    })
      .on("stdout", function (data) {
        utils.out(data.trim());
      })
      .on("stderr", function (data) {
        utils.error(data.trim());
      });
  });
}
module.exports.updatePackageInfoLinux = updatePackageInfoLinux;

async function installLinuxDeps () {
  utils.empty();
  utils.info("➤ Dependencies installer");
  utils.empty();
  const apt = options.apt;
  if (!apt.length) {
    utils.out("No dependecies needed!");
    return;
  }
  return new Promise((resolve) => {
    utils.check(apt, (result) => {
      if (!result.length) {
        utils.success("All Dependencies needed are installed !");
        resolve();
      } else {
        let modulesToInstall = result.join(" ");
        utils.empty();
        utils.info("Installing missing package...");
        utils.install(modulesToInstall, (err) => {
          if (err) {
            utils.error("Error Detected!");
            process.exit(1);
          }
          resolve();
        })
          .on("stdout", function (data) {
            utils.out(data.trim());
          })
          .on("stderr", function (data) {
            utils.error(data.trim());
          });
      }
    });
  });
}
module.exports.installLinuxDeps = installLinuxDeps;

async function installNPMDeps () {
  utils.empty();
  utils.info("➤ NPM Package installer");
  utils.empty();

  return new Promise((resolve) => {
    utils.prune((err) => {
      if (err) {
        utils.error("Error Detected!");
        process.exit(1);
      }
      resolve();
    })
      .on("stdout", function (data) {
        utils.out(data.trim());
      })
      .on("stderr", function (data) {
        utils.error(data.trim());
      });
  });
}
module.exports.installNPMDeps = installNPMDeps;

async function installFiles () {
  utils.empty();
  utils.info("➤ Install Files");
  utils.empty();
  if (options.minify) await minify();
  else await develop();
}
module.exports.installFiles = installFiles;

async function minify () {
  return new Promise((resolve) => {
    utils.minify((err) => {
      if (err) {
        utils.error("Error Detected!");
        process.exit(1);
      }
      resolve();
    })
      .on("stdout", function (data) {
        utils.out(data.trim());
      })
      .on("stderr", function (data) {
        utils.error(data.trim());
      });
  });
}
module.exports.minify = minify;

async function develop () {
  return new Promise((resolve) => {
    utils.develop((err) => {
      if (err) {
        utils.error("Error Detected!");
        process.exit(1);
      }
      resolve();
    })
      .on("stdout", function (data) {
        utils.out(data.trim());
      })
      .on("stderr", function (data) {
        utils.error(data.trim());
      });
  });
}
module.exports.develop = develop;

async function electronRebuild () {
  utils.empty();
  utils.info("➤ Rebuild MagicMirror...");
  utils.empty();
  if (!options.rebuild || (utils.isWin() && !options.windowsRebuild)) {
    utils.out("electron-rebuild is not needed.");
    return;
  }
  return new Promise((resolve) => {
    utils.electronRebuild((err) => {
      if (err) {
        utils.error("Error Detected!");
        process.exit(1);
      }
      resolve();
    })
      .on("stdout", function (data) {
        utils.out(data.trim());
      })
      .on("stderr", function (data) {
        utils.out(data.trim());
      });
  });
}
module.exports.electronRebuild = electronRebuild;

function done () {
  utils.empty();
  utils.success(`${utils.moduleName()} is now installed !`);
  utils.empty();
}
module.exports.done = done;

// Windows
async function removeWindowsDeps () {
  utils.empty();
  utils.info("➤ [Windows] Dependencies remover");
  utils.empty();
  const npm = options.windowsNPMRemove;
  if (!npm.length) {
    utils.out("No dependecies needed!");
    return;
  }
  let modulesToRemove = npm.join(" ");
  utils.info(`[Windows] removing: ${modulesToRemove}`);
  return new Promise((resolve) => {
    utils.npmRemove(modulesToRemove, (err) => {
      if (err) {
        utils.error("Error Detected!");
        process.exit(1);
      }
      resolve();
    })
      .on("stdout", function (data) {
        utils.out(data.trim());
      })
      .on("stderr", function (data) {
        utils.error(data.trim());
      });
  });
}
module.exports.removeWindowsDeps = removeWindowsDeps;

// installer options
function setOptions () {
  const defaults = {
    minify: true,
    rebuild: false,
    apt: [],
    windowsNPMRemove: [],
    windowsRebuild: false
  };
  if (!options || typeof options === "string") {
    utils.warning("No installer options!");
    options = defaults;
    return defaults;
  }
  if (!Array.isArray(options.apt) && options.apt !== undefined) {
    utils.warning("apt: format Error!");
    options.apt = [];
  }
  if (utils.isWin()) {
    if (!Array.isArray(options.windowsNPMRemove) && options.windowsNPMRemove !== undefined) {
      utils.warning("windowsNPMRemove: format Error!");
      options.windowsNPMRemove = [];
    }
    if (options.windowsRebuild !== undefined && typeof options.windowsRebuild !== "boolean") {
      utils.warning("windowsRebuild: format Error!");
      options.windowsRebuild = false;
    }
  }

  options = utils.configMerge({}, defaults, options);
  return options;
}

function getOptions () {
  return options;
}
module.exports.getOptions = getOptions;

// read package.json and setOptions on library load
setOptions();
