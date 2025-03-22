/** API Docs
* @bugsounet
**/

/* global loadTranslation, doTranslateNavBar */

// rotate rules
/* eslint-disable-next-line */
var PleaseRotateOptions = {
  startOnPageLoad: false
};

// define all vars
/* eslint-disable-next-line */
var translation = {};

// Load rules
window.addEventListener("load", async () => {
  document.title = "API Docs";
  translation = await loadTranslation();

  doTranslateNavBar();
});

