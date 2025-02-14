/*
 * Module : EXT-Assistant
 * @bugsounet
 * ©2025
 */

/* global AssistantResponse, AssistantSearch, AlertCommander, EXTs */

var logGA = () => { /* do nothing */ };

Module.register("EXT-Assistant", {
  defaults: {
    debug: false,
    stopCommand: "stop",
    otherStopCommands: [],
    assistantConfig: {
      lang: "en-US",
      latitude: 51.508530,
      longitude: -0.076132,
      deviceRegistred: false
    },
    responseConfig: {
      useFullscreen: false,
      responseOutputCSS: "response_output.css",
      screenOutputTimer: 5000,
      useChime: true,
      confirmationChime: true,
      chimes: {
        beep: "beep.mp3",
        error: "error.mp3",
        continue: "continue.mp3",
        confirmation: "confirmation.mp3",
        open: "Google_beep_open.mp3",
        close: "Google_beep_close.mp3",
        opening: "opening.mp3",
        closing: "closing.mp3",
        warning: "warning.ogg"
      },
      imgStatus: {
        hook: "hook.gif",
        standby: "standby.gif",
        reply: "reply.gif",
        error: "error.gif",
        think: "think.gif",
        continue: "continue.gif",
        listen: "listen.gif",
        confirmation: "confirmation.gif",
        information: "information.gif",
        warning: "warning.gif",
        userError: "userError.gif"
      },
      zoom: {
        transcription: "80%",
        responseOutput: "60%"
      }
    },
    recipes: []
  },

  getScripts () {
    return [
      "/modules/MMM-Bugsounet/EXTs/EXT-Assistant/components/assistantResponse.js",
      "/modules/MMM-Bugsounet/EXTs/EXT-Assistant/components/assistantSearch.js"
    ];
  },

  getStyles () {
    return ["/modules/MMM-Bugsounet/EXTs/EXT-Assistant/EXT-Assistant.css"];
  },

  getTranslations () {
    return {
      en: "translations/en.json",
      de: "translations/de.json",
      el: "translations/el.json",
      es: "translations/es.json",
      fr: "translations/fr.json",
      it: "translations/it.json",
      ko: "translations/ko.json",
      nl: "translations/nl.json",
      pt: "translations/pt.json",
      tr: "translations/tr.json",
      "zh-cn": "translations/zh-cn.json"
    };
  },

  getDom () {
    var dom = document.createElement("div");
    dom.style.display = "none";
    return dom;
  },

  notificationReceived (noti, payload = null, sender = null) {
    if (noti === "Bugsounet_READY" && sender.name === "MMM-Bugsounet") {
      this.sendSocketNotification("INIT", this.helperConfig);
    }
    if (!this.ready) return;
    switch (noti) {
      case "GA_ACTIVATE":
        if (payload && payload.type && payload.key) this.assistantActivate(payload);
        else this.assistantActivate({ type: "MIC" });
        break;
      case "GA_FORCE_FULLSCREEN":
        if (this.config.responseConfig.useFullscreen) return logGA("Force Fullscreen: Already activated");
        this.config.responseConfig.useFullscreen = true;
        this.assistantResponse = null;
        this.assistantResponse = new AssistantResponse(this.helperConfig["responseConfig"], this.callbacks);
        logGA("Force Fullscreen: AssistantResponse Reloaded");
        break;
      case "GA_STOP":
        if (this.assistantResponse.response && this.GAStatus.actual === "reply") this.assistantResponse.conversationForceEnd();
        break;
    }
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "LOAD_RECIPE":
        this.parseLoadedRecipe(payload);
        break;
      case "NOT_INITIALIZED":
        this.assistantResponse.fullscreen(true);
        this.assistantResponse.showError(this.translate(payload.message, { VALUES: payload.values }));
        this.assistantResponse.forceStatusImg("userError");
        break;
      case "WARNING":
        this.sendAlert({
          message: this.translate(payload),
          type: "warning",
          timer: 10000
        }, "EXT-Assistant");
        break;
      case "INFORMATION":
        // maybe for later
        break;
      case "ERROR":
        this.sendAlert({
          message: this.translate(payload),
          type: "error"
        }, "EXT-Assistant");
        break;
      case "RECIPE_ERROR":
        this.sendAlert({
          message: this.translate("GAErrorRecipe", { VALUES: payload }),
          type: "error"
        }, "EXT-Assistant");
        break;
      case "INITIALIZED":
        logGA("Initialized.");
        this.sendNotification("Bugsounet_HELLO");
        this.assistantResponse.Version(payload);
        this.assistantResponse.status("standby");
        this.ready = true;
        break;
      case "ASSISTANT_RESULT":
        if (payload.volume !== null) this.sendNotification("EXT_VOLUME-SPEAKER_SET", payload.volume);
        this.assistantResponse.start(payload);
        break;
      case "TUNNEL":
        this.assistantResponse.tunnel(payload);
        break;
      case "ASSISTANT_ACTIVATE":
        this.assistantActivate(payload);
        break;
      case "GOOGLESEARCH-RESULT":
        this.sendGoogleResult(payload);
        break;
      case "SendNoti":
        if (payload.payload && payload.noti) this.sendNotification(payload.noti, payload.payload);
        else this.sendNotification(payload);
        break;
      case "SendStop":
        this.EXTs.ActionsEXTs("EXT_STOP");
        break;
    }
  },

  start () {
    const helperConfig = ["debug", "recipes", "assistantConfig", "responseConfig", "website"];

    if (this.config.debug) logGA = (...args) => { console.log("[GA]", ...args); };

    this.helperConfig = {};
    for (var i = 0; i < helperConfig.length; i++) {
      this.helperConfig[helperConfig[i]] = this.config[helperConfig[i]];
    }
    this.helperConfig.micConfig = {
      recorder: "auto",
      device: "default"
    };

    this.forceResponse = false;
    this.assistantResponse = null;
    this.globalStopCommands = [];

    if (Array.isArray(this.config.otherStopCommands)) {
      this.globalStopCommands = this.config.otherStopCommands;
    }

    this.GAStatus = {
      actual: "standby",
      old: "standby"
    };

    this.commands = {};
    this.transcriptionHooks = {};
    this.responseHooks = {};

    this.callbacks = {
      assistantActivate: (payload) => {
        this.assistantActivate(payload);
      },
      postProcess: (response, callback_done, callback_none) => {
        this.postProcess(response, callback_done, callback_none);
      },
      endResponse: () => {
        logGA("Conversation Done");
      },
      translate: (text) => {
        return this.translate(text);
      },
      GAStatus: (status) => {
        this.GAStatus = status;
        this.sendNotification("Bugsounet_ASSISTANT-STATUS", this.GAStatus.actual);
      },
      Gateway: (response) => {
        return this.ScanResponse(response);
      },
      sendSocketNotification: (noti, params) => {
        this.sendSocketNotification(noti, params);
      }
    };

    this.assistantResponse = new AssistantResponse(this.helperConfig["responseConfig"], this.callbacks);
    this.AssistantSearch = new AssistantSearch(this.helperConfig.assistantConfig);

    this.assistantResponse.prepareGA();
    this.assistantResponse.prepareBackground();
    this.assistantResponse.Loading();

    // create the main command for "stop" (EXT_STOP)
    var StopCommand = {
      commands: {
        EXT_Stop: {
          notificationExec: {
            notification: "EXT_STOP"
          },
          soundExec: {
            chime: "close"
          },
          displayResponse: false
        }
      }
    };
    this.parseLoadedRecipe(JSON.stringify(StopCommand));
    logGA("[HOOK] EXT_Stop Command Added");

    // add default command to globalStopCommand (if needed)
    if (this.globalStopCommands.indexOf(this.config.stopCommand) === -1) {
      this.globalStopCommands.push(this.config.stopCommand);
    }

    // create all transcriptionHooks from globalStopCommands array
    if (this.globalStopCommands.length) {
      this.globalStopCommands.forEach((pattern, i) => {
        var Command = {
          transcriptionHooks: {}
        };
        Command.transcriptionHooks[`EXT_Stop${i}`] = {
          pattern: `^(${pattern})($)`,
          command: "EXT_Stop"
        };
        this.parseLoadedRecipe(JSON.stringify(Command));
        logGA(`[HOOK] Add pattern for EXT_Stop command: ${pattern}`);
      });
    }
    else { // should never happen !
      console.error("[GA] No Stop Commands defined!");
    }

   this.ready = false;
  },

  /********************************/
  /*** EXT-TelegramBot Commands ***/
  /********************************/
  EXT_TELBOTCommands (commander) {
    commander.add({
      command: "query",
      description: this.translate("QUERY_HELP"),
      callback: "tbQuery"
    });
  },

  tbQuery (command, handler) {
    var query = handler.args;
    if (!query) handler.reply("TEXT", this.translate("QUERY_HELP"));
    else this.assistantActivate({ type: "TEXT", key: query });
  },

  /*
   * Activate Process
   */
  assistantActivate (payload) {
    if (this.GAStatus.actual !== "standby" && !payload.force) return logGA("Assistant is busy.");
    this.assistantResponse.clearAliveTimers();
    if (this.GAStatus.actual === "continue") this.assistantResponse.showTranscription(this.translate("GAContinue"));
    else this.assistantResponse.showTranscription(this.translate("GABegin"));
    this.assistantResponse.fullscreen(true);
    this.lastQuery = null;
    var options = {
      type: "TEXT",
      key: null,
      lang: this.config.assistantConfig.lang,
      status: this.GAStatus.old,
      chime: true
    };
    options = Object.assign({}, options, payload);
    this.assistantResponse.status(options.type, (options.chime) ? true : false);
    this.sendSocketNotification("ACTIVATE_ASSISTANT", options);
  },

  postProcess (response, callback_done = () => {}, callback_none = () => {}) {
    if (response.lastQuery.status === "continue") return callback_none();
    var foundHook = this.findAllHooks(response);
    if (foundHook.length > 0) {
      this.assistantResponse.status("hook");
      for (var i = 0; i < foundHook.length; i++) {
        var hook = foundHook[i];
        this.doCommand(hook.command, hook.params, hook.from);
      }
      if (this.forceResponse) {
        this.forceResponse = false;
        callback_none();
      } else callback_done();
    } else {
      callback_none();
    }
  },

  /*
   * scan response
   */
  ScanResponse (response) {
    if (response.screen && (response.screen.links.length > 0 || response.screen.photos.length > 0)) {
      let opt = {
        photos: response.screen.photos,
        urls: response.screen.links,
        youtube: null
      };
      logGA("Send response:", opt);
      this.notificationReceived("EXT_GATEWAY", opt);
    } else if (response.text) {
      if (this.AssistantSearch.GoogleSearch(response.text)) {
        this.sendSocketNotification("GOOGLESEARCH", response.transcription.transcription);
      } else if (this.AssistantSearch.YouTubeSearch(response.text)) {
        logGA("Send response YouTube:", response.transcription.transcription);
        this.notificationReceived("EXT_GATEWAY", {
          photos: [],
          urls: [],
          youtube: response.transcription.transcription
        });
      }
    }
  },

  sendGoogleResult (link) {
    if (!link) return console.error("[GA] No link to open!");
    logGA("Send response:", link);
    this.notificationReceived("EXT_GATEWAY", {
      photos: [],
      urls: [link],
      youtube: null
    });
  },

  /*
   * hooks
   */
  findAllHooks (response) {
    var hooks = [];
    hooks = hooks.concat(this.findTranscriptionHook(response));
    hooks = hooks.concat(this.findResponseHook(response));
    this.findNativeAction(response);
    return hooks;
  },

  findResponseHook (response) {
    var found = [];
    if (response.screen) {
      var res = [];
      res.links = (response.screen.links) ? response.screen.links : [];
      res.text = (response.screen.text) ? [].push(response.screen.text) : [];
      res.photos = (response.screen.photos) ? response.screen.photos : [];
      for (var k in this.responseHooks) {
        if (!this.responseHooks.hasOwnProperty(k)) continue;
        var hook = this.responseHooks[k];
        if (!hook.where || !hook.pattern || !hook.command) continue;
        var pattern = new RegExp(hook.pattern, "ig");
        var f = pattern.exec(res[hook.where]);
        if (f) {
          found.push({
            from: k,
            params: f,
            command: hook.command
          });
          logGA("ResponseHook matched:", k);
        }
      }
    }
    return found;
  },

  findTranscriptionHook (response) {
    var foundHook = [];
    var transcription = (response.transcription) ? response.transcription.transcription : "";
    for (var k in this.transcriptionHooks) {
      if (!this.transcriptionHooks.hasOwnProperty(k)) continue;
      var hook = this.transcriptionHooks[k];
      if (hook.pattern && hook.command) {
        var pattern = new RegExp(hook.pattern, "ig");
        var found = pattern.exec(transcription);
        if (found) {
          foundHook.push({
            from: k,
            params: found,
            command: hook.command
          });
          logGA("TranscriptionHook matched:", k);
        }
      } else {
        logGA(`TranscriptionHook:${k} has invalid format`);
        continue;
      }
    }
    return foundHook;
  },

  doCommand (commandId, originalParam, from) {
    if (this.commands.hasOwnProperty(commandId)) {
      var command = this.commands[commandId];
      if (command.displayResponse) this.forceResponse = true;
    } else {
      logGA(`Command ${commandId} is not found.`);
      return;
    }
    var param = (typeof originalParam === "object") ? Object.assign({}, originalParam) : originalParam;

    if (command.hasOwnProperty("notificationExec")) {
      var ne = command.notificationExec;
      if (ne.notification) {
        var fnen = (typeof ne.notification === "function") ? ne.notification(param, from) : ne.notification;
        var nep = (ne.payload) ? ((typeof ne.payload === "function") ? ne.payload(param, from) : ne.payload) : null;
        var fnep = (typeof nep === "object") ? Object.assign({}, nep) : nep;
        logGA(`Command ${commandId} is executed (notificationExec).`);
        this.sendNotification(fnen, fnep);
      }
    }

    if (command.hasOwnProperty("shellExec")) {
      var se = command.shellExec;
      if (se.exec) {
        var fs = (typeof se.exec === "function") ? se.exec(param, from) : se.exec;
        var so = (se.options) ? ((typeof se.options === "function") ? se.options(param, from) : se.options) : null;
        var fo = (typeof so === "function") ? so(param) : so;
        if (fs) {
          logGA(`Command ${commandId} is executed.`);
          this.sendSocketNotification("SHELLEXEC", { command: fs, options: fo });
        }
      }
    }

    if (command.hasOwnProperty("moduleExec")) {
      var me = command.moduleExec;
      var mo = (typeof me.module === "function") ? me.module(param, from) : me.module;
      var m = (Array.isArray(mo)) ? mo : new Array(mo);
      if (typeof me.exec === "function") {
        MM.getModules().enumerate((mdl) => {
          if (m.length === 0 || (m.indexOf(mdl.name) >= 0)) {
            logGA(`Command ${commandId} is executed (moduleExec) for :`, mdl.name);
            me.exec(mdl, param, from);
          }
        });
      }
    }

    if (command.hasOwnProperty("soundExec")) {
      var snde = command.soundExec;
      if (snde.chime && typeof snde.chime === "string") {
        if (snde.chime === "open") this.assistantResponse.playChime("open");
        if (snde.chime === "close") this.assistantResponse.playChime("close");
        if (snde.chime === "opening") this.assistantResponse.playChime("opening");
        if (snde.chime === "closing") this.assistantResponse.playChime("closing");
      }
      if (snde.sound && typeof snde.sound === "string") {
        this.assistantResponse.playChime(snde.sound, true);
      }
    }
  },

  parseLoadedRecipe (payload) {
    let reviver = (key, value) => {
      if (typeof value === "string" && value.indexOf("__FUNC__") === 0) {
        let Value = value.slice(8);
        let functionTemplate = `(${Value})`;
        return eval(functionTemplate);
      }
      return value;
    };
    var p = JSON.parse(payload, reviver);

    if (p.hasOwnProperty("commands")) {
      this.registerCommandsObject(p.commands);
    }
    if (p.hasOwnProperty("transcriptionHooks")) {
      this.registerTranscriptionHooksObject(p.transcriptionHooks);
    }
    if (p.hasOwnProperty("responseHooks")) {
      this.registerResponseHooksObject(p.responseHooks);
    }
    if (p.hasOwnProperty("plugins")) {
      this.registerPluginsObject(p.plugins);
    }
  },

  registerPluginsObject (obj) {
    for (var pop in this.plugins) {
      if (obj.hasOwnProperty(pop)) {
        var candi = [];
        if (Array.isArray(obj[pop])) {
          candi = candi.concat(obj[pop]);
        } else {
          candi.push(obj[pop].toString());
        }
        for (var i = 0; i < candi.length; i++) {
          this.registerPlugin(pop, candi[i]);
        }
      }
    }
  },

  registerPlugin (plugin, command) {
    if (this.plugins.hasOwnProperty(plugin)) {
      if (Array.isArray(command)) {
        this.plugins[plugin].concat(command);
      }
      this.plugins[plugin].push(command);
    }
  },

  registerCommandsObject (obj) {
    this.commands = Object.assign({}, this.commands, obj);
  },

  registerTranscriptionHooksObject (obj) {
    this.transcriptionHooks = Object.assign({}, this.transcriptionHooks, obj);
  },

  registerResponseHooksObject (obj) {
    this.responseHooks = Object.assign({}, this.responseHooks, obj);
  },

  findNativeAction (response) {
    var action = (response.action) ? response.action : null;
    if (!action || !action.inputs) return;
    action.inputs.forEach((input) => {
      if (input.intent === "action.devices.EXECUTE") {
        input.payload.commands.forEach((command) => {
          command.execution.forEach((exec) => {
            logGA(`Native Action: ${exec.command}`, exec.params);
            if (exec.command === "action.devices.commands.SetVolume") {
              this.EXTs.sendVolume(exec.params.volumeLevel);
            }
          });
        });
      }
    });
  }
});
