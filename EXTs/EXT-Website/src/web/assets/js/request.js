/** fetch datas **/

/* global alertify, translation, PleaseRotate */

/* eslint-disable no-unused-vars */

var Alert = 0;

function getCurrentToken () {
  return JSON.parse(localStorage.getItem("MMM-Bugsounet"));
}

function getTranslate (lang, query, values = null) {
  return new Promise((resolve) => {
    Request("/api/translations/translate", "GET", { Authorization: `Bearer ${getCurrentToken()}`, language: lang, translate: query, values: JSON.stringify(values) }, null, "translate", (translate) => resolve(translate.translate), null);
  });
}

function getTranslateGroup (lang, group) {
  return new Promise((resolve) => {
    Request("/api/translations/group", "GET", { Authorization: `Bearer ${getCurrentToken()}`, language: lang, group: group }, null, "Grouptranslate", (translate) => resolve(translate.translate), null);
  });
}

function getMyUser () {
  return new Promise((resolve) => {
    Request("/api/me", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "MyUser", (user) => resolve(user), null);
  });
}

function putMyUser (body) {
  return new Promise((resolve) => {
    Request("/api/me", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ me: btoa(JSON.stringify(body)) }), "MyUser", (result) => resolve(result), null);
  });
}

function getHomeText (lang) {
  return new Promise((resolve) => {
    Request("/api/translations/homeText", "GET", { Authorization: `Bearer ${getCurrentToken()}`, language: lang }, null, "homeText", (text) => resolve(text.homeText), null);
  });
}

function getVersion () {
  return new Promise((resolve) => {
    Request("/api/version", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "version", (version) => resolve(version), null);
  });
}

function getAPIDocs () {
  return new Promise((resolve) => {
    Request("/api", "GET", null, null, "API", (api) => resolve(api.docs), null);
  });
}

function doDie () {
  return new Promise((resolve) => {
    Request("/api/system/die", "POST", { Authorization: `Bearer ${getCurrentToken()}` }, null, "Die", () => resolve(), null);
  });
}

function doRestart () {
  return new Promise((resolve) => {
    Request("/api/system/restart", "POST", { Authorization: `Bearer ${getCurrentToken()}` }, null, "Restart", () => resolve(), null);
  });
}

function doReboot () {
  return new Promise((resolve) => {
    Request("/api/system/reboot", "POST", { Authorization: `Bearer ${getCurrentToken()}` }, null, "Reboot", () => resolve(), null);
  });
}

function doShutdown () {
  return new Promise((resolve) => {
    Request("/api/system/shutdown", "POST", { Authorization: `Bearer ${getCurrentToken()}` }, null, "Shutdown", () => resolve(), null);
  });
}

function doUpdates (success) {
  return new Promise((resolve) => {
    Request("/api/EXT/Updates", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, null, "Updates", () => {
      if (success) success();
      resolve();
    }, null);
  });
}

function doStop (success) {
  return new Promise((resolve) => {
    Request("/api/EXT/stop", "POST", { Authorization: `Bearer ${getCurrentToken()}` }, null, "STOP", () => {
      if (success) success();
      resolve();
    }, null);
  });
}

function putRadio (radio, success) {
  return new Promise((resolve) => {
    Request("/api/EXT/RadioPlayer", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ radio: radio }), "RadioPlayer", () => {
      if (success) success();
      resolve();
    }, null);
  });
}

function putSpeaker (volume, success) {
  return new Promise((resolve) => {
    Request("/api/EXT/Volume/speaker", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ volume: volume }), "Volume", () => {
      if (success) success();
      resolve();
    }, null);
  });
}

function putMic (volume, success) {
  return new Promise((resolve) => {
    Request("/api/EXT/Volume/recorder", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ volume: volume }), "Volume", () => {
      if (success) success();
      resolve();
    }, null);
  });
}

function putTV (channel, success) {
  return new Promise((resolve) => {
    Request("/api/EXT/FreeboxTV", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ TV: channel }), "FreeboxTV", () => {
      if (success) success();
      resolve();
    }, null);
  });
}

function doAlert (alert, success) {
  return new Promise((resolve) => {
    Request("/api/system/alert", "POST", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ alert: alert }), "Alert", () => {
      if (success) success();
      resolve();
    }, null);
  });
}

function getCurrentSystem () {
  return new Promise((resolve) => {
    Request("/api/system/currentSysInfo", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "sysInfo", (system) => resolve(system), (err) => {
      if (err.status === 401 || err.status === 403) location.href = "/logout";
      if (Alert === 1) {
        if (!err.status || err.status === 502) {
          alertify.error("Connexion Lost!");
          showAlert("No response from MMM-Bugsounet.");
        } else {
          alertify.error(`[sysInfo] Server return Error ${err.status} (${err.error})`);
          showAlert(`[sysInfo] Server return Error ${err.status} (${err.error})`);
        }
      }
    });
  });
}

function checkSystem () {
  return new Promise((resolve) => {
    Request("/api/system/sysInfo", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "sysInfo", (system) => resolve(system), (err) => {
      if (err.status === 401 || err.status === 403) location.href = "/logout";
      if (Alert === 1) {
        if (!err.status || err.status === 502) {
          alertify.error("Connexion Lost!");
          showAlert("No response from MMM-Bugsounet.");
        } else {
          alertify.error(`[sysInfo] Server return Error ${err.status} (${err.error})`);
          showAlert(`[sysInfo] Server return Error ${err.status} (${err.error})`);
        }
      }
    });
  });
}

function checkEXTStatus () {
  return new Promise((resolve) => {
    Request("/api/EXT/status", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "status", (Status) => resolve(Status), (err) => {
      if (err.status === 401 || err.status === 403) location.href = "/logout";
      if (Alert === 1) {
        if (!err.status || err.status === 502) {
          alertify.error("Connexion Lost!");
          showAlert("No response from MMM-Bugsounet.");
        } else {
          alertify.error(`[status] Server return Error ${err.status} (${err.error})`);
          showAlert(`[status] Server return Error ${err.status} (${err.error})`);
        }
      }
    });
  });
}

function loadLoginTranslation () {
  return new Promise((resolve) => {
    Request("/api/translations/login", "GET", null, null, "loginTranslation", (tr) => resolve(tr), null);
  });
}

function loadTranslation () {
  return new Promise((resolve) => {
    Request("/api/translations/common", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadTranslation", (tr) => resolve(tr), null);
  });
}

function loadDataAllEXT () {
  return new Promise((resolve) => {
    Request("/api/EXT", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadDataAllEXT", (all) => resolve(all), null);
  });
}

function loadDataConfiguredEXT () {
  return new Promise((resolve) => {
    Request("/api/EXT/configured", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadDataConfiguredEXT", (confEXT) => resolve(confEXT), null);
  });
}

function loadDataInstalledEXT () {
  return new Promise((resolve) => {
    Request("/api/EXT/installed", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadDataInstalledEXT", (instEXT) => resolve(instEXT), null);
  });
}

function loadDataDescriptionEXT () {
  return new Promise((resolve) => {
    Request("/api/EXT/descriptions", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadDataDescriptionEXT", (desEXT) => resolve(desEXT), null);
  });
}

function loadMMConfig () {
  return new Promise((resolve) => {
    Request("/api/config/MM", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadMMConfig", (response) => {
      try {
        let parse = atob(response.config);
        let config = JSON.parse(parse);
        resolve(config);
      } catch {
        alertify.error("[loadMMConfig] Error on decode server response");
        Alert = 0;
      }
    }, null);
  });
}

function getEXTVersions () {
  return new Promise((resolve) => {
    Request("/api/EXT/versions", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "getEXTVersions", (EXTs) => resolve(EXTs), null);
  });
}

function loadBackupNames () {
  return new Promise((resolve) => {
    Request("/api/backups", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadBackupNames", (backups) => resolve(backups), null);
  });
}

function deleteBackups (success, error) {
  return new Promise((resolve) => {
    Request("/api/backups", "DELETE", { Authorization: `Bearer ${getCurrentToken()}` }, null, "backup-Delete", () => {
      if (success) success();
      resolve();
    }, (err) => {
      if (error) error(err);
      resolve();
    });
  });
}

function loadRadio () {
  return new Promise((resolve) => {
    Request("/api/EXT/RadioPlayer", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadRadio", (radio) => resolve(radio), null);
  });
}

function loadFreeboxTV () {
  return new Promise((resolve) => {
    Request("/api/EXT/FreeboxTV", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadFreeboxTV", (radio) => resolve(radio), null);
  });
}

function loadBackupConfig (file) {
  return new Promise((resolve) => {
    Request("/api/backups/file", "GET", { Authorization: `Bearer ${getCurrentToken()}`, backup: file }, null, "loadBackupConfig", (response) => {
      try {
        let parse = atob(response.config);
        let backup = JSON.parse(parse);
        resolve(backup);
      } catch {
        alertify.error("[loadBackupConfig] Error on decode server response");
        Alert = 0;
      }
    }, null);
  });
}

function doAssistantQuery(send) {
  return new Promise((resolve) => {
    Request("/api/EXT/Assistant/send", "POST", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ send: send }), "GoogleAssistant", () => {
      if (success) success();
      resolve();
    }, null);
  });
}

async function Request (url, type, header, data, from, success, fail) {
  // console.log(url, type, header, data, from, success, fail)
  var headers = {
    "Content-Type": "application/json"
  };

  if (header) {
    headers = Object.assign(headers, header);
  }

  var response;
  var result = {};

  try {
    response = await fetch(url, {
      method: type,
      headers: headers,
      body: data
    });
  } catch {
    Alert++;
    if (Alert === 1) alertify.error("Connexion Lost!");
    showAlert("No response from MMM-Bugsounet");
    return;
  }

  if (response.ok && response.status < 400) {
    result = await response.json();
    if (success) success(result);
    if (Alert) hideAlert();
    Alert = 0;
  } else {
    Alert++;
    try {
      result = await response.json();
    } catch {
      result.error = response.statusText;
    }

    result.status = response.status;

    if (fail) fail(result);
    else {
      if (result.status === 401 || response.status === 403) location.href = "/logout";
      if (result.status === 502) {
        showAlert("No response from MMM-Bugsounet");
      } else {
        showAlert(`[${from}] Server return Error ${response.status}: ${result.error}`);
      }
      if (Alert === 1) alertify.error(`[${from}] Server return Error ${response.status}: ${result.error}`);
    }
  }
}

function hasPluginConnected (obj, key, value) {
  if (typeof obj === "object" && obj !== null) {
    if (obj.hasOwnProperty(key)) return true;
    for (var p in obj) {
      if (obj.hasOwnProperty(p) && this.hasPluginConnected(obj[p], key, value)) {
        //logGW("check", key+":"+value, "in", p)
        if (obj[p][key] === value) {
          //logGW(p, "is connected")
          return true;
        }
      }
    }
  }
  return false;
}

function processSelectedFiles (fileInput) {
  let files = fileInput.files;
  let file = files[0].name;
  let backup = document.getElementById("backup");
  let option = document.createElement("option");
  option.value = "default";
  option.text = file;
  option.selected = true;
  backup.appendChild(option);
}

/** config merge **/
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

function forceMobileRotate () {
  var Options = {
    forcePortrait: false,
    message: translation.Rotate_Msg,
    subMessage: translation.Rotate_Continue,
    allowClickBypass: true,
    onlyMobile: true
  };
  PleaseRotate.start(Options);
}

function setTranslation (id, content) {
  try {
    document.getElementById(id).textContent = content;
  } catch (e) {
    console.error(`id: ${id}`, `content: ${content}`);
    console.error(e);
  }
}

function showAlert (Text) {
  const messageText = document.getElementById("messageText");
  if (messageText) {
    document.getElementById("alert").classList.remove("alert-success");
    document.getElementById("alert").classList.add("alert-danger");
    messageText.textContent = Text;
    document.getElementById("alert").classList.remove("invisible");
  }
}

function hideAlert () {
  const messageText = document.getElementById("messageText");
  if (messageText) {
    document.getElementById("alert").classList.add("invisible");
    document.getElementById("alert").classList.add("alert-success");
    document.getElementById("alert").classList.remove("alert-danger");
  }
}

function HideBlock (id) {
  const Block = document.getElementById(id);
  if (Block) {
    Block.classList.add("d-none");
  }
}

function ShowBlock (id) {
  const Block = document.getElementById(id);
  if (Block) {
    Block.classList.remove("d-none");
  }
}
