/******************
*  EXT-Background
*  ©Bugsounet
*  03/2023
******************/

Module.register("EXT-Background", {
  defaults: {
    model: "jarvis",
    myImage: null
  },

  notificationReceived (notification, payload, sender) {
    if (notification === "GA_READY") {
      if (sender.name !== "MMM-GoogleAssistant") return;
      this.sendSocketNotification("INIT");
      this.sendNotification("EXT_HELLO", this.name);
    }
    if (!sender || (sender.name !== "MMM-GoogleAssistant")) return;

    switch (notification) {
      case "ASSISTANT_THINK":
      case "ASSISTANT_CONTINUE":
      case "ASSISTANT_LISTEN":
        this.setBackground("listen");
        break;
      case "ASSISTANT_STANDBY":
        this.setBackground("standby");
        break;
      case "ASSISTANT_REPLY":
        this.setBackground("reply");
        break;
      case "ASSISTANT_HOOK":
      case "ASSISTANT_CONFIRMATION":
        this.setBackground("confirmation");
        break;
      case "ASSISTANT_ERROR":
        this.setBackground("error");
        break;
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
