/*
 ************************
 * Module : EXT-Detector
 ************************
 */

/* global DetectorVisual */

Module.register("EXT-Detector", {
  defaults: {
    debug: false,
    useIcon: true,
    porcupineAccessKey: null,
    porcupineCustomModel: null,
    snowboyMicConfig: {
      audioGain: 2.0,
      applyFrontend: true // When you use only `snowboy` and `smart_mirror`, `false` is better. But with other models, `true` is better.
    },
    detectors: [
      {
        detector: "Snowboy",
        Model: "jarvis",
        Sensitivity: null
      },
      {
        detector: "Porcupine",
        Model: "ok google",
        Sensitivity: null
      },
      {
        detector: "Porcupine",
        Model: "hey google",
        Sensitivity: null
      }
    ]
  },

  start () {
    this.ready = false;
    this.config.mic = {
      recorder: "auto",
      device: "default"
    };
    this.config.snowboyMicConfig = configMerge({}, this.config.mic, this.config.snowboyMicConfig);

    const Tools = {
      file: (...args) => this.file(...args),
      sendSocketNotification: (...args) => this.sendSocketNotification(...args),
      sendNotification: (...args) => this.sendNotification(...args)
    };
    this.visual = new DetectorVisual(this.config.useIcon, Tools);
  },

  notificationReceived (notification, payload, sender) {
    switch (notification) {
      case "Bugsounet_DETECTOR-START":
        if (this.ready) { this.sendSocketNotification("START"); }
        break;
      case "Bugsounet_DETECTOR-STOP":
        if (this.ready) { this.sendSocketNotification("STOP"); }
        break;
      case "Bugsounet_Ready":
        if (sender.name === "MMM-Bugsounet") { this.sendSocketNotification("INIT", this.config); }
        break;
    }
  },

  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case "INITIALIZED":
        this.sendNotification("Bugsounet_HELLO", this.name);
        this.ready = true;
        break;
      case "NOT_INITIALIZED":
        this.sendNotification("Bugsounet_ALERT", {
          message: "Error: No detectors found, please review your configuration",
          type: "error"
        });
        break;
      case "WARNING":
      case "ERROR":
        this.sendNotification("Bugsounet_ALERT", {
          message: `Error when loading ${payload.library} library. Try: 'npm run rebuild' in EXT-Detector directory`,
          type: "error"
        });
        break;
      case "ACCESSKEY":
        this.sendNotification("Bugsounet_ALERT", {
          message: "Error: No porcupineAccessKey provided in config",
          type: "error"
        });
        break;
      case "PORCUPINENOTINIT":
        this.sendNotification("Bugsounet_ALERT", {
          message: "Error: Can't start Porcupine detector",
          type: "error"
        });
        break;
      case "LISTENING":
        this.visual.DetectorRefreshLogo(false);
        break;
      case "DETECTED":
        this.visual.DetectorActivateWord();
        break;
      case "DISABLED":
        this.visual.DetectorDisabled();
        break;
    }
  },

  getStyles () {
    return [this.file("EXT-Detector.css")];
  },

  getScripts () {
    return [this.file("components/visual.js")];
  },

  getDom () {
    return this.visual.DetectorDom();
  }
});
