/** Shutdown
* @bugsounet
**/

/* global setTranslation, loadTranslation, getCurrentToken */

// define all vars
var translation = {};

// Load rules
window.addEventListener("load", async () => {
  translation = await loadTranslation();

  doShutdown();
});

function doShutdown () {
  document.title = translation.Tools;
  setTranslation("text1", translation.Tools_Die_Text1);
  setTranslation("text2", translation.Tools_Die_Text2);
  setTranslation("text3", translation.Tools_Die_Text3);
  Request("/api/system/shutdown", "POST", { Authorization: `Bearer ${getCurrentToken()}` }, null, "SHUTDOWN", null, null);
}
