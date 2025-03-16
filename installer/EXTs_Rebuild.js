/*
 * Rebuild EXTs installed
 * @busgounet
*/

const path = require("node:path");
const { fdir } = require("fdir");
const { empty, info, success, warning, error, out, execPathCMD, getModuleRoot, EXTClean } = require("./utils");
const { getOptions } = require("./functions");

/**
 * search all node_helper.js files in EXTs
 */
async function searchFilesInFolders () {
  const components = await new fdir()
    .withRelativePaths()
    .filter((path) => path.endsWith("node_helper.js"))
    .exclude((dirName) => dirName.endsWith("src"))
    .crawl(`${getModuleRoot()}/EXTs`)
    .withPromise();

  return components;
}

/**
 * rebuild all EXTs with Promise
 */
async function rebuildEXTs () {
  const options = getOptions();
  if (!options.EXT) return;
  const files = await searchFilesInFolders();
  if (files.length) {
    success(`Found: ${files.length} EXTs installed\n`);
    const EXTs = await searchFoldersFromFiles(files);

    if (EXTs.length) {
      for (const EXT of EXTs) {
        await update(EXT)
          .catch(() => process.exit(1));
      }
      empty();
      success("✅ All EXTs are rebuilded");
      empty();
    }
  } else {
    warning("No EXTs installed!");
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
async function update (EXT) {
  empty();
  if (!EXTNeedRebuild(EXT)) {
    info(`✋ Skipped: ${EXT} (Not needed)`);
    return;
  }
  empty();
  warning(`➤ Rebuild ${EXT}`);
  empty();
  await EXTClean(EXT);
  empty();
  return new Promise((resolve, reject) => {
    execPathCMD(`npm run setup:${EXT}`, getModuleRoot(), (err) => {
      if (err) {
        empty();
        error(`${EXT}: Error Detected!`);
        empty();
        reject();
      } else {
        success(`\n${EXT}: Update Done!`);
        resolve();
      }
    })
      .on("stdout", function (data) {
        out(data.trim());
      })
      .on("stderr", function (data) {
        error(data.trim());
      });
  });
}

/*
 * check package.json option rebuild of EXT
 */
function EXTNeedRebuild (EXT) {
  var packageJSON;
  try {
    packageJSON = require(`${getModuleRoot()}/EXTs/${EXT}/package.json`);
  } catch {
    error("Error ${EXT}: package.json not found");
    empty();
    process.exit(1);
  }

  var options = packageJSON.installer || {};
  if (options.rebuild) return true;
  return false;
}

module.exports.rebuildEXTs = rebuildEXTs;
