/*
 *****************************
 * Visual Class of EXT-Touch
 * @bugsounet
 * 24-03-22
 *****************************
 */

/*eslint-disable-next-line */
class DetectorTouchVisual {
  constructor (Tools) {
    this.file = (...args) => Tools.file(...args);
    this.sendNotification = (...args) => Tools.sendNotification(...args);
    this.listening = false;
    this.logoGoogle = this.file("resources/google.png");
    console.log("[EXT-Touch] Visual Loaded");
  }

  Disabled () {
    this.listening = false;
    const icon = document.getElementById("EXT_TOUCH-ICON");
    icon.classList.add("busy");
    icon.classList.remove("flash");
  }

  ClickCheck () {
    if (!this.listening) { return; }
    this.listening = false;
    this.RefreshLogo(true);
    this.sendNotification("GA_ACTIVATE");
  }

  RefreshLogo (disabled) {
    const icon = document.getElementById("EXT_TOUCH-ICON");
    if (disabled) {
      this.listening = false;
      icon.classList.remove("busy");
      icon.classList.add("flash");
    } else {
      this.listening = true;
      icon.classList.remove("busy", "flash");
    }
  }

  TouchDom () {
    const wrapper = document.createElement("div");
    wrapper.id = "EXT_TOUCH";

    const icon = document.createElement("div");
    icon.id = "EXT_TOUCH-ICON";
    icon.style.backgroundImage = `url(${this.logoGoogle})`;
    icon.classList.add("busy");
    icon.onclick = (event) => {
      event.stopPropagation();
      this.ClickCheck();
    };
    wrapper.appendChild(icon);

    return wrapper;
  }
}
