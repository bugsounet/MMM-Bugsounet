/** Die
* @bugsounet
**/

/* global setTranslation, loadTranslation, getCurrentToken */

// define all vars
var translation = {};

// Load rules
window.addEventListener("load", async () => {
  translation = await loadTranslation();

  doDie();
});

function doDie () {
  document.title = translation.Tools;
  setTranslation("text1", translation.Tools_Die_Text1);
  setTranslation("text2", translation.Tools_Die_Text2);
  setTranslation("text3", translation.Tools_Die_Text3);
  Request("/api/system/die", "POST", { Authorization: `Bearer ${getCurrentToken()}` }, null, "DIE", null, null);
}
