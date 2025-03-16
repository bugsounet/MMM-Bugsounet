const { empty, info, success, execCMD, getModuleRoot, isWin } = require("../../../installer/utils");

async function main () {
  if (isWin()) return;
  info("Install Emojis...");
  await execCMD("mkdir ~/.fonts &>/dev/null");
  await execCMD(`cp -f ${getModuleRoot()}/installer/*.ttf ~/.fonts/`);
  await execCMD("fc-cache -f -v &>/dev/null");
  success("Done");
}

main();
