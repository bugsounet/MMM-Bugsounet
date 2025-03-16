/*
 * Install src code without minify
 * @busgounet
*/

const { copyFileSync } = require("node:fs");
const { fdir } = require("fdir");
const { empty, warning, success, out, isWin, moduleName, getModuleRoot } = require("./utils");

/**
 * search all javascript files
 */
async function searchFiles () {
  const components = await new fdir()
    .withBasePath()
    .filter((path) => path.endsWith(".js"))
    .crawl(`${getModuleRoot()}/src`)
    .withPromise();

  return components;
}

/**
 * Install all files in array with Promise
 */
async function installFiles () {
  const files = await searchFiles();
  if (files.length) {
    success(`Found: ${files.length} files to install`);
    empty();
    await Promise.all(files.map((file) => { return install(file); })).catch(() => process.exit(1));
    empty();
    success("✅ All sources files are installed");
    empty();
  } else {
    warning("no files found!");
  }
}

/**
 * Install filename with copyFileSync
 * @param {string} file to install
 * @returns {boolean} resolved with true
 */
function install (FileIn) {
  var FileOut, MyFileName;
  if (isWin()) {
    FileOut = FileIn.replace(`${getModuleRoot()}\\src\\`, `${getModuleRoot()}\\`);
  } else {
    FileOut = FileIn.replace(`${getModuleRoot()}/src/`, `${getModuleRoot()}/`);
  }
  MyFileName = FileOut.replace(getModuleRoot(), moduleName());

  out(`Process File: \x1B[3m${MyFileName}\x1B[0m`);
  return new Promise((resolve, reject) => {
    try {
      copyFileSync(FileIn, FileOut);
      resolve(true);
    } catch {
      reject();
    }
  });
}

installFiles();
