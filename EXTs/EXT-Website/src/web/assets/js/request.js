/** fetch datas **/

/* global alertify, Swal */

/* eslint-disable no-unused-vars */

var Alert = 0;
alertify.set("notifier", "position", "bottom-right");

function getCurrentToken () {
  return JSON.parse(localStorage.getItem("MMM-Bugsounet"));
}

function doLogin (credentials, success, failed) {
  Request("/auth", "POST", false, { Authorization: `Basic ${credentials}` }, null, "doLogin", (response) => success(response), (err) => failed(err));
}

function getTranslate (lang, query, values = null) {
  return new Promise((resolve) => {
    Request("/api/translations/translate", "GET", true, { language: lang, translate: query, values: JSON.stringify(values) }, null, "getTranslate", (translate) => resolve(translate.translate));
  });
}

function getTranslateGroup (lang, group) {
  return new Promise((resolve) => {
    Request("/api/translations/group", "GET", true, { language: lang, group: group }, null, "getTranslateGroup", (translate) => resolve(translate.translate));
  });
}

function getMyUser () {
  return new Promise((resolve) => {
    Request("/api/databases/users/me", "GET", true, null, null, "getMyUser", (user) => resolve(user));
  });
}

function putMyUser (body, cb) {
  return new Promise((resolve) => {
    Request("/api/databases/users/me", "PUT", true, null, { me: btoa(JSON.stringify(body)) }, "putMyUser", (result) => {
      if (cb) cb();
      resolve(result);
    });
  });
}

function getLoginPrefs () {
  return new Promise((resolve) => {
    Request("/api/databases/login", "GET", null, null, null, "getLoginPrefs", (result) => resolve(result));
  });
}

function putLoginPrefs (body, cb) {
  return new Promise((resolve) => {
    Request("/api/databases/login", "PUT", true, null, { login: btoa(JSON.stringify(body)) }, "putLoginPrefs", (result) => {
      if (cb) cb();
      resolve(result);
    });
  });
}

function getHomeText (lang) {
  return new Promise((resolve) => {
    Request("/api/translations/homeText", "GET", true, { language: lang }, null, "getHomeText", (text) => resolve(text.homeText));
  });
}

function getVersion () {
  return new Promise((resolve) => {
    Request("/api/version", "GET", true, null, null, "getVersion", (version) => resolve(version));
  });
}

function getAPIDocs () {
  return new Promise((resolve) => {
    Request("/api", "GET", false, null, null, "getAPIDocs", (api) => resolve(api.docs));
  });
}

function doDie () {
  return new Promise((resolve) => {
    Request("/api/system/die", "POST", true, null, null, "doDie", () => resolve());
  });
}

function doRestart () {
  return new Promise((resolve) => {
    Request("/api/system/restart", "POST", true, null, null, "doRestart", () => resolve());
  });
}

function doReboot () {
  return new Promise((resolve) => {
    Request("/api/system/reboot", "POST", true, null, null, "doReboot", () => resolve());
  });
}

function doShutdown () {
  return new Promise((resolve) => {
    Request("/api/system/shutdown", "POST", true, null, null, "doShutdown", () => resolve());
  });
}

function doUpdates (success) {
  return new Promise((resolve) => {
    Request("/api/EXT/Updates", "PUT", true, null, null, "doUpdates", () => {
      if (success) success();
      resolve();
    });
  });
}

function doStop (success) {
  return new Promise((resolve) => {
    Request("/api/EXT/stop", "POST", true, null, null, "doStop", () => {
      if (success) success();
      resolve();
    });
  });
}

function putRadio (radio, success) {
  return new Promise((resolve) => {
    Request("/api/EXT/RadioPlayer", "PUT", true, null, { radio: radio }, "putRadio", () => {
      if (success) success();
      resolve();
    });
  });
}

function putSpeaker (volume, success) {
  return new Promise((resolve) => {
    Request("/api/EXT/Volume/speaker", "PUT", true, null, { volume: volume }, "putSpeaker", () => {
      if (success) success();
      resolve();
    });
  });
}

function putMic (volume, success) {
  return new Promise((resolve) => {
    Request("/api/EXT/Volume/recorder", "PUT", true, null, { volume: volume }, "putMic", () => {
      if (success) success();
      resolve();
    });
  });
}

function putTV (channel, success) {
  return new Promise((resolve) => {
    Request("/api/EXT/FreeboxTV", "PUT", true, null, { TV: channel }, "putTV", () => {
      if (success) success();
      resolve();
    });
  });
}

function doAlert (alert, success) {
  return new Promise((resolve) => {
    Request("/api/system/alert", "POST", true, null, { alert: alert }, "doAlert", () => {
      if (success) success();
      resolve();
    });
  });
}

function getCurrentSystem () {
  return new Promise((resolve) => {
    Request("/api/system/currentSysInfo", "GET", true, null, null, "getCurrentSystem", (system) => resolve(system));
  });
}

function checkSystem () {
  return new Promise((resolve) => {
    Request("/api/system/sysInfo", "GET", true, null, null, "checkSystem", (system) => resolve(system));
  });
}

function checkEXTStatus () {
  return new Promise((resolve) => {
    Request("/api/EXT/status", "GET", true, null, null, "checkEXTStatus", (Status) => resolve(Status));
  });
}

function loadLoginTranslation () {
  return new Promise((resolve) => {
    Request("/api/translations/login", "GET", false, null, null, "loadLoginTranslation", (tr) => resolve(tr));
  });
}

function loadTranslation () {
  return new Promise((resolve) => {
    Request("/api/translations/common", "GET", true, null, null, "loadTranslation", (tr) => resolve(tr));
  });
}

function loadDataAllEXT () {
  return new Promise((resolve) => {
    Request("/api/EXT", "GET", true, null, null, "loadDataAllEXT", (all) => resolve(all));
  });
}

function loadDataConfiguredEXT () {
  return new Promise((resolve) => {
    Request("/api/EXT/configured", "GET", true, null, null, "loadDataConfiguredEXT", (confEXT) => resolve(confEXT));
  });
}

function loadDataInstalledEXT () {
  return new Promise((resolve) => {
    Request("/api/EXT/installed", "GET", true, null, null, "loadDataInstalledEXT", (instEXT) => resolve(instEXT));
  });
}

function loadDataDescriptionEXT () {
  return new Promise((resolve) => {
    Request("/api/EXT/descriptions", "GET", true, null, null, "loadDataDescriptionEXT", (desEXT) => resolve(desEXT));
  });
}

function loadMMConfig () {
  return new Promise((resolve) => {
    Request("/api/config/MM", "GET", true, null, null, "loadMMConfig", (response) => {
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
    Request("/api/EXT/versions", "GET", true, null, null, "getEXTVersions", (EXTs) => resolve(EXTs));
  });
}

function loadBackupNames () {
  return new Promise((resolve) => {
    Request("/api/backups", "GET", true, null, null, "loadBackupNames", (backups) => resolve(backups));
  });
}

function deleteBackups (success, error) {
  return new Promise((resolve) => {
    Request("/api/backups", "DELETE", true, null, null, "deleteBackups", () => {
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
    Request("/api/EXT/RadioPlayer", "GET", true, null, null, "loadRadio", (radio) => resolve(radio));
  });
}

function loadFreeboxTV () {
  return new Promise((resolve) => {
    Request("/api/EXT/FreeboxTV", "GET", true, null, null, "loadFreeboxTV", (radio) => resolve(radio));
  });
}

function loadBackupConfig (file) {
  return new Promise((resolve) => {
    Request("/api/backups/file", "GET", true, { backup: file }, null, "loadBackupConfig", (response) => {
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
    Request("/api/EXT/Assistant/send", "POST", true, null, { send: send }, "doAssistantQuery", () => {
      if (success) success();
      resolve();
    });
  });
}

function doYouTubeQuery (search, success) {
  return new Promise((resolve) => {
    Request("/api/EXT/YouTube/search", "POST", true, null, { search: search }, "doYouTubeQuery", () => {
      if (success) success();
      resolve();
    });
  });
}

function doScreenPower (power, success) {
  return new Promise((resolve) => {
    Request("/api/EXT/Screen", "PUT", true, null, { power: power }, "doScreenPower", () => {
      if (success) success();
      resolve();
    });
  });
}

function SpotifySend (search, type, success) {
  return new Promise((resolve) => {
    Request("/api/EXT/Spotify/search", "POST", true, null, { search: search, type: type }, "SpotifySend", () => {
      if (success) success();
      resolve();
    });
  });
}

function SpotifyPlay (success) {
  return new Promise((resolve) => {
    Request("/api/EXT/Spotify/play", "PUT", true, null, null, "SpotifyPlay", () => {
      if (success) success();
      resolve();
    });
  });
}

function SpotifyStop (success) {
  return new Promise((resolve) => {
    Request("/api/EXT/Spotify/stop", "PUT", true, null, null, "SpotifyStop", () => {
      if (success) success();
      resolve();
    });
  });
}

function SpotifyNext (success) {
  return new Promise((resolve) => {
    Request("/api/EXT/Spotify/next", "PUT", true, null, null, "SpotifyNext", () => {
      if (success) success();
      resolve();
    });
  });
}

function SpotifyPrevious (success) {
  return new Promise((resolve) => {
    Request("/api/EXT/Spotify/previous", "PUT", true, null, null, "SpotifyPrevious", () => {
      if (success) success();
      resolve();
    });
  });
}

function loadBackup (backup, success, failed) {
  return new Promise((resolve) => {
    Request("/api/backups/file", "PUT", true, null, { backup: backup }, null, "loadBackup", () => {
      if (success) success();
      resolve();
    }, (err) => {
      if (err) failed(err);
    });
  });
}

function readBackup (config, success) {
  return new Promise((resolve) => {
    Request("/api/backups/external", "POST", true, null, { config: config }, "readBackup", (result) => {
      if (success) success(result);
      resolve();
    });
  });
}

function saveBackup (config, success) {
  return new Promise((resolve) => {
    Request("/api/backups/external", "PUT", true, null, { config: config }, "saveBackup", (result) => {
      if (success) success(result);
      resolve();
    });
  });
}

function writeConfig (config, success, failed) {
  return new Promise((resolve) => {
    Request("/api/config/MM", "PUT", true, null, { config: config }, "writeConfig", () => {
      if (success) success();
      resolve();
    }, (err) => {
      if (err) failed(err);
    });
  });
}

async function Request (url, method = "GET", auth, headerOptions = {}, body, fromFunctionName, callbackSuccess, callbackFailed) {

  var headers = {
    "Content-Type": "application/json"
  };

  if (auth === true) {
    headers.Authorization = `Bearer ${getCurrentToken()}`;
  }

  const config = {
    method: method,
    headers: { ...headers, ...headerOptions },
    body: body ? JSON.stringify(body) : null
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      Alert++;
      const errorBody = await response.json().catch(() => null);
      const error = new Error(`HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.body = errorBody?.error || response.statusText;

      if (callbackFailed) return callbackFailed(error);
      if (response.status === 401 || response.status === 403) location.href = "/logout";
      if (Alert === 1) {
        if (response.status === 500 || response.status === 502) {
          showAlert("No response from MMM-Bugsounet");
        }
        alertify.error(`[${fromFunctionName}] Server return Error ${error.status}: ${error.body}`);
      }
      return;
    }
    const result = await response.json();
    Alert = 0;
    if (callbackSuccess) callbackSuccess(result);
  } catch (error) {
    // EXT-Website Down
    Alert++;
    if (Alert === 1) {
      showAlert("No response from EXT-Website");
      alertify.error(`[${fromFunctionName}] Server return ${error.message}`);
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
  const contentWrapper = document.querySelector(".content-wrapper");
  Swal.fire({
    icon: "error",
    title: "Oops...",
    text: alert,
    confirmButtonText: "Retry",
    showCancelButton: true,
    didOpen: () => {
      contentWrapper.classList.add("blur");
    },
    willClose: () => {
      contentWrapper.classList.remove("blur");
    },
    customClass: {
      confirmButton: "btn btn-primary btn-round me-3",
      cancelButton: "btn btn-dark btn-round"
    },
    allowOutsideClick: false
  }).then((result) => {
    if (result.isConfirmed) {
      location.href = window.location.href;
    } else {
      Alert = 0;
    }
  });
}
