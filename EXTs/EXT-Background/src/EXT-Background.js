/******************
*  EXT-Background
*  ©Bugsounet
*  04/2025
******************/

Module.register("EXT-Background", {
  defaults: {
    model: "jarvis",
    myImage: null
  },

  notificationReceived (notification, payload, sender) {
    if (notification === "Bugsounet_ASSISTANT-READY") {
      if (sender.name !== "EXT-Assistant") return;
      this.sendSocketNotification("INIT");
      this.sendNotification("Bugsounet_HELLO");
    }
    if (!sender || (sender.name !== "EXT-Assistant")) return;

    if (notification === "Bugsounet_ASSISTANT-STATUS") {
      switch (payload) {
        case "think":
        case "continue":
        case "listen":
          this.setBackground("listen");
          break;
        case "standby":
          this.setBackground("standby");
          break;
        case "reply":
          this.setBackground("reply");
          break;
        case "hook":
        case "confirmation":
          this.setBackground("confirmation");
          break;
        case "error":
          this.setBackground("error");
          break;
      }
    }
  },

  setBackground (status) {
    let path = this.data.path;
    var GA = document.getElementById("GA_DOM");
    if (this.config.myImage) path = path + this.config.myImage;
    else path = `${path + this.config.model}/${status}.gif?seed=${Date.now()}`;
    GA.setAttribute("style", `background-image: url(${path});`);
  },

  getDom () {
    var dom = document.createElement("div");
    dom.style.display = "none";
    return dom;
  }
});
