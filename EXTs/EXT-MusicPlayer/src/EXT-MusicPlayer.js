/**
 ** Module : EXT-MusicPlayer
 ** @bugsounet
 **/

/* global Music */

Module.register("EXT-MusicPlayer", {
  defaults: {
    debug: false,
    verbose: false,
    useUSB: false,
    random: false,
    musicPath: "/home/pi/Music",
    checkSubDirectory: false,
    autoStart: false,
    loop: false,
    minVolume: 30,
    maxVolume: 100
  },

  start () {
    this.initializeMusicVolumeVLC();
    this.music = {
      connected: false,
      currentVolume: 0,
      minVolume: this.config.minVolume,
      minValue: this.convertPercentToValue(this.config.minVolume),
      maxVolume: this.config.maxVolume,
      targetVolume: this.config.maxVolume,
      targetValue: this.convertPercentToValue(this.config.maxVolume),
      assistantSpeak: false
    };
    this.config.minVolume = this.music.minValue;
    this.config.maxVolume = this.music.targetValue;
    this.config.hide = (...args) => this.hide(...args);
    this.config.show = (...args) => this.show(...args);
    this.config.file = (args) => this.file(args);
    this.ready = false;
    this.Music = new Music(this.config);
    this.random = this.config.random;
    this.canStop = true;
  },

  getScripts () {
    return [
      this.file("components/musicplayer.js"),
      "https://code.iconify.design/1/1.0.6/iconify.min.js"
    ];
  },

  getStyles () {
    return [
      "EXT-MusicPlayer.css",
      "modules/MMM-GoogleAssistant/node_modules/@mdi/font/css/materialdesignicons.min.css",
      "font-awesome.css"
    ];
  },

  getDom () {
    return this.Music.prepare();
  },

  notificationReceived (noti, payload, sender) {
    if (noti === "GA_READY") {
      if (sender.name === "MMM-GoogleAssistant") {
        this.sendSocketNotification("INIT", this.config);
        this.sendNotification("EXT_HELLO", this.name);
      }
    }
    if (noti === "EXT_VLCSERVER-START") {
      this.sendSocketNotification("START");
      this.ready = true;
    }

    if (!this.ready) return;

    switch (noti) {
      case "ASSISTANT_LISTEN":
      case "ASSISTANT_THINK":
      case "ASSISTANT_REPLY":
      case "ASSISTANT_CONTINUE":
      case "ASSISTANT_CONFIRMATION":
      case "ASSISTANT_ERROR":
        this.music.assistantSpeak = true;
        break;
      case "ASSISTANT_HOOK":
      case "ASSISTANT_STANDBY":
        this.music.assistantSpeak = false;
        break;
      case "EXT_VLCServer-WILL_PLAYING":
        this.canStop = false;
        break;
      case "EXT_STOP":
      case "EXT_MUSIC-STOP":
        if (this.canStop) {
          this.MusicCommand("STOP");
        }
        break;
      case "EXT_MUSIC-VOLUME_MIN":
        if (!this.music.connected) return;
        if (this.music.currentVolume <= this.music.minVolume) return;
        this.music.targetVolume = this.music.currentVolume;
        this.music.targetValue = this.convertPercentToValue(this.music.targetVolume);
        this.MusicCommand("VOLUME", this.music.minValue);
        break;
      case "EXT_MUSIC-VOLUME_MAX":
        if (!this.music.connected) return;
        if (this.music.targetVolume <= this.music.minVolume) return;
        this.MusicCommand("VOLUME", this.music.targetValue);
        break;
      case "EXT_MUSIC-VOLUME_SET":
        if (isNaN(payload)) return console.log("ERROR MUSIC VOLUME", "Must be a number ! [0-100]", payload);
        var volumeToSet = payload;
        if (payload > 100) volumeToSet = 100;
        if (payload < 0) volumeToSet = 0;
        this.music.targetValue = this.convertPercentToValue(volumeToSet);
        this.music.targetVolume = volumeToSet;
        if (!this.music.assistantSpeak) this.MusicCommand("VOLUME", this.music.targetValue);
        break;
      case "EXT_MUSIC-NEXT":
        this.MusicCommand("NEXT");
        break;
      case "EXT_MUSIC-PREVIOUS":
        this.MusicCommand("PREVIOUS");
        break;
      case "EXT_MUSIC-REBUILD":
        this.MusicCommand("REBUILD");
        break;
      case "EXT_MUSIC-SWITCH":
        this.MusicCommand("SWITCH");
        break;
      case "EXT_MUSIC-PLAY":
        this.MusicCommand("PLAY");
        break;
      case "EXT_MUSIC-PAUSE":
        this.MusicCommand("PAUSE");
        break;
    }
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {

      /** Music Player **/
      case "Music_Player":
        if (payload.volume) this.music.currentVolume = payload.volume;
        if (payload.connected) {
          if (!this.music.connected) {
            this.canStop = true;
            this.music.connected = true;
            this.sendNotification("EXT_MUSIC-CONNECTED");
          }
          if (payload.pause) this.Music.setPause();
          else this.Music.setPlay();
        } else {
          if (this.music.connected) {
            this.canStop = true;
            this.music.connected = false;
            this.sendNotification("EXT_MUSIC-DISCONNECTED");
          }
        }
        this.Music.updateSongInfo(payload);
        break;
      case "WARNING":
        this.sendNotification("GA_ALERT", {
          type: "warning",
          message: `Error When Loading: ${payload.library}. Try to solve it with \`npm run rebuild\` in EXT-MusicPlayer folder`,
          timer: 10000
        });
        this.ready = false;
        break;
      case "ERROR":
        this.sendNotification("GA_ALERT", {
          type: "error",
          message: payload,
          timer: 10000
        });
        break;
      case "WARN":
        this.sendNotification("GA_ALERT", {
          type: "warning",
          message: payload,
          timer: 10000
        });
        break;
      case "WILL_PLAYING":
        this.sendNotification("EXT_VLCServer-WILL_PLAYING");
        break;
    }
  },

  /** initialise Music volume control for VLC **/
  initializeMusicVolumeVLC () {

    /** convert volume **/
    try {
      let valueMin = null;
      valueMin = parseInt(this.config.minVolume);
      if (typeof valueMin === "number" && valueMin < 0 && valueMin > 100) {
        console.error("[MUSIC] config.minVolume error! Corrected with 30");
        this.config.minVolume = 30;
      }
    } catch (e) {
      console.error("[MUSIC] config.minVolume error!", e);
      this.config.minVolume = 30;
    }
    try {
      let valueMax = null;
      valueMax = parseInt(this.config.maxVolume);
      if (typeof valueMax === "number" && valueMax < 0 && valueMax > 100) {
        console.error("[MUSIC] config.maxVolume error! Corrected with 100");
        this.config.maxVolume = 100;
      }
    } catch (e) {
      console.error("[MUSIC] config.maxVolume error!", e);
      this.config.maxVolume = 100;
    }
    console.log("[MUSIC] VLC Volume Control initialized!");
  },

  /****************************/
  /*** TelegramBot Commands ***/
  /****************************/
  EXT_TELBOTCommands (commander) {
    commander.add({
      command: "music",
      description: "Music player commands",
      callback: "tbMusic"
    });
  },

  tbMusic (command, handler) {
    if (handler.args) {
      var args = handler.args.toLowerCase().split(" ");
      if (args[0] === "play") {
        handler.reply("TEXT", "Music PLAY");
        this.MusicCommand("PLAY");
      }
      else if (args[0] === "pause") {
        handler.reply("TEXT", "Music PAUSE");
        this.MusicCommand("PAUSE");
      }
      else if (args[0] === "stop") {
        handler.reply("TEXT", "Music STOP");
        this.MusicCommand("STOP");
      }
      else if (args[0] === "next") {
        handler.reply("TEXT", "Music NEXT");
        this.MusicCommand("NEXT");
      }
      else if (args[0] === "previous") {
        handler.reply("TEXT", "Music PREVIOUS");
        this.MusicCommand("PREVIOUS");
      }
      else if (args[0] === "rebuild") {
        handler.reply("TEXT", "Rebuild music database");
        this.MusicCommand("REBUILD");
      }
      else if (args[0] === "volume") {
        if (args[1]) {
          if (isNaN(args[1])) return handler.reply("TEXT", "Must be a number ! [0-100]");
          if (args[1] > 100) args[1] = 100;
          if (args[1] < 0) args[1] = 0;
          handler.reply("TEXT", `Music VOLUME: ${args[1]}`);
          this.MusicCommand("VOLUME", this.convertPercentToValue(args[1]));
        } else handler.reply("TEXT", "Define volume [0-100]");
      }
      else if (args[0] === "switch") {
        handler.reply("TEXT", "Switch Database (USB Key/Local Folder)");
        this.MusicCommand("SWITCH");
      }
      else if (args[0] === "random") {
        this.random = !this.random;
        handler.reply("TEXT", `Random is now set to ${this.random}`);
        this.sendSocketNotification("MUSIC_RANDOM", this.random);
      }
      else if (!isNaN(args[0])) {
        let track = parseInt(args[0]);
        if (track > 0) {
          handler.reply("TEXT", `Start Playing id: ${track}`);
          this.MusicCommand("PLAY", track - 1);
        }
        else handler.reply("TEXT", "Track must be > 1");
      }
      else handler.reply("TEXT", `Unknow command: ${args[0]}`);
    } else {
      handler.reply("TEXT", "Need Help for /music commands ?\n\n\
  *play*: Launch music (last title)\n\
  *pause*: Pause music\n\
  *stop*: Stop music\n\
  *next*: Next track\n\
  *previous*: Previous track\n\
  *random*: Set Random (toggle)\n\
  *rebuild*: Rebuild music Database\n\
  *volume*: Volume control, it need a value 0-100\n\
  *switch*: Switch between USB Key and Local Folder\n\
  *<track_number>*: play the track number\n\
  ", { parse_mode: "Markdown" });
    }
  },

  /** Music commands/controls **/
  MusicCommand (command, payload) {
    switch (command) {
      case "PLAY":
        this.sendSocketNotification("MUSIC_PLAY", payload);
        break;
      case "PAUSE":
        this.sendSocketNotification("MUSIC_PAUSE");
        break;
      case "STOP":
        this.sendSocketNotification("MUSIC_STOP");
        break;
      case "NEXT":
        this.sendSocketNotification("MUSIC_NEXT");
        break;
      case "PREVIOUS":
        this.sendSocketNotification("MUSIC_PREVIOUS");
        break;
      case "VOLUME":
        this.sendSocketNotification("MUSIC_VOLUME_TARGET", payload);
        break;
      case "REBUILD":
        this.sendSocketNotification("MUSIC_REBUILD");
        break;
      case "SWITCH":
        this.sendSocketNotification("MUSIC_SWITCH");
        break;
    }
  },

  /** Convert percent to cvlc value **/
  convertPercentToValue (percent) {
    return parseInt(((percent * 256) / 100).toFixed(0));
  }
});
