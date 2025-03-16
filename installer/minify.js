/*
 * Code minifier
 * @busgounet
*/

const { fdir } = require("fdir");
const esbuild = require("esbuild");
const { empty, success, warning, out, isWin, moduleName, moduleRev, moduleVersion, getModuleRoot } = require("./utils");

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
 * Minify all files in array with Promise
 */
async function minifyFiles () {
  const files = await searchFiles();
  if (files.length) {
    success(`Found: ${files.length} files to install and minify`);
    empty();
    await Promise.all(files.map((file) => { return minify(file); })).catch(() => process.exit(1));
  } else {
    warning("no files found!");
  }
}

/**
 * Minify filename with esbuild
 * @param {string} file to minify
 * @returns {boolean} resolved with true
 */
function minify (FileIn) {
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
      esbuild.buildSync({
        entryPoints: [FileIn],
        allowOverwrite: true,
        minify: true,
        outfile: FileOut,
        banner: {
          js: `/** ${moduleName()}\n  * File: ${MyFileName}\n  * Version: ${moduleVersion()}\n  * Revision: ${moduleRev()}\n  * ⚠ This file must not be modified ⚠\n**/`
        },
        footer: {
          js: "/** ❤ Coded With Heart by @bugsounet **/"
        }
      });
      resolve(true);
    } catch {
      reject();
    }
  });
}

minifyFiles();
