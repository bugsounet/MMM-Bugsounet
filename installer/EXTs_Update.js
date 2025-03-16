/*
 * Update EXTs installed
 * @busgounet
*/

const path = require("node:path");
const { fdir } = require("fdir");
const utils = require("./utils");
const functions = require("./functions");

const moduleRoot = utils.getModuleRoot();
const options = functions.getOptions();

/**
 * search all node_helper.js files in EXTs
 */
async function searchFilesInFolders () {
  const components = await new fdir()
    .withRelativePaths()
    .filter((path) => path.endsWith("node_helper.js"))
    .exclude((dirName) => dirName.endsWith("src"))
    .crawl(`${moduleRoot}/EXTs`)
    .withPromise();

  if (components.length) utils.success(`Found: ${components.length} EXTs to update\n`);
  else utils.warning("no EXTs installed!");
  return components;
}

/**
 * update all EXTs with Promise
 */
async function updateEXTs () {
  if (!options.EXT) return;
  const files = await searchFilesInFolders();
  const EXTs = await searchFoldersFromFiles(files);

  if (EXTs.length) {
    for (const EXT of EXTs) {
      await update(EXT)
        .catch(() => process.exit(1));
    }
    utils.success("\n✅ All EXTs are updated\n");
  }
}

/**
 * search folder from filename in array
 */
async function searchFoldersFromFiles (files) {
  var folders = [];
  files.forEach((file) => {
    let folder = path.dirname(file);
    folders.push(folder);
  });
  return folders.sort();
}

/**
 * update EXT as Promise
 */
function update (EXT) {
  utils.warning(`➤ Updating ${EXT}`);
  utils.empty();

  return new Promise((resolve, reject) => {
    utils.execPathCMD(`npm run setup:${EXT}`, utils.getModuleRoot(), (err) => {
      if (err) {
        utils.empty();
        utils.error(`${EXT}: Error Detected!`);
        utils.empty();
        reject();
      } else {
        utils.success(`\n${EXT}: Update Done`);
        resolve();
      }
    })
      .on("stdout", function (data) {
        utils.out(data.trim());
      })
      .on("stderr", function (data) {
        utils.error(data.trim());
      });
  });
}

module.exports.updateEXTs = updateEXTs;
