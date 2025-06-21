/** fetch datas **/

/* global alertify, Swal */

/* eslint-disable no-unused-vars */

var Alert = 0;
alertify.set("notifier", "position", "bottom-right");

function getCurrentToken () {
  return JSON.parse(localStorage.getItem("MMM-Bugsounet"));
}

function doLogin (credentials, cb) {
  Request("/auth", "POST", { Authorization: `Basic ${credentials}` }, null, "Login", (response) => {
    localStorage.setItem("MMM-Bugsounet", JSON.stringify(response.session));
    location.href = "/";
  }, (err) => cb(err));
}

function getTranslate (lang, query, values = null) {
  return new Promise((resolve) => {
    Request("/api/translations/translate", "GET", { Authorization: `Bearer ${getCurrentToken()}`, language: lang, translate: query, values: JSON.stringify(values) }, null, "translate", (translate) => resolve(translate.translate));
  });
}

function getTranslateGroup (lang, group) {
  return new Promise((resolve) => {
    Request("/api/translations/group", "GET", { Authorization: `Bearer ${getCurrentToken()}`, language: lang, group: group }, null, "Grouptranslate", (translate) => resolve(translate.translate));
  });
}

function getMyUser () {
  return new Promise((resolve) => {
    Request("/api/me", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "MyUser", (user) => resolve(user));
  });
}

function putMyUser (body, cb) {
  return new Promise((resolve) => {
    Request("/api/me", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ me: btoa(JSON.stringify(body)) }), "MyUser", (result) => {
      if (cb) cb();
      resolve(result);
    });
  });
}

function getHomeText (lang) {
  return new Promise((resolve) => {
    Request("/api/translations/homeText", "GET", { Authorization: `Bearer ${getCurrentToken()}`, language: lang }, null, "homeText", (text) => resolve(text.homeText));
  });
}

function getVersion () {
  return new Promise((resolve) => {
    Request("/api/version", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "version", (version) => resolve(version));
  });
}

function getAPIDocs () {
  return new Promise((resolve) => {
    Request("/api", "GET", null, null, "API", (api) => resolve(api.docs));
  });
}

function doDie () {
  return new Promise((resolve) => {
    Request("/api/system/die", "POST", { Authorization: `Bearer ${getCurrentToken()}` }, null, "Die", () => resolve());
  });
}

function doRestart () {
  return new Promise((resolve) => {
    Request("/api/system/restart", "POST", { Authorization: `Bearer ${getCurrentToken()}` }, null, "Restart", () => resolve());
  });
}

function doReboot () {
  return new Promise((resolve) => {
    Request("/api/system/reboot", "POST", { Authorization: `Bearer ${getCurrentToken()}` }, null, "Reboot", () => resolve());
  });
}

function doShutdown () {
  return new Promise((resolve) => {
    Request("/api/system/shutdown", "POST", { Authorization: `Bearer ${getCurrentToken()}` }, null, "Shutdown", () => resolve());
  });
}

function doUpdates (success) {
  return new Promise((resolve) => {
    Request("/api/EXT/Updates", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, null, "Updates", () => {
      if (success) success();
      resolve();
    });
  });
}

function doStop (success) {
  return new Promise((resolve) => {
    Request("/api/EXT/stop", "POST", { Authorization: `Bearer ${getCurrentToken()}` }, null, "STOP", () => {
      if (success) success();
      resolve();
    });
  });
}

function putRadio (radio, success) {
  return new Promise((resolve) => {
    Request("/api/EXT/RadioPlayer", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ radio: radio }), "RadioPlayer", () => {
      if (success) success();
      resolve();
    });
  });
}

function putSpeaker (volume, success) {
  return new Promise((resolve) => {
    Request("/api/EXT/Volume/speaker", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ volume: volume }), "Volume", () => {
      if (success) success();
      resolve();
    });
  });
}

function putMic (volume, success) {
  return new Promise((resolve) => {
    Request("/api/EXT/Volume/recorder", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ volume: volume }), "Volume", () => {
      if (success) success();
      resolve();
    });
  });
}

function putTV (channel, success) {
  return new Promise((resolve) => {
    Request("/api/EXT/FreeboxTV", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ TV: channel }), "FreeboxTV", () => {
      if (success) success();
      resolve();
    });
  });
}

function doAlert (alert, success) {
  return new Promise((resolve) => {
    Request("/api/system/alert", "POST", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ alert: alert }), "Alert", () => {
      if (success) success();
      resolve();
    });
  });
}

function getCurrentSystem () {
  return new Promise((resolve) => {
    Request("/api/system/currentSysInfo", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "sysInfo", (system) => resolve(system));
  });
}

function checkSystem () {
  return new Promise((resolve) => {
    Request("/api/system/sysInfo", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "sysInfo", (system) => resolve(system));
  });
}

function checkEXTStatus () {
  return new Promise((resolve) => {
    Request("/api/EXT/status", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "status", (Status) => resolve(Status));
  });
}

function loadLoginTranslation () {
  return new Promise((resolve) => {
    Request("/api/translations/login", "GET", null, null, "loginTranslation", (tr) => resolve(tr));
  });
}

function loadTranslation () {
  return new Promise((resolve) => {
    Request("/api/translations/common", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadTranslation", (tr) => resolve(tr));
  });
}

function loadDataAllEXT () {
  return new Promise((resolve) => {
    Request("/api/EXT", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadDataAllEXT", (all) => resolve(all));
  });
}

function loadDataConfiguredEXT () {
  return new Promise((resolve) => {
    Request("/api/EXT/configured", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadDataConfiguredEXT", (confEXT) => resolve(confEXT));
  });
}

function loadDataInstalledEXT () {
  return new Promise((resolve) => {
    Request("/api/EXT/installed", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadDataInstalledEXT", (instEXT) => resolve(instEXT));
  });
}

function loadDataDescriptionEXT () {
  return new Promise((resolve) => {
    Request("/api/EXT/descriptions", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadDataDescriptionEXT", (desEXT) => resolve(desEXT));
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
    });
  });
}

function getEXTVersions () {
  return new Promise((resolve) => {
    Request("/api/EXT/versions", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "getEXTVersions", (EXTs) => resolve(EXTs));
  });
}

function loadBackupNames () {
  return new Promise((resolve) => {
    Request("/api/backups", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadBackupNames", (backups) => resolve(backups));
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
    Request("/api/EXT/RadioPlayer", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadRadio", (radio) => resolve(radio));
  });
}

function loadFreeboxTV () {
  return new Promise((resolve) => {
    Request("/api/EXT/FreeboxTV", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadFreeboxTV", (radio) => resolve(radio));
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
    });
  });
}

function doAssistantQuery (send, success) {
  return new Promise((resolve) => {
    Request("/api/EXT/Assistant/send", "POST", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ send: send }), "GoogleAssistant", () => {
      if (success) success();
      resolve();
    });
  });
}

function doScreenPower (power, success) {
  return new Promise((resolve) => {
    Request("/api/EXT/Screen", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ power: power }), "Screen", () => {
      if (success) success();
      resolve();
    });
  });
}

function SpotifySend (send, type, success) {
  return new Promise((resolve) => {
    Request("/api/EXT/Spotify", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ query: send, type: type }), "Spotify", () => {
      if (success) success();
      resolve();
    });
  });
}

function SpotifyPlay (success) {
  return new Promise((resolve) => {
    Request("/api/EXT/Spotify/play", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, null, "Spotify", () => {
      if (success) success();
      resolve();
    });
  });
}

function SpotifyStop (success) {
  return new Promise((resolve) => {
    Request("/api/EXT/Spotify/stop", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, null, "Spotify", () => {
      if (success) success();
      resolve();
    });
  });
}

function SpotifyNext (success) {
  return new Promise((resolve) => {
    Request("/api/EXT/Spotify/next", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, null, "Spotify", () => {
      if (success) success();
      resolve();
    });
  });
}

function SpotifyPrevious (success) {
  return new Promise((resolve) => {
    Request("/api/EXT/Spotify/previous", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, null, "Spotify", () => {
      if (success) success();
      resolve();
    });
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
    if (Alert === 1) {
      alertify.error("Connexion Lost!");
      showAlert("No response from EXT-Website");
    }
    return;
  }

  if (response.ok && response.status < 400) {
    result = await response.json();
    if (success) success(result);
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
      if (Alert === 1) {
        if (result.status === 502 || response.status === 500) {
          showAlert("No response from MMM-Bugsounet");
        }
        alertify.error(`[${from}] Server return Error ${response.status}: ${result.error}`);
      }
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

function setTranslation (id, content) {
  try {
    document.getElementById(id).textContent = content;
  } catch (e) {
    console.error(`id: ${id}`, `content: ${content}`);
    console.error(e);
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

function showAlert (alert) {
  Swal.fire({
    icon: "error",
    title: "Oops...",
    text: alert,
    confirmButtonText: "Retry",
    showCancelButton: true
  }).then((result) => {
    if (result.isConfirmed) {
      location.href = window.location.href;
    } else {
      Alert = 0;
    }
  });
}
