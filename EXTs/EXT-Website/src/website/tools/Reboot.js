/** Reboot
* @bugsounet
**/

/* global setTranslation, loadTranslation, getCurrentToken */

// define all vars
var translation = {};
var websiteLocation = window.location.origin;

// Load rules
window.addEventListener("load", async () => {
  translation = await loadTranslation();

  doRestart();
});

function doRestart () {
  document.title = translation.Tools;
  setTranslation("text1", translation.Tools_Restart_Text1);
  setTranslation("text2", translation.Tools_Restart_Text2);

  Request("/api/system/reboot", "POST", { Authorization: `Bearer ${getCurrentToken()}` }, null, "REBOOT", null, null);

  function handle200 () {
    window.location.href = "/";
  }

  function checkPage (callback) {
    fetch(websiteLocation)
      .then((response) => {
        if (response.status === 200) return callback();
      })
      .catch(() => {});
  }

  setInterval(() => {
    checkPage(handle200);
  }, 5000);
}
