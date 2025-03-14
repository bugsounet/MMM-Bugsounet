/* EXT-FreeboxTV */

Module.register("EXT-FreeboxTV", {
  defaults: {
    debug: false,
    streams: "streamsConfig.json",
    volume: {
      start: 100,
      min: 30,
      useLast: true
    }
  },

  start () {
    this.FreeboxTV = {
      playing: false,
      channel: null,
      last: 9999
    };
    this.volumeControl = null;
    this.Channels = [];
    this.initializeVolume();
    this.ready = false;
    this.canStop = true;
  },

  getDom () {
    var wrapper = document.createElement("div");
    wrapper.classList.add("hidden");
    return wrapper;
  },

  playStream (channel) {
    if (!this.ChannelsCheck(channel)) {
      console.error(`[FreeboxTV] Channel not found: ${channel}`);
      this.sendNotification("Bugsounet_ALERT", {
        type: "error",
        message: `Channel not found: ${channel}`,
        timer: 10000
      });
      return;
    }
    if (this.FreeboxTV.playing) this.stopStream();
    this.sendSocketNotification("PLAY", channel);
    this.FreeboxTV.channel = channel;
    this.FreeboxTV.last = this.Channels.indexOf(channel);
  },

  playNextStream () {
    let last = this.FreeboxTV.last;
    let channel = this.Channels.next(last);
    if (!channel) channel = this.Channels[0];
    this.playStream(channel);
  },

  playPreviousStream () {
    let last = this.FreeboxTV.last;
    let channel = this.Channels.prev(last);
    if (!channel) channel = this.Channels[this.Channels.length - 1];
    this.playStream(channel);
  },

  stopStream (force) {
    if (this.FreeboxTV.playing) {
      this.sendSocketNotification("STOP");
      this.FreeboxTV.channel = null;
    }
    if (force) {
      this.FreeboxTV.playing = false;
      this.FreeboxTV.channel = null;
    }
  },

  notificationReceived (notification, payload, sender) {
    if (notification === "Bugsounet_READY") {
      if (sender.name === "MMM-Bugsounet") this.sendSocketNotification("CONFIG", this.config);
    }
    if (notification === "Bugsounet_VLCSERVER-START") this.sendSocketNotification("START");
    if (!this.ready) return;

    switch (notification) {
      case "Bugsounet_FREEBOXTV-PLAY":
        this.playStream(payload ? payload : this.Channels[0]);
        break;
      case "Bugsounet_FREEBOXTV-NEXT":
        this.playNextStream(payload);
        break;
      case "Bugsounet_FREEBOXTV-PREVIOUS":
        this.playPreviousStream(payload);
        break;
      case "Bugsounet_VLCServer-WILL_PLAYING":
        this.canStop = false;
        break;
      case "Bugsounet_STOP":
      case "Bugsounet_FREEBOXTV-STOP":
        if (this.canStop) this.stopStream(true);
        break;
      case "Bugsounet_FREEBOXTV-VOLUME":
        var value = null;
        if (payload) value = parseInt(payload);
        if (typeof value === "number" && value >= 0 && value <= 100) {
          this.volumeControl = ((value * 255) / 100).toFixed(0);
          if (this.config.volume.useLast) this.sendSocketNotification("VOLUME_LAST", this.volumeControl);
          if (this.FreeboxTV.playing) this.sendSocketNotification("VOLUME_CONTROL", this.volumeControl);
          console.log(`[FreeboxTV] Volume: ${this.volumeControl} [${value}]`);
        } else console.log("[FreeboxTV] Volume Control wrong value:", payload);
        break;
      case "Bugsounet_FREEBOXTV-VOLUME_MIN":
        if (this.FreeboxTV.playing) this.sendSocketNotification("VOLUME_CONTROL", this.config.volume.min);
        break;
      case "Bugsounet_FREEBOXTV-VOLUME_MAX":
        if (this.FreeboxTV.playing) this.sendSocketNotification("VOLUME_CONTROL", this.volumeControl ? this.volumeControl : this.config.volume.start);
        break;
    }
  },

  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case "INITIALIZED":
        this.Channels = payload;
        var iterifyArr = function (arr) {
          arr.next = (current) => {
            var next = current;
            next = next + 1;
            if (next >= arr.length) return arr[0];
            return arr[next];
          };
          arr.prev = (current) => {
            var previous = current;
            previous = previous - 1;
            if (previous < 0) return arr[arr.length - 1];
            return arr[previous];
          };
          return arr;
        };
        iterifyArr(this.Channels);
        if (!this.ready) {
          this.ready = true;
          this.sendNotification("Bugsounet_HELLO");
          this.sendNotification("Bugsounet_FREEBOXTV-CHANNELS", this.Channels);
        }
        break;
      case "ENDED":
        this.FreeboxTV.playing = false;
        this.canStop = true;
        this.sendNotification("Bugsounet_FREEBOXTV-DISCONNECTED");
        break;
      case "STARTED":
        this.FreeboxTV.playing = true;
        this.canStop = true;
        this.sendNotification("Bugsounet_FREEBOXTV-CONNECTED");
        break;
      case "ERROR":
        this.sendNotification("Bugsounet_ALERT", {
          type: "error",
          message: payload,
          timer: 10000
        });
        break;
      case "WILL_PLAYING":
        this.sendNotification("Bugsounet_VLCServer-WILL_PLAYING");
        break;
    }
  },

  /** Telegram Addon **/
  EXT_TELBOTCommands (commander) {
    commander.add({
      command: "tv",
      description: "Lance un chaine de FreeboxTV.",
      callback: "TV"
    });
    commander.add({
      command: "tvol",
      description: "Contrôle du volume de la TV.",
      callback: "TVol"
    });
    commander.add({
      command: "tvlist",
      description: "Liste des chaines",
      callback: "TVList"
    });
  },

  TV (command, handler) {
    if (!this.ready) return handler.reply("TEXT", "EXT-FreeboxTV n'est pas prêt.");

    if (handler.args) {
      if (this.ChannelsCheck(handler.args)) {
        this.playStream(handler.args);
        return handler.reply("TEXT", `J'affiche la chaine: ${handler.args}`);
      } else return handler.reply("TEXT", `Chaine non trouvé: ${handler.args}`);
    }
    this.stopStream(true);
    handler.reply("TEXT", "J'éteins la TV.");
  },

  TVol (command, handler) {
    if (!this.ready) return handler.reply("TEXT", "EXT-FreeboxTV n'est pas prêt.");

    if (handler.args) {
      let value = null;
      value = parseInt(handler.args);
      if (typeof value === "number" && value >= 0 && value <= 100) {
        this.volumeControl = ((value * 255) / 100).toFixed(0);
        if (this.config.volume.useLast) this.sendSocketNotification("VOLUME_LAST", this.volumeControl);
        this.sendSocketNotification("VOLUME_CONTROL", this.volumeControl);
        console.log(`[FreeboxTV] Volume: ${this.volumeControl} [${value}]`);
        return handler.reply("TEXT", `Je mets le volume à ${handler.args}%`);
      }
    }
    else return handler.reply("TEXT", "Le volume doit être entre 0 et 100.");
  },

  TVList (command, handler) {
    if (!this.ready) return handler.reply("TEXT", "EXT-FreeboxTV n'est pas prêt.");

    let List = this.Channels.toString();
    if (!List) return handler.reply("TEXT", "Aucune Chaine disponible.");

    List = List.replaceAll(",", "\n - ");
    handler.reply("TEXT", `Chaine disponible:\n - ${List}`);
  },

  ChannelsCheck (channel) {
    if (this.Channels.indexOf(channel) > -1) return true;
    return false;
  },

  initializeVolume () {

    /** convert volume **/
    try {
      let valueStart = null;
      valueStart = parseInt(this.config.volume.start);
      if (typeof valueStart === "number" && valueStart >= 0 && valueStart <= 100) this.config.volume.start = ((valueStart * 255) / 100).toFixed(0);
      else {
        console.warn("[FreeboxTV] config.volume.start error! Corrected with 100");
        this.config.volume.start = 255;
      }
    } catch (e) {
      console.warn("[FreeboxTV] config.volume.start error!", e);
      this.config.volume.start = 255;
    }
    try {
      let valueMin = null;
      valueMin = parseInt(this.config.volume.min);
      if (typeof valueMin === "number" && valueMin >= 0 && valueMin <= 100) this.config.volume.min = ((valueMin * 255) / 100).toFixed(0);
      else {
        console.warn("[FreeboxTV] config.volume.min error! Corrected with 30");
        this.config.volume.min = 70;
      }
    } catch (e) {
      console.warn("[FreeboxTV] config.volume.min error!", e);
      this.config.volume.min = 70;
    }
    console.log("[FreeboxTV] Volume Control initialized!");
  }
});
