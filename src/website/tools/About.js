/** About
* @bugsounet
**/

/* global setTranslation, getVersion, loadTranslation, forceMobileRotate, doTranslateNavBar */

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
  document.title = translation.About;
  setTranslation("about_title", translation.About_Title);
  setTranslation("version", version.version);
  setTranslation("api", version.api);
  setTranslation("rev", version.rev);
  setTranslation("language", version.version.lang);

  setTranslation("byHeader", translation.About_Info_by);
  setTranslation("DonateHeader", translation.About_Info_Donate);
  setTranslation("DonateText", translation.About_Info_Donate_Text);
  setTranslation("VersionHeader", translation.About_Info_About);

  for (let tr = 1; tr <= 10; tr++) {
    let trans = `About_Info_Translator${tr}`;
    if (tr === 1 && translation[trans]) {
      setTranslation("Translators", translation.About_Info_Translator);
      document.getElementById("translatorsBox").style.display = "flex";
    }
    if (translation[trans]) setTranslation(`translator-${tr}`, translation[trans]);
  }
}
