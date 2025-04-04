const path = require("node:path");
const fs = require("node:fs");
const USB = require("usb").usb;
const Drives = require("drivelist");

const VLC = require("vlc-client");

var log = function () { /*do nothing*/ };

class PLAYER {
  constructor (config, debug, callback = () => {}) {
    this.config = config;
    this.default = {
      useUSB: false,
      modulePath: "./",
      musicPath: "/home",
      checkSubDirectory: false,
      autoStart: false,
      maxVolume: 256,
      loop: false,
      random: false
    };
    this.config = Object.assign(this.default, this.config);
    this.sendSocketNotification = callback.sendSocketNotification;
    if (debug) log = (...args) => { console.log("[MUSIC]", ...args); };
    this.AutoDetectUSB = this.config.useUSB;
    this.FileExtensions = ["mp3", "flac", "wav", "ogg", "opus", "m4a"];
    this.MusicPlayerStatus = {
      readyToAutoPlay: false,
      justStarted: true,
      ready: false,
      connected: false,
      pause: false,
      current: 0,
      duration: 0,
      file: null,
      title: "",
      artist: "",
      volume: 0,
      date: 0,
      seed: 0,
      cover: null,
      id: 0,
      idMax: 0,
      format: null,
      lastState: false
    };
    this.audioList = [];
    this.USBAutoDetect();
    this.vlc = null;
    this.warn = 0;
    this.statusInterval = null;
    this.startVLC();
  }

  async init () {
    // Re-init all value :)
    this.MusicPlayerStatus = {
      justStarted: true,
      ready: false,
      connected: false,
      pause: false,
      current: 0,
      file: null,
      title: "",
      artist: "",
      volume: 0,
      date: 0,
      seed: 0,
      cover: null,
      id: 0,
      idMax: 0,
      format: null,
      lastState: false
    };
    this.audioList = [];
  }

  pulse () {
    log("Launch pulse");
    this.statusInterval = setInterval(() => this.status(), 1000);
  }

  async start () {
    if (this.AutoDetectUSB) { // USB Key is already connected !
      await this.USBSearchDrive();
    }
    else await this.search(this.config.musicPath);
    if (this.audioList.length) {
      console.log(`[MUSIC] Audio files Found: ${this.audioList.length}`);
      this.MusicPlayerStatus.readyToAutoPlay = true;
    } else console.log("[MUSIC] No Audio files Found!");
  }

  async USBSearchDrive () {
    let drives = await Drives.list();
    drives.forEach(async (drive) => {
      if (!drive.isSystem && drive.isUSB && drive.mountpoints[0]) {
        log(`Found USB Drive: ${drive.description} in ${drive.device}`);
        var drive_path = path.normalize(drive.mountpoints[0].path);
        log(`USB Path Drive: ${drive_path}`);
        await this.search(drive_path);
      }
    });
  }

  USBAutoDetect () {
    log(`AutoDetect USB Key: ${this.AutoDetectUSB ? "On" : "Off"}`);
    if (this.AutoDetectUSB) {
      USB.on("attach", () => { this.PlugInUSB(); });
      USB.on("detach", () => { this.PlugOutUSB(); });
    }
  }

  PlugInUSB () {
    log("USB Key Detected");
    setTimeout(async () => {
      this.audioList = [];
      await this.USBSearchDrive();
      if (this.audioList.length) {
        console.log(`[MUSIC] Audio files Found: ${this.audioList.length}`);
        if (this.config.autoStart) this.MusicPlayList();
      } else console.log("[MUSIC] USB-KEY: No Audio files Found!");
    }, 5000);
  }

  PlugOutUSB () {
    log("Warn: USB Key Released!");
    this.init();
  }

  search (Path) {
    if (!fs.existsSync(Path)) {
      console.log(`[MUSIC] Error: No such directory: ${Path}`);
      this.sendSocketNotification("ERROR", `No such directory: ${Path}`);
      return;
    }
    log(`Search in ${Path}`);
    var FileList = fs.readdirSync(Path);
    FileList.forEach((file) => {
      var filename = path.join(Path, file);
      var stat = fs.lstatSync(filename);
      if (stat.isDirectory()) {
        if (this.config.checkSubDirectory) this.search(filename);
      } else {
        var isValidFileExtension = this.checkValidFileExtension(filename);
        if (isValidFileExtension) {
          log(`Found: ${filename}`);
          this.audioList.push(filename);
        }
      }
    });
    this.MusicPlayerStatus.idMax = this.audioList.length - 1;
  }

  checkValidFileExtension (filename) {
    var found = false;
    this.FileExtensions.forEach((extension) => {
      if (filename.toLowerCase().endsWith(extension)) found = true;
    });
    return found;
  }

  MusicPlayList () {
    if (!this.audioList.length) {
      this.MusicPlayerStatus.idMax = 0;
      return console.log("[Music] No Music to Read");
    } else {
      this.MusicPlayerStatus.idMax = this.audioList.length - 1;
    }

    if (!this.config.random) {
      if (this.MusicPlayerStatus.id === 0) {
        this.MusicPlayer();
      } else {
        this.MusicPlayerStatus.id++;
        if (this.MusicPlayerStatus.id > this.MusicPlayerStatus.idMax) this.MusicPlayerStatus.id = 0;
        else this.MusicPlayer();
      }
    } else this.MusicPlayer();
  }

  /** Music Player **/
  async MusicPlayer () {
    clearTimeout(this.statusInterval);
    this.sendSocketNotification("WILL_PLAYING");
    try {
      if (this.config.random) {
        let randomId = await this.getRandomInt(this.audioList.length);
        if (randomId === this.MusicPlayerStatus.id) return this.MusicPlayer(); // same song ?
        this.MusicPlayerStatus.id = randomId;
      }

      // make structure
      this.MusicPlayerStatus.connected = false;
      this.MusicPlayerStatus.current = 0;
      this.MusicPlayerStatus.file = this.audioList[this.MusicPlayerStatus.id];
      this.MusicPlayerStatus.filename = path.basename(this.MusicPlayerStatus.file);
      this.MusicPlayerStatus.device = this.AutoDetectUSB ? "USB" : "FOLDER";

      log(`Start playing: ${path.basename(this.MusicPlayerStatus.file)}`);

      await this.vlc.playFile(this.MusicPlayerStatus.file, { novideo: true, wait: true, timeout: 300 });
      this.pulse();

    } catch (error) {
      console.error(`[MUSIC] Music Player Error: ${error.message}`);
      this.sendSocketNotification("WARN", error.message);
    }
  }

  send (data) {
    this.sendSocketNotification("Music_Player", data);
    //console.log("data", data)
  }

  getConnected () {
    return this.MusicPlayerStatus.connected;
  }

  getTrackLength () {
    return this.MusicPlayerStatus.idMax;
  }

  setPause () {
    if (this.MusicPlayerStatus.ready && this.MusicPlayerStatus.connected) {
      if (this.MusicPlayerStatus.pause) {
        log("Resume Paused");
        this.vlc.play();
      } else {
        log("Paused");
        this.vlc.pause();
      }
    }
  }

  setPlay (id) {
    const TrackNumber = parseInt(id);
    if (TrackNumber >= 0) {
      if (TrackNumber > this.MusicPlayerStatus.idMax) {
        console.error(`[MUSIC] Track not found: ${TrackNumber}`);
        this.sendSocketNotification("WARN", `Track not found: ${TrackNumber}`);
      } else {
        log(`Search Track: ${TrackNumber}`);
        this.MusicPlayerStatus.id = TrackNumber;
        this.MusicPlayer();
      }
      return;
    }
    if (this.MusicPlayerStatus.pause) {
      log("Resume Play");
      this.vlc.play();
    } else {
      log("Play");
      this.MusicPlayer();
      this.MusicPlayerStatus.pause = false;
    }
  }

  setStop () {
    if (this.MusicPlayerStatus.ready && this.MusicPlayerStatus.connected) {
      log("Stop");
      this.vlc.stop();
      this.MusicPlayerStatus.lastState = false;
    }
  }

  setNext () {
    if (this.MusicPlayerStatus.ready && this.MusicPlayerStatus.connected) {
      if (this.config.random) this.MusicPlayer();
      else {
        log("Next");
        this.MusicPlayerStatus.id++;
        if (this.MusicPlayerStatus.id > this.MusicPlayerStatus.idMax) this.MusicPlayerStatus.id = 0;
        this.MusicPlayer();
      }
    }
  }

  setPrevious () {
    if (this.MusicPlayerStatus.ready && this.MusicPlayerStatus.connected) {
      if (this.config.random) this.MusicPlayer();
      else {
        log("Previous");
        this.MusicPlayerStatus.id--;
        if (this.MusicPlayerStatus.id < 0) this.MusicPlayerStatus.id = this.MusicPlayerStatus.idMax;
        this.MusicPlayer();
      }
    }
  }

  setVolume (volume) { // Warn must be 0-256
    if (this.MusicPlayerStatus.ready && this.MusicPlayerStatus.connected) {
      log(`Set Volume ${volume}`);
      this.vlc.setVolumeRaw(volume);
    }
  }

  setNewMax (volume) {
    if (volume) {
      // keep memoroy this volume for next song !
      log(`Received new Volume Max: ${volume}`);
      this.config.maxVolume = volume;
    }
  }

  setSwitch () {
    this.AutoDetectUSB = !this.AutoDetectUSB;
    this.rebuild();
  }

  rebuild () {
    log(`Rebuild Database with ${this.AutoDetectUSB ? "USB Key" : "Local Folder"}`);
    this.setStop();
    this.init();
    this.start();
  }

  setRandom (random) {
    this.config.random = random;
    log(`Set Random to ${this.config.random}`);
  }

  getRandomInt (max) {
    return Math.floor(Math.random() * max);
  }

  startVLC () {
    this.vlc = new VLC.Client({
      ip: "127.0.0.1",
      port: 8082,
      password: "EXT-VLCServer",
      log: this.config.debug
    });
  }

  async status () {
    const status = await this.vlc.status().catch(
      (err) => {
        if (err.code === "ECONNREFUSED" || err.message.includes("Unauthorized")) {
          this.warn++;
          console.error(`[MUSIC] Can't start VLC Client! Reason: ${err.message}`);
          if (this.warn > 5) {
            clearTimeout(this.statusInterval);
            this.sendSocketNotification("ERROR", `Can't start VLC Client! Reason: ${err.message}`);
          } else console.warn(`[MUSIC] Wait for response... (${this.warn}/5)`);
        } else {
          console.error(`[MUSIC] ${err.message}`);
          this.sendSocketNotification("ERROR", `VLC Client error: ${err.message}`);
        }
      }
    );

    if (status) {
      this.MusicPlayerStatus.ready = true;
      this.warn = 0;
    } else {
      this.MusicPlayerStatus.ready = false;
      return;
    }

    if (this.MusicPlayerStatus.justStarted) {
      this.MusicPlayerStatus.justStarted = false;
      console.log("[MUSIC] Player Ready!");
    }

    if (this.MusicPlayerStatus.readyToAutoPlay) {
      this.MusicPlayerStatus.readyToAutoPlay = false;
      if (this.config.autoStart && this.AutoDetectUSB) this.MusicPlayList();
    }

    if (status.state === "playing") {
      if (status.information.category.meta.filename !== this.MusicPlayerStatus.filename) {
        log("Not played by EXT-MusicPlayer");
        this.MusicPlayerStatus.connected = false;
        this.MusicPlayerStatus.lastState = false;
        clearTimeout(this.statusInterval);
      } else {
        log("Playing");
        if (!this.MusicPlayerStatus.connected) {

          /* discover first playing of music */
          log(`Set volume to ${this.config.maxVolume}`);
          this.vlc.setVolumeRaw(this.config.maxVolume);
          this.MusicPlayerStatus.seed = Date.now();
          let meta = status.information.category.meta;
          this.MusicPlayerStatus.title = meta.title || path.basename(this.MusicPlayerStatus.file);
          this.MusicPlayerStatus.artist = meta.artist || "-";
          this.MusicPlayerStatus.date = meta.date || "-";
          if (meta.artwork_url) {
            let file = meta.artwork_url.replace("file://", "");
            this.MusicPlayerStatus.cover = path.basename(file);
            fs.copyFileSync(file, `${this.config.modulePath}/cover/${this.MusicPlayerStatus.cover}`);
          } else {
            this.MusicPlayerStatus.cover = null;
          }
        }
        this.MusicPlayerStatus.connected = true;
        this.MusicPlayerStatus.lastState = true;
        this.MusicPlayerStatus.pause = false;
        this.MusicPlayerStatus.current = status.position;
        this.MusicPlayerStatus.volume = (parseInt(status.volume) * 100) / 256;
      }
    }
    else if (status.state === "stopped") {
      if (this.MusicPlayerStatus.lastState) {
        if ((this.MusicPlayerStatus.id >= this.MusicPlayerStatus.idMax) && !this.config.loop && !this.config.random) {

          /* end of playlist --> no loop */
          log("Stopped (no loop)");
          this.MusicPlayerStatus.id = 0;
          this.MusicPlayerStatus.connected = false;
          this.MusicPlayerStatus.lastState = false;
        } else {
          log("Playing Next");
          this.MusicPlayerStatus.connected = true;
          this.MusicPlayerStatus.lastState = true;
          this.setNext();
        }
      } else {
        log("Stopped");
        this.MusicPlayerStatus.connected = false;
        this.MusicPlayerStatus.lastState = false;
        clearTimeout(this.statusInterval);
      }
    }
    else if (status.state === "paused") {
      if (this.MusicPlayerStatus.lastState) {
        log("Paused");
        this.MusicPlayerStatus.pause = true;
      }
    }
    //log("Status:", status.state, status.information)
    this.send(this.MusicPlayerStatus);
  }
}

module.exports = PLAYER;
