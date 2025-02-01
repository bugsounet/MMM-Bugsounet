/*
 * Install new source code to src (develop)
 * @busgounet
*/

const { copyFileSync } = require("node:fs");
const { fdir } = require("fdir");
const utils = require("./utils");

const isWin = utils.isWin();
const project = utils.moduleName();
const moduleRoot = utils.getModuleRoot();

var files = [];

/**
 * search all javascript files
 */
async function searchFiles () {
  const components = await new fdir()
    .withBasePath()
    .filter((path) => path.endsWith(".js"))
    .crawl(`${moduleRoot}/src`)
    .withPromise();

  files = files.concat(components);
  if (files.length) utils.success(`Found: ${files.length} files to install\n`);
  else utils.warning("no files found!");
}

/**
 * Install all files in array with Promise
 */
async function installFiles () {
  await searchFiles();
  if (files.length) {
    await Promise.all(files.map((file) => { return install(file); })).catch(() => process.exit(1));
    utils.success("\n✅ All new sources files are copied to the src folder\n");
  }
}

/**
 * Install filename with copyFileSync
 * @param {string} file to install
 * @returns {boolean} resolved with true
 */
function install (FileIn) {
  var FileOut, MyFileName;
  if (isWin) {
    FileOut = FileIn.replace(`${moduleRoot}\\src\\`, `${moduleRoot}\\`);
  } else {
    FileOut = FileIn.replace(`${moduleRoot}/src/`, `${moduleRoot}/`);
  }
  MyFileName = FileOut.replace(moduleRoot, project);

  utils.out(`Process File: \x1B[3m${MyFileName}\x1B[0m`);
  return new Promise((resolve, reject) => {
    try {
      copyFileSync(FileOut, FileIn);
      resolve(true);
    } catch {
      reject();
    }
  });
}

installFiles();
