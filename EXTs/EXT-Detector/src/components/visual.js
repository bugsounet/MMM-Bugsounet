/*
 *******************************
 * Visual Class of EXT-Detector
 *******************************
 */

/* eslint-disable-next-line */
class DetectorVisual {
  constructor (useIcon, Tools) {
    this.useIcon = useIcon;
    this.file = (...args) => Tools.file(...args);
    this.sendSocketNotification = (...args) => Tools.sendSocketNotification(...args);
    this.sendNotification = (...args) => Tools.sendNotification(...args);
    this.listening = false;
    this.logoGoogle = this.file("resources/google.png");
    console.log("[EXT-Detector] Visual Loaded");
  }

  DetectorDisabled () {
    if (!this.useIcon) { return; }
    this.listening = false;
    const icon = document.getElementById("EXT_DETECTOR-ICON");
    icon.classList.add("busy");
    icon.classList.remove("flash");
  }

  DetectorActivateWord () {
    this.DetectorRefreshLogo(true);
    this.sendNotification("Bugsounet_ACTIVATE");
  }

  DetectorRefreshLogo (disabled) {
    if (!this.useIcon) { return; }
    const icon = document.getElementById("EXT_DETECTOR-ICON");
    if (disabled) {
      this.listening = false;
      icon.classList.remove("busy");
      icon.classList.add("flash");
    } else {
      this.listening = true;
      icon.classList.remove("busy", "flash");
    }
  }

  DetectorDom () {
    const wrapper = document.createElement("div");
    wrapper.id = "EXT_DETECTOR";

    if (this.useIcon) {
      const icon = document.createElement("div");
      icon.id = "EXT_DETECTOR-ICON";
      icon.style.backgroundImage = `url(${this.logoGoogle})`;
      icon.classList.add("busy");
      wrapper.appendChild(icon);
    }
    else { wrapper.className = "hidden"; }
    return wrapper;
  }
}
