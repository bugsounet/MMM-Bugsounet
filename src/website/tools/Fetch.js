/** fetch datas **/

/* global alertify, translation, PleaseRotate */

var Alert = 0;

function getCurrentToken () {
  return JSON.parse(localStorage.getItem("MMM-Bugsounet"));
}

/* eslint-disable-next-line */
function getHomeText () {
  return new Promise((resolve) => {
    //Request (url, type, headers, data, from, success, fail)
    Request("/api/translations/homeText", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "homeText", (text) => resolve(text.homeText), null);
  });
}

/* eslint-disable-next-line */
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

/* eslint-disable-next-line */
function checkSystem () {
  return new Promise((resolve) => {
    Request("/api/system/sysInfo", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "sysInfo", (system) => resolve(system), (err) => {
      if (err.status === 403 || err.status === 401) location.href = "/login";
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

/* eslint-disable-next-line */
function checkEXTStatus () {
  return new Promise((resolve) => {
    Request("/api/EXT/status", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "status", (Status) => resolve(Status), (err) => {
      if (err.status === 403 || err.status === 401) location.href = "/login";
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

/* eslint-disable-next-line */
function loadLoginTranslation () {
  return new Promise((resolve) => {
    Request("/api/translations/login", "GET", null, null, "loginTranslation", (tr) => resolve(tr), null);
  });
}

/* eslint-disable-next-line */
function loadTranslation () {
  return new Promise((resolve) => {
    Request("/api/translations/common", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadTranslation", (tr) => resolve(tr), null);
  });
}

/* eslint-disable-next-line */
function loadDataAllEXT () {
  return new Promise((resolve) => {
    Request("/api/EXT", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadDataAllEXT", (all) => resolve(all), null);
  });
}

/* eslint-disable-next-line */
function loadDataConfiguredEXT () {
  return new Promise((resolve) => {
    Request("/api/EXT/configured", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadDataConfiguredEXT", (confEXT) => resolve(confEXT), null);
  });
}

/* eslint-disable-next-line */
function loadDataInstalledEXT () {
  return new Promise((resolve) => {
    Request("/api/EXT/installed", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadDataInstalledEXT", (instEXT) => resolve(instEXT), null);
  });
}

/* eslint-disable-next-line */
function loadDataDescriptionEXT () {
  return new Promise((resolve) => {
    Request("/api/EXT/descriptions", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadDataDescriptionEXT", (desEXT) => resolve(desEXT), null);
  });
}

/* eslint-disable-next-line */
function loadMMConfig () {
  return new Promise((resolve) => {
    Request("api/config/MM", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadMMConfig", (response) => {
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

/* eslint-disable-next-line */
function getEXTVersions () {
  return new Promise((resolve) => {
    Request("/api/EXT/versions", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "getEXTVersions", (EXTs) => resolve(EXTs), null);
  });
}

/* eslint-disable-next-line */
function loadBackupNames () {
  return new Promise((resolve) => {
    Request("/api/backups", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadBackupNames", (backups) => resolve(backups), null);
  });
}

/* eslint-disable-next-line */
function loadRadio () {
  return new Promise((resolve) => {
    Request("/api/EXT/RadioPlayer", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadRadio", (radio) => resolve(radio), null);
  });
}

/* eslint-disable-next-line */
function loadFreeboxTV () {
  return new Promise((resolve) => {
    Request("/api/EXT/FreeboxTV", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loadFreeboxTV", (radio) => resolve(radio), null);
  });
}

/* eslint-disable-next-line */
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
      if (result.status === 502) {
        showAlert("No response from MMM-Bugsounet");
      } else {
        showAlert(`[${from}] Server return Error ${response.status}: ${result.error}`);
      }
      if (Alert === 1) alertify.error(`[${from}] Server return Error ${response.status}: ${result.error}`);
    }
  }
}

/* eslint-disable-next-line */
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

/* eslint-disable-next-line */
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
/* eslint-disable-next-line */
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

/* eslint-disable-next-line */
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

/* eslint-disable-next-line */
async function doTranslateNavBar () {
  let Docs = await getAPIDocs();
  setTranslation("Home", translation.Home);
  setTranslation("Terminal", translation.Terminal);
  setTranslation("Configuration", translation.Configuration);
  setTranslation("Tools", translation.Tools);
  setTranslation("About", translation.About);
  setTranslation("System", translation.System);
  setTranslation("Logout", translation.Logout);
  if (!Docs) document.getElementById("APIDocsItem").style.display = "none";

  document.getElementById("accordionSidebar").classList.remove("invisible");

  var path = location.pathname;

  if (path === "/EditMMConfig") path = "/MMConfig";
  if (path === "/Die" || path === "/Restart") path = "/Tools";
  if (path === "/SystemDie" || path === "/SystemRestart") path = "/System";
  if (path === "/ptyProcess") path = "/Terminal";

  const ref = document.querySelectorAll(`[href="${path}"]`);
  if (ref[0]) {
    ref[0].removeAttribute("href");
    ref[0].classList.add("active");
  }
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
