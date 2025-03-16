/**
 ** Plugin: EXT-Spotify
 ** @bugsounet
 **/

/* global Spotify */

var logSpotify = () => { /* do nothing */ };

Module.register("EXT-Spotify", {
  defaults: {
    debug: false,
    mini: true,
    updateInterval: 1000,
    idleInterval: 10000,
    CLIENT_ID: "",
    CLIENT_SECRET: ""
  },

  start () {
    if (this.config.debug) logSpotify = (...args) => { console.log("[SPOTIFY]", ...args); };

    /** make default config **/
    this.Player = {
      usePlayer: false,
      deviceName: "MagicMirror",
      minVolume: 30,
      maxVolume: 100
    };
    this.Visual = {
      updateInterval: this.config.updateInterval,
      idleInterval: this.config.idleInterval,
      PATH: "../",
      TOKEN: "tokenSpotify.json",
      CLIENT_ID: this.config.CLIENT_ID,
      CLIENT_SECRET: this.config.CLIENT_SECRET
    };
    this.init = false;
    this.SpotifyCurrentID = null;

    /** Search player **/
    let Librespot = config.modules.find((m) => m.module === "MMM-Bugsounet/EXTs/EXT-Librespot");
    if (Librespot && !Librespot.disabled) {
      this.Player.usePlayer = true;
      logSpotify("Player Found!");
      if (Librespot) {
        try {
          this.Player.minVolume = Librespot.config.minVolume ? Librespot.config.minVolume : 30;
        } catch { /* do nothing */ }
        try {
          this.Player.maxVolume = Librespot.config.maxVolume ? Librespot.config.maxVolume : 100;
        } catch { /* do nothing */ }
        try {
          this.Player.deviceName = Librespot.config.deviceName ? Librespot.config.deviceName : "MagicMirror";
        } catch { /* do nothing */ }
      }
    }

    this.spotify = {
      connected: false,
      player: false,
      is_playing: false,
      currentVolume: 0,
      targetVolume: this.Player.maxVolume,
      repeat: null,
      shuffle: null
    };
    this.assistantSpeak = false;
    var callbacks = {
      spotifyStatus: (status) => {
        if (status) {

          /** Spotify active **/
          this.spotify.connected = true;
          this.sendNotification("Bugsounet_SPOTIFY-CONNECTED");
        } else {

          /** Spotify inactive **/
          this.sendNotification("Bugsounet_SPOTIFY-DISCONNECTED");
          this.spotify.connected = false;
          logSpotify("spotifyStatus: PLAYER Disconnected");
          this.sendNotification("Bugsounet_SPOTIFY-PLAYER_DISCONNECTED");
          this.spotify.player = false;
        }
      },
      spotifyPlaying: (play) => {
        this.sendNotification("Bugsounet_SPOTIFY-PLAYING", play);
      },
      init: () => { this.init = true; },
      command: (command, param) => {
        switch (command) {
          case "PLAY":
            this.SpotifyCommand("PLAY");
            break;
          case "PAUSE":
            this.SpotifyCommand("PAUSE");
            break;
          case "NEXT":
            this.SpotifyCommand("NEXT");
            break;
          case "PREVIOUS":
            this.SpotifyCommand("PREVIOUS");
            break;
          case "SEEK":
            this.SpotifyCommand("SEEK", param);
            break;
          case "REPEAT":
            this.SpotifyCommand("REPEAT");
            break;
          case "SHUFFLE":
            this.SpotifyCommand("SHUFFLE");
            break;
          case "TRANSFERID":
            this.sendSocketNotification("SPOTIFY_TRANSFER_BYID", param);
            break;
          case "VOLUME":
            var Volume = param;
            if (isNaN(Volume)) {
              this.sendNotification("GA_ALERT", {
                type: "error",
                message: "Volume MUST be a number ! [0-100]",
                icon: this.file("components/Spotify-Logo.png")
              });
              console.error("[SPOTIFY] Volume Must be a number ! [0-100]");
              return;
            }
            if (Volume > 100) Volume = 100;
            if (Volume < 0) Volume = 0;
            logSpotify(`Volume FORCE SET: ${Volume}`);
            this.spotify.targetVolume = Volume;
            if (!this.assistantSpeak) this.sendSocketNotification("SPOTIFY_VOLUME", this.spotify.targetVolume);
            break;
        }
      },
      alert: (params) => {
        this.sendNotification("GA_ALERT", params);
      }
    };
    this.configHelper = {
      visual: this.Visual,
      player: this.Player,
      debug: this.config.debug
    };
    this.configClass = {
      debug: this.config.debug,
      deviceDisplay: this.translate("SpotifyListenText"),
      mini: this.config.mini,
      hide: (...args) => this.hide(...args),
      show: (...args) => this.show(...args)
    };
    logSpotify("configHelper:", this.configHelper);
    this.Spotify = new Spotify(this.configClass, callbacks);
  },

  getScripts () {
    return [this.file("components/spotifyClass.js")];
  },

  getStyles () {
    return [
      "EXT-Spotify.css",
      "modules/MMM-Bugsounet/node_modules/@mdi/font/css/materialdesignicons.min.css",
      "font-awesome.css"
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

    /** Create Spotify **/
    return this.Spotify.prepare();
  },

  notificationReceived (noti, payload, sender) {
    switch (noti) {
      case "Bugsounet_READY":
        if (sender.name === "MMM-Bugsounet") {
          this.sendSocketNotification("INIT", this.configHelper);
          this.sendNotification("Bugsounet_HELLO", this.name);
        }
        break;
      case "Bugsounet_SPOTIFY-VOLUME_MIN":
        if (!this.spotify.player) return;
        if (this.spotify.currentVolume <= this.configHelper.player.minVolume) return;
        this.spotify.targetVolume = this.spotify.currentVolume;
        this.sendSocketNotification("SPOTIFY_VOLUME", this.configHelper.player.minVolume);
        break;
      case "Bugsounet_SPOTIFY-VOLUME_MAX":
        if (!this.spotify.player) return;
        if (this.spotify.targetVolume <= this.configHelper.player.minVolume) return;
        this.sendSocketNotification("SPOTIFY_VOLUME", this.spotify.targetVolume);
        break;
      case "Bugsounet_SPOTIFY-VOLUME_SET":
        var setVolume = payload;
        if (!this.spotify.player || !setVolume) return;
        if (isNaN(setVolume)) {
          this.sendNotification("Bugsounet_ALERT", {
            type: "error",
            message: "Volume MUST be a number ! [0-100]",
            icon: this.file("components/Spotify-Logo.png")
          });
          console.error("[SPOTIFY] Volume Must be a number ! [0-100]");
          return;
        }
        if (setVolume > 100) setVolume = 100;
        if (setVolume < 0) setVolume = 0;
        logSpotify(`Volume SET: ${setVolume}`);
        this.spotify.targetVolume = setVolume;
        if (!this.assistantSpeak) this.sendSocketNotification("SPOTIFY_VOLUME", this.spotify.targetVolume);
        break;
      case "Bugsounet_SPOTIFY-PLAY":
        this.SpotifyCommand("PLAY", payload);
        break;
      case "Bugsounet_SPOTIFY-PAUSE":
        this.SpotifyCommand("PAUSE");
        break;
      case "Bugsounet_SPOTIFY-PLAY-TOGGLE":
        if (this.spotify.connected && this.spotify.player && this.spotify.is_playing) this.SpotifyCommand("PAUSE");
        else this.SpotifyCommand("PLAY", payload);
        break;
      case "Bugsounet_STOP":
        if (!this.spotify.connected) return; // don't force to stop if no device play...
        if (this.spotify.player) this.sendSocketNotification("SPOTIFY_STOP");
        break;
      case "Bugsounet_SPOTIFY-STOP":
        this.SpotifyCommand("STOP");
        break;
      case "Bugsounet_SPOTIFY-NEXT":
        this.SpotifyCommand("NEXT");
        break;
      case "Bugsounet_SPOTIFY-PREVIOUS":
        this.SpotifyCommand("PREVIOUS");
        break;
      case "Bugsounet_SPOTIFY-SHUFFLE":
        this.SpotifyCommand("SHUFFLE");
        break;
      case "Bugsounet_SPOTIFY-REPEAT":
        this.SpotifyCommand("REPEAT");
        break;
      case "Bugsounet_SPOTIFY-TRANSFER":
        this.SpotifyCommand("TRANSFER", payload);
        break;
      case "Bugsounet_SPOTIFY-SEARCH":
        this.SpotifyCommand("SEARCH", payload);
        break;
      case "Bugsounet_SPOTIFY-SEEK":
        this.SpotifyCommand("SEEK", payload);
        break;
      case "Bugsounet_LIBRESPOT-PLAYING":
        this.sendSocketNotification("LIBRESPOT-EVENTS", payload);
        break;
    }
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {

      /** Spotify module **/
      case "SPOTIFY_PLAY":
        this.Spotify.updateCurrentSpotify(payload);
        if (!this.spotify.connected) return; // don't check if not connected (use spotify callback)
        if (payload && payload.device && payload.device.name) {
          this.spotify.is_playing = payload.is_playing;
          this.spotify.repeat = payload.repeat_state;
          this.spotify.shuffle = payload.shuffle_state;
          if ((payload.device.id === "EXT-Librespot") || (payload.device.name === this.configHelper.player.deviceName)) {
            this.spotify.currentVolume = payload.device.volume_percent;
            if (!this.spotify.player) {
              this.spotify.player = true;
              logSpotify("SPOTIFY_PLAY: PLAYER Connected");
              this.sendNotification("Bugsounet_SPOTIFY-PLAYER_CONNECTED");
            }
          }
          else {
            if (this.spotify.player) {
              this.spotify.player = false;
              logSpotify("SPOTIFY_PLAY: PLAYER Disconnected");
              this.sendNotification("Bugsounet_SPOTIFY-PLAYER_DISCONNECTED");
            }
          }
        }
        break;
      case "SPOTIFY_IDLE":
        this.Spotify.updatePlayback(false);
        this.spotify.player = false;
        break;
      case "DONE_SPOTIFY_VOLUME":
        logSpotify("Volume done:", payload);
        break;
      case "INFORMATION":
        this.sendNotification("Bugsounet_ALERT", {
          type: "information",
          message: this.translate(payload.message, { VALUES: payload.values }),
          icon: this.file("components/Spotify-Logo.png")
        });
        break;
      case "WARNING":
        this.sendNotification("Bugsounet_ALERT", {
          type: "warning",
          message: this.translate(payload.message, { VALUES: payload.values }),
          icon: this.file("components/Spotify-Logo.png")
        });
        break;
      case "SUCCESS":
        this.sendNotification("Bugsounet_ALERT", {
          type: "success",
          message: this.translate(payload.message, { VALUES: payload.values }),
          icon: this.file("components/Spotify-Logo.png")
        });
        break;
      case "PLAYER_RECONNECT":
        this.sendNotification("Bugsounet_PLAYER-SPOTIFY_RECONNECT");
        break;
    }
  },

  /****************************/
  /*** TelegramBot Commands ***/
  /****************************/
  EXT_TELBOTCommands (commander) {
    commander.add({
      command: "spotify",
      description: "Spotify commands",
      callback: "tbSpotify"
    });
  },

  tbSpotify (command, handler) {
    if (handler.args) {
      var args = handler.args.toLowerCase().split(" ");
      var params = handler.args.split(" ");
      if (args[0] === "play") {
        handler.reply("TEXT", "Spotify PLAY");
        this.SpotifyCommand("PLAY");
      }
      if (args[0] === "pause") {
        handler.reply("TEXT", "Spotify PAUSE");
        this.SpotifyCommand("PAUSE");
      }
      if (args[0] === "stop") {
        handler.reply("TEXT", "Spotify STOP");
        this.SpotifyCommand("STOP");
      }
      if (args[0] === "next") {
        handler.reply("TEXT", "Spotify NEXT");
        this.SpotifyCommand("NEXT");
      }
      if (args[0] === "previous") {
        handler.reply("TEXT", "Spotify PREVIOUS");
        this.SpotifyCommand("PREVIOUS");
      }
      if (args[0] === "volume") {
        if (args[1]) {
          if (isNaN(args[1])) return handler.reply("TEXT", "Must be a number ! [0-100]");
          if (args[1] > 100) args[1] = 100;
          if (args[1] < 0) args[1] = 0;
          handler.reply("TEXT", `Spotify VOLUME: ${args[1]}`);
          this.SpotifyCommand("VOLUME", args[1]);
        } else handler.reply("TEXT", "Define volume [0-100]");
      }
      if (args[0] === "to") {
        if (args[1]) {
          handler.reply("TEXT", `Spotify TRANSFER to: ${params[1]} (if exist !)`);
          this.SpotifyCommand("TRANSFER", params[1]);
        }
        else handler.reply("TEXT", "Define the device name (case sensitive)");
      }
    } else {
      handler.reply("TEXT", "Need Help for /spotify commands ?\n\n\
  *play*: Launch music (last title)\n\
  *pause*: Pause music\n\
  *stop*: Stop music\n\
  *next*: Next track\n\
  *previous*: Previous track\n\
  *volume*: Volume control, it need a value 0-100\n\
  *to*: Transfert music to another device (case sensitive)\
  ", { parse_mode: "Markdown" });
    }
  },

  /** Spotify commands **/
  SpotifyCommand (command, payload) {
    switch (command) {
      case "PLAY":
        this.sendSocketNotification("SPOTIFY_PLAY", payload);
        break;
      case "PAUSE":
        this.sendSocketNotification("SPOTIFY_PAUSE");
        break;
      case "STOP":
        if (!this.spotify.connected) return; // don't force to stop if no device play...
        if (this.spotify.player) {
          this.sendSocketNotification("SPOTIFY_STOP");
        }
        else this.sendSocketNotification("SPOTIFY_PAUSE");
        break;
      case "NEXT":
        this.sendSocketNotification("SPOTIFY_NEXT");
        break;
      case "PREVIOUS":
        this.sendSocketNotification("SPOTIFY_PREVIOUS");
        break;
      case "SHUFFLE":
        this.sendSocketNotification("SPOTIFY_SHUFFLE", !this.spotify.shuffle);
        break;
      case "REPEAT":
        var nextRepeatState;
        if (this.spotify.repeat === "off") nextRepeatState = "context";
        if (this.spotify.repeat === "context") nextRepeatState = "track";
        if (this.spotify.repeat === "track") nextRepeatState = "off";
        this.sendSocketNotification("SPOTIFY_REPEAT", nextRepeatState);
        break;
      case "TRANSFER":
        this.sendSocketNotification("SPOTIFY_TRANSFER", payload);
        break;
      case "VOLUME":
        this.notificationReceived("EXT_SPOTIFY-VOLUME_SET", payload);
        break;
      case "SEEK":
        this.sendSocketNotification("SPOTIFY_SEEK", payload);
        break;
      case "SEARCH":

        /** enforce type **/
        var searchType = payload.query.split(" ");
        var type = null;
        if (searchType[0] === this.translate("SpotifySearchTypePlaylist")) type = "playlist";
        else if (searchType[0] === this.translate("SpotifySearchTypeAlbum")) type = "album";
        else if (searchType[0] === this.translate("SpotifySearchTypeTrack")) type = "track";
        else if (searchType[0] === this.translate("SpotifySearchTypeArtist")) type = "artist";
        if (type) {
          payload.query = payload.query.replace(`${searchType[0]} `, "");
          payload.type = type;
        }
        var pl = {
          query: {
            q: payload.query,
            type: payload.type
          },
          condition: {
            random: payload.random,
            autoplay: true
          }
        };
        this.sendSocketNotification("SEARCH_AND_PLAY", pl);
        break;
    }
  }
});
