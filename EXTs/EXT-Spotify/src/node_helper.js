"use strict";

var NodeHelper = require("node_helper");

var logSpotify = () => { /* do nothing */ };
const spotify = require("./components/spotifyLib");

module.exports = NodeHelper.create({
  start () {
    this.retry = null;
    this.timeout = null;
    this.retryPlayerCount = 0;
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "INIT":
        console.log("[SPOTIFY] EXT-Spotify Version:", require("./package.json").version, "rev:", require("./package.json").rev);
        this.initialize(payload);
        break;

      /** Spotify module **/
      case "SPOTIFY_RETRY_PLAY":
        clearTimeout(this.timeout);
        this.timeout = null;
        clearTimeout(this.retry);
        this.retry = null;
        this.retry = setTimeout(() => {
          this.spotify.play(payload, (code, error, result) => {
            if ((code === 404) && (result.error.reason === "NO_ACTIVE_DEVICE")) {
              logSpotify("RETRY playing...");
              this.socketNotificationReceived("SPOTIFY_PLAY", payload);
            }
            if ((code !== 204) && (code !== 202)) {
              if (this.config.player.usePlayer) this.sendSocketNotification("WARNING", { message: "PlayerNoResponse", values: this.config.player.deviceName });
              return console.log("[SPOTIFY:PLAY] RETRY Error", code, error, result);
            }
            else {
              logSpotify("RETRY: DONE_PLAY");
              this.retryPlayerCount = 0;
              if (this.config.player.usePlayer) this.sendSocketNotification("SUCCESS", { message: "PlayerConnected", values: this.config.player.deviceName });
            }
          });
        }, 3000);
        break;
      case "SPOTIFY_PLAY":
        this.spotify.play(payload, (code, error, result) => {
          clearTimeout(this.timeout);
          this.timeout = null;
          if ((code === 404) && (result.error.reason === "NO_ACTIVE_DEVICE")) {
            this.retryPlayerCount++;
            if (this.retryPlayerCount >= 4) return this.retryPlayerCount = 0;
            if (this.config.player.usePlayer) {
              console.log("[SPOTIFY] No response from player !");
              this.sendSocketNotification("INFORMATION", { message: "PlayerConnecting" });
              this.sendSocketNotification("PLAYER_RECONNECT");
              this.timeout = setTimeout(() => {
                this.socketNotificationReceived("SPOTIFY_TRANSFER", this.config.player.deviceName);
                this.socketNotificationReceived("SPOTIFY_RETRY_PLAY", payload);
              }, 3000);
            }
          }
          if ((code !== 204) && (code !== 202)) {
            return console.log("[SPOTIFY:PLAY] Error", code, result);
          }
          else {
            logSpotify("DONE_PLAY");
            this.retryPlayerCount = 0;
          }
        });
        break;
      case "SPOTIFY_VOLUME":
        this.spotify.volume(payload, (code, error, result) => {
          if (code !== 204) console.log("[SPOTIFY:VOLUME] Error", code, result);
          else {
            this.sendSocketNotification("DONE_SPOTIFY_VOLUME", payload);
            logSpotify("DONE_VOLUME:", payload);
          }
        });
        break;
      case "SPOTIFY_PAUSE":
        this.spotify.pause((code, error, result) => {
          if ((code !== 204) && (code !== 202)) console.log("[SPOTIFY:PAUSE] Error", code, result);
          else logSpotify("DONE_PAUSE");
        });
        break;
      case "SPOTIFY_TRANSFER":
        this.spotify.transferByName(payload, (code, error, result) => {
          if ((code !== 204) && (code !== 202)) console.log("[SPOTIFY:TRANSFER] Error", code, result);
          else logSpotify("DONE_TRANSFER", payload);
        });
        break;
      case "SPOTIFY_TRANSFER_BYID":
        this.spotify.transferById(payload, (code, error, result) => {
          if ((code !== 204) && (code !== 202)) console.log("[SPOTIFY:TRANSFERID] Error", code, result);
          else logSpotify("DONE_TRANSFERID", payload);
        });
        break;
      case "SPOTIFY_STOP":
        if (this.config.player.usePlayer) this.sendSocketNotification("PLAYER_RECONNECT");
        break;
      case "SPOTIFY_NEXT":
        this.spotify.next((code, error, result) => {
          if ((code !== 204) && (code !== 202)) console.log("[SPOTIFY:NEXT] Error", code, result);
          else logSpotify("DONE_NEXT");
        });
        break;
      case "SPOTIFY_PREVIOUS":
        this.spotify.previous((code, error, result) => {
          if ((code !== 204) && (code !== 202)) console.log("[SPOTIFY:PREVIOUS] Error", code, result);
          else logSpotify("DONE_PREVIOUS");
        });
        break;
      case "SPOTIFY_SHUFFLE":
        this.spotify.shuffle(payload, (code, error, result) => {
          if ((code !== 204) && (code !== 202)) console.log("[SPOTIFY:SHUFFLE] Error", code, result);
          else logSpotify("DONE_SHUFFLE");
        });
        break;
      case "SPOTIFY_REPEAT":
        this.spotify.repeat(payload, (code, error, result) => {
          if ((code !== 204) && (code !== 202)) console.log("[SPOTIFY:REPEAT] Error", code, result);
          else logSpotify("DONE_REPEAT");
        });
        break;
      case "SPOTIFY_SEEK":
        this.spotify.seek(payload, (code, error, result) => {
          if ((code !== 204) && (code !== 202)) console.log("[SPOTIFY:SEEK] Error", code, result);
          else logSpotify("DONE_SEEK", payload);
        });
        break;
      case "SEARCH_AND_PLAY":
        logSpotify("Search and Play", payload);
        this.searchAndPlay(payload.query, payload.condition);
        break;
      case "ASK_DEVICES":
        this.spotify.updateDeviceList();
        break;
      case "LIBRESPOT-EVENTS":
        this.spotify.librespot(payload);
        break;
    }
  },

  async initialize (config) {
    this.config = config;
    if (this.config.debug) logSpotify = (...args) => { console.log("[SPOTIFY]", ...args); };
    logSpotify("Starting Spotify module...");
    try {
      this.spotify = new spotify(this.config.visual,
        (noti, params) => {
          this.sendSocketNotification(noti, params);
        },
        this.config.debug,
        false);
      this.spotify.start();
    } catch (e) {
      let error = "SPOTIFY: tokenSpotify.json file not found !";
      console.log(`[SPOTIFY] Error From library: ${e}`);
      this.sendSocketNotification("WARNING", { message: error });
    }
  },

  /** Spotify Search sub-function **/
  searchAndPlay (param, condition) {
    if (!param.type) {
      param.type = "artist,track,album,playlist";
    } else {
      param.type = param.type.replace(/\s/g, "");
    }
    if (!param.q) {
      param.q = "something cool";
    }
    var pickup = (items, random, retType) => {
      var ret = {};
      var r = (random)
        ? items[Math.floor(Math.random() * items.length)]
        : items[0];
      if (r.uri) {
        ret[retType] = (retType === "uris") ? [r.uri] : r.uri;
        return ret;
      } else {
        console.log("[SPOTIFY] Unplayable item: ", r);
        return false;
      }
    };
    this.spotify.search(param, (code, error, result) => {
      var foundForPlay = null;
      if (code === 200) { //When success
        const map = {
          tracks: "uris",
          artists: "context_uri",
          albums: "context_uri",
          playlists: "context_uri"
        };
        for (var section in map) {
          if (map.hasOwnProperty(section) && !foundForPlay) {
            var retType = map[section];
            if (result[section] && result[section].items.length > 1) {
              foundForPlay = pickup(result[section].items, condition.random, retType);
            }
          }
        }
        if (foundForPlay && condition.autoplay) {
          logSpotify("Search and Play Result:", foundForPlay);
          this.socketNotificationReceived("SPOTIFY_PLAY", foundForPlay);
        } else {
          logSpotify("Search and Play No Result");
          this.sendSocketNotification("WARNING", { message: "SpotifyNoResult" });
        }
      } else { //when fail
        console.log("[SPOTIFY] Search and Play failed !");
        this.sendSocketNotification("WARNING", { message: "SpotifySearchFailed" });
      }
    });
  },

  DisplayError (err, error, details = null) {
    if (details) console.log(`[SPOTIFY][ERROR]${err}`, details.message, details);
    else console.log(`[SPOTIFY][ERROR]${err}`);
    return this.sendSocketNotification("NOT_INITIALIZED", { message: error.message, values: error.values });
  }
});
