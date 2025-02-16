"use strict";
var logGA = () => { /* do nothing */ };
const { search, OrganicResult } = require("google-sr");

class GoogleSearch {
  constructor (Tools, debug) {
    if (debug) logGA = (...args) => { console.log("[GA] [GoogleSearch]", ...args); };
    this.sendSocketNotification = (...args) => Tools.sendSocketNotification(...args);
  }

  search (text) {
    if (!text) return;
    var finalResult = [];
    search({
        query: text,
        resultTypes: [OrganicResult]
      })
        .then((response) => {
          if (response?.length) {
            response.forEach((result) => {
              logGA(`Link: ${result.link} (${result.title})`);
              finalResult.push(result.link);
            });

            if (finalResult.length) {
              logGA("Results:", finalResult);
              this.sendSocketNotification("GOOGLESEARCH-RESULT", finalResult[0]);
            } else {
              logGA("No Results found!");
              this.sendSocketNotification("ERROR", "[GoogleSearch] No Results found!");
            }
          } else {
            logGA("No Results found!");
            this.sendSocketNotification("ERROR", "[GoogleSearch] No Results found!");
          }
        })
        .catch((e) => {
          console.error(`[GA] [GOOGLE_SEARCH] [ERROR] ${e.message}`);
          this.sendSocketNotification("ERROR", "[GoogleSearch] Sorry, an error occurred!");
        });
  }
}

module.exports = GoogleSearch;
