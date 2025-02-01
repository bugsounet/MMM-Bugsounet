/* Spotify class rev: 220918 */

/* eslint-disable-next-line */
class Spotify {
  constructor (Config, callbacks) {
    this.config = Config;
    this.debug = this.config.debug;
    this.spotifyStatus = callbacks.spotifyStatus;
    this.spotifyPlaying = callbacks.spotifyPlaying;
    this.currentPlayback = null;
    this.connected = false;
    this.timer = null;
    this.ads = false;
    this.hide = (...args) => this.config.hide(...args);
    this.show = (...args) => this.config.show(...args);
    console.log("[SPOTIFY] Spotify Class Loaded");
  }

  /** Create a default display **/
  prepare () {
    var viewDom = document.createElement("div");
    viewDom.id = "EXT_SPOTIFY";
    if (this.config.mini) viewDom.classList.add("mini");
    else viewDom.classList.add("big");
    viewDom.classList.add("inactive");

    viewDom.appendChild(this.getHTMLElementWithID("div", "EXT_SPOTIFY_BACKGROUND"));

    const cover_img = this.getHTMLElementWithID("img", "EXT_SPOTIFY_COVER_IMAGE");
    cover_img.className = "fade-in";

    const cover = this.getHTMLElementWithID("div", "EXT_SPOTIFY_COVER");
    cover.appendChild(cover_img);

    const misc = this.getHTMLElementWithID("div", "EXT_SPOTIFY_MISC");
    misc.appendChild(this.getInfoContainer());
    misc.appendChild(this.getProgressContainer());
    misc.appendChild(this.getSpotifyLogoContainer());

    const fore = this.getHTMLElementWithID("div", "EXT_SPOTIFY_FOREGROUND");
    fore.appendChild(cover);
    fore.appendChild(misc);

    viewDom.appendChild(fore);
    return viewDom;
  }

  updatePlayback (status) { // hide show rules with animation !
    var dom = document.getElementById("EXT_SPOTIFY");

    clearTimeout(this.timer);
    this.timer = null;
    this.spotifyPlaying(status);
    if (this.connected && !status) {
      if (this.debug) console.log("[SPOTIFY] Disconnected");
      this.connected = false;
      this.spotifyStatus(false);

      this.hide(1000, () => {}, { lockString: "EXT-SPOTIFY_LOCK" });
      setTimeout(() => {
        dom.classList.add("inactive");
      }, 1000);
    }
    if (!this.connected && status) {
      if (this.debug) console.log("[SPOTIFY] Connected");
      this.connected = true;
      this.spotifyStatus(true);

      dom.classList.remove("inactive");
      this.show(1000, () => {}, { lockString: "EXT-SPOTIFY_LOCK" });
    }
  }

  updateCurrentSpotify (current) {
    if (!current) return;
    if (!this.currentPlayback) {
      this.updateSongInfo(current.item);
      this.updatePlaying(current.is_playing);
      this.updateDevice(current.device);
      this.updatePlayback(current.is_playing);
      if (current.device) this.updateVolume(current.device.volume_percent);
      if (current.is_playing && current.item) this.updateProgress(current.progress_ms, current.item.duration_ms);
    } else {
      if (!this.connected && current.is_playing) {
        this.updatePlayback(true);
      }

      /** for Ads **/
      if (current.currently_playing_type === "ad") {
        this.ads = true;
        current.is_playing = false;
      }
      if (this.currentPlayback.is_playing !== current.is_playing) {
        this.updatePlaying(current.is_playing);
      }
      if (current.currently_playing_type === "ad") {
        this.currentPlayback.is_playing = false;
        return;
      }
      if (this.ads) {
        this.currentPlayback = null;
        this.ads = false;
        return;
      }

      /** prevent all error **/
      if (!current.item || !current.device || !current.progress_ms || !current.item.duration_ms || !this.currentPlayback.item) return this.currentPlayback = null;
      if (!this.currentPlayback.item) return this.currentPlayback = current;

      /** All is good so ... live update **/
      if (this.currentPlayback.item.id !== current.item.id) {
        this.updateSongInfo(current.item);
      }
      if (this.currentPlayback.device.id !== current.device.id) {
        this.updateDevice(current.device);
      }
      if (this.currentPlayback.device.volume_percent !== current.device.volume_percent) {
        this.updateVolume(current.device.volume_percent);
      }
      if (this.currentPlayback.progress_ms !== current.progress_ms) {
        this.updateProgress(current.progress_ms, current.item.duration_ms);
      }
    }
    this.currentPlayback = current;
  }

  msToTime (duration) {
    let ret = "";
    let seconds = parseInt((duration / 1000) % 60),
      minutes = parseInt((duration / (1000 * 60)) % 60),
      hours = parseInt((duration / (1000 * 60 * 60)) % 24);
    if (hours > 0) {
      hours = (hours < 10) ? `0${hours}` : hours;
      ret = `${ret + hours}:`;
    }
    minutes = (minutes < 10) ? `0${minutes}` : minutes;
    seconds = (seconds < 10) ? `0${seconds}` : seconds;
    return `${ret + minutes}:${seconds}`;
  }

  updateProgress (progressMS, durationMS) {
    const bar = document.getElementById("EXT_SPOTIFY_PROGRESS_BAR");
    bar.value = progressMS;

    if (bar.max !== durationMS) bar.max = durationMS;

  }

  updateDevice (device) {
    const deviceContainer = document.querySelector("#EXT_SPOTIFY_DEVICE .text");
    const deviceIcon = document.getElementById("EXT_SPOTIFY_DEVICE_ICON");

    if (device.id === "EXT-Librespot") {
      deviceContainer.textContent = `${device.name}`;
    } else {
      deviceContainer.textContent = `${this.config.deviceDisplay} ${device.name}`;
    }
    deviceIcon.className = this.getFAIconClass(device.type);
  }

  updateVolume (volume_percent) {
    const volumeContainer = document.querySelector("#EXT_SPOTIFY_VOLUME .text");
    const volumeIcon = document.getElementById("EXT_SPOTIFY_VOLUME_ICON");

    volumeContainer.textContent = `${volume_percent}%`;
    volumeIcon.className = this.getVolumeIconClass(volume_percent);
  }

  getVolumeIconClass (volume_percent) {
    let iconClass = "VOL_OFF";
    if (volume_percent === 0) {
      return this.getFAIconClass(iconClass);
    }

    if (volume_percent < 40) iconClass = "VOL_LOW";
    else iconClass = volume_percent > 70 ? "VOL_HIGH" : "VOL_MID";
    return this.getFAIconClass(iconClass);
  }

  updatePlaying (isPlaying) {
    const s = document.getElementById("EXT_SPOTIFY");
    if (isPlaying) {
      s.classList.add("playing");
      s.classList.remove("pausing");
      this.spotifyPlaying(true);
    } else {
      s.classList.add("pausing");
      s.classList.remove("playing");
      this.spotifyPlaying(false);
    }
  }

  updateSongInfo (playbackItem) {
    if (!playbackItem) return;

    const cover_img = document.getElementById("EXT_SPOTIFY_COVER_IMAGE");
    let img_index = 1;

    var img_url;
    var display_name;
    if (playbackItem.album) {
      img_url = playbackItem.album.images[img_index].url;
      display_name = playbackItem.album.name;
    }
    else {
      img_url = playbackItem.images[img_index].url;
      display_name = playbackItem.show.name;
    }

    if (img_url !== cover_img.src) {

      const back = document.getElementById("EXT_SPOTIFY_BACKGROUND");
      back.classList.remove("fade-in");
      /* eslint-disable-next-line */
      let backOffSet = cover_img.offsetWidth; // needed !
      back.classList.add("fade-in");
      back.style.backgroundImage = `url(${img_url})`;

      cover_img.classList.remove("fade-in");
      /* eslint-disable-next-line */
      let offset = cover_img.offsetWidth; // needed !
      cover_img.classList.add("fade-in");
      cover_img.src = img_url;
    }

    const title = document.querySelector("#EXT_SPOTIFY_TITLE .text");
    title.textContent = playbackItem.name;

    const album = document.querySelector("#EXT_SPOTIFY_ALBUM .text");
    album.textContent = display_name;

    const artist = document.querySelector("#EXT_SPOTIFY_ARTIST .text");
    const artists = playbackItem.artists;
    let artistName = "";
    if (playbackItem.album) {
      for (let x = 0; x < artists.length; x++) {
        if (!artistName) {
          artistName = artists[x].name;
        } else {
          artistName += `, ${artists[x].name}`;
        }
      }
    } else {
      artistName = playbackItem.show.publisher;
    }
    artist.textContent = artistName;
  }

  getFAIcon (iconType) {
    switch (iconType) {
      case "Spotify":
        return "fab fa-spotify fa-sm";
      case "Title":
        return "fa fa-music fa-sm";
      case "Artist":
        return "fa fa-user fa-sm";
      case "Album":
        return "fa fa-folder fa-sm";
      // Volume Icons
      case "VOL_HIGH":
        return "mdi mdi-volume-high";
      case "VOL_MID":
        return "mdi mdi-volume-medium";
      case "VOL_LOW":
        return "mdi mdi-volume-low";
      case "VOL_OFF":
        return "mdi mdi-volume-off";
      // Device Icons
      case "Tablet":
        return "fas fa-tablet fa-sm";
      case "GameConsole":
        return "fas fa-gamepad fa-sm";
      case "AVR":
      case "STB":
        return "mdi mdi-audio-video";
      case "AudioDongle":
      case "CastVideo":
        return "mdi mdi-cast-connected";
      case "CastAudio":
      case "Speaker":
        return "mdi mdi-cast-audio";
      case "Automobile":
        return "fas fa-car fa-sm";
      case "Smartphone":
        return "fas fa-mobile fa-sm";
      case "TV":
        return "fas fa-tv fa-sm";
      case "Unknown":
      case "Computer":
        return "fa fa-desktop fa-sm";
      default:
        return "fa fa-headphones fa-sm";
    }
  }

  getFAIconClass (iconType) {
    return `infoicon ${this.getFAIcon(iconType)}`;
  }

  getIconContainer (className, id, icon) {
    const iconContainer = document.createElement("i");
    iconContainer.className = className;
    iconContainer.dataset.inline = "false";
    iconContainer.id = id;
    iconContainer.dataset.icon = icon;

    return iconContainer;
  }

  getHTMLElementWithID (type, id) {
    const divElement = document.createElement(type);
    divElement.id = id;
    return divElement;
  }

  getEmptyTextHTMLElement () {
    const text = document.createElement("span");
    text.className = "text";
    text.textContent = "";

    return text;
  }

  getDeviceContainer () {
    const device = this.getHTMLElementWithID("div", "EXT_SPOTIFY_DEVICE");
    device.appendChild(
      this.getIconContainer(this.getFAIconClass("default"), "EXT_SPOTIFY_DEVICE_ICON")
    );
    device.appendChild(this.getEmptyTextHTMLElement());

    return device;
  }

  getVolumeContainer () {
    const volume = this.getHTMLElementWithID("div", "EXT_SPOTIFY_VOLUME");
    volume.appendChild(
      this.getIconContainer(this.getFAIconClass("VOL_OFF"), "EXT_SPOTIFY_VOLUME_ICON")
    );
    volume.appendChild(this.getEmptyTextHTMLElement());

    return volume;
  }

  getSpotifyLogoContainer () {
    const logo = this.getHTMLElementWithID("div", "EXT_SPOTIFY_LOGO");
    logo.appendChild(
      this.getIconContainer(this.getFAIconClass("Spotify"), "EXT_SPOTIFY_LOGO_ICON")
    );
    const text = document.createElement("span");
    text.className = "text";
    text.innerHTML = "<span>Spotify<sup>Ⓡ</sup></span>";
    logo.appendChild(text);

    return logo;
  }

  getInfoContainer () {
    const info = this.getHTMLElementWithID("div", "EXT_SPOTIFY_INFO");
    const infoElementsWithIcon = {
      EXT_SPOTIFY_TITLE: "Title",
      EXT_SPOTIFY_ALBUM: "Album",
      EXT_SPOTIFY_ARTIST: "Artist"
    };

    for (const [key, iconType] of Object.entries(infoElementsWithIcon)) {
      const element = this.getHTMLElementWithID("div", key);
      element.appendChild(this.getIconContainer(this.getFAIconClass(iconType)));
      element.appendChild(this.getEmptyTextHTMLElement());
      info.appendChild(element);
    }

    info.appendChild(this.getDeviceContainer());
    info.appendChild(this.getVolumeContainer());
    return info;
  }

  getProgressContainer () {
    const progress = this.getHTMLElementWithID("div", "EXT_SPOTIFY_PROGRESS");

    const bar = this.getHTMLElementWithID("progress", "EXT_SPOTIFY_PROGRESS_BAR");
    bar.value = 0;
    bar.max = 100;

    progress.appendChild(bar);
    return progress;
  }

  getCoverContainer () {
    const cover_img = this.getHTMLElementWithID("img", "EXT_SPOTIFY_COVER_IMAGE");
    cover_img.className = "fade-in";

    const cover = this.getHTMLElementWithID("div", "EXT_SPOTIFY_COVER");
    cover.appendChild(cover_img);
    return cover;
  }

  getConnected () {
    return this.connected;
  }
}
