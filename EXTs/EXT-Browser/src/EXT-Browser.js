/**
 ** Module : EXT-Browser
 ** @bugsounet
 ** ©04-2025
 **/

/* global BrowserDisplay */
/* eslint-disable-next-line */
var logBrowser = () => { /* do nothing */ };

Module.register("EXT-Browser", {
  defaults: {
    debug: false,
    displayDelay: 60 * 1000,
    scrollActivate: true,
    scrollStep: 25,
    scrollInterval: 1000,
    scrollStart: 5000
  },

  start () {
    if (this.config.debug) logBrowser = (...args) => { console.log("[BROWSER]", ...args); };
    this.ready = false;
    const Tools = {
      sendNotification: (...args) => this.sendNotification(...args),
      translate: (...args) => this.translate(...args)
    };
    this.BrowserDisplay = new BrowserDisplay(this.config, Tools);
  },

  getDom () {
    var dom = document.createElement("div");
    dom.style.display = "none";
    return dom;
  },

  getStyles () {
    return ["EXT-Browser.css"];
  },

  getScripts () {
    return [this.file("components/BrowserDisplay.js")];
  },

  getTranslations () {
    return {
      en: "translations/en.json",
      fr: "translations/fr.json",
      it: "translations/it.json",
      de: "translations/de.json",
      es: "translations/es.json",
      nl: "translations/nl.json",
      pt: "translations/pt.json",
      ko: "translations/ko.json",
      tr: "translations/tr.json"
    };
  },

  notificationReceived (noti, payload, sender) {
    switch (noti) {
      case "Bugsounet_ASSISTANT-READY":
        if (sender.name === "EXT-Assistant") {
          this.sendSocketNotification("INIT");
          this.BrowserDisplay.preparePopup();
          this.sendNotification("Bugsounet_HELLO");
          this.ready = true;
        }
        break;
      case "Bugsounet_BROWSER-OPEN":
        if (!payload || !this.ready) return;
        if (typeof (payload) !== "string") {
          console.error("[BROWSER] EXT_BROWSER-OPEN Error: payload must be a string, received:", payload);
          return;
        }
        if (payload.startsWith("http://") || payload.startsWith("https://")) {
          this.BrowserDisplay.browser.url = payload;
          this.BrowserDisplay.displayBrowser();
        } else {
          this.sendNotification("Bugsounet_ALERT", {
            message: this.translate("BrowserError"),
            type: "error"
          });
        }
        break;
      case "Bugsounet_STOP":
      case "Bugsounet_BROWSER-CLOSE":
        if (this.BrowserDisplay.browser.running) this.BrowserDisplay.endBrowser(true);
        break;
    }
  }
});
