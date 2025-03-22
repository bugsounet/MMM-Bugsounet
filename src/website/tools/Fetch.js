/** fetch datas **/

/* global $, alertify, translation, PleaseRotate */

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
    Request("/api/version", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "getVersion", (version) => resolve(version), null);
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
    Request("/api/system/sysInfo", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "sysInfo", (system) => resolve(system), null);
  });
}

/* eslint-disable-next-line */
function checkWebviewTag () {
  return new Promise((resolve) => {
    Request("/api/config/webview", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "checkWebviewTag", (tag) => resolve(tag.webview), null);
  });
}

/* eslint-disable-next-line */
function checkEXTStatus () {
  return new Promise((resolve) => {
    Request("/api/EXT/status", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "Status", (Status) => resolve(Status), (err) => {
      let error = err.responseJSON?.error ? err.responseJSON.error : (err.responseText ? err.responseText : err.statusText);
      if (err.status === 403 || err.status === 401) $(location).attr("href", "/");
      if (!err.status) alertify.error("Connexion Lost!");
      else alertify.error(`[Status] Server return Error ${err.status} (${error})`);
    });
  });
}

/* eslint-disable-next-line */
function loadLoginTranslation () {
  return new Promise((resolve) => {
    Request("/api/translations/login", "GET", { Authorization: `Bearer ${getCurrentToken()}` }, null, "loginTranslation", (tr) => resolve(tr), null);
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
function loadPluginConfig (plugin) {
  return new Promise((resolve) => {
    Request("/api/config/default", "GET", { Authorization: `Bearer ${getCurrentToken()}`, ext: plugin }, null, "loadPluginConfig", (response) => {
      try {
        let parse = atob(response.config);
        let config = JSON.parse(parse);
        resolve(config);
      } catch {
        alertify.error("[loadPluginConfig] Error on decode server response");
      }
    }, null);
  });
}

/* eslint-disable-next-line */
function loadPluginTemplate (plugin) {
  return new Promise((resolve) => {
    Request("/api/config/schema", "GET", { Authorization: `Bearer ${getCurrentToken()}`, ext: plugin }, null, "loadPluginTemplate", (response) => {
      try {
        let parse = atob(response.schema);
        let schema = JSON.parse(parse);
        resolve(schema);
      } catch {
        alertify.error("[loadPluginTemplate] Error on decode server response");
      }
    }, null);
  });
}

/* eslint-disable-next-line */
function loadPluginCurrentConfig (plugin) {
  return new Promise((resolve) => {
    Request("/api/config/EXT", "GET", { Authorization: `Bearer ${getCurrentToken()}`, ext: plugin }, null, "loadPluginConfig", (response) => {
      try {
        let parse = atob(response.config);
        let config = JSON.parse(parse);
        resolve(config);
      } catch {
        alertify.error("[loadPluginConfig] Error on decode server response");
      }
    }, null);
  });
}

/* eslint-disable-next-line */
function loadBackupConfig (file) {
  return new Promise((resolve) => {
    Request("/api/backups/file", "GET", { Authorization: `Bearer ${getCurrentToken()}`, backup: file }, null, "loadPluginConfig", (response) => {
      try {
        let parse = atob(response.config);
        let backup = JSON.parse(parse);
        resolve(backup);
      } catch {
        alertify.error("[loadBackupConfig] Error on decode server response");
      }
    }, null);
  });
}

function Request (url, type, header, data, from, success, fail) {
  // console.log(url, type, header, data, from, success, fail)
  var headers = {
    "Content-Type": "application/json"
  };

  if (header) {
    headers = Object.assign(headers, header);
  }

  $.ajax(
    {
      url: url,
      type: type,
      headers,
      dataType: "json",
      data: data,
      success: (response) => {
        if (success) success(response);
      },
      error: (err) => {
        if (fail) return fail(err);
        let error = err.responseJSON?.error ? err.responseJSON.error : (err.responseText ? err.responseText : err.statusText);
        if (!err.status) alertify.error("Connexion Lost!");
        else alertify.error(`[${from}] Server return Error ${err.status} (${error})`);
      }
    }
  );
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

  $("#backup").append($("<option>", {
    value: "default",
    text: file,
    selected: true
  }));
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
  $("#Home").text(translation.Home);
  $("#Plugins").text(translation.Plugins);
  $("#Terminal").text(translation.Terminal);
  $("#Configuration").text(translation.Configuration);
  $("#Tools").text(translation.Tools);
  $("#About").text(translation.About);
  $("#System").text(translation.System);
  $("#Logout").text(translation.Logout);
  if (!Docs) $("#APIDocsItem").hide();

  $("#accordionSidebar").removeClass("invisible");
  $("li.active").removeClass("active");
  var path = location.pathname;

  if (path === "/"
    || path === "/EXT"
    || path === "/Terminal"
    || path === "/MMConfig"
    || path === "/3rdpartymodules"
    || path === "/Tools"
    || path === "/System"
    || path === "/About"
    || path === "/APIDocs"
  ) $(`a[href="${path}"]`).removeAttr("href");

  if (path === "/install"
    || path === "/delete"
    || path === "/EXTModifyConfig"
    || path === "/EXTCreateConfig"
  ) path = "/EXT";
  if (path === "/EditMMConfig") path = "/MMConfig";
  if (path === "/Die" || path === "/Restart") path = "/Tools";
  if (path === "/SystemDie" || path === "/SystemRestart") path = "/System";
  if (path === "/ptyProcess") path = "/Terminal";
  $(`a[href="${path}"]`).closest("a").addClass("active");
}
