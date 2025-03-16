/*
 * EXT-TelegramBot
 *
 * By eouia & @bugsounet
 */

/* global TelegramBotCommandRegister, TelegramBotMessageHandler TelegramBotExtraChars */

Module.register("EXT-TelegramBot", {
  defaults: {
    debug: false,
    telegramAPIKey: null,
    adminChatId: null,
    allowedUser: [],
    commandAllowed: { // If set, only specific user can use these commands, other even in allowedUser cannot. These members should be allowed by allowedUser first.
      //"telecast": ["eouia", "someone"],
      //"mychatid": ["eouia"]
    },
    useWelcomeMessage: true,
    useSoundNotification: true,
    detailOption: {},
    //if you want this module to work behind local proxy, try this. (experimental)
    /*
    detailOption: {
      request: {
        proxy: "https://someone:somepassword@local.proxy.addr:1234",
      }
    }
    */
    favourites: ["/commands", "/modules", "/hideall", "/showall"],
    telecast: null, // true or chat_id
    telecastLife: 1000 * 60 * 60 * 6,
    telecastLimit: 5,
    telecastHideOverflow: true,
    telecastContainer: 300,
    dateFormat: "DD-MM-YYYY HH:mm:ss",
    screenshotTool: "grim"
  },

  start () {
    this.isAlreadyInitialized = 0;
    this.commands = [];
    this.customCommandCallbacks = new Map();
    this.askSession = new Set();
    this.commonSession = new Map();
    this.config.text = {
      "EXT-TELBOT_HELPER_ERROR": this.translate("EXT-TELBOT_HELPER_ERROR"),
      "EXT-TELBOT_HELPER_NOT_ALLOWED": this.translate("EXT-TELBOT_HELPER_NOT_ALLOWED"),
      "EXT-TELBOT_HELPER_RESTART": this.translate("EXT-TELBOT_HELPER_RESTART"),
      "EXT-TELBOT_HELPER_WAKEUP": this.translate("EXT-TELBOT_HELPER_WAKEUP"),
      "EXT-TELBOT_HELPER_MSG_COMING": this.translate("EXT-TELBOT_HELPER_MSG_COMING"),
      "EXT-TELBOT_HELPER_SERVED": this.translate("EXT-TELBOT_HELP_SERVED", { module: "TelegramBot Service" })
    };
    this.config = configMerge({}, this.defaults, this.config);

    this.getCommands(new TelegramBotCommandRegister(this, this.registerCommand.bind(this)));

    this.allowed = new Set(this.config.allowedUser);
    this.history = [];
    this.chats = [];

    /** audio part **/
    if (this.config.useSoundNotification) {
      this.sound = new Audio();
      this.sound.autoplay = true;
    }
  },

  getTranslations () {
    return {
      en: "translations/en.json",
      de: "translations/de.json",
      id: "translations/id.json",
      fr: "translations/fr.json",
      it: "translations/it.json",
      es: "translations/es.json",
      "zh-cn": "translations/zh-cn.json",
      tr: "translations/tr.json"
    };
  },

  getStyles () {
    return ["EXT-TelegramBot.css"];
  },

  getScripts () {
    return [this.file("components/TELBOT_lib.js")];
  },

  getDom () {
    var dom = document.createElement("div");
    dom.id = "EXT-TELBOT";
    dom.classList.add("inactive");
    if ((isNaN(this.config.telecastContainer)) || this.config.telecastContainer < 200 || this.config.telecastContainer > 1000) {

      /** Wrong setting go to default **/
      this.config.telecastContainer = this.defaults.telecastContainer;
    }
    if (this.config.telecast) {
      dom.setAttribute("style", `--container-width:${this.config.telecastContainer}px;`);
      dom.appendChild(this.getTelecastDom());
    }
    return dom;
  },

  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case "INITIALIZED":
        if (this.isAlreadyInitialized) return;
        else this.isAlreadyInitialized = 1;
        MM.getModules().enumerate((m) => {
          if ("EXT-TelegramBot" !== m.name && (m.name.startsWith("EXT-") || "MMM-Bugsounet" === m.name) && typeof m.EXT_TELBOTCommands === "function") {
            var tc = m.EXT_TELBOTCommands(new TelegramBotCommandRegister(m, this.registerCommand.bind(this)));
            if (Array.isArray(tc)) {
              tc.forEach((c) => {
                this.registerCommand(m, c);
              });
            }
          }
        });
        this.sendNotification("Bugsounet_HELLO", this.name);
        this.sendSocketNotification("SET_COMMANDS", this.commands.map((c) => { return { command: c.command, description: c.description }; }));
        break;
      case "CHAT":
        this.telecast(payload);
        break;
      case "COMMAND":
        this.parseCommand(payload);
        break;
      case "SCREENSHOT_RESULT":
        this.TELBOT_screenshot_result(payload.session, payload);
        break;
      case "ANSWER":
        this.askSession.forEach((s) => {
          if (s.session_id === payload.sessionId) {
            var callbacks = {
              reply: this.reply.bind(this),
              ask: this.ask.bind(this),
              say: this.say.bind(this)
            };
            var handler = new TelegramBotMessageHandler(payload, payload.text, callbacks);
            s.callback("ANSWER_FOR_ASK", handler);
            this.askSession.delete(s);
            return;
          }
          if (moment.unix(s.time).isBefore(moment().add(-1, "hours"))) {
            this.askSession.delete(s);
          }
        });
        break;
    }
  },

  notificationReceived (notification, payload, sender) {
    switch (notification) {
      case "Bugsounet_READY":
        if (sender.name === "MMM-Bugsounet") {
          if (this.isAlreadyInitialized) return;
          this.sendSocketNotification("INIT", this.config);
          this.sendSocketNotification("ALLOWEDUSER", [...this.allowed]);
        }
        break;
      case "Bugsounet_TELBOT-TELL_ADMIN":
        var r = null;
        if (typeof payload === "string") {
          r = {
            chat_id: null,
            type: "TEXT",
            text: `${payload}\n${this.translate("EXT-TELBOT_HELP_SERVED", { module: sender.name })}`,
            option: { parse_mode: "Markdown" }
          };
          this.adminSay(r);
        } else if (typeof payload === "object") {
          r = Object.assign({}, payload, { chat_id: null });
          this.adminSay(r);
        }
        break;
    }
  },

  getCommands (Register) {
    var defaultCommands = [
      {
        command: "help",
        callback: "TELBOT_help",
        description: this.translate("EXT-TELBOT_HELP"),
        args_pattern: [/^[^\s]+/],
        args_mapping: ["command"]
      },
      {
        command: "commands",
        description: this.translate("EXT-TELBOT_COMMANDS"),
        callback: "TELBOT_list_commands"
      },
      {
        command: "modules",
        description: this.translate("EXT-TELBOT_MODULES"),
        callback: "TELBOT_list_modules"
      },
      {
        command: "mychatid",
        description: this.translate("EXT-TELBOT_MYCHATID"),
        callback: "TELBOT_mychatid"
      },
      {
        command: "allowed",
        description: this.translate("EXT-TELBOT_ALLOWED"),
        callback: "TELBOT_allowed"
      },
      {
        command: "allowuser",
        description: this.translate("EXT-TELBOT_ALLOWUSER"),
        callback: "TELBOT_allowuser",
        args_pattern: [/^[^\s]+/],
        args_mapping: ["username"]
      },
      {
        command: "hideall",
        description: this.translate("EXT-TELBOT_HIDEALL"),
        callback: "TELBOT_hideall"
      },
      {
        command: "showall",
        description: this.translate("EXT-TELBOT_SHOWALL"),
        callback: "TELBOT_showall"
      },
      {
        command: "hide",
        description: this.translate("EXT-TELBOT_HIDE"),
        callback: "TELBOT_hide"
      },
      {
        command: "show",
        description: this.translate("EXT-TELBOT_SHOW"),
        callback: "TELBOT_show"
      },
      {
        command: "favor",
        callback: "TELBOT_favor",
        description: this.translate("EXT-TELBOT_FAVOR")
      },
      {
        command: "recent",
        callback: "TELBOT_recent",
        description: this.translate("EXT-TELBOT_RECENT")
      },
      {
        command: "resetkeyboard",
        callback: "TELBOT_reset_keyboard",
        description: this.translate("EXT-TELBOT_RESET_KEYBOARD")
      },
      {
        command: "notification",
        callback: "TELBOT_noti",
        description: this.translate("EXT-TELBOT_NOTIFICATION"),
        args_pattern: [/([^\s]+)\s?([^\s]?.*|)$/]
      },
      {
        command: "screenshot",
        callback: "TELBOT_screenshot",
        description: this.translate("EXT-TELBOT_SCREENSHOT")
      },
      {
        command: "telecast",
        callback: "TELBOT_telecast",
        description: this.translate("EXT-TELBOT_TELECAST")
      },
      {
        command: "clean",
        callback: "TELBOT_clean",
        description: this.translate("EXT-TELBOT_CLEAN")
      }
    ];
    defaultCommands.forEach((c) => {
      Register.add(c);
    });
  },

  TELBOT_clean (command, handler) {
    if (!this.config.telecast) {
      var text = this.translate("EXT-TELBOT_TELECAST_FALSE");
      handler.reply("TEXT", text, { parse_mode: "Markdown" });
      return;
    }
    this.chats = [];
    this.updateDom();
    handler.reply("TEXT", this.translate("EXT-TELBOT_CLEAN_DONE"));
  },

  TELBOT_telecast (command, handler) {
    if (!this.config.telecast) {
      var text = this.translate("EXT-TELBOT_TELECAST_FALSE");
      handler.reply("TEXT", text, { parse_mode: "Markdown" });
      return;
    }
    handler.message.text = handler.args;
    handler.message.caption = handler.args;
    this.sendSocketNotification("FORCE_TELECAST", handler.message);
  },

  TELBOT_screenshot (command, handler) {
    var sessionId = `${Date.now()}_${this.commonSession.size}`;
    this.commonSession.set(sessionId, handler);
    this.sendSocketNotification("SCREENSHOT", { session: sessionId });
  },

  TELBOT_screenshot_result (sessionId, ret) {
    var handler = this.commonSession.get(sessionId);
    var text = "";
    if (handler && ret.status) {
      this.commonSession.delete(sessionId);
      text = this.translate("EXT-TELBOT_SCREENSHOT_RESULT") + ret.timestamp;
      handler.reply("PHOTO_PATH", ret.path, { caption: text });
      this.sendNotification("EXT_GPHOTOPHOTOS-UPLOAD", ret.path);
    } else {
      text = `${this.translate("EXT-TELBOT_SCREENSHOT_RESULT_ERROR")}\n${ret.result}`;
      handler.reply("TEXT", TelegramBotExtraChars(text), { parse_mode: "Markdown" });
    }
  },

  TELBOT_noti (command, handler) {
    var text = "";
    if (!handler.args || !handler.args[0]) {
      text = this.translate("EXT-TELBOT_NOTIFICATION_FAIL");
      handler.reply("TEXT", text, { parse_mode: "Markdown" });
      return;
    }
    var noti = handler.args[0][1];
    var pstr = handler.args[0][2];
    var payload = pstr;
    if (pstr.indexOf("{") + pstr.indexOf("[") !== -2) {
      try {
        payload = JSON.parse(pstr);
      } catch {
        text = this.translate("EXT-TELBOT_NOTIFICATION_PAYLOAD_FAIL");
        text += "\n" + `\`${payload}\``;
        handler.reply("TEXT", text, { parse_mode: "Markdown" });
        return;
      }
    }
    this.sendNotification(noti, payload);
    handler.reply("TEXT", this.translate("EXT-TELBOT_NOTIFICATION_RESULT"), { parse_mode: "Markdown" });
  },

  TELBOT_favor (command, handler) {
    var text = this.translate("EXT-TELBOT_FAVOR_RESULT");
    handler.reply("TEXT", text, {
      reply_markup: {
        resize_keyboard: true,
        one_time_keyboard: true,
        keyboard: [this.config.favourites]
      },
      parse_mode: "Markdown"
    });
  },

  TELBOT_recent (command, handler) {
    var text = this.translate("EXT-TELBOT_RECENT_RESULT");
    handler.reply("TEXT", text, {
      reply_markup: {
        resize_keyboard: true,
        one_time_keyboard: true,
        keyboard: [this.history]
      },
      parse_mode: "Markdown"
    });
  },

  TELBOT_reset_keyboard (command, handler) {
    var text = this.translate("EXT-TELBOT_RESET_KEYBOARD_RESULT");
    handler.reply("TEXT", text, {
      reply_markup: {
        remove_keyboard: true
      },
      parse_mode: "Markdown"
    });
  },

  TELBOT_hideall (command, handler) {
    var text = this.translate("EXT-TELBOT_HIDEALL_RESULT");
    MM.getModules().enumerate((m) => {
      m.hide(500, { lockString: "TB_LOCK" });
    });
    handler.reply("TEXT", text, { parse_mode: "Markdown" });
  },

  TELBOT_showall (command, handler) {
    var text = this.translate("EXT-TELBOT_SHOWALL_RESULT");
    MM.getModules().enumerate((m) => {
      m.show(500, { lockString: "TB_LOCK" });
    });
    handler.reply("TEXT", text, { parse_mode: "Markdown" });
  },

  TELBOT_hide (command, handler) {
    var found = false;
    var unlock = false;
    if (handler.args) {
      MM.getModules().enumerate((m) => {
        if (m.name === handler.args) {
          found = true;
          if (m.hidden) return handler.reply("TEXT", handler.args + this.translate("EXT-TELBOT_HIDE_ALREADY"));
          if (m.lockStrings.length > 0) {
            m.lockStrings.forEach((lock) => {
              if (lock === "TB_LOCK") {
                m.hide(500, { lockString: "TB_LOCK" });
                if (m.lockStrings.length === 0) {
                  unlock = true;
                  handler.reply("TEXT", handler.args + this.translate("EXT-TELBOT_HIDE_DONE"));
                }
              }
            });
            if (!unlock) return handler.reply("TEXT", handler.args + this.translate("EXT-TELBOT_HIDE_LOCKED"));
          }
          else {
            m.hide(500, { lockString: "TB_LOCK" });
            handler.reply("TEXT", handler.args + this.translate("EXT-TELBOT_HIDE_DONE"));
          }
        }
      });
      if (!found) handler.reply("TEXT", this.translate("EXT-TELBOT_MODULE_NOTFOUND") + handler.args);
    } else return handler.reply("TEXT", this.translate("EXT-TELBOT_MODULE_NAME"));
  },

  TELBOT_show (command, handler) {
    var found = false;
    var unlock = false;
    if (handler.args) {
      MM.getModules().enumerate((m) => {
        if (m.name === handler.args) {
          found = true;
          if (!m.hidden) return handler.reply("TEXT", handler.args + this.translate("EXT-TELBOT_SHOW_ALREADY"));
          if (m.lockStrings.length > 0) {
            m.lockStrings.forEach((lock) => {
              if (lock === "TB_LOCK") {
                m.show(500, { lockString: "TB_LOCK" });
                if (m.lockStrings.length === 0) {
                  unlock = true;
                  handler.reply("TEXT", handler.args + this.translate("EXT-TELBOT_SHOW_DONE"));
                }
              }
            });
            if (!unlock) return handler.reply("TEXT", handler.args + this.translate("EXT-TELBOT_SHOW_LOCKED"));
          }
          else {
            m.show(500, { lockString: "TB_LOCK" });
            handler.reply("TEXT", handler.args + this.translate("EXT-TELBOT_SHOW_DONE"));
          }
        }
      });
      if (!found) handler.reply("TEXT", this.translate("EXT-TELBOT_MODULE_NOTFOUND") + handler.args);
    } else return handler.reply("TEXT", this.translate("EXT-TELBOT_MODULE_NAME"));
  },

  TELBOT_allowed (command, handler) {
    var text = "";
    for (var username of this.allowed) {
      if (text === "") {
        text += `\`${username}\``;
      } else {
        text += `, \`${username}\``;
      }
    }
    handler.reply("TEXT", text, { parse_mode: "Markdown" });
  },

  TELBOT_allowuser (command, handler) {
    var text = "";
    if (handler.message.admin !== "admin") {
      text = this.translate("EXT-TELBOT_ONLY_ADMIN");
    } else if (handler.args !== null) {
      var user = handler.args["username"];
      this.allowed.add(user);
      this.sendSocketNotification("ALLOWEDUSER", [...this.allowed]);
      text = this.translate("EXT-TELBOT_ALLOWUSER_REGISTERED");
    } else {
      text = this.translate("EXT-TELBOT_ALLOWUSER_ERROR");
    }

    handler.reply("TEXT", text, { parse_mode: "Markdown" });
  },

  TELBOT_mychatid (command, handler) {
    //handler.tell, handler.reply, handler.ask
    var text = this.translate("EXT-TELBOT_MYCHATID_RESULT", { chatid: handler.message.chat.id });
    handler.reply("TEXT", text, { parse_mode: "Markdown" });
  },

  TELBOT_list_modules (command, handler) {
    var text = "";
    var hidden = this.translate("EXT-TELBOT_HIDDEN");
    var showing = this.translate("EXT-TELBOT_SHOWING");
    MM.getModules().enumerate((m) => {
      text += `\`${m.name}\` _`;
      text += ((m.hidden) ? hidden : showing);
      text += "_\n";
    });
    if (!text) {
      text = this.translate("EXT-TELBOT_MODULES_ERROR");
    }
    handler.reply("TEXT", text, { parse_mode: "Markdown" });
  },

  /* eslint-disable no-useless-escape */
  TELBOT_list_commands (command, handler) {
    var text = "";
    this.commands.forEach((c) => {
      var name = c.command;
      var description = (c.description) ? c.description : "";
      var bits = description.split(/[\.\n]/);
      text += `*${name}* \- _${bits[0]}_\n`;
    });
    if (!text) {
      text = this.translate("EXT-TELBOT_COMMANDS_ERROR");
    }
    handler.reply("TEXT", text, { parse_mode: "Markdown" });
  },
  /* eslint-enable no-useless-escape */

  TELBOT_help (command, handler) {
    var target;
    var text = "";
    if (handler.args !== null) {
      target = handler.args["command"];
      this.commands.forEach((c) => {
        if (c.command === target) {
          text += `\`/${c.command}\`\n`;
          text += (c.description) ? c.description : "";
          text += "\n";
          text += (
            (c.moduleName)
              ? (this.translate("EXT-TELBOT_HELP_SERVED", { module: c.moduleName }))
              : ""
          );
          text += "\n";
        }
      });
    }
    if (!text) {
      text = this.translate("EXT-TELBOT_HELP_HELP");
    }
    handler.reply("TEXT", text, { parse_mode: "Markdown" });
  },

  registerCommand (module, commandObj) {
    var c = commandObj;
    var command = c.command;
    var callback = ((c.callback) ? (c.callback) : "notificationReceived");
    if (typeof callback !== "function") {
      if (typeof module[callback] !== "function") return false;
    }
    var idx = 0;
    this.commands.forEach(() => {
      var sameCommand = this.commands.filter(function (com) {
        if (com.command === command) return com;
      });
      if (sameCommand.length > 0) {
        command = c.command + idx;
        idx++;
      }
    });
    var cObj = {
      command: command,
      execute: c.command,
      moduleName: module.name,
      module: module,
      description: c.description,
      callback: callback,
      argsPattern: c.args_pattern,
      argsMapping: c.args_mapping
    };
    this.commands.push(cObj);
    return true;
  },

  parseCommand (msg) {
    const createHandler = (msg, args) => {
      var callbacks = {
        reply: this.reply.bind(this),
        ask: this.ask.bind(this),
        say: this.say.bind(this)
      };
      return new TelegramBotMessageHandler(msg, args, callbacks);
    };
    var args = null;
    var handler = null;
    var text = null;
    if (typeof msg.text === "undefined") return;
    var msgText = msg.text;
    if (msgText.indexOf("/") !== 0) return;
    /* eslint-disable-next-line */
    var matched = msgText.match(new RegExp("^\/([0-9a-zA-Z-_]+)\s?(.*)$"));
    var matchedCommands = [];
    if (matched) {
      matchedCommands = this.commands.filter((c) => {
        if (c.command.indexOf(matched[1]) === 0) return true;
        return false;
      });
      if (matchedCommands.length > 1) {
        var exact = matchedCommands.filter((c) => {
          if (c.command === matched[1]) return true;
          return false;
        });
        if (exact.length === 1) {
          matchedCommands = exact;
        }
      }
    }
    if (matchedCommands.length === 1) {
      //proper
      var c = matchedCommands[0];
      if (this.config.commandAllowed.hasOwnProperty(c.command)) {
        var allowedUser = this.config.commandAllowed[c.command];
        if (Array.isArray(allowedUser) && allowedUser.length > 0) {
          if (!allowedUser.includes(msg.from.username)) {
            handler = createHandler(msg, null);
            text = this.translate("EXT-TELBOT_NOT_ALLOWED_COMMAND");
            handler.reply("TEXT", text, { parse_mode: "Markdown" });
            return;
          }
        }
      }
      var restText = matched[2].trim();
      if (restText === "") {
        args = null;
      } else {
        if (c.argsPattern && Array.isArray(c.argsPattern)) {
          args = [];
          for (var j = 0; j < c.argsPattern.length; j++) {
            var p = c.argsPattern[j];
            if (p instanceof RegExp) {
              //do nothing.
            } else {
              if (typeof p === "string") {
                p = this.toRegExp(p);
              } else {
                p = /.*/;
              }
            }
            var result = p.exec(restText.trim());
            if (c.argsMapping && Array.isArray(c.argsMapping)) {
              if (typeof c.argsMapping[j] !== "undefined") {
                if (result && result.length === 1) {
                  args[c.argsMapping[j]] = result[0];
                } else {
                  args[c.argsMapping[j]] = result;
                }
              } else {
                if (result && result.length === 1) {
                  args.push(result[0]);
                } else {
                  args.push(result);
                }
              }
            } else {
              if (result && result.length === 1) {
                args.push(result[0]);
              } else {
                args.push(result);
              }
            }
          }
        } else {
          args = restText;
        }
      }
      if (msg.chat.id === this.config.adminChatId) {
        msg.admin = "admin";
      }
      if (c.callback !== "notificationReceived") {
        handler = createHandler(msg, args);
        if (typeof c.callback === "function") {
          c.callback(c.execute, handler, c.module);
        } else {
          c.module[c.callback].bind(c.module);
          c.module[c.callback](c.execute, handler, c.module);
        }
      } else {
        c.module[c.callback].bind(c.module);
        c.module[c.callback](c.execute, args);
      }
      this.history.push(msg.text);
      while (this.history.length > 5) {
        this.history.shift();
      }
    } else {
      //0 or multi
      handler = createHandler(msg, null);
      text = this.translate("EXT-TELBOT_NOT_REGISTERED_COMMAND");
      if (matchedCommands.length > 1) {
        text = this.translate("EXT-TELBOT_FOUND_SEVERAL_COMMANDS");
        for (var tc of matchedCommands) {
          text += `*/${tc.command}*\n`;
        }
      }
      handler.reply("TEXT", text, { parse_mode: "Markdown" });
    }
  },

  reply (response) {
    this.sendSocketNotification("REPLY", response);
  },

  ask (response, sessionId, callback) {
    if (sessionId === null) return false;
    var session = {
      session_id: sessionId,
      callback: callback,
      time: moment().format("X")
    };
    this.askSession.add(session);
    response.askSession = session;
    this.sendSocketNotification("ASK", response);
  },

  say (response, adminMode = false) {
    if (adminMode) this.sendSocketNotification("SAY_ADMIN", response);
    else this.sendSocketNotification("SAY", response);
  },

  adminSay (response) {
    this.sendSocketNotification("SAY_ADMIN", response);
  },

  toRegExp (exp) {
    var lastSlash = exp.lastIndexOf("/");
    if (lastSlash > 1) {
      var restoredRegex = new RegExp(
        exp.slice(1, lastSlash),
        exp.slice(lastSlash + 1)
      );
      return (restoredRegex) ? restoredRegex : new RegExp(exp.valueOf());
    } else {
      return new RegExp(exp.valueOf());
    }
  },

  getTelecastDom () {
    var dom = document.createElement("div");
    dom.classList.add("container");
    var anchor = document.createElement("div");
    anchor.id = "EXT-TELBOT_ANCHOR";
    dom.appendChild(anchor);
    if (this.config.telecastHideOverflow) dom.classList.add("telecastHideOverflow");
    for (var c of this.chats) {
      this.appendTelecastChat(dom, c);
    }
    return dom;
  },

  appendTelecastChat (parent, c) {
    const getImageURL = (id) => {
      return this.file(`cache/${id}`);
    };
    var anchor = parent.querySelector("#EXT-TELBOT_ANCHOR");
    var chat = document.createElement("div");
    chat.classList.add("chat");
    var from = document.createElement("div");
    from.classList.add("from");
    var profile = document.createElement("div");
    profile.classList.add("profile");
    if (c.from._photo) {
      let profileImage = document.createElement("img");
      profileImage.classList.add("profileImage");
      profileImage.src = getImageURL(c.from._photo);
      profile.appendChild(profileImage);
    } else {
      let altName = "";
      if (c.from.first_name) altName += c.from.first_name.substring(0, 1);
      if (c.from.last_name) altName += c.from.last_name.substring(0, 1);
      if (!altName) altName += c.from.username.substring(0, 2);
      let rr = c.from.id % 360;
      var hsl = `hsl(${rr}, 75%, 50%)`;
      //profile.style.backgroundColor = "hsl(${rr}, 100%, 50%)"
      profile.style.backgroundColor = hsl;
      profile.innerHTML = altName;
    }
    from.appendChild(profile);
    chat.appendChild(from);
    var message = document.createElement("div");
    message.classList.add("message");
    var bubble = document.createElement("div");
    bubble.classList.add("bubble");
    //reply
    if (c.chat._photo) {
      var photo = document.createElement("div");
      photo.classList.add("photo");
      var background = document.createElement("div");
      background.classList.add("background");
      background.style.backgroundImage = `url(${getImageURL(c.chat._photo)})`;
      photo.appendChild(background);
      var imageContainer = document.createElement("div");
      imageContainer.classList.add("imageContainer");
      var photoImage = document.createElement("img");
      photoImage.classList.add("photoImage");
      photoImage.src = getImageURL(c.chat._photo);
      photoImage.onload = () => {
        anchor.scrollIntoView(false);
      };
      imageContainer.appendChild(photoImage);
      photo.appendChild(imageContainer);
      bubble.appendChild(photo);
    }
    if (c.chat._video) {
      var video = document.createElement("video");
      video.classList.add("video");
      video.autoplay = true;
      video.loop = true;
      video.src = getImageURL(c.chat._video);
      video.addEventListener("loadeddata", () => {
        anchor.scrollIntoView(false);
      }, false);
      video.addEventListener("error", () => {
        delete c.chat._video;
        c.text = "Video Error!";
        this.updateDom();
      }, false);
      bubble.appendChild(video);
    }

    if (c.text) {
      var text = document.createElement("div");
      text.classList.add("text");
      text.innerHTML = c.text;
      bubble.appendChild(text);
    }

    if (c.chat._audio) {
      var audio = document.createElement("div");
      audio.classList.add("text");
      var audioSrc = new Audio(getImageURL(c.chat._audio));
      audioSrc.volume = 0.6;
      audioSrc.play();
      audio.innerHTML = c.title ? c.title : (c.caption ? c.caption : "Audio");
      bubble.appendChild(audio);
    }

    if (c.chat._voice) {
      var voice = document.createElement("div");
      voice.classList.add("text");
      var voiceSrc = new Audio(getImageURL(c.chat._voice));
      voiceSrc.volume = 1.0;
      voiceSrc.play();
      voice.innerHTML = "Voice";
      bubble.appendChild(voice);
    }

    message.appendChild(bubble);
    chat.appendChild(message);
    chat.timer = setTimeout(() => {
      parent.removeChild(chat);
    }, this.config.telecastLife);
    parent.insertBefore(chat, anchor);
  },

  telecast (msgObj) {
    if (!this.config.telecast) return;
    if (!msgObj.text && !msgObj.photo && !msgObj.sticker && !msgObj.animation && !msgObj.audio && !msgObj.voice) return;
    if (this.config.useSoundNotification) this.sound.src = this.file("resources/msg_incoming.mp3");
    while (this.chats.length >= this.config.telecastLimit) {
      this.chats.shift();
    }
    this.chats.push(msgObj);

    var module = document.getElementById("EXT-TELBOT");
    module.classList.remove("inactive");

    var dom = document.querySelector("#EXT-TELBOT .container");

    while (dom.childNodes.length >= this.config.telecastLimit + 1) {
      if (dom.firstChild.id !== "EXT-TELBOT_ANCHOR") dom.removeChild(dom.firstChild);
    }
    this.appendTelecastChat(dom, msgObj);
    this.sendNotification("EXT-TELBOT_TELECAST", msgObj);
    var anchor = document.querySelector("#EXT-TELBOT_ANCHOR");
    anchor.scrollIntoView(false);
  }
});
