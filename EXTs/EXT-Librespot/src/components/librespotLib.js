//
// Librespot library

var _Debug = () => { /* do nothing */ };

class Librespot {
  constructor (config, callback) {
    this.notification = callback;
    this.default = {
    };
    this.config = Object.assign({}, this.default, config);
    if (this.config.debug) _Debug = (...args) => { console.log("[LIBRESPOT]", ...args); };

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

    _Debug("Librespot library Initialized...");
  }

  librespot (event) {
    switch (event.event) {
      case "session_disconnected":
        _Debug("session disconnected");
        if (this.librespotTimer) {
          clearInterval(this.librespotTimer);
          this.librespotTimer = null;
          this.notification("IDLE");
        }
        break;
      case "session_connected":
        _Debug("session connected");
        this.librespotTimer = null;
        this.SendLibrespotResult();
        break;
      case "session_client_changed":
        _Debug("session client changed");
        this.librespotResult.device.name = event.client_name;
        if (event.client_name === "") this.librespotResult.device.name = this.config.deviceName;
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
      if (this.librespotResult.is_playing) this.librespotResult.progress_ms = this.librespotResult.progress_ms + 1000;
      if (this.librespotResult.progress_ms > this.librespotResult.item.duration_ms) this.librespotResult.progress_ms = this.librespotResult.item.duration_ms;
      this.notification("EVENTS", this.librespotResult);
    }, 1000);
  }
}

module.exports = Librespot;
