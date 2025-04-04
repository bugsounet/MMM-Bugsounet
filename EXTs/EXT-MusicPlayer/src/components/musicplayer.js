/* eslint-disable-next-line */
class Music {
  constructor (Config) {
    this.config = Config;
    this.debug = Config.debug;
    this.currentPlayback = null;
    this.connected = false;
    this.hideTimer = null;
    this.hide = (...args) => Config.hide(...args);
    this.show = (...args) => Config.show(...args);
    this.file = (args) => Config.file(args);
    console.log("[MUSIC] Music Player Loaded");
  }

  /** Create a default display **/
  prepare () {
    var viewDom = document.createElement("div");
    viewDom.id = "EXT_MUSIC";
    viewDom.className = "inactive";

    viewDom.appendChild(this.getHTMLElementWithID("div", "EXT_MUSIC_BACKGROUND"));

    const cover_img = this.getHTMLElementWithID("img", "EXT_MUSIC_COVER_IMAGE");
    cover_img.className = "fade-in";

    const cover = this.getHTMLElementWithID("div", "EXT_MUSIC_COVER");
    cover.appendChild(cover_img);

    const misc = this.getHTMLElementWithID("div", "EXT_MUSIC_MISC");
    misc.appendChild(this.getInfoContainer());
    misc.appendChild(this.getVolumeContainer());
    misc.appendChild(this.getProgressContainer());
    misc.appendChild(this.getMusicLogoContainer());

    const fore = this.getHTMLElementWithID("div", "EXT_MUSIC_FOREGROUND");
    fore.appendChild(cover);
    fore.appendChild(misc);

    viewDom.appendChild(fore);
    return viewDom;
  }

  getHTMLElementWithID (type, id) {
    const divElement = document.createElement(type);
    divElement.id = id;
    return divElement;
  }

  getInfoContainer () {
    const info = this.getHTMLElementWithID("div", "EXT_MUSIC_INFO");
    const infoElementsWithIcon = {
      EXT_MUSIC_TITLE: "Title",
      EXT_MUSIC_ARTIST: "Artist",
      EXT_MUSIC_ALBUM: "OUT"
    };

    for (const [key, iconType] of Object.entries(infoElementsWithIcon)) {
      const element = this.getHTMLElementWithID("div", key);
      element.appendChild(this.getIconContainer(this.getFAIconClass(iconType)));
      element.appendChild(this.getEmptyTextHTMLElement());
      info.appendChild(element);
    }

    info.appendChild(this.getDeviceContainer());
    return info;
  }

  getIconContainer (className, id, icon) {
    const iconContainer = document.createElement("i");
    iconContainer.className = className;
    iconContainer.dataset.inline = "false";
    iconContainer.id = id;
    iconContainer.dataset.icon = icon;

    return iconContainer;
  }

  getFAIcon (iconType) {
    switch (iconType) {
      case "MUSICPLAYER":
        //return 'fas fa-file-audio'
        return "fab fa-google";
      case "USB":
        return "fa fa-usb";
      case "OUT":
        return "fas fa-sign-out-alt";
      case "FOLDER":
        return "far fa-folder-open";
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
      default:
        return "fa fa-headphones fa-sm";
    }
  }

  getFAIconClass (iconType) {
    return `infoicon ${this.getFAIcon(iconType)}`;
  }

  getEmptyTextHTMLElement () {
    const text = document.createElement("span");
    text.className = "text";
    text.textContent = "";

    return text;
  }

  getDeviceContainer () {
    const device = this.getHTMLElementWithID("div", "EXT_MUSIC_DEVICE");
    device.appendChild(
      this.getIconContainer(this.getFAIconClass(this.config.useUSB ? "USB" : "FOLDER"), "EXT_MUSIC_DEVICE_ICON")
    );
    device.appendChild(this.getEmptyTextHTMLElement());

    return device;
  }

  getVolumeContainer () {
    const volume = this.getHTMLElementWithID("div", "EXT_MUSIC_VOLUME");
    volume.appendChild(
      this.getIconContainer(this.getFAIconClass("VOL_OFF"), "EXT_MUSIC_VOLUME_ICON")
    );
    volume.appendChild(this.getEmptyTextHTMLElement());

    return volume;
  }

  getProgressContainer () {
    const progress = this.getHTMLElementWithID("div", "EXT_MUSIC_PROGRESS");

    const bar = this.getHTMLElementWithID("progress", "EXT_MUSIC_PROGRESS_BAR");
    bar.value = 0;
    bar.max = 1;

    progress.appendChild(bar);
    return progress;
  }

  getMusicLogoContainer () {
    const logo = this.getHTMLElementWithID("div", "EXT_MUSIC_LOGO");
    const text = document.createElement("span");
    text.className = "text";
    text.textContent = "Music Player";
    logo.appendChild(text);

    return logo;
  }

  updateSongInfo (playbackItem) {
    if (!playbackItem) return;

    const sDom = document.getElementById("EXT_MUSIC");
    if (playbackItem.connected) {
      clearTimeout(this.hideTimer);
      sDom.classList.remove("inactive");
      if (!this.connected) {
        if (this.debug) console.log("[MUSIC] Connected");
        this.connected = true;
        this.show(1000, () => {}, { lockString: "EXT-MUSICPLAYER_LOCK" });
      }
    } else {
      if (!playbackItem.lastState) {
        if (this.connected) {
          if (this.debug) console.log("[MUSIC] Disconnected");
          this.connected = false;
          clearTimeout(this.hideTimer);
          this.hide(1000, () => {}, { lockString: "EXT-MUSICPLAYER_LOCK" });
          this.hideTimer = setTimeout(() => {
            sDom.classList.add("inactive");
          }, 1000);
        }
        return;
      }
    }
    const cover_img = document.getElementById("EXT_MUSIC_COVER_IMAGE");
    var img_url;
    if (playbackItem.cover) img_url = this.file(`cover/${playbackItem.cover}?seed=${playbackItem.seed}`);
    else img_url = this.file(`resources/music.jpg?seed=${playbackItem.seed}`);
    if (cover_img.src.indexOf(img_url) === -1) {
      const back = document.getElementById("EXT_MUSIC_BACKGROUND");
      back.classList.remove("fade-in");
      /* eslint-disable-next-line */
      let backOffSet = back.offsetWidth; // needed for no display buging
      back.classList.add("fade-in");
      back.style.backgroundImage = `url(${img_url})`;

      cover_img.classList.remove("fade-in");
      /* eslint-disable-next-line */
      let offset = cover_img.offsetWidth; // needed for no display buging
      cover_img.classList.add("fade-in");
      cover_img.src = img_url;
    }

    const title = document.querySelector("#EXT_MUSIC_TITLE .text");
    title.textContent = playbackItem.title;

    const album = document.querySelector("#EXT_MUSIC_ALBUM .text");
    album.textContent = playbackItem.date;

    const artist = document.querySelector("#EXT_MUSIC_ARTIST .text");

    let artistName = playbackItem.artist;
    artist.textContent = artistName;

    const deviceIcon = document.getElementById("EXT_MUSIC_DEVICE_ICON");
    deviceIcon.className = this.getDeviceIconClass(playbackItem.device);

    const USB = document.querySelector("#EXT_MUSIC_DEVICE .text");
    USB.textContent = `${playbackItem.id + 1}/${playbackItem.idMax + 1}`;
    this.updateVolume(playbackItem.volume);
    this.updateProgress(playbackItem.current);
  }

  updateVolume (volume_percent) {
    const volumeContainer = document.querySelector("#EXT_MUSIC_VOLUME .text");
    const volumeIcon = document.getElementById("EXT_MUSIC_VOLUME_ICON");

    volumeContainer.textContent = `${(volume_percent).toFixed(0)}%`;
    volumeIcon.className = this.getVolumeIconClass((volume_percent).toFixed(0));
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

  getDeviceIconClass (device) {
    if (device === "USB") return this.getFAIconClass("USB");
    else return this.getFAIconClass("FOLDER");
  }

  updateProgress (progress) {
    const bar = document.getElementById("EXT_MUSIC_PROGRESS_BAR");
    bar.value = progress;
  }

  setPause () {
    const Dom = document.getElementById("EXT_MUSIC");
    Dom.classList.add("pausing");
  }

  setPlay () {
    const Dom = document.getElementById("EXT_MUSIC");
    Dom.classList.remove("pausing");
  }
}
