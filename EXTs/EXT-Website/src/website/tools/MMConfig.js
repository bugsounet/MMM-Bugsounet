/** MMConfig
* @bugsounet
**/

/* global setTranslation, loadTranslation, forceMobileRotate, doTranslateNavBar, loadMMConfig, JSONEditor, loadBackupNames, loadBackupConfig, getCurrentToken, alertify, FileReaderJS, saveAs */

// rotate rules
/* eslint-disable-next-line */
var PleaseRotateOptions = {
  startOnPageLoad: false
};

// define all vars
var translation = {};

// Load rules
window.addEventListener("load", async () => {
  translation = await loadTranslation();

  forceMobileRotate();
  switch (window.location.pathname) {
    case "/MMConfig":
      viewJSEditor();
      break;
    case "/EditMMConfig":
      EditMMConfigJSEditor();
      break;
  }

  doTranslateNavBar();
});

//make viewJSEditor
async function viewJSEditor () {
  document.title = translation.Configuration;
  setTranslation("MMConfigHeader", translation.Configuration_Welcome);
  setTranslation("EditLoadButton", translation.Configuration_EditLoad);
  var modules = await loadMMConfig();
  const container = document.getElementById("jsoneditor");

  const options = {
    mode: "code",
    mainMenuBar: false,
    onEditable (node) {
      if (!node.path) {
        // In modes code and text, node is empty: no path, field, or value
        // returning false makes the text area read-only
        return false;
      }
    }
  };
  new JSONEditor(container, options, modules);
}

async function EditMMConfigJSEditor () {
  document.title = translation.Configuration;
  setTranslation("MMConfigHeader", translation.Configuration_Edit_Title);
  setTranslation("wait", translation.Wait);
  setTranslation("done", translation.Done);
  setTranslation("error", translation.Error);
  setTranslation("errorConfig", translation.Error);
  setTranslation("save", translation.Save);
  setTranslation("load", translation.Load);
  document.getElementById("wait").style.display = "none";
  document.getElementById("done").style.display = "none";
  document.getElementById("error").style.display = "none";
  document.getElementById("errorConfig").style.display = "none";
  document.getElementById("load").style.display = "none";
  document.getElementById("save").style.display = "none";
  document.getElementById("buttonGrp").classList.remove("invisible");
  let ActualConfig = document.querySelectorAll("option")[0];
  ActualConfig.textContent = translation.Configuration_Edit_AcualConfig;
  var allBackup = await loadBackupNames();
  var config = {};
  var conf = null;
  var options = {
    mode: "code",
    mainMenuBar: false,
    onValidationError: (errors) => {
      if (errors.length) {
        document.getElementById("save").style.display = "none";
        document.getElementById("externalSave").classList.add("disabled");
        document.getElementById("errorConfig").style.display = "block";
      }
      else {
        document.getElementById("errorConfig").style.display = "none";
        document.getElementById("save").style.display = "block";
        document.getElementById("externalSave").classList.remove("disabled");
      }
    }
  };

  if (window.location.search) {
    /* eslint-disable no-useless-escape */
    conf = decodeURIComponent(window.location.search.match(/(\?|&)config\=([^&]*)/)[2]);
    /* eslint-enable no-useless-escape */
    if (conf === "default") config = await loadMMConfig();
    else {
      options = {
        mode: "code",
        mainMenuBar: false,
        onEditable (node) {
          if (!node.path) {
            // In modes code and text, node is empty: no path, field, or value
            // returning false makes the text area read-only
            return false;
          }
        }
      };
      config = await loadBackupConfig(conf);
      document.getElementById("load").style.display = "block";
    }
  } else {
    conf = "default";
    config = await loadMMConfig();
  }

  const backup = document.getElementById("backup");

  allBackup.forEach((filename, i) => {
    let option = document.createElement("option");
    option.value = filename;
    option.text = filename;
    backup.appendChild(option);
    if (filename === conf) backup.selectedIndex = i + 1;
  });

  const container = document.getElementById("jsoneditor");
  const editor = new JSONEditor(container, options, config);
  document.getElementById("load").onclick = function () {
    document.getElementById("load").style.display = "none";
    document.getElementById("wait").style.display = "block";

    Request("/api/backups/file", "PUT", { Authorization: `Bearer ${getCurrentToken()}`, backup: conf }, null, "loadBackup", () => {
      document.getElementById("wait").style.display = "none";
      document.getElementById("done").style.display = "block";
      document.getElementById("alert").classList.remove("invisible");
      setTranslation("messageText", translation.Restart);
    }, (err) => {
      document.getElementById("wait").style.display = "none";
      document.getElementById("error").style.display = "block";
      document.getElementById("alert").classList.remove("invisible");
      document.getElementById("alert").classList.remove("alert-success");
      document.getElementById("alert").classList.add("alert-danger");
      let error = err.error;
      if (!err.status) {
        setTranslation("messageText", err);
        alertify.error("Connexion Lost!");
      } else {
        setTranslation("messageText", err.statusText);
        alertify.error(`[loadBackup] Server return Error ${err.status} (${error})`);
      }
    });
  };
  document.getElementById("save").onclick = function () {
    let data = editor.getText();
    document.getElementById("save").style.display = "none";
    document.getElementById("wait").style.display = "block";
    let encode = btoa(data);

    Request("api/config/MM", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ config: encode }), "writeConfig", () => {
      document.getElementById("wait").style.display = "none";
      document.getElementById("done").style.display = "block";
      document.getElementById("alert").classList.remove("invisible");
      setTranslation("messageText", translation.Restart);
    }, (err) => {
      document.getElementById("wait").style.display = "none";
      document.getElementById("error").style.display = "block";
      document.getElementById("alert").classList.remove("invisible");
      document.getElementById("alert").classList.remove("alert-success");
      document.getElementById("alert").classList.add("alert-danger");
      let error = err.error;
      if (!err.status) {
        setTranslation("messageText", err);
        alertify.error("Connexion Lost!");
      } else {
        setTranslation("messageText", error);
        alertify.error(`[writeConfig] Server return Error ${err.status} (${error})`);
      }
    });
  };
  FileReaderJS.setupInput(document.getElementById("fileToLoad"), {
    readAsDefault: "Text",
    on: {
      load (event) {
        if (event.target.result) {
          let encode = btoa(event.target.result);
          Request("/api/backups/external", "POST", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ config: encode }), "readExternalBackup", (back) => {
            let decode = atob(back.config);
            let config = JSON.parse(decode);
            editor.update(config);
            editor.refresh();
            alertify.success("External Config Loaded !");
          }, null);
        }
      }
    }
  });
  document.getElementById("externalSave").onclick = function () {
    alertify.prompt("MMM-Bugsounet", "Save config file as:", "config", function (evt, value) {
      var fileName = value;
      if (fileName.indexOf(".") === -1) {
        fileName = `${fileName}.js`;
      } else {
        if (fileName.split(".").pop().toLowerCase() === "js") {
          // Nothing to do
        } else {
          fileName = `${fileName.split(".")[0]}.js`;
        }
      }
      var configToSave = editor.getText();
      let encode = btoa(configToSave);
      Request("/api/backups/external", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ config: encode }), "saveExternalBackup", (back) => {
        alertify.success("Download is ready !");
        fetch(back.file)
          .then((response) => response.blob())
          .then((result) => saveAs(result, fileName))
          .catch((e) => {
            console.error("Save Error:", e);
            alertify.error("Save Error!");
          });
      }, null);
    }, function () {
      // do nothing
    });
  };
}
