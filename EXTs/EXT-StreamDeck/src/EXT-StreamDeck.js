/******************
*  EXT-StreamDeck *
*  Bugsounet      *
*******************/

Module.register("EXT-StreamDeck", {
  defaults: {
    debug: false,
    device: null,
    Brightness: 100,
    EcoBrightness: 10,
    EcoTime: 10000,
    keyFinder: false,
    keys: [
      {
        key: 0,
        logo: "tv-on",
        notification: "Bugsounet_SCREEN-WAKEUP",
        payload: null,
        command: null,
        sound: "opening"
      },
      {
        key: 1,
        logo: "spotify",
        notification: "Bugsounet_SPOTIFY-PLAY",
        payload: null,
        command: null,
        sound: "opening"
      },
      {
        key: 2,
        logo: "volume-up",
        notification: "Bugsounet_VOLUME-SPEAKER_UP",
        payload: null,
        command: null,
        sound: "up"
      },
      {
        key: 3,
        logo: "tv-off",
        notification: "Bugsounet_SCREEN-END",
        payload: null,
        command: null,
        sound: "closing"
      },
      {
        key: 4,
        logo: "stop",
        notification: "Bugsounet_STOP",
        payload: null,
        command: null,
        sound: "closing"
      },
      {
        key: 5,
        logo: "volume-down",
        notification: "Bugsounet_VOLUME-SPEAKER_DOWN",
        payload: null,
        command: null,
        sound: "down"
      }
    ]
  },

  start () {
    this.resources = `${this.data.path}resources/`;
    this.audio = null;
    this.ready = false;
  },

  getDom () {
    var wrapper = document.createElement("div");
    wrapper.style.display = "none";
    return wrapper;
  },

  notificationReceived (noti, payload, sender) {
    if (noti === "Bugsounet_READY") {
      if (sender.name === "MMM-Bugsounet") {
        this.sendSocketNotification("INIT", this.config);
        this.audio = new Audio();
        this.audio.autoplay = true;
      }
    }
    if (!this.ready) return;

    switch (noti) {
      case "Bugsounet_STREAMDECK-ON":
        this.sendSocketNotification("ON");
        break;
      case "Bugsounet_STREAMDECK-OFF":
        this.sendSocketNotification("OFF");
        break;
    }
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "INITIALIZED":
        this.ready = true;
        this.sendNotification("Bugsounet_HELLO", this.name);
        break;
      case "WARNING":
        this.sendNotification("Bugsounet_ALERT", {
          type: "warning",
          message: payload.message
        });
        break;
      case "NOTIFICATION":
        this.sendNotification(payload.notification, payload.payload || undefined);
        break;
      case "SOUND":
        this.audio.src = `${this.resources + payload}.mp3`;
        break;
      case "KEYFINDER":
        this.sendNotification("Bugsounet_ALERT", {
          type: "information",
          message: `You pressed key number: ${payload.key}`,
          timer: 3000
        });
    }
  }
});
