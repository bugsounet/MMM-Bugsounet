/** Tools
* @bugsounet
**/

/* global $, setTranslation, alertify, getCurrentToken, getVersion, loadRadio, loadTranslation, doTranslateNavBar, checkEXTStatus, loadBackupNames, forceMobileRotate */

// rotate rules
/* eslint-disable-next-line */
var PleaseRotateOptions = {
  startOnPageLoad: false
};

// define all vars
var translation = {};
var version = {};
var EXTStatus = {};

// Load rules
window.addEventListener("load", async () => {
  version = await getVersion();
  translation = await loadTranslation();

  forceMobileRotate();
  doTools();

  doTranslateNavBar();
});

async function doTools () {
  // translate
  document.title = translation.Tools;
  EXTStatus = await checkEXTStatus();

  // live stream every secs of EXT for update
  setInterval(async () => {
    EXTStatus = await checkEXTStatus();
    updateTools();
  }, 1000);

  setTranslation("title", translation.Tools_Welcome);
  setTranslation("subtitle", translation.Tools_subTitle);
  setTranslation("stop", translation.Tools_Die);
  setTranslation("restart", translation.Tools_Restart);
  setTranslation("Die", translation.Confirm);
  setTranslation("Restart", translation.Confirm);

  // backups
  var allBackup = await loadBackupNames();
  if (allBackup.length > 5) {
    setTranslation("backupFound", allBackup.length);
    setTranslation("backupFoundText", translation.Tools_Backup_Found);
    setTranslation("backupText", translation.Tools_Backup_Text);
    setTranslation("backup-Delete", translation.Delete);
    setTranslation("backup-Error", translation.Error);
    setTranslation("backup-Done", translation.Done);
    document.getElementById("backup-Box").style.display = "block";

    document.getElementById("backup-Delete").onclick = function () {
      Request("/api/backups", "DELETE", { Authorization: `Bearer ${getCurrentToken()}` }, null, "backup-Delete", () => {
        document.getElementById("backup-Delete").style.display = "none";
        document.getElementById("backup-Done").style.display = "inline-block";
        alertify.success(translation.Tools_Backup_Deleted);
      }, (err) => {
        document.getElementById("backup-Delete").style.display = "none";
        document.getElementById("backup-Error").style.display = "inline-block";
        let error = err.error;
        if (!err.status) alertify.error("Connexion Lost!");
        else alertify.error(`[backup-Delete] Server return Error ${err.status} (${error})`);
      });
    };

    document.getElementById("backup-Done").onclick = function () {
      document.getElementById("backup-Box").style.display = "none";
    };
  }

  // screen control
  if (EXTStatus["EXT-Screen"].hello) {
    if (EXTStatus["EXT-Screen"].power) setTranslation("Screen-Control", translation.TurnOff);
    else setTranslation("Screen-Control", translation.TurnOn);
    setTranslation("Screen-Text", translation.Tools_Screen_Text);
    document.getElementById("Screen-Box").style.display = "block";

    document.getElementById("Screen-Control").onclick = function () {
      let powerControler = EXTStatus["EXT-Screen"].power ? "OFF" : "ON";
      Request("/api/EXT/Screen", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ power: powerControler }), "Screen", () => {
        alertify.success(translation.RequestDone);
      }, null);
    };
  }

  // Bugsounet-Alert query
  document.getElementById("Alert-Query").setAttribute("placeholder", translation.Tools_Alert_Query);
  setTranslation("Alert-Text", translation.Tools_Alert_Text);
  setTranslation("Alert-Send", translation.Send);
  document.getElementById("Alert-Box").style.display = "block";
  document.getElementById("Alert-Query").addEventListener("keyup", function () {
    if (this.value.length > 5) {
      document.getElementById("Alert-Send").classList.remove("disabled");
    } else {
      document.getElementById("Alert-Send").classList.add("disabled");
    }
  });

  document.getElementById("Alert-Send").onclick = function () {
    document.getElementById("Alert-Send").classList.add("disabled");
    Request("/api/system/alert", "POST", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ alert: document.getElementById("Alert-Query").value }), "Alert", () => {
      alertify.success(translation.RequestDone);
    }, null);
  };

  // Volume control
  if (EXTStatus["EXT-Volume"].hello) {
    setTranslation("Volume-Text", translation.Tools_Volume_Text);
    setTranslation("Volume-Text2", translation.Tools_Volume_Text2);
    setTranslation("Volume-Text3", translation.Tools_Volume_Text3);
    setTranslation("Volume-Send", translation.Confirm);
    document.getElementById("Volume-Box").style.display = "block";

    document.getElementById("Volume-Send").onclick = function () {
      Request("/api/EXT/Volume/speaker", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ volume: Number(document.getElementById("Volume-Query").value) }), "Volume", () => {
        alertify.success(translation.RequestDone);
      }, null);
    };

    // mic control
    setTranslation("Volume-Text-Record", translation.Tools_Volume_Text_Record);
    setTranslation("Volume-Text-Record2", translation.Tools_Volume_Text2);
    setTranslation("Volume-Text-Record3", translation.Tools_Volume_Text3);
    setTranslation("Volume-Send-Record", translation.Confirm);
    document.getElementById("Volume-Box-Record").style.display = "block";

    document.getElementById("Volume-Send-Record").onclick = function () {
      Request("/api/EXT/Volume/recorder", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ volume: Number(document.getElementById("Volume-Query-Record").value) }), "Volume", () => {
        alertify.success(translation.RequestDone);
      }, null);
    };
  }

  // Update Control
  if (EXTStatus["EXT-Updates"].hello) {
    setTranslation("Update-Header", translation.Tools_Update_Header);
    setTranslation("Update-Text", translation.Tools_Update_Text);
    setTranslation("Update-Text2", translation.Tools_Update_Text2);
    document.getElementById("Update-Confirm").onclick = function () {
      document.getElementById("Update-Confirm").classList.add("disabled");
      Request("/api/EXT/Updates", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, null, "Updates", () => {
        alertify.success(translation.RequestDone);
      }, null);
    };
  }

  // Spotify Control
  if (EXTStatus["EXT-Spotify"].hello) {
    var type = "track";
    setTranslation("Spotify-Text", translation.Tools_Spotify_Text);
    setTranslation("Spotify-Text2", translation.Tools_Spotify_Text2);
    setTranslation("Spotify-Send", translation.Send);
    setTranslation("Spotify-Artist-Text", translation.Tools_Spotify_Artist);
    setTranslation("Spotify-Track-Text", translation.Tools_Spotify_Track);
    setTranslation("Spotify-Album-Text", translation.Tools_Spotify_Album);
    setTranslation("Spotify-Playlist-Text", translation.Tools_Spotify_Playlist);
    document.getElementById("Spotify-Query").setAttribute("placeholder", translation.Tools_Spotify_Query);
    setTranslation("Spotify-Send", translation.Send);
    document.getElementById("Spotify-Box").style.display = "block";
    document.getElementById("Spotify-Query").addEventListener("keyup", function () {
      if (this.value.length > 1 && type) {
        document.getElementById("Spotify-Send").classList.remove("disabled");
      } else {
        document.getElementById("Spotify-Send").classList.add("disabled");
      }
    });

    document.getElementById("Spotify-Send").onclick = function () {
      document.getElementById("Spotify-Send").classList.add("disabled");
      Request("/api/EXT/Spotify", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ query: document.getElementById("Spotify-Query").value, type: type }), "Spotify", () => {
        alertify.success(translation.RequestDone);
      }, null);
    };

    document.getElementById("Spotify-Play").onclick = function () {
      Request("/api/EXT/Spotify/play", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, null, "Spotify", () => {
        alertify.success(translation.RequestDone);
      }, null);
    };

    document.getElementById("Spotify-Stop").onclick = function () {
      Request("/api/EXT/Spotify/stop", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, null, "Spotify", () => {
        alertify.success(translation.RequestDone);
      }, null);
    };

    document.getElementById("Spotify-Next").onclick = function () {
      Request("/api/EXT/Spotify/next", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, null, "Spotify", () => {
        alertify.success(translation.RequestDone);
      }, null);
    };

    document.getElementById("Spotify-Previous").onclick = function () {
      Request("/api/EXT/Spotify/previous", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, null, "Spotify", () => {
        alertify.success(translation.RequestDone);
      }, null);
    };

    document.getElementById("Spotify-Artist").onclick = function () {
      if (!this.checked) {
        type = null;
        document.getElementById("Spotify-Send").classList.add("disabled");
        return;
      }
      type = "artist";
      document.getElementById("Spotify-Track").checked = !this.checked;
      document.getElementById("Spotify-Album").checked = !this.checked;
      document.getElementById("Spotify-Playlist").checked = !this.checked;
      if (document.getElementById("Spotify-Query").value.length > 1) {
        document.getElementById("Spotify-Send").classList.remove("disabled");
      } else {
        document.getElementById("Spotify-Send").classList.add("disabled");
      }
    };

    document.getElementById("Spotify-Track").onclick = function () {
      if (!this.checked) {
        type = null;
        document.getElementById("Spotify-Send").classList.add("disabled");
        return;
      }
      type = "track";
      document.getElementById("Spotify-Artist").checked = !this.checked;
      document.getElementById("Spotify-Album").checked = !this.checked;
      document.getElementById("Spotify-Playlist").checked = !this.checked;
      if (document.getElementById("Spotify-Query").value.length > 1) {
        document.getElementById("Spotify-Send").classList.remove("disabled");
      } else {
        document.getElementById("Spotify-Send").classList.add("disabled");
      }
    };

    document.getElementById("Spotify-Album").onclick = function () {
      if (!this.checked) {
        type = null;
        document.getElementById("Spotify-Send").classList.add("disabled");
        return;
      }
      type = "album";
      document.getElementById("Spotify-Artist").checked = !this.checked;
      document.getElementById("Spotify-Track").checked = !this.checked;
      document.getElementById("Spotify-Playlist").checked = !this.checked;
      if (document.getElementById("Spotify-Query").value.length > 1) {
        document.getElementById("Spotify-Send").classList.remove("disabled");
      } else {
        document.getElementById("Spotify-Send").classList.add("disabled");
      }
    };

    document.getElementById("Spotify-Playlist").onclick = function () {
      if (!this.checked) {
        type = null;
        document.getElementById("Spotify-Send").classList.add("disabled");
        return;
      }
      type = "playlist";
      document.getElementById("Spotify-Artist").checked = !this.checked;
      document.getElementById("Spotify-Track").checked = !this.checked;
      document.getElementById("Spotify-Album").checked = !this.checked;
      if (document.getElementById("Spotify-Query").value.length > 1) {
        document.getElementById("Spotify-Send").classList.remove("disabled");
      } else {
        document.getElementById("Spotify-Send").classList.add("disabled");
      }
    };
  }

  // RadioPlayer query
  if (EXTStatus["EXT-RadioPlayer"].hello) {
    setTranslation("Radio-Text", translation.Tools_Radio_Text);
    setTranslation("Radio-Send", translation.Listen);
    var radio = await loadRadio();
    if (radio.length) {
      radio.forEach((station) => {
        let option = document.createElement("option");
        option.value = station;
        option.text = station;
        document.getElementById("Radio-Query").appendChild(option);
      });
    }
    else {
      document.getElementById("Radio-Query").style.display = "none";
      setTranslation("Radio-Text2", translation.Tools_Radio_Text2);
      document.getElementById("Radio-Text2").style.display = "block";
      document.getElementById("Radio-Send").classList.add("disabled");
    }
    document.getElementById("Radio-Box").style.display = "block";
    document.getElementById("Radio-Send").onclick = function () {
      Request("/api/EXT/RadioPlayer", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ radio: document.getElementById("Radio-Query").value }), "RadioPlayer", () => {
        alertify.success(translation.RequestDone);
      }, null);
    };
  }

  // FreeboxTV query
  if (EXTStatus["EXT-FreeboxTV"].hello && version.lang === "fr") {
    document.getElementById("FreeboxTV-Box").style.display = "block";
    document.getElementById("FreeboxTV-Send").onclick = function () {
      Request("/api/EXT/FreeboxTV", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ TV: document.getElementById("FreeboxTV-Query").value }), "FreeboxTV", () => {
        alertify.success(translation.RequestDone);
      }, null);
    };
  }

  // Stop Command
  setTranslation("Stop-Text", translation.Tools_Stop_Text);
  setTranslation("Stop-Send", translation.Send);
  document.getElementById("Stop-Send").onclick = function () {
    Request("/api/EXT/stop", "POST", { Authorization: `Bearer ${getCurrentToken()}` }, null, "STOP", () => {
      alertify.success(translation.RequestDone);
    }, null);
  };
}

function updateTools () {
  if (EXTStatus["EXT-Screen"].hello) {
    if (EXTStatus["EXT-Screen"].power) setTranslation("Screen-Control", translation.TurnOff);
    else setTranslation("Screen-Control", translation.TurnOn);
  }

  if (EXTStatus["EXT-Volume"].hello) {
    setTranslation("Volume-Set", `${EXTStatus["EXT-Volume"].speaker}%`);
    setTranslation("Volume-Set-Record", `${EXTStatus["EXT-Volume"].recorder}%`);
  }

  if (EXTStatus["EXT-Updates"].hello) {
    let needUpdate = 0;
    setTranslation("Update-Confirm", translation.Confirm);
    var updateModules = EXTStatus["EXT-Updates"].module;
    if (!updateModules) return document.getElementById("Update-Box").style.display = "none";
    if (!Object.keys(updateModules).length) return document.getElementById("Update-Box").style.display = "none";
    if (Object.keys(updateModules).length) {
      document.getElementById("Update-Box").style.display = "block";
      for (const [key] of Object.entries(updateModules)) {
        if ($(`#${key}`).length === 0) $("#Update-Modules-Box").append(`<br><span id='${key}'>${key}</span>`);
        if (key.startsWith("EXT-") || key === "MMM-Bugsounet") ++needUpdate;
      }
      document.getElementById("Update-Modules-Box").style.display = "block";
    }
    if (!needUpdate) document.getElementById("Update-Confirm").classList.add("disabled");
    else document.getElementById("Update-Confirm").classList.remove("disabled");
  }

  if (this.hasPluginConnected(EXTStatus, "connected", true)) {
    document.getElementById("Stop-Box").style.display = "block";
  }
  else document.getElementById("Stop-Box").style.display = "none";

  if (EXTStatus["EXT-Spotify"].hello) {
    if (EXTStatus["EXT-Spotify"].connected || EXTStatus["EXT-Spotify"].play) {
      document.getElementById("Spotify-Play").style.display = "none";
      document.getElementById("Spotify-Stop").style.display = "block";
    } else {
      document.getElementById("Spotify-Play").style.display = "block";
      document.getElementById("Spotify-Stop").style.display = "none";
    }
  }
}
