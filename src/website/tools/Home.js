/** Home
* @bugsounet
**/

/* global setTranslation, getVersion, loadTranslation, getHomeText, forceMobileRotate, doTranslateNavBar */

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
  document.getElementById("HomeText").innerHTML = homeText;
});

function doIndex () {
  document.title = translation.Home;
  setTranslation("welcome", translation.Home_Welcome);
  if (version.needUpdate) {
    document.getElementById("alert").classList.remove("invisible");
    document.getElementById("alert").classList.remove("alert-success");
    document.getElementById("alert").classList.add("alert-warning");
    setTranslation("messageText", `${translation.Update} v${version.last}`);
  }
}

