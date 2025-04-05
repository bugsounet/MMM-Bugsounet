/*
 *************************************
 * Module : EXT-Touch
 * Activate by touch for EXT-Assistant
 * @bugsounet
 *************************************
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
      case "Bugsounet_TOUCH-START":
        if (this.ready) this.Touch.RefreshLogo(false);
        break;
      case "Bugsounet_TOUCH-BLINK":
        if (this.ready) this.Touch.RefreshLogo(true);
        break;
      case "Bugsounet_TOUCH-STOP":
        if (this.ready) this.Touch.Disabled();
        break;
      case "Bugsounet_ASSISTANT-READY":
        if (sender.name === "EXT-Assistant") { this.sendSocketNotification("INIT"); }
        break;
    }
  },

  socketNotificationReceived (notification) {
    switch (notification) {
      case "INITIALIZED":
        this.ready = true;
        this.sendNotification("Bugsounet_HELLO");
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
