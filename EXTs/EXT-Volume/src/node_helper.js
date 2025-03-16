"use strict";

const exec = require("child_process").exec;

var log = () => { /* do nothing */ };
var NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
  start () {
    this.volumeSpeakerScript = "amixer -D pulse -M sset Master #VOLUME#% -q";
    this.volumeRecorderScript = "amixer -D pulse -M sset Capture #VOLUME#% -q";
    this.checkVolumeScript = "amixer -D pulse sget Master";
    this.checkRecorderScript = "amixer -D pulse sget Capture";
    this.reInfoVolume = /[a-z][a-z ]*: Playback [0-9-]+ \[([0-9]+)%\] (?:[[0-9.-]+dB\] )?\[(on|off)\]/i;
    this.reInfoRecord = /[a-z][a-z ]*: Capture [0-9-]+ \[([0-9]+)%\] (?:[[0-9.-]+dB\] )?\[(on|off)\]/i;
    this.level = {
      Speaker: 100,
      SpeakerIsMuted: false,
      Recorder: 50
    };
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "INIT":
        console.log("[VOLUME] EXT-Volume Version:", require("./package.json").version, "rev:", require("./package.json").rev);
        this.initialize(payload);
        break;
      case "INITIAL_VOLUME":
        this.setVolumeRecorder(this.config.startRecorderVolume);
        this.setVolumeSpeaker("unmute");
        this.setVolumeSpeaker(this.config.startSpeakerVolume);
        break;
      case "VOLUME_GET":
        this.sendSocketNotification("VOLUMESPEAKER_LEVEL", this.level);
        break;
      case "VOLUMESPEAKER_SET":
        this.setVolumeSpeaker(payload);
        break;
      case "VOLUMESPEAKER_UP":
        this.upVolumeSpeaker();
        break;
      case "VOLUMESPEAKER_MUTE_TOGGLE":
        this.muteVolumeToggle();
        break;
      case "VOLUMESPEAKER_DOWN":
        this.downVolumeSpeaker();
        break;
      case "VOLUMERECORDER_SET":
        this.setVolumeRecorder(payload);
        break;
      case "VOLUMERECORDER_UP":
        this.upVolumeRecorder();
        break;
      case "VOLUMERECORDER_DOWN":
        this.downVolumeRecorder();
        break;
    }
  },

  async initialize (config) {
    this.config = config;
    if (this.config.debug) log = (...args) => { console.log("[VOLUME]", ...args); };
    this.lastSpeakerLevel = this.config.startSpeakerVolume;
    this.lastRecorderLevel = this.config.startRecorderVolume;
    if (this.config.syncVolume) this.timerCheck();
  },

  /** Volume control **/
  setVolumeSpeaker (level) {
    var script;
    if (level === "mute" || level === "unmute") script = this.volumeSpeakerScript.replace("#VOLUME#%", level);
    else script = this.volumeSpeakerScript.replace("#VOLUME#", level);
    exec(script, (err) => {
      if (err) {
        console.error("[VOLUME] Set Volume Error:", err.toString());
        this.sendSocketNotification("WARNING", "VolumePresetError");
      }
      else {
        log("Set Speaker Volume To:", level);
        if (level === "mute" || level === "unmute") {
          this.level.SpeakerIsMuted = (level === "mute") ? true : false;
        } else {
          this.sendSocketNotification("VOLUMESPEAKER_DONE", level);
          this.level.Speaker = level;
        }
        this.sendSocketNotification("VOLUMESPEAKER_LEVEL", this.level);
        log("Speaker is now", this.level);
      }
    });
  },

  muteVolumeToggle () {
    this.setVolumeSpeaker(this.level.SpeakerIsMuted ? "unmute" : "mute");
  },

  upVolumeSpeaker () {
    var level = this.level.Speaker + 5;
    if (level >= 100) level = 100;
    this.setVolumeSpeaker(level);
  },

  downVolumeSpeaker () {
    var level = this.level.Speaker - 5;
    if (level <= 0) level = 0;
    this.setVolumeSpeaker(level);
  },

  setVolumeRecorder (level) {
    var script = this.volumeRecorderScript.replace("#VOLUME#", level);
    exec(script, (err) => {
      if (err) {
        console.error("[VOLUME] Set Record Volume Error:", err.toString());
        this.sendSocketNotification("WARNING", "VolumeRecordPresetError");
      }
      else {
        log("Set Recorder Volume To:", level);
        this.sendSocketNotification("VOLUMERECORDER_DONE", level);
        this.level.Recorder = level;
        this.sendSocketNotification("VOLUMESPEAKER_LEVEL", this.level);
      }
    });
  },

  upVolumeRecorder () {
    var level = this.level.Recorder + 5;
    if (level >= 100) level = 100;
    this.setVolumeRecorder(level);
  },

  downVolumeRecorder () {
    var level = this.level.Recorder - 5;
    if (level <= 0) level = 0;
    this.setVolumeRecorder(level);
  },

  timerCheck () {
    console.log("[VOLUME] SyncVolume Started");
    setInterval(() => {
      // check Volume
      exec(this.checkVolumeScript, (err, stdout) => {
        if (err) {
          console.error("[VOLUME] Get Volume Error:", err);
        } else {
          let change = 0;
          const result = this.reInfoVolume.exec(stdout);
          if (!result[1] || !result[2]) console.error("[VOLUME] Get Volume Error: wrong array !?");
          let volume = parseInt(result[1]);
          let mute = result[2];
          if (this.level.Speaker !== volume) {
            this.level.Speaker = volume;
            this.sendSocketNotification("VOLUMESPEAKER_DONE", volume);
            change = 1;
            log("Get Volume:", volume);
          }
          let SpeakerIsMuted = (mute === "off") ? true : false;
          if (this.level.SpeakerIsMuted !== SpeakerIsMuted) {
            this.level.SpeakerIsMuted = SpeakerIsMuted;
            change = 1;
            log("Mute Volume:", SpeakerIsMuted);
          }
          if (change) this.sendSocketNotification("VOLUMESPEAKER_LEVEL", this.level);
        }
      });
      // check Record
      exec(this.checkRecorderScript, (err, stdout) => {
        if (err) {
          console.error("[VOLUME] Get Record Error:", err);
        } else {
          const result = this.reInfoRecord.exec(stdout);
          if (!result[1]) console.error("[VOLUME] Get Record Error: wrong array !?");
          let recordVolume = parseInt(result[1]);
          if (this.level.Recorder !== recordVolume) {
            this.level.Recorder = recordVolume;
            this.sendSocketNotification("VOLUMERECORDER_DONE", recordVolume);
            this.sendSocketNotification("VOLUMESPEAKER_LEVEL", this.level);
            log("Get Record:", recordVolume);
          }
        }
      });
    }, 1000);
  }
});
