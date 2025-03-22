/**
 ** Module : EXT-RadioPlayer
 ** ©@bugsounet
 **/

Module.register("EXT-RadioPlayer", {
  defaults: {
    debug: false,
    minVolume: 30,
    maxVolume: 75,
    streams: "streamsConfig.json"
  },

  start () {
    this.Radio = {};
    this.Channels = [];
    this.initializeMusicVolumeVLC();
    this.radioPlayer = {
      ready: false,
      play: false,
      img: null,
      link: null,
      last: 9999,
      radio: null,
      title: null,
      now_playing: null
    };
    this.canStop = true;
  },

  getStyles () {
    return ["EXT-RadioPlayer.css"];
  },

  getTranslations () {
    return {
      en: "translations/en.json",
      fr: "translations/fr.json"
    };
  },

  getDom () {
    var radio = document.createElement("div");
    radio.id = "EXT_RADIO";

    var radioInformationContainer = document.createElement("div");
    radioInformationContainer.id = "EXT_RADIO-RadioInformationContainer";
    var radioName = document.createElement("div");
    radioName.id = "EXT_RADIO-RadioName";
    radioName.textContent = "EXT-RadioPlayer";
    radioInformationContainer.appendChild(radioName);
    var radioLogoContainer = document.createElement("div");
    radioLogoContainer.id = "EXT_RADIO-RadioLogoContainer";
    radioInformationContainer.appendChild(radioLogoContainer);
    var radioLogo = document.createElement("img");
    radioLogo.id = "EXT_RADIO-RadioLogo";
    radioLogo.src = this.file("radio.jpg");
    radioLogo.addEventListener("error", () => { radioLogo.src = this.file("radio.jpg"); }, false);
    radioLogoContainer.appendChild(radioLogo);
    radio.appendChild(radioInformationContainer);

    var marqueeContainer = document.createElement("div");
    marqueeContainer.id = "EXT_RADIO-MarqueeContainer";
    var marqueeDiv = document.createElement("div");
    marqueeDiv.id = "EXT_RADIO-MarqueeDiv";
    marqueeContainer.appendChild(marqueeDiv);
    var marqueeSpan1 = document.createElement("span");
    marqueeSpan1.id = "EXT_RADIO-MarqueeSpan1";
    marqueeSpan1.textContent = this.translate("NO_INFORMATIONS");
    marqueeDiv.appendChild(marqueeSpan1);
    var marqueeSpan2 = document.createElement("span");
    marqueeSpan2.id = "EXT_RADIO-MarqueeSpan2";
    marqueeSpan2.textContent = this.translate("NO_INFORMATIONS");
    marqueeDiv.appendChild(marqueeSpan2);
    radio.appendChild(marqueeContainer);

    return radio;
  },

  notificationReceived (noti, payload, sender) {
    if (noti === "MODULE_DOM_CREATED") this.hide(0, () => {}, { lockString: "EXT-RADIO_LOCK" });
    if (noti === "Bugsounet_READY" && sender.name === "MMM-Bugsounet") this.sendSocketNotification("INIT", this.config);
    if (noti === "Bugsounet_VLCSERVER-START") this.sendSocketNotification("START");
    if (!this.radioPlayer.ready) return;

    switch (noti) {
      case "Bugsounet_VLCServer-WILL_PLAYING":
        this.canStop = false;
        break;
      case "Bugsounet_STOP":
      case "Bugsounet_RADIO-STOP":
        if (this.radioPlayer.play && this.canStop) {
          this.sendSocketNotification("STOP");
        }
        break;
      case "Bugsounet_RADIO-PLAY":
        this.playStream(payload ? payload : this.Channels[0]);
        break;
      case "Bugsounet_RADIO-NEXT":
        this.playNextStream();
        break;
      case "Bugsounet_RADIO-PREVIOUS":
        this.playPreviousStream();
        break;
      case "Bugsounet_RADIO-VOLUME_MIN":
        if (this.radioPlayer.play) this.sendSocketNotification("VOLUME", this.config.minVolume);
        break;
      case "Bugsounet_RADIO-VOLUME_MAX":
        if (this.radioPlayer.play) this.sendSocketNotification("VOLUME", this.config.maxVolume);
        break;
    }
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "ERROR":
        this.sendNotification("Bugsounet_ALERT", {
          type: "error",
          message: payload,
          timer: 10000
        });
        break;
      case "WARN":
        this.sendNotification("Bugsounet_ALERT", {
          type: "warning",
          message: payload,
          timer: 5000
        });
        break;
      case "PLAYING":
        this.radioPlayer.play = true;
        this.showRadio();
        break;
      case "META":
        if (payload.title) this.radioPlayer.title = payload.title;
        if (payload.now_playing) this.radioPlayer.now_playing = payload.now_playing;
        this.updateMeta();
        break;
      case "FINISH":
        this.radioPlayer.play = false;
        this.radioPlayer.img = null;
        this.radioPlayer.link = null;
        this.radioPlayer.radio = null;
        this.radioPlayer.title = null;
        this.radioPlayer.now_playing = null;
        this.showRadio();
        break;
      case "READY":
        this.Radio = payload;
        this.Channels = Object.keys(this.Radio);
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
        if (!this.radioPlayer.ready) {
          this.sendNotification("Bugsounet_HELLO");
          this.sendNotification("Bugsounet_RADIO-CHANNELS", this.Channels);
          this.radioPlayer.ready = true;
        }
        break;
      case "WILL_PLAYING":
        this.sendNotification("Bugsounet_VLCServer-WILL_PLAYING");
        this.sendNotification("Bugsounet_RADIO-PLAYING", payload);
        break;
    }
  },

  showRadio () {
    if (this.radioPlayer.play) {
      this.sendNotification("Bugsounet_RADIO-CONNECTED");
      this.show(1000, () => {}, { lockString: "EXT-RADIO_LOCK" });
      this.canStop = true;
    } else {
      this.sendNotification("Bugsounet_RADIO-DISCONNECTED");
      this.sendNotification("Bugsounet_RADIO-PLAYING", null);
      this.hide(1000, () => {}, { lockString: "EXT-RADIO_LOCK" });
      this.canStop = true;
    }
  },

  updateMeta () {
    var radioName = document.getElementById("EXT_RADIO-RadioName");
    var marquee1 = document.getElementById("EXT_RADIO-MarqueeSpan1");
    var marquee2 = document.getElementById("EXT_RADIO-MarqueeSpan2");
    radioName.textContent = this.radioPlayer.title || this.radioPlayer.radio || "EXT-RadioPlayer";
    marquee1.textContent = this.radioPlayer.now_playing || this.translate("NO_INFORMATIONS");
    marquee2.textContent = this.radioPlayer.now_playing || this.translate("NO_INFORMATIONS");
  },

  /** initialise volume control for VLC **/
  initializeMusicVolumeVLC () {

    /** convert volume **/
    try {
      let valueMin = null;
      valueMin = parseInt(this.config.minVolume);
      if (typeof valueMin === "number" && valueMin >= 0 && valueMin <= 100) this.config.minVolume = this.convertPercentToValue(valueMin);
      else {
        console.warn("[RADIO] config.minVolume error! Corrected with 30");
        this.config.minVolume = 70;
      }
    } catch (e) {
      console.warn("[RADIO] config.minVolume error!", e);
      this.config.minVolume = 70;
    }
    try {
      let valueMax = null;
      valueMax = parseInt(this.config.maxVolume);
      if (typeof valueMax === "number" && valueMax >= 0 && valueMax <= 100) this.config.maxVolume = this.convertPercentToValue(valueMax);
      else {
        console.warn("[RADIO] config.maxVolume error! Corrected with 100");
        this.config.maxVolume = 255;
      }
    } catch (e) {
      console.warn("[RADIO] config.maxVolume error!", e);
      this.config.maxVolume = 255;
    }
    console.log("[RADIO] VLC Volume Control initialized!");
  },

  /** Convert percent to cvlc value **/
  convertPercentToValue (percent) {
    return parseInt(((percent * 256) / 100).toFixed(0));
  },

  playNextStream () {
    let last = this.radioPlayer.last;
    let channel = this.Channels.next(last);
    if (!channel) channel = this.Channels[0];
    this.playStream(channel);
  },

  playPreviousStream () {
    let last = this.radioPlayer.last;
    let channel = this.Channels.prev(last);
    if (!channel) channel = this.Channels[this.Channels.length - 1];
    this.playStream(channel);
  },

  playStream (channel) {
    if (!this.radioPlayer.ready) return;
    if (!this.ChannelsCheck(channel)) {
      console.log(`[RADIO] Radio not found: ${channel}`);
      this.sendNotification("Bugsounet_ALERT", {
        type: "error",
        message: `Radio not found: ${channel}`,
        timer: 10000
      });
    }
    this.radioPlayer.radio = channel;

    if (this.Radio[channel].img) {
      this.radioPlayer.img = this.Radio[channel].img;
    } else {
      this.radioPlayer.img = this.file("radio.jpg");
    }

    var radioImg = document.getElementById("EXT_RADIO-RadioLogo");
    var radioName = document.getElementById("EXT_RADIO-RadioName");
    var marquee1 = document.getElementById("EXT_RADIO-MarqueeSpan1");
    var marquee2 = document.getElementById("EXT_RADIO-MarqueeSpan2");

    this.radioPlayer.now_playing = this.translate("NO_INFORMATIONS");
    marquee1.textContent = this.radioPlayer.now_playing;
    marquee2.textContent = this.radioPlayer.now_playing;
    radioName.textContent = this.radioPlayer.radio || "EXT-RadioPlayer";

    radioImg.classList.remove("WipeEnter");
    /* eslint-disable-next-line */
    let backOffSet = radioImg.offsetWidth;
    radioImg.classList.add("WipeEnter");
    radioImg.src = this.radioPlayer.img;

    this.radioPlayer.link = this.Radio[channel].link;
    this.sendSocketNotification("PLAY", { link: this.radioPlayer.link, name: this.radioPlayer.radio });
    this.radioPlayer.last = this.Channels.indexOf(channel);
  },

  ChannelsCheck (channel) {
    if (this.Channels.indexOf(channel) > -1) return true;
    return false;
  },

  /** Telegram Addon **/
  EXT_TELBOTCommands (commander) {
    commander.add({
      command: "radio",
      description: this.translate("RADIO_DESC_RADIO"),
      callback: "tb_RadioPlay"
    });
    commander.add({
      command: "radionext",
      description: this.translate("RADIO_DESC_NEXT"),
      callback: "tb_RadioNext"
    });
    commander.add({
      command: "radioprevious",
      description: this.translate("RADIO_DESC_PREVIOUS"),
      callback: "tb_RadioPrevious"
    });
    commander.add({
      command: "radiolist",
      description: this.translate("RADIO_DESC_LIST"),
      callback: "tb_RadioList"
    });
  },

  tb_RadioPlay (command, handler) {
    if (!this.Channels.length) {
      handler.reply("TEXT", this.translate("NO_STREAMS_FILE"));
      return;
    }
    if (handler.args) {
      if (this.ChannelsCheck(handler.args)) {
        this.playStream(handler.args);
        handler.reply("TEXT", this.translate("RADIO_PLAYING", { VALUES: handler.args }));
      } else {
        handler.reply("TEXT", this.translate("RADIO_NOT_FOUND", { VALUES: handler.args }));
      }
    } else {
      if (this.radioPlayer.last === 9999) {
        this.playStream(this.Channels[0]);
        handler.reply("TEXT", this.translate("RADIO_PLAYING", { VALUES: this.Channels[0] }));
      } else {
        this.playStream(this.Channels[this.radioPlayer.last]);
        handler.reply("TEXT", this.translate("RADIO_PLAYING", { VALUES: this.Channels[this.radioPlayer.last] }));
      }
    }
  },

  tb_RadioNext (command, handler) {
    if (!this.Channels.length) {
      handler.reply("TEXT", this.translate("NO_STREAMS_FILE"));
      return;
    }
    let channel = this.Channels.next(this.radioPlayer.last);
    if (!channel) channel = this.Channels[0];
    this.playStream(channel);
    handler.reply("TEXT", this.translate("RADIO_PLAYING", { VALUES: channel }));
  },

  tb_RadioPrevious (command, handler) {
    if (!this.Channels.length) {
      handler.reply("TEXT", this.translate("NO_STREAMS_FILE"));
      return;
    }
    let channel = this.Channels.prev(this.radioPlayer.last);
    if (!channel) channel = this.Channels[this.Channels.length - 1];
    this.playStream(channel);
    handler.reply("TEXT", this.translate("RADIO_PLAYING", { VALUES: channel }));
  },

  tb_RadioList (command, handler) {
    if (!this.Channels.length) {
      handler.reply("TEXT", this.translate("NO_STREAMS_FILE"));
      return;
    }
    let List = this.Channels.toString();
    List = List.replaceAll(",", "\n - ");
    handler.reply("TEXT", this.translate("RADIO_LIST", { VALUES: List }), { parse_mode: "Markdown" });
  }
});
