/** About
* @bugsounet
**/

/* global $, getVersion, loadTranslation, forceMobileRotate, doTranslateNavBar */

// rotate rules
/* eslint-disable-next-line */
var PleaseRotateOptions = {
  startOnPageLoad: false
};

// define all vars
var translation = {};
var version = {};

// Load rules
window.addEventListener("load", async () => {
  version = await getVersion();
  translation = await loadTranslation();

  forceMobileRotate();
  GatewaySetting();

  doTranslateNavBar();
});

function GatewaySetting () {
  //translate parts
  $(document).prop("title", translation.About);
  $("#about_title").text(translation.About_Title);
  $("#version").text(version.version);
  $("#api").text(version.api);
  $("#rev").text(version.rev);
  $("#language").text(version.lang);

  $("#byHeader").text(translation.About_Info_by);
  $("#SupportHeader").text(translation.About_Info_Support);
  $("#DonateHeader").text(translation.About_Info_Donate);
  $("#DonateText").text(translation.About_Info_Donate_Text);
  $("#VersionHeader").text(translation.About_Info_About);

  for (let tr = 1; tr <= 10; tr++) {
    let trans = `About_Info_Translator${tr}`;
    if (tr === 1 && translation[trans]) {
      $("#Translators").text(translation.About_Info_Translator);
      $("#translatorsBox").css("display", "flex");
    }
    if (translation[trans]) $(`#translator-${tr}`).text(translation[trans]);
  }
}
