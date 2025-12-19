/**
 ** Plugin: EXT-Spotify
 ** @bugsounet
 **/

/* global Spotify Bugsounet_translate */

var logSpotify = () => { /* do nothing */ };

Module.register("EXT-Spotify", {
  defaults: {
    debug: false,
    mini: true
  },

  start () {
    if (this.config.debug) logSpotify = (...args) => { console.log("[SPOTIFY]", ...args); };

    /** make default config **/
    this.Visual = {
      LibrespotPlayer: "MagicMirror²"
    };
    this.init = false;

    /** Search player **/
    let Librespot = config.modules.find((m) => m.module === "MMM-Bugsounet/EXTs/EXT-Librespot");
    if (Librespot && !Librespot.disabled) {
      logSpotify("Player Found:", Librespot.config.deviceName);
    }

    this.spotify = {
      connected: false,
      player: false,
      is_playing: false,
      currentVolume: 0,
      targetVolume: 0,
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
        }
      },
      spotifyPlaying: (play) => {
        this.sendNotification("Bugsounet_SPOTIFY-PLAYING", play);
      },
      init: () => { this.init = true; },
      alert: (params) => {
        this.sendNotification("Bugsounet_ALERT", params);
      }
    };
    this.configHelper = {
      visual: this.Visual,
      player: this.Player,
      debug: this.config.debug
    };
    this.configClass = {
      debug: this.config.debug,
      deviceDisplay: Bugsounet_translate("EXT-Spotify_ListenText"),
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

  getDom () {

    /** Create Spotify **/
    return this.Spotify.prepare();
  },

  notificationReceived (noti, payload, sender) {
    switch (noti) {
      case "Bugsounet_READY":
        if (sender.name === "MMM-Bugsounet") {
          this.sendSocketNotification("INIT", this.configHelper);
          this.sendNotification("Bugsounet_HELLO");
        }
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
        break;
      case "SPOTIFY_IDLE":
        this.Spotify.updatePlayback(false);
        this.spotify.player = false;
        break;
      case "INFORMATION":
        this.sendNotification("Bugsounet_ALERT", {
          type: "information",
          message: Bugsounet_translate(payload.message, { VALUES: payload.values }),
          icon: this.file("components/Spotify-Logo.png")
        });
        break;
      case "WARNING":
        this.sendNotification("Bugsounet_ALERT", {
          type: "warning",
          message: Bugsounet_translate(payload.message, { VALUES: payload.values }),
          icon: this.file("components/Spotify-Logo.png")
        });
        break;
    }
  }
});
