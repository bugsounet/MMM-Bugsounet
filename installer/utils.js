const os = require("node:os");
const util = require("node:util");
const Exec = util.promisify(require("node:child_process").exec);
const exec = require("child_process").exec;
const events = require("events");
const path = require("node:path");

var packageJSON = require("../package.json");

var moduleRoot = path.resolve(__dirname, "../");
const installerHome = path.resolve(__dirname, "../installer");

// color codes
const reset = "\x1B[0m";
const red = "\x1B[91m";
const yellow = "\x1B[93m";
const green = "\x1B[92m";
const blue = "\x1B[94m";

// find any node arguments
const findArgs = () => process.argv.reduce((args, arg) => {
  // long arg
  if (arg.slice(0, 2) === "--") {
    const longArg = arg.split("=");
    const longArgFlag = longArg[0].slice(2);
    const longArgValue = longArg.length > 1 ? longArg[1] : true;
    args[longArgFlag] = longArgValue;
  }
  // flags
  else if (arg[0] === "-") {
    const flags = arg.slice(1).split("");
    flags.forEach((flag) => {
      args[flag] = true;
    });
  }
  return args;
}, {});

const args = findArgs();

if (args.path) {
  moduleRoot = path.resolve(moduleRoot, args.path);
  packageJSON = require(`${moduleRoot}/package.json`);
}

// deep merge
function configMerge (result) {
  var stack = Array.prototype.slice.call(arguments, 1);
  var item;
  var key;
  while (stack.length) {
    item = stack.shift();
    for (key in item) {
      if (item.hasOwnProperty(key)) {
        if (typeof result[key] === "object" && result[key] && Object.prototype.toString.call(result[key]) !== "[object Array]") {
          if (typeof item[key] === "object" && item[key] !== null) {
            result[key] = configMerge({}, result[key], item[key]);
          } else {
            result[key] = item[key];
          }
        } else {
          result[key] = item[key];
        }
      }
    }
  }
  return result;
}
module.exports.configMerge = configMerge;

function getArgs () {
  return args;
}
module.exports.getArgs = getArgs;

function getModuleRoot () {
  return moduleRoot;
}
module.exports.getModuleRoot = getModuleRoot;

// Display an empty line
function empty () {
  console.log("‎ ");
}
module.exports.empty = empty;

// Display a error in red
function error (text) {
  console.log(`${red}${text}${reset}`);
}
module.exports.error = error;

// Display a warning in yellow
function warning (text) {
  console.log(`${yellow}${text}${reset}`);
}
module.exports.warning = warning;

// Display a success in green
function success (text) {
  console.log(`${green}${text}${reset}`);
}
module.exports.success = success;

// Display out std message
function out (text) {
  console.log(text);
}
module.exports.out = out;

// Display an information in blue
function info (text) {
  console.log(`${blue}${text}${reset}`);
}
module.exports.info = info;

// Display module Name
function moduleName () {
  return packageJSON.name || "Unknow";
}
module.exports.moduleName = moduleName;

// Display module Version
function moduleVersion () {
  return packageJSON.version || "X.Y.Z";
}
module.exports.moduleVersion = moduleVersion;

// Display module rev date
function moduleRev () {
  return packageJSON.rev || "------";
}
module.exports.moduleRev = moduleRev;

// checkOS
async function execOSCmd (command) {
  const { stdout, stderr } = await Exec(command);
  if (stderr) return "Error";
  else return stdout.trim();
}

async function checkOS () {
  let type = os.type();
  let sysinfo = {
    type: null,
    arch: null,
    name: null,
    version: null
  };

  switch (type) {
    case "Linux":
      sysinfo.type = "Linux";
      sysinfo.arch = await execOSCmd("uname -m");
      sysinfo.name = await execOSCmd("cat /etc/*release | grep ^ID= | cut -f2 -d=");
      sysinfo.version = await execOSCmd("cat /etc/*release | grep ^VERSION_ID= | cut -f2 -d= | tr -d '\"'");
      return sysinfo;
    case "Darwin":
      sysinfo.type = "Darwin";
      sysinfo.arch = await execOSCmd("uname -m");
      sysinfo.name = await execOSCmd("sw_vers -productName");
      sysinfo.version = await execOSCmd("sw_vers -productVersion");
      return sysinfo;
    case "Windows_NT":
      sysinfo.type = "Windows";
      sysinfo.arch = os.arch();
      sysinfo.name = os.version();
      sysinfo.version = os.release();
      return sysinfo;
    default:
      sysinfo.type = undefined;
      return sysinfo;
  }
}
module.exports.checkOS = checkOS;

/* apt tools */

/**
 * check the currently installed of the module using dpkg -s
 * return: null if installed or err if not installed
 */
function checker (name, callback = () => {}) {
  exec(`dpkg -s ${name}`, function (err) {
    if (err) {
      return callback(0);
    }
    return callback(1);
  });
}

function check (names, callback = () => {}) {
  var modules = [];
  names.forEach((name, i) => {
    checker(name, (result) => {
      if (result === 0) {
        warning(`Missing package: ${name}`);
        modules.push(name);
      }
      if (i === names.length - 1) callback(modules);
    });
  });
}

/**
 * Update the apt cache using apt-get update
 */
function update (callback = () => {}) {
  var emitter = new events.EventEmitter();
  var child = exec("sudo apt-get update", function (err) {
    if (err) {
      return callback(err);
    }
    return callback();
  });

  child.stdout.on("data", function (data) {
    emitter.emit("stdout", data);
  });

  child.stderr.on("data", function (data) {
    emitter.emit("stderr", data);
  });

  return emitter;
}

/**
 * Install the module with the given names
 *
 * @param   {String}    names                names of the modules to install
 */
function install (names, callback = () => {}) {
  var emitter = new events.EventEmitter();
  var child = exec(`sudo apt-get install -y ${names}`, function (err) {
    if (err) {
      return callback(err);
    }
    return callback();
  });

  child.stdout.on("data", function (data) {
    emitter.emit("stdout", data);
  });

  child.stderr.on("data", function (data) {
    emitter.emit("stderr", data);
  });

  return emitter;
}

/**
 * Install npm dependencies
 */
function prune (callback = () => {}) {
  var emitter = new events.EventEmitter();
  var child = exec("npm prune", { cwd: moduleRoot }, function (err) {
    if (err) {
      return callback(err);
    }
    return callback();
  });

  child.stdout.on("data", function (data) {
    emitter.emit("stdout", data);
  });

  child.stderr.on("data", function (data) {
    emitter.emit("stderr", data);
  });

  return emitter;
}

/**
 * Remove npm dependencies
 */
function npmRemove (names, callback = () => {}) {
  var emitter = new events.EventEmitter();
  var child = exec(`npm remove ${names}`, { cwd: moduleRoot }, function (err) {
    if (err) {
      return callback(err);
    }
    return callback();
  });

  child.stdout.on("data", function (data) {
    emitter.emit("stdout", data);
  });

  child.stderr.on("data", function (data) {
    emitter.emit("stderr", data);
  });

  return emitter;
}

module.exports.check = check;
module.exports.update = update;
module.exports.install = install;
module.exports.prune = prune;
module.exports.npmRemove = npmRemove;

/**
 * search all javascript files
 */
function minify (callback = () => {}) {
  var emitter = new events.EventEmitter();
  // to do: make working with windows
  let cmd = (args.path) ? `node ${installerHome}/minify --path=${args.path}` : `node ${installerHome}/minify`;
  var child = exec(cmd, function (err) {
    if (err) {
      return callback(err);
    }
    return callback();
  });

  child.stdout.on("data", function (data) {
    emitter.emit("stdout", data);
  });

  child.stderr.on("data", function (data) {
    emitter.emit("stderr", data);
  });

  return emitter;
}

function develop (callback = () => {}) {
  var emitter = new events.EventEmitter();
  let cmd = (args.path) ? `node ${installerHome}/dev --path=${args.path}` : `node ${installerHome}/dev`;
  var child = exec(cmd, function (err) {
    if (err) {
      return callback(err);
    }
    return callback();
  });

  child.stdout.on("data", function (data) {
    emitter.emit("stdout", data);
  });

  child.stderr.on("data", function (data) {
    emitter.emit("stderr", data);
  });

  return emitter;
}
module.exports.minify = minify;
module.exports.develop = develop;

// electron need to be rebuilded
function electronRebuild (callback = () => {}) {
  var emitter = new events.EventEmitter();
  var child = exec("npx electron-rebuild", { cwd: moduleRoot }, function (err) {
    if (err) {
      return callback(err);
    }
    return callback();
  });

  child.stdout.on("data", function (data) {
    emitter.emit("stdout", data);
  });

  child.stderr.on("data", function (data) {
    emitter.emit("stderr", data);
  });

  return emitter;
}
module.exports.electronRebuild = electronRebuild;

// use windows platform ?
function isWin () {
  return process.platform === "win32";
}
module.exports.isWin = isWin;

function execCMD (command, callback = () => {}, bypass) {
  return new Promise((resolve) => {
    exec(`${command}`, function (err) {
      if (err) {
        error(`Error on ${command}:`);
        error(err);
        if (!bypass) process.exit(1);
      }
      resolve(callback());
    });
  });
}
module.exports.execCMD = execCMD;

async function moduleReset () {
  info("➤ Cleaning js files and reset git branch...");
  if (isWin()) {
    await execCMD(`del ${moduleRoot}\\*.js`);
    await execCMD(`rmdir ${moduleRoot}\\components /Q /S`);
  } else {
    await execCMD(`rm -f ${moduleRoot}/*.js`);
    await execCMD(`rm -rf ${moduleRoot}/components`);
  }
  await execCMD("git config pull.rebase false");
  await execCMD("git reset --hard");
}
module.exports.moduleReset = moduleReset;

async function moduleClean () {
  info("➤ Cleaning node_modules...");
  if (isWin()) {
    await execCMD(`rmdir ${moduleRoot}\\node_modules /Q /S`, () => {}, true);
  } else {
    await execCMD(`rm -rf ${moduleRoot}/node_modules`, () => {}, true);
  }
}
module.exports.moduleClean = moduleClean;

function moduleSetup (callback = () => {}) {
  info("➤ Setup...");
  var emitter = new events.EventEmitter();
  var child = exec("npm run setup", function (err) {
    if (err) {
      return callback(err);
    }
    return callback();
  });

  child.stdout.on("data", function (data) {
    emitter.emit("stdout", data);
  });

  child.stderr.on("data", function (data) {
    emitter.emit("stderr", data);
  });

  return emitter;
}

function modulePull (callback = () => {}) {
  info("➤ Updating Branch...");
  var emitter = new events.EventEmitter();
  var child = exec("git pull", { cwd: installerHome }, function (err) {
    if (err) {
      return callback(err);
    }
    return callback();
  });

  child.stdout.on("data", function (data) {
    emitter.emit("stdout", data);
  });

  child.stderr.on("data", function (data) {
    emitter.emit("stderr", data);
  });

  return emitter;
}

async function moduleUpdate (callback = () => {}) {
  await moduleReset();
  await modulePull((err) => {
    if (err) {
      error("Error Detected!");
      process.exit(1);
    }
    moduleSetup((err) => {
      if (err) {
        error("Error Detected!");
        process.exit(1);
      }
      return callback();
    })
      .on("stdout", function (data) {
        out(data.trim());
      })
      .on("stderr", function (data) {
        error(data.trim());
      });
  })
    .on("stdout", function (data) {
      out(data.trim());
    })
    .on("stderr", function (data) {
      error(data.trim());
    });
}
module.exports.moduleUpdate = moduleUpdate;

async function moduleRebuild (callback = () => {}) {
  await moduleClean();
  await moduleUpdate((err) => {
    if (err) {
      error("Error Detected!");
      process.exit(1);
    }
    return callback();
  });
}
module.exports.moduleRebuild = moduleRebuild;

async function checkUserGroup (folder, name) {
  info(`➤ Check ${name} user/group...`);
  let CHKUSER = await execOSCmd(`stat -c '%U' ${folder}`);
  let CHKGROUP = await execOSCmd(`stat -c '%G' ${folder}`);
  if (CHKUSER === "root" || CHKGROUP === "root") {
    error("No root neeed!");
    error(`Found: ${CHKUSER}/${CHKGROUP}`);
    empty();
    process.exit(1);
    return;
  }
  success(`Found: ${CHKUSER}/${CHKGROUP}`);
}

async function checkRoot () {
  let MagicMirrorRoot = path.resolve(installerHome, "../../../");
  await checkUserGroup(moduleRoot, moduleName());
  empty();
  await checkUserGroup(MagicMirrorRoot, "MagicMirror");
}
module.exports.checkRoot = checkRoot;
