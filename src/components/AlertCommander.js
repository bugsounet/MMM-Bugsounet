/* global logBugsounet Swal */
/* eslint-disable-next-line */
class AlertCommander {
  constructor (Tools) {
    this.alerts = {
      displayed: false,
      buffer: []
    };
    this.event = ["warning", "error", "information", "success"];
    this.types = [
      {
        event: "warning",
        icon: "modules/MMM-Bugsounet/resources/warning.gif",
        timer: 5000,
        sound: "modules/MMM-Bugsounet/resources/warning.ogg"
      },
      {
        event: "error",
        icon: "modules/MMM-Bugsounet/resources/error.gif",
        timer: 5000,
        sound: "modules/MMM-Bugsounet/resources/error.mp3"
      },
      {
        event: "information",
        icon: "modules/MMM-Bugsounet/resources/information.gif",
        timer: 5000,
        sound: null
      },
      {
        event: "success",
        icon: "modules/MMM-Bugsounet/resources/success.gif",
        timer: 5000,
        sound: null
      }
    ];
    this.sound = new Audio();
    this.sound.autoplay = true;
    this.warningTimeout = null;
    this.translate = (...args) => Tools.translate(...args);
    console.log("[Bugsounet] AlertCommander Ready");
  }

  Alert (info) {
    var alertObject = {
      type: null,
      info: info
    };

    if (this.event.indexOf(info.type) < 0) {
      logBugsounet("[ALERT] debug information:", info.type);
      return this.Alert({ type: "warning", message: "Alert Core: unknow Type!" });
    }

    alertObject.type = this.types.find((type) => type.event === info.type);

    if (!info.message) { // should not happen
      logBugsounet("[ALERT] debug information:", info);
      return this.Alert({ type: "warning", message: "Alert Core: No message!" });
    }
    if (!alertObject.type) {
      logBugsounet("[ALERT] debug information:", alertObject);
      return this.Alert({ type: "warning", message: "Alert Core: Display Type Error!" });
    }

    this.alerts.buffer.push(alertObject);
    logBugsounet("[ALERT] Buffer Add:", alertObject);
    this.AlertBuffer(this.alerts.buffer[0]);
  }

  /** Informations Display with translate from buffer **/
  AlertBuffer (alert) {
    if (this.alerts.displayed || !this.alerts.buffer.length) return;
    let timer = alert.info.timer ? alert.info.timer : alert.type.timer;

    // define timer limit...
    if (timer < 3000) timer = 3000;
    if (timer > 30000) timer = 30000;
    this.SweetAlert(alert, timer);
  }

  AlertShift () {
    logBugsounet("[ALERT] Buffer deleted:", this.alerts.buffer[0]);
    this.alerts.buffer.shift();
    this.alerts.displayed = false;
    if (this.alerts.buffer.length) this.AlertBuffer(this.alerts.buffer[0]);
    else logBugsounet("[ALERT] Buffer is now empty!");
  }

  playAlert (alert) {
    if (alert.info.sound === "none") return;
    if (alert.type.sound || alert.info.sound) this.sound.src = `${alert.info.sound ? alert.info.sound : alert.type.sound}?seed=${Date.now}`;
  }

  SweetAlert (alert, timer) {
    let message = `<div class= "AlertMessageContainer"><img class= "AlertMessageIcon" src=${alert.info.icon}></img>${alert.info.message}</div>`;
    let options = {
      html: alert.info.icon ? message : alert.info.message,
      footer: alert.info.sender ? alert.info.sender : "MMM-Bugsounet",
      icon: alert.info.type === "information" ? "info" : alert.info.type,
      timer: timer,
      showConfirmButton: false,
      timerProgressBar: true,
      background: "rgba(33,33,33,.95)",
      color: "#ffffff",
      toast: true,
      showClass: {
        popup: `
          animate__animated
          animate__fadeInDown
          animate__faster
        `
      },
      hideClass: {
        popup: `
          animate__animated
          animate__zoomOutUp
          animate__faster
        `
      },
      customClass: {
        timerProgressBar: "AlertProgressColor",
        footer: "AlertFooterColor"
      },
      width: "100%",
      position: "top",
      willOpen: () => { this.alerts.displayed = true; },
      didOpen: (toast) => {
        this.playAlert(alert);
        toast.onclick = Swal.close;
      }
    };
    if (alert.info.type === "error") {
      options.html = alert.info.message;
      options.iconColor = "#db3236";
      options.toast = false;
      options.backdrop = true;
      options.width = "32em";
      options.position = "center";
      options.title = this.translate("AlertError");
      options.imageUrl = alert.info.icon || undefined;
      options.imageWidth = 100;
      options.customClass.timerProgressBar = "AlertProgressColorError";
      options.heightAuto = false;
    }
    if (alert.info.type === "warning") {
      options.iconColor = "#FFA500";
      options.customClass.timerProgressBar = "AlertProgressColorWarning";
    }
    Swal.fire(options).then(() => this.AlertShift());
  }
}
