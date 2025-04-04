/*
 ****************************
 * Module : EXT-Touch
 * Activate by touch for GA
 * @bugsounet
 ****************************
 */

/* global DetectorTouchVisual */

Module.register("EXT-Touch", {
  start () {
    this.ready = false;
    const Tools = {
      file: (...args) => this.file(...args),
      sendNotification: (...args) => this.sendNotification(...args)
    };
    this.Touch = new DetectorTouchVisual(Tools);
  },

  notificationReceived (notification, payload, sender) {
    switch (notification) {
      case "EXT_TOUCH-START":
        if (this.ready) this.Touch.RefreshLogo(false);
        break;
      case "EXT_TOUCH-BLINK":
        if (this.ready) this.Touch.RefreshLogo(true);
        break;
      case "EXT_TOUCH-STOP":
        if (this.ready) this.Touch.Disabled();
        break;
      case "GA_READY":
        if (sender.name === "MMM-GoogleAssistant") { this.sendSocketNotification("INIT"); }
        break;
    }
  },

  socketNotificationReceived (notification) {
    switch (notification) {
      case "INITIALIZED":
        this.ready = true;
        this.sendNotification("EXT_HELLO", this.name);
        break;
    }
  },

  getStyles () {
    return [this.file("EXT-Touch.css")];
  },

  getScripts () {
    return [this.file("components/visual.js")];
  },

  getDom () {
    return this.Touch.TouchDom();
  }
});
