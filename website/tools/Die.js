/** Die
* @bugsounet
**/

/* global $, loadTranslation, getCurrentToken */

// define all vars
var translation = {};

// Load rules
window.addEventListener("load", async () => {
  translation = await loadTranslation();

  doDie();
});

function doDie () {
  $(document).prop("title", translation.Tools);
  $("#text1").text(translation.Tools_Die_Text1);
  $("#text2").text(translation.Tools_Die_Text2);
  $("#text3").text(translation.Tools_Die_Text3);
  Request("/api/system/die", "POST", { Authorization: `Bearer ${getCurrentToken()}` }, null, "DIE", null, null);
}
