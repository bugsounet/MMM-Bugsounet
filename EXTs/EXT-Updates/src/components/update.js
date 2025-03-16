var log = () => { /* do nothing */ };
const childProcess = require("child_process");

class Update {
  constructor (config, Tools) {
    this.config = config;
    this.root_path = this.config.root_path;
    this.sendSocketNotification = (...args) => Tools.sendSocketNotification(...args);
    if (this.config.debug) log = (...args) => { console.log("[UPDATES] [UPDATE]", ...args); };
    this.updateList = ["MMM-Bugsounet"];
    if (Array.isArray(this.config.bugsounet) && this.config.bugsounet.length) {
      this.updateList = this.updateList.concat(this.config.bugsounet);
      this.updateList = [...new Set(this.updateList)];
      console.warn("[UPDATES] [UPDATE] bugsounet updateList Found:", this.updateList);
      this.sendSocketNotification("UPDATE_LIST", this.updateList);
    } else {
      this.sendSocketNotification("UPDATE_LIST", this.updateList);
    }
  }

  process (module) {
    let Command = null;
    var Path = `${this.root_path}/modules/`;
    var modulePath = Path + module;

    if (this.updateList.includes(module)) Command = "npm run update";

    if (!Command) return console.warn(`[UPDATES] Update of ${module} is not supported.`);
    console.log(`[UPDATES] [UPDATE] Updating ${module}...`);
    this.sendSocketNotification("SendInfo", `Updating ${module}...`);

    childProcess.exec(Command, { cwd: modulePath, timeout: this.config.timeout }, (error, stdout) => {
      if (error) {
        console.error(`[UPDATES] exec error: ${error}`);
        this.sendSocketNotification("ERROR_UPDATE", module);
      } else {
        console.log(`[UPDATES] Update logs of ${module}: ${stdout}`);
        this.sendSocketNotification("UPDATED", module);
        if (this.config.autoRestart) {
          log("Process update done");
          setTimeout(() => this.sendSocketNotification("RESTART"), 3000);
        } else {
          log("Process update done, don't forget to restart MagicMirror!");
          this.sendSocketNotification("NEEDRESTART");
        }
      }
    });
  }

  /** remove ExtraChars for telegramBot markdown **/
  ExtraChars (str) {
    let result = str;
    result = result.replace(/[\s]{2,}/g, " "); // delete space doubles, and more
    result = result.replace(/^[\s]/, ""); // delete space on the begin
    result = result.replace(/[\s]$/, ""); // delete space on the end
    result = result.replace("|", ":"); // simple replace | to : for more visibility
    /** special markdown for Telegram **/
    result = result.replace(new RegExp("_", "g"), "\\_"); //
    result = result.replace(new RegExp("\\*", "g"), "\\*");
    result = result.replace(new RegExp("\\[", "g"), "\\[");
    result = result.replace(new RegExp("`", "g"), "\\`");
    return result;
  }

  /** remove only color **/
  StripColor (str) {
    let result = str;
    result = result.replace(/\[(\[H\033\[2J|\d+;\d+H|\d+(;\d+;\d+(;\d+;\d+)?m|[m])|1K)|\[m/g, "");
    return result;
  }
}

module.exports = Update;
