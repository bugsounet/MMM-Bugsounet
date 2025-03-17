//
// Spotify library
// Developers : Seongnoh Sean Yi (eouia0819@gmail.com)
//              bugsounet (bugsounet@bugsounet.fr)

const fs = require("fs");
const path = require("path");
const express = require("express");

const app = express();
const moment = require("dayjs");

var _Debug = () => { /* do nothing */ };

class Spotify {
  constructor (config, callback, debug = false, first = false) {
    this.notification = callback;
    this.default = {
      CLIENT_ID: "",
      CLIENT_SECRET: "",
      AUTH_DOMAIN: "http://localhost",
      AUTH_PATH: "/callback",
      AUTH_PORT: "8888",
      SCOPE: "user-read-private app-remote-control playlist-read-private streaming user-read-playback-state user-modify-playback-state",
      TOKEN: "./token.json",
      PATH: "../",
      updateInterval: 1000
    };
    this.retryTimer = null;
    this.timer = null;
    this.token = null;
    this.setup = first;
    this.config = Object.assign({}, this.default, config);
    if (debug) _Debug = (...args) => { console.log("[SPOTIFY]", ...args); };

    this.authorizationSeed = `Basic ${
      Buffer.from(
        `${this.config.CLIENT_ID}:${this.config.CLIENT_SECRET}`
      ).toString("base64")}`;
    this.initFromToken();
    // librespot
    this.librespotTimer = null;
    this.librespotResult = {
      device: {
        id: "EXT-Librespot",
        name: "MagicMirror",
        type: "Speaker",
        volume_percent: 100
      },
      progress_ms: 0,
      item: {
        album: {
          artists: [],
          images: [],
          name: ""
        },
        artists: [],
        duration_ms: 137368,
        id: 0,
        name: "Deck The Halls"
      },
      currently_playing_type: "track",
      is_playing: true
    };

    _Debug("Spotify library Initialized...");
  }

  async pulse () {
    let idle = false;
    try {
      let result = await this.updateSpotify(this.config);
      this.notification("SPOTIFY_PLAY", result);
    } catch (e) {
      idle = true;
      if (e) console.log("[SPOTIFY:ERROR]", e);
      this.notification("SPOTIFY_IDLE");
    }
    this.timer = setTimeout(() => {
      this.timer = null;
      clearTimeout(this.timer);
      this.pulse();
    }, idle ? this.config.idleInterval : this.config.updateInterval);
  }

  start () {
    _Debug("Started...");
    this.pulse();
  }

  stop () {
    clearTimeout(this.timer);
    this.timer = null;
    clearTimeout(this.retryTimer);
    this.retryTimer = null;
    _Debug("Stop");
  }

  updateDeviceList () {
    this.getDevices((code, error, result) => {
      if (result === "undefined" || code !== 200) {
        console.log("[SPOTIFY:DEVICE LIST] Error", code, result);
      } else {
        _Debug("[DEVICE LIST]", result);
        this.notification("SPOTIFY_DEVICELIST", result);
      }
    });
  }

  updateSpotify () {
    return new Promise((resolve, reject) => {
      this.getCurrentPlayback((code, error, result) => {
        if (result === "undefined" || code !== 200) {
          reject();
        } else {
          resolve(result);
        }
      });
    });
  }

  writeToken (output, cb = null) {
    var token = Object.assign({}, output);
    token.expires_at = Date.now() + ((token.expires_in - 60) * 1000);
    this.token = token;
    var file = path.resolve(__dirname, this.config.PATH + this.config.TOKEN);
    fs.writeFileSync(file, JSON.stringify(token));
    _Debug("Token is written...");
    _Debug("Token expire", moment(this.token.expires_at).format("LLLL"));
    if (cb) cb();
  }

  initFromToken () {
    var file = path.resolve(__dirname, this.config.PATH + this.config.TOKEN);
    if (fs.existsSync(file)) {
      this.token = JSON.parse(fs.readFileSync(file));
    }
    else {
      if (!this.setup) throw Error(`[SPOTIFY:ERROR] Token not found in ${file}`);
    }
  }

  isExpired () {
    return (Date.now() >= this.token.expires_at);
  }

  refreshToken (cb = null) {
    _Debug("Token refreshing...");
    var refresh_token = this.token.refresh_token;
    let data = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh_token
    });

    var authOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: this.authorizationSeed
      },
      body: data.toString()
    };

    fetch("https://accounts.spotify.com/api/token", authOptions)
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          console.error("[SPOTIFY:ERROR] Token refreshing failed:", data);
          if (cb) cb();
        } else {
          data.refresh_token = this.token.refresh_token;
          this.writeToken(data, cb);
        }
      })
      .catch((error) => {
        console.error("[SPOTIFY:ERROR] Token refreshing failed:", error);
      });
  }

  accessToken () {
    return (this.token.access_token) ? this.token.access_token : null;
  }

  doRequest (api, type, qsParam, bodyParam, cb) {
    if (!this.token) {
      console.log("[SPOTIFY:ERROR] Token Error !", this.config.TOKEN);
      return;
    }
    let url = `https://api.spotify.com${api}`;
    var authOptions = {
      method: type,
      headers: {
        Authorization: `Bearer ${this.token.access_token}`
      }
    };
    if (bodyParam) authOptions.body = JSON.stringify(bodyParam);
    if (qsParam) {
      let Params = new URLSearchParams(qsParam);
      url = `${url}/?${Params}`;
    }

    var req = () => {
      let status = null;
      let statusText = null;
      fetch(url, authOptions)
        .then((response) => {
          status = response.status;
          statusText = response.statusText;
          if (status === 400) throw new Error(status);
          if (status === 204 || status === 202) return null;
          return response.json();
        })
        .then((data) => {
          if (api !== "/v1/me/player" && type !== "GET") _Debug("API Requested:", api);
          if (cb) cb(status, null, data);
        })
        .catch((error) => {
          _Debug("API Request fail on :", api);
          if (status) _Debug("---> Error", status, statusText, "qsParam:", qsParam, "authOptions:", authOptions);
          if (cb) {
            _Debug("!!!---> Detail", error);
            _Debug("Retry in 5 sec...");
            this.retryTimer = setTimeout(() => { cb("400", error, null); }, 5000);
          }
        });
    };

    if (this.isExpired()) {
      this.refreshToken(req);
    } else {
      req();
    }
  }

  getCurrentPlayback (cb) {
    var params = {
      additional_types: "episode,track"
    };
    this.doRequest("/v1/me/player", "GET", params, null, cb);
  }

  getDevices (cb) {
    this.doRequest("/v1/me/player/devices", "GET", null, null, cb);
  }

  play (param, cb) {
    this.doRequest("/v1/me/player/play", "PUT", null, param, cb);
  }

  pause (cb) {
    this.doRequest("/v1/me/player/pause", "PUT", null, null, cb);
  }

  next (cb) {
    this.doRequest("/v1/me/player/next", "POST", null, null, cb);
  }

  /* eslint-disable no-unused-vars */
  previous (cb) {
    this.doRequest("/v1/me/player/seek", "PUT", { position_ms: 0 }, null, (code, error, body) => {
      this.doRequest("/v1/me/player/previous", "POST", null, null, cb);
    });
  }
  /* eslint-enable no-unused-vars */

  seek (position, cb) {
    this.doRequest("/v1/me/player/seek", "PUT", { position_ms: position }, null, cb);
  }

  search (param, cb) {
    param.limit = 50;
    this.doRequest("/v1/search", "GET", param, null, cb);
  }

  transfer (req, cb) {
    if (req.device_ids.length > 1) {
      req.device_ids = [req.device_ids[0]];
    }
    this.doRequest("/v1/me/player", "PUT", null, req, cb);
  }

  transferByName (device_name, cb) {
    this.getDevices((code, error, result) => {
      if (code === 200) {
        let devices = result.devices;
        for (let i = 0; i < devices.length; i++) {
          if (devices[i].name === device_name) {
            this.transfer({ device_ids: [devices[i].id] }, cb);
            return;
          }
        }
      } else {
        cb(code, error, result);
      }
    });
  }

  transferById (device, cb) {
    this.transfer({ device_ids: [device] }, cb);
  }

  volume (volume = 50, cb) {
    this.doRequest("/v1/me/player/volume", "PUT", { volume_percent: volume }, null, cb);
  }

  repeat (state, cb) {
    this.doRequest("/v1/me/player/repeat", "PUT", { state: state }, null, cb);
  }

  shuffle (state, cb) {
    this.doRequest("/v1/me/player/shuffle", "PUT", { state: state }, null, cb);
  }

  replay (cb) {
    this.doRequest("/v1/me/player/seek", "PUT", { position_ms: 0 }, null, cb);
  }

  async authFlow (afterCallback = () => {}, err = () => {}) {
    var redirect_uri = `${this.config.AUTH_DOMAIN}:${this.config.AUTH_PORT}${this.config.AUTH_PATH}`;

    if (!this.config.CLIENT_ID) {
      let msg = "[SPOTIFY_AUTH] CLIENT_ID doesn't exist.";
      err(msg);
      return;
    }

    if (this.token) {
      let msg = "[SPOTIFY_AUTH] You already have a token. no need to auth.";
      err(msg);
      return;
    }

    let server = app.get(this.config.AUTH_PATH, (req, res) => {
      let code = req.query.code || null;
      let data = new URLSearchParams({
        code: code,
        redirect_uri: redirect_uri,
        grant_type: "authorization_code"
      });
      let authOptions = {
        method: "POST",
        body: data.toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: this.authorizationSeed
        }
      };
      fetch("https://accounts.spotify.com/api/token", authOptions)
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            console.error("[SPOTIFY_AUTH] Error ", data);
            server.close();
            res.send(`Error: ${data.error_description}`);
            throw new Error(data.error_description);
          }
          this.writeToken(data);
          server.close();
          res.send(`${this.config.TOKEN} would be created. Check it`);
          afterCallback();
        })
        .catch(() => {
          err("[SPOTIFY_AUTH] Error in request");
        });
    }).listen(this.config.AUTH_PORT);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.config.CLIENT_ID,
      scope: this.config.SCOPE,
      redirect_uri: redirect_uri,
      state: Date.now(),
      show_dialog: true
    });

    let url = `https://accounts.spotify.com/authorize?${params}`;

    const open = await loadOpen();
    console.log("[SPOTIFY_AUTH] Opening the browser for authentication on Spotify...");
    open(url).catch(() => {
      console.log("[SPOTIFY_AUTH] Failed to automatically open the URL. Copy/paste this in your browser:\n", url);
    });
  }

  librespot (event) {
    switch (event.event) {
      case "session_disconnected":
        _Debug("Librespot disconnected");
        clearInterval(this.librespotTimer);
        this.librespotTimer = null;
        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = null;
        }
        this.pulse();
        break;
      case "session_connected":
        _Debug("Librespot connected");
        clearInterval(this.librespotTimer);
        this.librespotTimer = null;
        this.SendLibrespotResult();
        break;
      case "session_client_changed":
        this.librespotResult.device.name = event.client_name;
        if (event.client_name === "") this.librespotResult.device.name = this.config.LibrespotPlayer;
        break;
      case "volume_changed":
        this.librespotResult.device.volume_percent = (Number(event.volume) * 100 / 65535).toFixed(0);
        break;
      case "shuffle_changed":
        break;
      case "repeat_changed":
        break;
      case "track_changed":
        var commonMeta = event.common_metadata_fields;
        var trackMeta = event.track_metadata_fields;
        this.librespotResult.item.id = event.common_metadata_fields.track_id;
        this.librespotResult.item.name = event.common_metadata_fields.name;
        var artists = trackMeta.artists;
        this.librespotResult.item.artists = [];
        artists.forEach((artist) => {
          this.librespotResult.item.artists.push({ name: artist });
        });
        this.librespotResult.item.album.name = event.track_metadata_fields.album;
        var images = commonMeta.covers;
        this.librespotResult.item.album.images = [];
        images.forEach((image) => {
          this.librespotResult.item.album.images.push({ url: image });
        });
        this.librespotResult.item.duration_ms = Number(event.common_metadata_fields.duration_ms);
        break;
      case "playing":
        this.librespotResult.item.id = event.track_id;
        this.librespotResult.progress_ms = Number(event.position_ms);
        this.librespotResult.is_playing = true;
        break;
      case "paused":
        this.librespotResult.progress_ms = Number(event.position_ms);
        this.librespotResult.is_playing = false;
        break;
      case "seeked":
        this.librespotResult.progress_ms = Number(event.position_ms);
        break;
    }
  }

  SendLibrespotResult () {
    this.librespotTimer = setInterval(() => {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      if (this.librespotResult.is_playing) this.librespotResult.progress_ms = this.librespotResult.progress_ms + 1000;
      if (this.librespotResult.progress_ms > this.librespotResult.item.duration_ms) this.librespotResult.progress_ms = this.librespotResult.item.duration_ms;
      this.notification("SPOTIFY_PLAY", this.librespotResult);
    }, 1000);
  }
}

// import Open library and use default function only
async function loadOpen () {
  const loaded = await import("open");
  return loaded.default;
}

module.exports = Spotify;
