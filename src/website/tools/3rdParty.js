/** 3rd Party Module
* @bugsounet
**/

/* global $, loadTranslation, doTranslateNavBar */

// rotate rules
/* eslint-disable-next-line */
var PleaseRotateOptions = {
  startOnPageLoad: false
};

// define all vars
/* eslint-disable-next-line */
var translation = {}; // don't understand why no-unused-vars !?

// Load rules
window.addEventListener("load", async () => {
  translation = await loadTranslation();

  $(document).prop("title", "MagicMirror² 3rd Party Modules");

  doTranslateNavBar();
});

