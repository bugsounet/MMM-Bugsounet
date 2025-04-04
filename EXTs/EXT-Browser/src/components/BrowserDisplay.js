/* global logBrowser */
/* eslint-disable-next-line */
class BrowserDisplay {
  constructor (config, Tools) {
    this.browser = {
      url: null,
      running: false
    };
    this.timerBrowser = null;
    this.sendNotification = (...args) => { Tools.sendNotification(...args); };
    this.translate = (...args) => { return Tools.translate(...args); };
    this.config = config;
    console.log("[BROWSER] BrowserDisplay Ready");
  }

  preparePopup () {
    var Browser = document.createElement("webview");
    Browser.id = "EXT_BROWSER";
    Browser.scrolling = "no";
    Browser.classList.add("hidden");
    document.body.appendChild(Browser);
  }

  displayBrowser () {
    logBrowser("Loading", this.browser.url);
    var webView = document.getElementById("EXT_BROWSER");
    webView.src = this.browser.url;
    this.startBrowser();

    webView.addEventListener("did-fail-load", (e) => {
      console.log("[BROWSER] Loading error", e);

      /*
      this.sendNotification("GA_ALERT", {
        message: this.translate("BrowserError"),
        type: "error"
      });
      this.endBrowser();
      */
    });
    webView.addEventListener("crashed", (event) => {
      console.log("[BROWSER] J'ai tout pété mon général !!!");
      console.log("[BROWSER]", event);
      this.sendNotification("GA_ALERT", {
        message: this.translate("BrowserCrash"),
        type: "error"
      });
      this.endBrowser();
    });
    webView.addEventListener("console-message", (event) => {
      if (event.level === 1 && this.config.debug) console.log("[BROWSER]", event.message);
    });
    webView.addEventListener("did-stop-loading", () => {
      if (this.browser.running || (webView.getURL() === "about:blank")) return;
      this.browser.running = true;
      logBrowser("URL Loaded", webView.getURL());
      webView.executeJavaScript(`
      var timer = null
      function scrollDown(posY){
        clearTimeout(timer)
        timer = null
        var scrollHeight = document.body.scrollHeight
        if (posY === 0) console.log("Begin Scrolling")
        if (posY > scrollHeight) posY = scrollHeight
        document.documentElement.scrollTop = document.body.scrollTop = posY;
        if (posY === scrollHeight) return console.log("End Scrolling")
        timer = setTimeout(function(){
          if (posY < scrollHeight) {
            posY = posY + ${this.config.scrollStep}
            scrollDown(posY);
          }
        }, ${this.config.scrollInterval});
      };
      if (${this.config.scrollActivate}) {
        setTimeout(scrollDown(0), ${this.config.scrollStart});
      };`);
    });
    if (this.config.displayDelay) {
      this.timerBrowser = setTimeout(() => {
        this.endBrowser(true);
      }, this.config.displayDelay);
    }
  }

  startBrowser () {
    if (!this.browser.running) this.sendNotification("GA_ALERT", {
      message: this.translate("BrowserOpen"),
      type: "information"
    });
    this.sendNotification("EXT_BROWSER-CONNECTED");
    clearTimeout(this.timerBrowser);
    this.timerBrowser = null;
    this.hideModules();
    this.showBrowser();
  }

  endBrowser (extAlert = false) {
    if (extAlert) this.sendNotification("GA_ALERT", {
      message: this.translate("BrowserClose"),
      type: "information"
    });
    this.sendNotification("EXT_BROWSER-DISCONNECTED");
    this.hideBrowser();
    this.resetBrowser();
    this.showModules();
  }

  resetBrowser () {
    clearTimeout(this.timerBrowser);
    this.timerBrowser = null;
    this.browser = {
      url: null,
      running: false
    };
    var iframe = document.getElementById("EXT_BROWSER");
    iframe.src = "about:blank";
  }

  showBrowser () {
    logBrowser("Show Iframe");
    var iframe = document.getElementById("EXT_BROWSER");
    iframe.classList.remove("hidden");
  }

  hideBrowser () {
    logBrowser("Hide Iframe");
    var iframe = document.getElementById("EXT_BROWSER");
    iframe.classList.add("hidden");
  }

  hideModules () {
    MM.getModules().enumerate((module) => {
      module.hide(100, () => {}, { lockString: "EXT_LOCKED" });
    });
  }

  showModules () {
    MM.getModules().enumerate((module) => {
      module.show(100, () => {}, { lockString: "EXT_LOCKED" });
    });
  }
}
