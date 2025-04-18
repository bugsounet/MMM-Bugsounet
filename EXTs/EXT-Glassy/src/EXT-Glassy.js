/**************
*  EXT-Glassy
*  ©Bugsounet
*  02/2025
**************/

Module.register("EXT-Glassy", {
  defaults: {
    debug: false,
    ignoreModules: [],
    modulePadding: "10px",
    moduleRadius: "10px",
    moduleShadow: "5px",
    moduleBackgroundRGB: "0,0,0",
    moduleBackgroundOpacity: "15%",
    moduleBorderRGB: "255,255,255",
    moduleBorderOpacity: "10%",
    moduleShadowOffsetX: "-5px",
    moduleShadowOffsetY: "-5px",
    moduleShadowBlur: "8px",
    moduleShadowColor: "black",
    moduleBlur: "5px",
    moduleSpacing: "15px",
    mirrorMargin: "10px",
    mirrorBackground: true,
    mirrorBackgroundFile: "default.jpg",
    mirrorBackgroundOnSuspend: true
  },

  start () {
    this.data.position = "top_center";
  },

  notificationReceived (notification) {
    switch (notification) {
      case "Bugsounet_READY":
        this.sendSocketNotification("INIT", this.config);
        if (this.config.mirrorBackground) this.MMBackground();
        this.initialize();
        this.sendNotification("Bugsounet_HELLO");
        break;
    }
  },

  getDom () {
    var dom = document.createElement("div");
    dom.style.display = "none";
    dom.className = "hidden";
    return dom;
  },

  getStyles () {
    return ["EXT-Glassy.css"];
  },

  initialize () {
    // set css from config
    const cssValues = {
      "--Glassy-Padding": this.config.modulePadding,
      "--Glassy-Radius": this.config.moduleRadius,
      "--Glassy-Background": `rgba(${this.config.moduleBackgroundRGB}, ${this.config.moduleBackgroundOpacity})`,
      "--Glassy-Blur": this.config.moduleBlur,
      "--Glassy-Border-color": `rgba(${this.config.moduleBorderRGB}, ${this.config.moduleBorderOpacity})`,
      "--Glassy-Shadow": `${this.config.moduleShadowOffsetX} ${this.config.moduleShadowOffsetY} ${this.config.moduleShadowBlur} ${this.config.moduleShadowColor}`,
      "--gap-modules": this.config.moduleSpacing,
      "--gap-body-top": this.config.mirrorMargin,
      "--gap-body-right": this.config.mirrorMargin,
      "--gap-body-bottom": this.config.mirrorMargin,
      "--gap-body-left": this.config.mirrorMargin
    };
    this.cssSet(cssValues);
    //select Modules to Glassy apply
    MM.getModules()
      .exceptModule(this)
      .exceptWithClass(this.config.ignoreModules)
      .enumerate((module) => {
        const identifier = module.data.identifier;
        const moduleClass = document.getElementById(identifier);
        const moduleContent = moduleClass?.getElementsByClassName("module-content")[0];
        moduleContent?.classList.add("Glassy");
      });
  },

  cssSet (CSS) {
    const cssRoot = document.querySelector(":root");
    Object.entries(CSS).forEach((value) => {
      cssRoot.style.setProperty(value[0], value[1]);
    });
  },

  MMBackground () {
    const nodes = document.getElementsByClassName("region fullscreen below");
    const pos = nodes[0];
    const children = pos.children[0];
    const module = document.createElement("div");
    module.id = "Background_EXT-Glassy";
    module.className = "default";
    module.style.backgroundImage = `url(/modules/MMM-Bugsounet/EXTs/EXT-Glassy/resources/${this.config.mirrorBackgroundFile})`;
    pos.insertBefore(module, children);
  },

  suspend () {
    if (this.config.mirrorBackground && !this.config.mirrorBackgroundOnSuspend) {
      const MMBackground = document.getElementById("Background_EXT-Glassy");
      MMBackground.className = "hidden";
    }
    Log.log("EXT-Glassy is suspended.");
  },

  resume () {
    if (this.config.mirrorBackground && !this.config.mirrorBackgroundOnSuspend) {
      const MMBackground = document.getElementById("Background_EXT-Glassy");
      MMBackground.className = "default";
    }
    Log.log("EXT-Glassy is resumed.");
  }

});
