/** Tools
* @bugsounet
**/

/* global $, alertify, getCurrentToken, getVersion, loadRadio, loadTranslation, doTranslateNavBar, checkEXTStatus, loadBackupNames, forceMobileRotate */

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
  $(document).prop("title", translation.Tools);
  EXTStatus = await checkEXTStatus();

  // live stream every secs of EXT for update
  setInterval(async () => {
    EXTStatus = await checkEXTStatus();
    updateTools();
  }, 1000);

  $("#title").text(translation.Tools_Welcome);
  $("#subtitle").text(translation.Tools_subTitle);
  $("#stop").text(translation.Tools_Die);
  $("#restart").text(translation.Tools_Restart);
  $("#Die").text(translation.Confirm);
  $("#Restart").text(translation.Confirm);

  // backups
  var allBackup = await loadBackupNames();
  if (allBackup.length > 5) {
    $("#backupFound").text(allBackup.length);
    $("#backupFoundText").text(translation.Tools_Backup_Found);
    $("#backupText").text(translation.Tools_Backup_Text);
    $("#backup-Delete").text(translation.Delete);
    $("#backup-Error").text(translation.Error);
    $("#backup-Done").text(translation.Done);
    $("#backup-Box").css("display", "block");

    document.getElementById("backup-Delete").onclick = function () {
      Request("/api/backups", "DELETE", { Authorization: `Bearer ${getCurrentToken()}` }, null, "backup-Delete", () => {
        $("#backup-Delete").css("display", "none");
        $("#backup-Done").css("display", "inline-block");
        alertify.success(translation.Tools_Backup_Deleted);
      }, (err) => {
        $("#backup-Delete").css("display", "none");
        $("#backup-Error").css("display", "inline-block");
        let error = err.responseJSON?.error ? err.responseJSON.error : (err.responseText ? err.responseText : err.statusText);
        if (!err.status) alertify.error("Connexion Lost!");
        else alertify.error(`[backup-Delete] Server return Error ${err.status} (${error})`);
      });
    };

    document.getElementById("backup-Done").onclick = function () {
      $("#backup-Box").css("display", "none");
    };
  }

  // screen control
  if (EXTStatus["EXT-Screen"].hello) {
    if (EXTStatus["EXT-Screen"].power) $("#Screen-Control").text(translation.TurnOff);
    else $("#Screen-Control").text(translation.TurnOn);
    $("#Screen-Text").text(translation.Tools_Screen_Text);
    $("#Screen-Box").css("display", "block");

    document.getElementById("Screen-Control").onclick = function () {
      let powerControler = EXTStatus["EXT-Screen"].power ? "OFF" : "ON";
      Request("/api/EXT/Screen", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ power: powerControler }), "Screen", () => {
        alertify.success(translation.RequestDone);
      }, null);
    };
  }

  // Bugsounet-Alert query
  $("#Alert-Query").prop("placeholder", translation.Tools_Alert_Query);
  $("#Alert-Text").text(translation.Tools_Alert_Text);
  $("#Alert-Send").text(translation.Send);
  $("#Alert-Box").css("display", "block");
  $("#Alert-Query").keyup(function () {
    if ($(this).val().length > 5) {
      $("#Alert-Send").removeClass("disabled");
    } else {
      $("#Alert-Send").addClass("disabled");
    }
  });

  document.getElementById("Alert-Send").onclick = function () {
    $("#Alert-Send").addClass("disabled");
    Request("/api/system/alert", "POST", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ alert: $("#Alert-Query").val() }), "Alert", () => {
      alertify.success(translation.RequestDone);
    }, null);
  };

  // Volume control
  if (EXTStatus["EXT-Volume"].hello) {
    $("#Volume-Text").text(translation.Tools_Volume_Text);
    $("#Volume-Text2").text(translation.Tools_Volume_Text2);
    $("#Volume-Text3").text(translation.Tools_Volume_Text3);
    $("#Volume-Send").text(translation.Confirm);
    $("#Volume-Box").css("display", "block");

    document.getElementById("Volume-Send").onclick = function () {
      Request("/api/EXT/Volume/speaker", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ volume: Number($("#Volume-Query").val()) }), "Volume", () => {
        alertify.success(translation.RequestDone);
      }, null);
    };

    // mic control
    $("#Volume-Text-Record").text(translation.Tools_Volume_Text_Record);
    $("#Volume-Text-Record2").text(translation.Tools_Volume_Text2);
    $("#Volume-Text-Record3").text(translation.Tools_Volume_Text3);
    $("#Volume-Send-Record").text(translation.Confirm);
    $("#Volume-Box-Record").css("display", "block");

    document.getElementById("Volume-Send-Record").onclick = function () {
      Request("/api/EXT/Volume/recorder", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ volume: Number($("#Volume-Query-Record").val()) }), "Volume", () => {
        alertify.success(translation.RequestDone);
      }, null);
    };
  }

  // Update Control
  if (EXTStatus["EXT-Updates"].hello) {
    $("#Update-Header").text(translation.Tools_Update_Header);
    $("#Update-Text").text(translation.Tools_Update_Text);
    $("#Update-Text2").text(translation.Tools_Update_Text2);
    document.getElementById("Update-Confirm").onclick = function () {
      $("#Update-Confirm").addClass("disabled");
      Request("/api/EXT/Updates", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, null, "Updates", () => {
        alertify.success(translation.RequestDone);
      }, null);
    };
  }

  // Spotify Control
  if (EXTStatus["EXT-Spotify"].hello) {
    var type = null;
    $("#Spotify-Text").text(translation.Tools_Spotify_Text);
    $("#Spotify-Text2").text(translation.Tools_Spotify_Text2);
    $("#Spotify-Send").text(translation.Send);
    $("#Spotify-Artist-Text").text(translation.Tools_Spotify_Artist);
    $("#Spotify-Track-Text").text(translation.Tools_Spotify_Track);
    $("#Spotify-Album-Text").text(translation.Tools_Spotify_Album);
    $("#Spotify-Playlist-Text").text(translation.Tools_Spotify_Playlist);
    $("#Spotify-Query").prop("placeholder", translation.Tools_Spotify_Query);
    $("#Spotify-Send").text(translation.Send);
    $("#Spotify-Box").css("display", "block");
    $("#Spotify-Query").keyup(function () {
      if ($(this).val().length > 1 && type) {
        $("#Spotify-Send").removeClass("disabled");
      } else {
        $("#Spotify-Send").addClass("disabled");
      }
    });

    document.getElementById("Spotify-Send").onclick = function () {
      $("#Spotify-Send").addClass("disabled");
      Request("/api/EXT/Spotify", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ query: $("#Spotify-Query").val(), type: type }), "Spotify", () => {
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
        $("#Spotify-Send").addClass("disabled");
        return;
      }
      type = "artist";
      $("#Spotify-Track").prop("checked", !this.checked);
      $("#Spotify-Album").prop("checked", !this.checked);
      $("#Spotify-Playlist").prop("checked", !this.checked);
      if ($("#Spotify-Query").val().length > 1) {
        $("#Spotify-Send").removeClass("disabled");
      } else {
        $("#Spotify-Send").addClass("disabled");
      }
    };

    document.getElementById("Spotify-Track").onclick = function () {
      if (!this.checked) {
        type = null;
        $("#Spotify-Send").addClass("disabled");
        return;
      }
      type = "track";
      $("#Spotify-Artist").prop("checked", !this.checked);
      $("#Spotify-Album").prop("checked", !this.checked);
      $("#Spotify-Playlist").prop("checked", !this.checked);
      if ($("#Spotify-Query").val().length > 1) {
        $("#Spotify-Send").removeClass("disabled");
      } else {
        $("#Spotify-Send").addClass("disabled");
      }
    };

    document.getElementById("Spotify-Album").onclick = function () {
      if (!this.checked) {
        type = null;
        $("#Spotify-Send").addClass("disabled");
        return;
      }
      type = "album";
      $("#Spotify-Artist").prop("checked", !this.checked);
      $("#Spotify-Track").prop("checked", !this.checked);
      $("#Spotify-Playlist").prop("checked", !this.checked);
      if ($("#Spotify-Query").val().length > 1) {
        $("#Spotify-Send").removeClass("disabled");
      } else {
        $("#Spotify-Send").addClass("disabled");
      }
    };

    document.getElementById("Spotify-Playlist").onclick = function () {
      if (!this.checked) {
        type = null;
        $("#Spotify-Send").addClass("disabled");
        return;
      }
      type = "playlist";
      $("#Spotify-Artist").prop("checked", !this.checked);
      $("#Spotify-Track").prop("checked", !this.checked);
      $("#Spotify-Album").prop("checked", !this.checked);
      if ($("#Spotify-Query").val().length > 1) {
        $("#Spotify-Send").removeClass("disabled");
      } else {
        $("#Spotify-Send").addClass("disabled");
      }
    };
  }

  // RadioPlayer query
  if (EXTStatus["EXT-RadioPlayer"].hello) {
    $("#Radio-Text").text(translation.Tools_Radio_Text);
    $("#Radio-Send").text(translation.Listen);
    var radio = await loadRadio();
    if (radio.length) {
      radio.forEach((station) => {
        $("#Radio-Query").append($("<option>", {
          value: station,
          text: station,
          selected: false
        }));
      });
    }
    else {
      $("#Radio-Query").css("display", "none");
      $("#Radio-Text2").text(translation.Tools_Radio_Text2);
      $("#Radio-Text2").css("display", "block");
      $("#Radio-Send").addClass("disabled");
    }
    $("#Radio-Box").css("display", "block");
    document.getElementById("Radio-Send").onclick = function () {
      Request("/api/EXT/RadioPlayer", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ radio: $("#Radio-Query").val() }), "RadioPlayer", () => {
        alertify.success(translation.RequestDone);
      }, null);
    };
  }

  // FreeboxTV query
  if (EXTStatus["EXT-FreeboxTV"].hello && version.lang === "fr") {
    $("#FreeboxTV-Box").css("display", "block");
    document.getElementById("FreeboxTV-Send").onclick = function () {
      Request("/api/EXT/FreeboxTV", "PUT", { Authorization: `Bearer ${getCurrentToken()}` }, JSON.stringify({ TV: $("#FreeboxTV-Query").val() }), "FreeboxTV", () => {
        alertify.success(translation.RequestDone);
      }, null);
    };
  }

  // Stop Command
  $("#Stop-Text").text(translation.Tools_Stop_Text);
  $("#Stop-Send").text(translation.Send);
  document.getElementById("Stop-Send").onclick = function () {
    Request("/api/EXT/stop", "POST", { Authorization: `Bearer ${getCurrentToken()}` }, null, "STOP", () => {
      alertify.success(translation.RequestDone);
    }, null);
  };
}

function updateTools () {
  if (EXTStatus["EXT-Screen"].hello) {
    if (EXTStatus["EXT-Screen"].power) $("#Screen-Control").text(translation.TurnOff);
    else $("#Screen-Control").text(translation.TurnOn);
  }

  if (EXTStatus["EXT-Volume"].hello) {
    $("#Volume-Set").text(`${EXTStatus["EXT-Volume"].speaker}%`);
    $("#Volume-Set-Record").text(`${EXTStatus["EXT-Volume"].recorder}%`);
  }

  if (EXTStatus["EXT-Updates"].hello) {
    let needUpdate = 0;
    $("#Update-Confirm").text(translation.Confirm);
    var updateModules = EXTStatus["EXT-Updates"].module;
    if (!updateModules) return $("#Update-Box").css("display", "none");
    if (!Object.keys(updateModules).length) return $("#Update-Box").css("display", "none");
    if (Object.keys(updateModules).length) {
      $("#Update-Box").css("display", "block");
      for (const [key] of Object.entries(updateModules)) {
        if ($(`#${key}`).length === 0) $("#Update-Modules-Box").append(`<br><span id='${key}'>${key}</span>`);
        if (key.startsWith("EXT-") || key === "MMM-Bugsounet") ++needUpdate;
      }
      $("#Update-Modules-Box").css("display", "block");
    }
    if (!needUpdate) $("#Update-Confirm").addClass("disabled");
    else $("#Update-Confirm").removeClass("disabled");
  }

  if (this.hasPluginConnected(EXTStatus, "connected", true)) {
    $("#Stop-Box").css("display", "block");
  }
  else $("#Stop-Box").css("display", "none");

  if (EXTStatus["EXT-Spotify"].hello) {
    if (EXTStatus["EXT-Spotify"].connected || EXTStatus["EXT-Spotify"].play) {
      $("#Spotify-Play").css("display", "none");
      $("#Spotify-Stop").css("display", "block");
    } else {
      $("#Spotify-Play").css("display", "block");
      $("#Spotify-Stop").css("display", "none");
    }
  }
}
