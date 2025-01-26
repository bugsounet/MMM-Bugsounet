/*
 * Code minifier
 * @busgounet
*/

const path = require("node:path");
const { fdir } = require("fdir");
const esbuild = require("esbuild");
const utils = require("./utils");

const isWin = utils.isWin();
const project = utils.moduleName();
const revision = utils.moduleRev();
const version = utils.moduleVersion();

const moduleRoot = path.resolve(__dirname, "../");

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
  if (files.length) utils.success(`Found: ${files.length} files to install and minify\n`);
  else utils.warning("no files found!");
}

/**
 * Minify all files in array with Promise
 */
async function minifyFiles () {
  await searchFiles();
  if (files.length) await Promise.all(files.map((file) => { return minify(file); })).catch(() => process.exit(1));
}

/**
 * Minify filename with esbuild
 * @param {string} file to minify
 * @returns {boolean} resolved with true
 */
function minify (FileIn) {
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
      esbuild.buildSync({
        entryPoints: [FileIn],
        allowOverwrite: true,
        minify: true,
        outfile: FileOut,
        banner: {
          js: `/** ${project}\n  * File: ${MyFileName}\n  * Version: ${version}\n  * Revision: ${revision}\n  * ⚠ This file must not be modified ⚠\n**/`
        },
        footer: {
          js: "/** ❤ Coded With Heart by @bugsounet -- https://www.bugsounet.fr **/"
        }
      });
      resolve(true);
    } catch {
      reject();
    }
  });
}

minifyFiles();
