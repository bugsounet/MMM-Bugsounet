/**
 ** Module : EXT-Volume
 ** @bugsounet
 **/

/* global VolumeDisplayer */

Module.register("EXT-Volume", {
  defaults: {
    debug: false,
    startSpeakerVolume: 100,
    startRecorderVolume: 50,
    syncVolume: false
  },

  start () {
    if (this.config.startSpeakerVolume > 100) this.config.startSpeakerVolume = 100;
    if (this.config.startSpeakerVolume < 0) this.config.startSpeakerVolume = 0;
    if (this.config.startRecorderVolume > 100) this.config.startRecorderVolume = 100;
    if (this.config.startRecorderVolume < 0) this.config.startRecorderVolume = 0;
    this.currentLevel = {};
    this.oldLevel = {};
    this.ready = false;
    this.VolumeDiplayer = new VolumeDisplayer(this.translate("VolumeText"));
  },

  getScripts () {
    return [this.file("components/VolumeDisplayer.js")];
  },

  getStyles () {
    return [
      "EXT-Volume.css",
      "modules/MMM-Bugsounet/node_modules/@mdi/font/css/materialdesignicons.min.css"
    ];
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
      el: "translations/el.json",
      "zh-cn": "translations/zh-cn.json",
      tr: "translations/tr.json"
    };
  },

  getDom () {
    var dom = document.createElement("div");
    dom.style.display = "none";
    return dom;
  },

  notificationReceived (noti, payload, sender) {
    if (noti === "Bugsounet_READY") {
      if (sender.name === "MMM-Bugsounet") {
        this.sendSocketNotification("INIT", this.config);
        this.VolumeDiplayer.prepare();
        this.ready = true;
        this.sendNotification("Bugsounet_HELLO", this.name);
        this.sendSocketNotification("INITIAL_VOLUME");
      }
    }
    if (!this.ready) return;
    switch (noti) {
      case "Bugsounet_VOLUME-SPEAKER_SET":
        var valueSPK = Number(payload);
        if ((!valueSPK && valueSPK !== 0) || ((valueSPK < 0) || (valueSPK > 100))) return;
        this.sendSocketNotification("VOLUMESPEAKER_SET", valueSPK);
        break;
      case "Bugsounet_VOLUME-SPEAKER_UP":
        this.sendSocketNotification("VOLUMESPEAKER_UP");
        break;
      case "Bugsounet_VOLUME-SPEAKER_DOWN":
        this.sendSocketNotification("VOLUMESPEAKER_DOWN");
        break;
      case "Bugsounet_VOLUME-SPEAKER_MUTE":
        if (payload) this.sendSocketNotification("VOLUMESPEAKER_SET", "mute");
        else this.sendSocketNotification("VOLUMESPEAKER_SET", "unmute");
        break;
      case "Bugsounet_VOLUME-SPEAKER_MUTE_TOGGLE":
        this.sendSocketNotification("VOLUMESPEAKER_MUTE_TOGGLE");
        break;
      case "Bugsounet_VOLUME-RECORDER_SET":
        var valueREC = Number(payload);
        if ((!valueREC && valueREC !== 0) || ((valueREC < 0) || (valueREC > 100))) return;
        this.sendSocketNotification("VOLUMERECORDER_SET", valueREC);
        break;
      case "Bugsounet_VOLUME-RECORDER_UP":
        this.sendSocketNotification("VOLUMERECORDER_UP");
        break;
      case "Bugsounet_VOLUME-RECORDER_DOWN":
        this.sendSocketNotification("VOLUMERECORDER_DOWN");
        break;
    }
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "VOLUMESPEAKER_DONE":
        this.VolumeDiplayer.drawVolumeSpeaker(payload);
        break;
      case "VOLUMERECORDER_DONE":
        this.VolumeDiplayer.drawVolumeRecorder(payload);
        break;
      case "VOLUMESPEAKER_LEVEL":
        this.sendNotification("Bugsounet_VOLUME_GET", payload);
        this.currentLevel = payload;
        if (this.currentLevel.SpeakerIsMuted === true) {
          this.VolumeDiplayer.drawVolumeMuted();
        }
        if ((this.currentLevel.SpeakerIsMuted === false) && this.oldLevel.SpeakerIsMuted === true) {
          this.VolumeDiplayer.drawVolumeSpeaker(this.currentLevel.Speaker);
        }
        this.oldLevel = payload;
        break;
      case "WARNING":
        this.sendNotification("Bugsounet_ALERT", { type: "warning", message: this.translate(payload) });
    }
  },

  /****************************/
  /*** TelegramBot Commands ***/
  /****************************/

  EXT_TELBOTCommands (commander) {
    commander.add({
      command: "volume",
      description: this.translate("VolumeHelp"),
      callback: "tbVolume"
    });
    commander.add({
      command: "record",
      description: "Set recorder volume",
      callback: "tbRecorder"
    });
    commander.add({
      command: "mute",
      description: "Mute speaker",
      callback: "tbMute"
    });
    commander.add({
      command: "unmute",
      description: "UnMute speaker",
      callback: "tbUnMute"
    });
  },

  tbVolume (command, handler) {
    if (handler.args) {
      var value = Number(handler.args);
      if ((!value && value !== 0) || ((value < 0) || (value > 100))) return handler.reply("TEXT", "/volume [0-100]");
      this.sendSocketNotification("VOLUMESPEAKER_SET", value);
      handler.reply("TEXT", `Speaker Volume ${value}%`);
    }
    else handler.reply("TEXT", `Speaker Volume ${this.currentLevel.Speaker}%`);
  },

  tbRecorder (command, handler) {
    if (handler.args) {
      var value = Number(handler.args);
      if ((!value && value !== 0) || ((value < 0) || (value > 100))) return handler.reply("TEXT", "/volume [0-100]");
      this.sendSocketNotification("VOLUMERECORDER_SET", value);
      handler.reply("TEXT", `Recorder Volume ${value}%`);
    }
    else handler.reply("TEXT", `Recorder Volume ${this.currentLevel.Recorder}%`);
  },

  tbMute (command, handler) {
    if (this.currentLevel.SpeakerIsMuted) return handler.reply("TEXT", "Speaker is already Muted");
    this.sendSocketNotification("VOLUMESPEAKER_SET", "mute");
    handler.reply("TEXT", "Speaker is now Muted");
  },

  tbUnMute (command, handler) {
    if (!this.currentLevel.SpeakerIsMuted) return handler.reply("TEXT", "Speaker is already UnMuted");
    this.sendSocketNotification("VOLUMESPEAKER_SET", "unmute");
    handler.reply("TEXT", "Speaker is now UnMuted");
  }
});
