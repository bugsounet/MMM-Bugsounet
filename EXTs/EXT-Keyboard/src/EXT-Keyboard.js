/****************
*  EXT-Keyboard *
*  Bugsounet    *
*  02/2024      *
*****************/

Module.register("EXT-Keyboard", {
  defaults: {
    debug: false,
    keyFinder: false,
    keys: [
      {
        keyCode: 107,
        notification: "EXT_VOLUME-SPEAKER_UP",
        payload: null,
        command: null,
        sound: "up"
      },
      {
        keyCode: 109,
        notification: "EXT_VOLUME-SPEAKER_DOWN",
        payload: null,
        command: null,
        sound: "down"
      }
    ]
  },

  start () {
    this.resources = `${this.data.path}resources/`;
    this.audio = null;
  },

  getDom () {
    var wrapper = document.createElement("div");
    wrapper.style.display = "none";
    return wrapper;
  },

  notificationReceived (noti, payload, sender) {
    switch (noti) {
      case "GA_READY":
        if (sender.name === "MMM-GoogleAssistant") {
          this.sendSocketNotification("INIT", this.config);
          this.prepare();
          this.sendNotification("EXT_HELLO", this.name);
        }
        break;
    }
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "WARNING":
        this.sendNotification("GA_ALERT", {
          type: "warning",
          message: payload.message,
          sound: `${this.resources}keyboard.mp3`
        });
        break;
    }
  },

  prepare () {
    this.audio = new Audio();
    this.audio.autoplay = true;
    onkeydown = (event) => {
      if (this.config.keyFinder) {
        this.sendNotification("GA_ALERT", {
          type: "information",
          message: `You pressed: ${event.key === " " ? "Space" : event.key} --> keyCode is: ${event.keyCode}`,
          timer: 3000,
          sound: `${this.resources}keyboard.mp3`
        });
      }
      if (this.config.keys.length && Array.isArray(this.config.keys)) {
        this.config.keys.forEach((key) => {
          if (key.keyCode === event.keyCode) {
            if (key.notification) this.sendNotification(key.notification, key.payload || undefined);
            if (key.command) this.sendSocketNotification("SHELLEXEC", key.command);
            if (key.sound) this.audio.src = `${this.resources + key.sound}.mp3`;
          }
        });
      }
    };
  }

});
