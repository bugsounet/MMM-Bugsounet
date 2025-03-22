/** Home
* @bugsounet
**/

/* global $, setTranslation, getVersion, loadTranslation, getHomeText, forceMobileRotate, doTranslateNavBar */

// rotate rules
/* eslint-disable-next-line */
var PleaseRotateOptions = {
  startOnPageLoad: false
};

// define all vars
var translation = {};
var version = {};
var homeText = {};

// Load rules
window.addEventListener("load", async () => {
  version = await getVersion();
  translation = await loadTranslation();
  homeText = await getHomeText();

  forceMobileRotate();
  doIndex();
  doTranslateNavBar();
  $("#HomeText").html(homeText);
});

function doIndex () {
  document.title = translation.Home;
  setTranslation("welcome", translation.Home_Welcome);
  if (version.needUpdate) {
    $("#alert").removeClass("invisible");
    $("#alert").removeClass("alert-success");
    $("#alert").addClass("alert-warning");
    setTranslation("messageText", `${translation.Update} v${version.last}`);
  }
}

