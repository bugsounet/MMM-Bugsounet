"use strict";

const fs = require("node:fs");
const http = require("node:http");
const GoogleAuthLibrary = require("google-auth-library");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const googleapis = require("googleapis");
const GoogleActions = require("actions-on-google");

var log = () => { /* do nothing */ };

class smarthome {
  constructor (config, cb = () => {}) {
    this.config = config;
    this.translations = this.config.translations;

    this.sendSocketNotification = (...args) => cb.sendSocketNotification(...args);

    if (this.config.debug) log = (...args) => { console.log("[SMARTHOME]", ...args); };

    this.smarthome = {
      lang: this.SHLanguage(this.config.lang),
      user: { username: "admin", password: "admin", devices: ["MMM-Bugsounet"] },
      use: false, // credentials and CLIENT_ID ok
      app: null,
      server: null,
      initialized: false, // server started
      ready: false, // homegraph ready
      EXTStatus: {}, // status of all EXTs
      EXT: {}, // EXTs compatible list for device
      homegraph: null, // homegraph control
      actions: null, // actions on google
      current: {}, // current status of smarthome
      old: {}, // old status of smarthome
      device: {}, // smarthome device
      last_code: null,
      last_code_user: null,
      last_code_time: null
    };
    this.root_path = global.root_path;
    this.GAPath = `${this.root_path}/modules/MMM-Bugsounet`;
    this.smarthomeWebsitePath = `${this.root_path}/modules/MMM-Bugsounet/EXTs/EXT-SmartHome/website`;
    this.smarthomeModulePath = `${this.root_path}/modules/MMM-Bugsounet/EXTs/EXT-SmartHome`;
    this.tokensDir = `${this.smarthomeWebsitePath}/tokens/`;
    this.waitBeforeInitDevice = 10 * 1000;
  }

  init () {
    console.log("[SMARTHOME] Loading SmartHome...");
    return new Promise((resolve) => {
      if (!this.config.username && !this.config.password) {
        console.error("[SMARTHOME] Your have not defined user/password in config!");
        console.error("[SMARTHOME] Using default credentials");
      } else {
        if ((this.config.username === this.smarthome.user.username) || (this.config.password === this.smarthome.user.password)) {
          console.warn("[SMARTHOME] WARN: You are using default username or default password");
          console.warn("[SMARTHOME] WARN: Don't forget to change it!");
        }
        this.smarthome.user.username = this.config.username;
        this.smarthome.user.password = this.config.password;
      }

      let file = `${this.smarthomeModulePath}/smarthome.json`;
      fs.readFile(file, "utf8", (err, data) => {
        let content;
        if (!data) {
          console.error("[SMARTHOME] smarthome.json: file not found!");
          this.send("Alert", "smarthome.json: file not found!");
          resolve();
          return;
        }

        try {
          content = JSON.parse(data);
        } catch {
          console.error("[SMARTHOME] smarthome.json: corrupt!");
          this.send("Alert", "smarthome.json: corrupt!");
          resolve();
          return;
        }
        if (content?.type === "service_account") {
          this.smarthome.homegraph = googleapis.google.homegraph({
            version: "v1",
            auth: new GoogleAuthLibrary.GoogleAuth({
              keyFile: file,
              scopes: ["https://www.googleapis.com/auth/homegraph"]
            })
          });
          if (!this.config.CLIENT_ID) {
            console.error("[SMARTHOME] CLIENT_ID not defined in config!");
            this.send("Alert", "CLIENT_ID not defined in config!");
          } else {
            this.smarthome.use = true;
          }
        } else {
          console.error("[SMARTHOME] smarthome.json: bad format!");
          this.send("Alert", "smarthome.json: bad format!");
        }
        resolve();
      });
    });
  }

  createMiddleware () {
    console.log("[SMARTHOME] Create Middleware...");
    this.smarthome.actions = GoogleActions.smarthome();
    this.smarthome.app = express();
    this.smarthome.server = http.createServer(this.smarthome.app);

    this.smarthome.app.use(bodyParser.json());
    this.smarthome.app.use(bodyParser.urlencoded({ extended: true }));
    this.actions();

    var options = {
      dotfiles: "ignore",
      etag: false,
      extensions: ["css", "js"],
      index: false,
      maxAge: "1d",
      redirect: false,
      setHeaders (res) {
        res.set("x-timestamp", Date.now());
      }
    };

    this.smarthome.app
      .use(this.logRequest)
      .use(cors({ origin: "*" }))
      .use("/assets", express.static(`${this.smarthomeWebsitePath}/assets`, options))

      .get("/robots.txt", (req, res) => {
        res.sendFile(`${this.smarthomeWebsitePath}/robots.txt`);
      });

    if (this.smarthome.use) {
      this.smarthome.app
        .get("/login/", (req, res) => {
          if (this.smarthome.use) res.sendFile(`${this.smarthomeWebsitePath}/login.html`);
          else res.sendFile(`${this.smarthomeWebsitePath}/disabled.html`);
        })

        .post("/login/", (req, res) => {
          let form = req.body;
          let args = req.query;
          if (form["username"] && form["password"] && args["state"] && args["response_type"] && args["response_type"] === "code" && args["client_id"] === this.config.CLIENT_ID) {
            let user = this.get_user(form["username"], form["password"]);
            if (!user) return res.sendFile(`${this.smarthomeWebsitePath}/login.html`);
            this.smarthome.last_code = this.random_string(8);
            this.smarthome.last_code_user = form["username"];
            this.smarthome.last_code_time = (new Date(Date.now())).getTime() / 1000;
            let params = {
              state: args["state"],
              code: this.smarthome.last_code,
              client_id: this.config.CLIENT_ID
            };
            log("[AUTH] Generate Code:", this.smarthome.last_code);
            res.status(301).redirect(args["redirect_uri"] + this.serialize(params));
          } else {
            res.status(400).sendFile(`${this.smarthomeWebsitePath}/400.html`);
          }
        })

        .post("/token/", (req, res) => {
          let form = req.body;
          if (form["grant_type"] && form["grant_type"] === "authorization_code" && form["code"] && form["code"] === this.smarthome.last_code) {
            let time = (new Date(Date.now())).getTime() / 1000;
            if (time - this.smarthome.last_code_time > 10) {
              log("[TOKEN] Invalid code (timeout)");
              res.status(403).sendFile(`${this.smarthomeWebsitePath}/403.html`);
            } else {
              let access_token = this.random_string(32);
              fs.writeFileSync(`${this.tokensDir}/${access_token}`, this.smarthome.last_code_user, { encoding: "utf8" });
              log("|TOKEN] Send Token:", access_token);
              res.json({ access_token: access_token });
            }
          } else {
            log("[TOKEN] Invalid code");
            res.status(403).sendFile(`${this.smarthomeWebsitePath}/403.html`);
          }
        })

        /** fulfillment Server **/
        .get("/", (req, res) => {
          res.sendFile(`${this.smarthomeWebsitePath}/works.html`);
        })

        .post("/", this.smarthome.actions)

        /** Display current google graph in console **/
        .get("/graph", (req, res) => {
          if (this.smarthome.ready) this.queryGraph();
          res.status(404).sendFile(`${this.smarthomeWebsitePath}/404.html`);
        });
    } else {
      this.smarthome.app
        .get("/login/", (req, res) => {
          res.sendFile(`${this.smarthomeWebsitePath}/disabled.html`);
        })
        .get("/", (req, res) => {
          res.sendFile(`${this.smarthomeWebsitePath}/disabled.html`);
        });
    }

    this.smarthome.app
      .get("/*", (req, res) => {
        console.warn("[SMARTHOME] Don't find:", req.url);
        res.status(404).sendFile(`${this.smarthomeWebsitePath}/404.html`);
      });

    /** Create Server **/
    this.smarthome.server
      .listen(8083, "127.0.0.1", () => {
        console.log("[SMARTHOME] Start listening on port 8083");
        this.smarthome.initialized = true;
        this.sendSocketNotification("INITIALIZED");
        if (this.smarthome.use) {
          log("Wait", this.waitBeforeInitDevice / 1000, "secs for Collecting EXTs...");

          setTimeout(() => {
            console.log("[SMARTHOME] Device Configuration...");
            this.initDevice();
          }, this.waitBeforeInitDevice);
        }
      })
      .on("error", (err) => {
        console.error("[SMARTHOME] Can't start SmartHome web server!");
        console.error("[SMARTHOME] Error:", err.message);
        this.sendSocketNotification("SendNoti", {
          noti: "Bugsounet_ALERT",
          payload: {
            type: "error",
            message: "Can't start SmartHome web server!",
            timer: 10000
          }
        });
        this.smarthome.initialized = false;
      });
  }

  /** log any traffic **/
  logRequest (req, res, next) {
    var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    log(`[${ip}] [${req.method}] ${req.url}`);
    next();
  }

  setEXTStatus (EXTs) {
    this.smarthome.EXTStatus = EXTs;
    log("Set EXTStatus updated");
  }

  initDevice () {
    log("[DEVICE] Create device...");
    this.smarthome.device = {
      type: "action.devices.types.TV",
      traits: [
        "action.devices.traits.Reboot",
        "action.devices.traits.InputSelector"
      ],
      name: {
        name: "MagicMirror²",
        defaultNames: [
          "Magic Mirror",
          "MagicMirror",
          "Mirror"
        ],
        nicknames: [
          "Magic Mirror",
          "MagicMirror",
          "Mirror"
        ]
      },
      attributes: {
        orderedInputs: true,
        availableInputs: []
      },
      willReportState: true,
      roomHint: "MMM-Bugsounet",
      deviceInfo: {
        manufacturer: "@bugsounet",
        model: "MMM-Bugsounet",
        hwVersion: require(`${this.GAPath}/package.json`).version,
        swVersion: require(`${this.smarthomeModulePath}/package.json`).version
      }
    };

    let Status = this.smarthome.EXTStatus;
    log("Received first Status", Status);
    this.smarthome.EXT = {
      "EXT-Screen": Status["EXT-Screen"].hello,
      "EXT-Volume": Status["EXT-Volume"].hello,
      "EXT-Pages": Status["EXT-Pages"].hello,
      "EXT-Spotify": Status["EXT-Spotify"].hello,
      "EXT-FreeboxTV": Status["EXT-FreeboxTV"].hello,
      "EXT-RadioPlayer": Status["EXT-RadioPlayer"].hello
    };
    this.smarthome.current.Screen = Status["EXT-Screen"].power;
    this.smarthome.current.Volume = Status["EXT-Volume"].speaker;
    this.smarthome.current.VolumeIsMuted = Status["EXT-Volume"].isMuted;
    this.smarthome.current.Page = Status["EXT-Pages"].actual;
    this.smarthome.current.MaxPages = Status["EXT-Pages"].total;
    this.smarthome.current.SpotifyIsConnected = Status["EXT-Spotify"].connected;
    this.smarthome.current.SpotifyIsPlaying = Status["EXT-Spotify"].play;
    this.smarthome.current.TvIsPlaying = Status["EXT-FreeboxTV"].connected;
    this.smarthome.current.TVPlay = Status["EXT-FreeboxTV"].playing;
    this.smarthome.current.RadioIsPlaying = Status["EXT-RadioPlayer"].connected;
    this.smarthome.current.RadioPlay = Status["EXT-RadioPlayer"].playing;

    // Stop
    log(`[DEVICE] Add Input: ${this.translations["Stop"]}`);
    let stop = {
      key: this.translations["Stop"],
      names: [
        {
          lang: this.smarthome.lang,
          name_synonym: [this.translations["Stop"], "Stop", "stop"]
        }
      ]
    };
    this.smarthome.device.attributes.availableInputs.push(stop);

    if (this.smarthome.EXT["EXT-Screen"]) {
      log("[DEVICE] Found: EXT-Screen (action.devices.traits.OnOff)");
      this.smarthome.device.traits.push("action.devices.traits.OnOff");
    }
    if (this.smarthome.EXT["EXT-Volume"]) {
      log("[DEVICE] Found: EXT-Volume (action.devices.traits.Volume)");
      this.smarthome.device.traits.push("action.devices.traits.Volume");
      this.smarthome.device.attributes.volumeMaxLevel = 100;
      this.smarthome.device.attributes.volumeCanMuteAndUnmute = true;
      this.smarthome.device.attributes.volumeDefaultPercentage = this.smarthome.current.Volume;
      this.smarthome.device.attributes.levelStepSize = 5;
    }
    if (this.smarthome.EXT["EXT-Pages"]) {
      log("[DEVICE] Found: EXT-Pages (action.devices.traits.Channel)");
      this.smarthome.device.traits.push("action.devices.traits.Channel");
    }

    this.smarthome.device.traits.push("action.devices.traits.Locator");

    this.smarthome.device.attributes.availableApplications = [];
    let home = {
      key: "Home",
      names: [
        {
          name_synonym: ["home"],
          lang: this.smarthome.lang
        }
      ]
    };
    this.smarthome.device.attributes.availableApplications.push(home);

    if (this.smarthome.EXT["EXT-Spotify"]) {
      log("[DEVICE] Found: EXT-Spotify (action.devices.traits.AppSelector, action.devices.traits.TransportControl)");
      this.smarthome.device.traits.push("action.devices.traits.AppSelector");
      let spotify = {
        key: "Spotify",
        names: [
          {
            name_synonym: ["spotify"],
            lang: this.smarthome.lang
          }
        ]
      };
      this.smarthome.device.attributes.availableApplications.push(spotify);
      this.smarthome.device.traits.push("action.devices.traits.TransportControl");
      this.smarthome.device.attributes.transportControlSupportedCommands = [
        "NEXT",
        "PAUSE",
        "PREVIOUS",
        "RESUME",
        "STOP"
      ];
    }

    if (this.smarthome.EXT["EXT-FreeboxTV"]) {
      log("[DEVICE] Found: EXT-FreeboxTV (action.devices.traits.InputSelector)");
      this.smarthome.EXTStatus["EXT-FreeboxTV"].channels.forEach((channel) => {
        log(`[DEVICE] Add Input: TV ${channel}`);
        let FBTV = {
          key: `TV ${channel}`,
          names: [
            {
              lang: this.smarthome.lang,
              name_synonym: [`TV ${channel}`, `${channel}`]
            }
          ]
        };
        this.smarthome.device.attributes.availableInputs.push(FBTV);
      });
      let TV = {
        key: "TV",
        names: [
          {
            name_synonym: ["TV"],
            lang: this.smarthome.lang
          }
        ]
      };
      this.smarthome.device.attributes.availableApplications.push(TV);
    }

    if (this.smarthome.EXT["EXT-RadioPlayer"]) {
      log("[DEVICE] Found: EXT-RadioPlayer (action.devices.traits.InputSelector)");
      this.smarthome.EXTStatus["EXT-RadioPlayer"].channels.forEach((channel) => {
        log(`[DEVICE] Add Input: Radio ${channel}`);
        let radio = {
          key: `Radio ${channel}`,
          names: [
            {
              lang: this.smarthome.lang,
              name_synonym: [`Radio ${channel}`, `${channel}`]
            }
          ]
        };
        this.smarthome.device.attributes.availableInputs.push(radio);
      });
      let RADIO = {
        key: "RADIO",
        names: [
          {
            name_synonym: ["Radio"],
            lang: this.smarthome.lang
          }
        ]
      };
      this.smarthome.device.attributes.availableApplications.push(RADIO);
    }

    // Restart MM²
    log(`[DEVICE] Add Input: ${this.translations["Restart"]}`);
    let restartMM = {
      key: this.translations["Restart"],
      names: [
        {
          lang: this.smarthome.lang,
          name_synonym: [this.translations["Restart"]]
        }
      ]
    };
    this.smarthome.device.attributes.availableInputs.push(restartMM);

    // CLose MM²
    log(`[DEVICE] Add Input: ${this.translations["CLose"]}`);
    let cLoseMM = {
      key: this.translations["CLose"],
      names: [
        {
          lang: this.smarthome.lang,
          name_synonym: [this.translations["CLose"]]
        }
      ]
    };
    this.smarthome.device.attributes.availableInputs.push(cLoseMM);

    // Restart system
    log(`[DEVICE] Add Input: ${this.translations["Reboot"]}`);
    let restartSystem = {
      key: this.translations["Reboot"],
      names: [
        {
          lang: this.smarthome.lang,
          name_synonym: [this.translations["Reboot"]]
        }
      ]
    };
    this.smarthome.device.attributes.availableInputs.push(restartSystem);

    // CLose system
    log(`[DEVICE] Add Input: ${this.translations["Shutdown"]}`);
    let closeSystem = {
      key: this.translations["Shutdown"],
      names: [
        {
          lang: this.smarthome.lang,
          name_synonym: [this.translations["Shutdown"]]
        }
      ]
    };
    this.smarthome.device.attributes.availableInputs.push(closeSystem);

    log("Your device is now:", this.smarthome.device);
    this.requestSync();
  }

  refreshData () {
    let data = this.smarthome.EXTStatus;
    this.smarthome.old = {
      Screen: this.smarthome.current.Screen,
      Volume: this.smarthome.current.Volume,
      VolumeIsMuted: this.smarthome.current.VolumeIsMuted,
      Page: this.smarthome.current.Page,
      MaxPages: this.smarthome.current.MaxPages,
      SpotifyIsConnected: this.smarthome.current.SpotifyIsConnected,
      SpotifyIsPlaying: this.smarthome.current.SpotifyIsPlaying,
      TvIsPlaying: this.smarthome.current.TvIsPlaying,
      TVPlay: this.smarthome.current.TVPlay,
      RadioIsPlaying: this.smarthome.current.RadioIsPlaying,
      RadioPlay: this.smarthome.current.RadioPlay
    };
    this.smarthome.current.Screen = data["EXT-Screen"].power;
    this.smarthome.current.Volume = data["EXT-Volume"].speaker;
    this.smarthome.current.VolumeIsMuted = data["EXT-Volume"].isMuted;
    this.smarthome.current.Page = data["EXT-Pages"].actual;
    this.smarthome.current.MaxPages = data["EXT-Pages"].total;
    this.smarthome.current.SpotifyIsConnected = data["EXT-Spotify"].connected;
    this.smarthome.current.SpotifyIsPlaying = data["EXT-Spotify"].play;
    this.smarthome.current.TvIsPlaying = data["EXT-FreeboxTV"].connected;
    this.smarthome.current.TVPlay = data["EXT-FreeboxTV"].playing;
    this.smarthome.current.RadioIsPlaying = data["EXT-RadioPlayer"].connected;
    this.smarthome.current.RadioPlay = data["EXT-RadioPlayer"].playing;
  }

  /** action on google **/
  actions () {
    this.smarthome.actions.onSync((body, headers) => {
      log("[ACTIONS] [SYNC] Request:", JSON.stringify(body));
      let user_id = this.check_token(headers);
      if (!user_id) {
        console.error("[SMARTHOME] [ACTIONS] [SYNC] Error: user_id not found!");
        return {};
      }
      var result = {};
      result["requestId"] = body["requestId"];
      result["payload"] = { agentUserId: user_id, devices: [] };
      let user = this.get_userOnly(user_id);
      if (!user) {
        console.error(`[SMARTHOME] [ACTIONS] [SYNC] Error: This token is registred only for user: ${user_id}`);
        return {};
      }
      let device = this.get_device(user.devices[0], this.smarthome.device);
      result["payload"]["devices"].push(device);
      log("[ACTIONS] [SYNC] Send Result:", JSON.stringify(result));
      return result;
    });

    this.smarthome.actions.onExecute((body, headers) => {
      log("[ACTIONS] [EXECUTE] Request:", JSON.stringify(body));
      let user_id = this.check_token(headers);
      if (!user_id) {
        console.error("[SMARTHOME] [ACTIONS] [EXECUTE] Error: user_id not found!");
        return {};
      }
      var result = {};
      result["payload"] = {};
      result["payload"]["commands"] = [];
      let inputs = body["inputs"];
      let device_id = inputs[0].payload.commands[0].devices[0].id || null;
      let command = inputs[0].payload.commands[0].execution[0].command || null;
      let params = inputs[0].payload.commands[0].execution[0].hasOwnProperty("params") ? inputs[0].payload.commands[0].execution[0].params : null;
      let action_result = this.execute(command, params);
      action_result["ids"] = [device_id];
      result["payload"]["commands"].push(action_result);
      log("[ACTIONS] [EXECUTE] Send Result:", JSON.stringify(result));
      return result;
    });

    this.smarthome.actions.onQuery((body, headers) => {
      log("[ACTIONS] [QUERY] Request:", JSON.stringify(body));
      let user_id = this.check_token(headers);
      if (!user_id) {
        console.error("[SMARTHOME] [ACTIONS] [QUERY] Error: user_id not found!");
        return {};
      }
      var result = {};
      result["payload"] = {};
      result["payload"]["devices"] = {};
      let inputs = body["inputs"];
      let device_id = inputs[0].payload.devices[0].id || null;
      log("[ACTIONS] [QUERY] device_id:", device_id);
      result["payload"]["devices"][device_id] = this.query(this.smarthome);
      log("[ACTIONS] [QUERY] Send Result:", JSON.stringify(result));
      return result;
    });

    this.smarthome.actions.onDisconnect((body, headers) => {
      log("[ACTIONS] [Disconnect]");
      this.delete_token(this.get_token(headers));
      return {};
    });
  }

  query (smarthome) {
    let data = smarthome.current;
    let EXT = smarthome.EXT;
    let result = { online: true };

    if (!smarthome.initialized) { // to change initialized -> ready
      result = { online: false };
      log("[HOMEGRAPH] [QUERY] Result:", result);
      return result;
    }

    result.currentInput = this.translations["Stop"];
    result.currentApplication = "Home";

    if (EXT["EXT-Screen"]) {
      result.on = data.Screen;
    }
    if (EXT["EXT-Volume"]) {
      result.currentVolume = data.Volume;
      result.isMuted = data.VolumeIsMuted;
    }
    if (EXT["EXT-FreeboxTV"] && data.TvIsPlaying) {
      result.currentInput = `TV ${data.TVPlay}`;
      result.currentApplication = "TV";
    }
    if (EXT["EXT-RadioPlayer"] && data.RadioIsPlaying) {
      result.currentInput = `Radio ${data.RadioPlay}`;
      result.currentApplication = "Radio";
    }

    if (EXT["EXT-Spotify"] && data.SpotifyIsPlaying) {
      result.currentApplication = "Spotify";
    }

    log("[HOMEGRAPH] [QUERY] Result:", result);
    return result;
  }

  execute (command, params) {
    let data = this.smarthome.current;
    switch (command) {
      case "action.devices.commands.OnOff":
        if (params["on"]) this.send("screen", "ON");
        else this.send("screen", "OFF");
        return { status: "SUCCESS", states: { on: params["on"], online: true } };
      case "action.devices.commands.volumeRelative":
        var level = 0;
        if (params.volumeRelativeLevel > 0) {
          level = data.Volume + 5;
          if (level > 100) level = 100;
          this.send("volumeUp");
        } else {
          level = data.Volume - 5;
          if (level < 0) level = 0;
          this.send("volumeDown");
        }
        return { status: "SUCCESS", states: { online: true, currentVolume: level, isMuted: data.VolumeIsMuted } };
      case "action.devices.commands.setVolume":
        this.send("volume", params.volumeLevel);
        return { status: "SUCCESS", states: { online: true, currentVolume: params.volumeLevel, isMuted: data.VolumeIsMuted } };
      case "action.devices.commands.mute":
        this.send("volumeMute", params.mute);
        return { status: "SUCCESS", states: { online: true, isMuted: params.mute, currentVolume: data.Volume } };
      case "action.devices.commands.SetInput":
        var input = params.newInput;
        var element;

        // STOP
        if (input === this.translations["Stop"]) {
          this.send("Stop");
          params.newInput = this.translations["Stop"];
        }

        // RestartMM
        if (input === this.translations["Restart"]) {
          this.send("Restart");
          params.newInput = this.translations["Restart"];
        }

        // CLoseMM
        if (input === this.translations["CLose"]) {
          this.send("Close");
          params.newInput = this.translations["CLose"];
        }

        // RestartSystem
        if (input === this.translations["Reboot"]) {
          this.send("Reboot");
          params.newInput = this.translations["Reboot"];
        }

        // CloseSystem
        if (input === this.translations["Shutdown"]) {
          this.send("Shutdown");
          params.newInput = this.translations["Shutdown"];
        }

        // FreeboxTV
        if (input.startsWith("TV ")) {
          element = input.split(/(^TV\s)/s);
          this.send("TVPlay", element[2]);
          params.newInput = input;
        }

        // RadioPlayer
        if (input.startsWith("Radio ")) {
          element = input.split(/(^Radio\s)/s);
          this.send("RadioPlay", element[2]);
          params.newInput = input;
        }

        return { status: "SUCCESS", states: { online: true, currentInput: params.newInput } };
      case "action.devices.commands.NextInput":
        // a coder avec soit FreeboxTV ou RadioPlayer
        //this.send("setNextPage");
        return { status: "SUCCESS", states: { online: true } };
      case "action.devices.commands.PreviousInput":
        // a coder avec soit FreeboxTV ou RadioPlayer
        // this.send("setPreviousPage");
        return { status: "SUCCESS", states: { online: true } };
      case "action.devices.commands.Reboot":
        this.send("Restart");
        return {};
      case "action.devices.commands.Locate":
        this.send("Locate");
        return { status: "SUCCESS" };
      case "action.devices.commands.mediaStop":
        this.send("Stop");
        return {};
      case "action.devices.commands.mediaNext":
        this.send("SpotifyNext");
        return {};
      case "action.devices.commands.mediaPrevious":
        this.send("SpotifyPrevious");
        return {};
      case "action.devices.commands.mediaPause":
        this.send("SpotifyPause");
        return {};
      case "action.devices.commands.mediaResume":
        this.send("SpotifyPlay");
        return {};
      case "action.devices.commands.appSelect":
        if (params.newApplication === "Spotify") {
          if (!data.SpotifyIsConnected && !data.SpotifyIsPlaying) {
            this.send("SpotifyPlay");
          }
        }
        if (params.newApplication === "Radio") {
          if (!data.RadioIsPlaying) {
            this.send("RadioPlay");
          }
        }
        if (params.newApplication === "TV") {
          if (!data.TvIsPlaying) {
            this.send("TVPlay");
          }
        }
        if (params.newApplication === "Home") {
          this.send("Stop");
        }
        return { status: "SUCCESS", states: { online: true, currentApplication: params.newApplication } };
      case "action.devices.commands.relativeChannel":
        if (params.relativeChannelChange > 0) {
          this.send("setNextPage");
        } else {
          this.send("setPreviousPage");
        }
        return { status: "SUCCESS" };
      default:
        return { status: "ERROR" };
    }
  }

  /** Tools **/
  get_user (username, password) {
    if ((username === this.smarthome.user.username) && (password === this.smarthome.user.password)) {
      return this.smarthome.user;
    } else {
      return null;
    }
  }

  get_userOnly (username) {
    if (username === this.smarthome.user.username) {
      return this.smarthome.user;
    } else {
      return null;
    }
  }

  get_device (device_id, device) {
    if (device_id === "MMM-Bugsounet") {
      let data = device;
      data["id"] = device_id;
      return data;
    } else {
      return null;
    }
  }

  /** token rules **/
  check_token (headers) {
    let access_token = this.get_token(headers);
    if (!access_token) {
      console.error("[SMARTHOME] [TOKEN] No token found in headers");
      return null;
    }
    if (fs.existsSync(`${this.tokensDir}${access_token}`)) {
      let user = fs.readFileSync(`${this.tokensDir}${access_token}`, "utf8");
      return user;
    } else {
      console.error("[SMARTHOME] [TOKEN] Token not found in database", access_token);
      return null;
    }
  }

  get_token (headers) {
    if (!headers) return null;
    const auth = headers.authorization;
    let parts = auth.split(" ", 2);
    if (auth && parts.length === 2 && parts[0].toLowerCase() === "bearer") {
      return parts[1];
    } else {
      return null;
    }
  }

  delete_token (access_token) {
    if (fs.existsSync(`${this.tokensDir}${access_token}`)) {
      fs.unlinkSync(`${this.tokensDir}${access_token}`);
    } else {
      console.error("[SMARTHOME] [TOKEN] Delete Failed", access_token);
    }
  }

  random_string (length = 8) {
    let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  serialize (obj) {
    let str = `?${Object.keys(obj).reduce(function (a, k) {
      a.push(`${k}=${encodeURIComponent(obj[k])}`);
      return a;
    }, []).join("&")}`;
    return str;
  }

  SHLanguage (language) {
    let lang = "en";

    switch (language) {
      case "da":
      case "nl":
      case "en":
      case "fr":
      case "de":
      case "hi":
      case "id":
      case "it":
      case "ja":
      case "ko":
      case "es":
      case "sv":
        lang = language;
        break;
      case "pt":
      case "pt-br":
        lang = "pt-BR";
        break;
      case "zh-tw":
        lang = "zh-TW";
        break;
      case "nb":
      case "nn":
        lang = "no";
        break;
      //case "th": ?? Thaï (th)
      default:
        lang = "en";
        break;
    }
    return lang;
  }

  /** homegraph **/
  async requestSync () {
    log("[HOMEGRAPH] [RequestSync] in Progress...");
    let body = {
      requestBody: {
        agentUserId: this.smarthome.user.username,
        async: false
      }
    };
    try {
      await this.smarthome.homegraph.devices.requestSync(body);
      console.log("[SMARTHOME] smarthome Ready!");
      this.smarthome.ready = true;
    } catch (e) {
      if (e.code) {
        console.error("[SMARTHOME] [HOMEGRAPH] [RequestSync] Error:", e.code, e.errors);
        this.send("Alert", `[requestSync] Error ${e.code} - ${e.errors[0].message} (${e.errors[0].reason})`);
      } else {
        console.error("[SMARTHOME] [HOMEGRAPH] [RequestSync]", e.toString());
        this.send("Alert", `[requestSync] ${e.toString()}`);
      }
    }
  }

  async queryGraph () {
    if (!this.smarthome.ready) return;
    let query = {
      requestBody: {
        requestId: `Bugsounet-${Date.now()}`,
        agentUserId: this.smarthome.user.username,
        inputs: [
          {
            payload: {
              devices: [
                {
                  id: "MMM-Bugsounet"
                }
              ]
            }
          }
        ]
      }
    };
    try {
      const res = await this.smarthome.homegraph.devices.query(query);
      log("[HOMEGRAPH] [QueryGraph]", JSON.stringify(res.data));
    } catch (e) {
      console.log("[SMARTHOME] [HOMEGRAPH] [QueryGraph]", e.code ? e.code : e, e.errors ? e.errors : "");
    }
  }

  async updateGraph () {
    if (!this.smarthome.ready) return;
    let EXT = this.smarthome.EXT;
    let current = this.smarthome.current;
    let old = this.smarthome.old;

    function isEqual (x, y) {
      const ok = Object.keys,
        tx = typeof x,
        ty = typeof y;
      return x && y && tx === "object" && tx === ty
        ? (ok(x).length === ok(y).length && ok(x).every((key) => isEqual(x[key], y[key])))
        : (x === y);
    }

    if (!isEqual(current, old)) {
      let state = {
        online: true
      };
      if (EXT["EXT-Screen"]) {
        state.on = current.Screen;
      }
      if (EXT["EXT-Volume"]) {
        state.currentVolume = current.Volume;
        state.isMuted = current.VolumeIsMuted;
      }

      state.currentInput = this.translations["Stop"];
      state.currentApplication = "Home";

      if (EXT["EXT-FreeboxTV"] && current.TvIsPlaying) {
        state.currentInput = `TV ${current.TVPlay}`;
        state.currentApplication = "TV";
      }

      if (EXT["EXT-RadioPlayer"] && current.RadioIsPlaying) {
        state.currentInput = `Radio ${current.RadioPlay}`;
        state.currentApplication = "Radio";
      }

      if (EXT["EXT-Spotify"] && current.SpotifyIsPlaying) {
        state.currentApplication = "Spotify";
      }

      let body = {
        requestBody: {
          agentUserId: this.smarthome.user.username,
          requestId: `Bugsounet-${Date.now()}`,
          payload: {
            devices: {
              states: {
                "MMM-Bugsounet": state
              }
            }
          }
        }
      };
      try {
        const res = await this.smarthome.homegraph.devices.reportStateAndNotification(body);
        if (res.status !== 200) log("[HOMEGRAPH] [ReportState]", res.data, state, res.status, res.statusText);
      } catch (e) {
        console.error("[SMARTHOME] [HOMEGRAPH] [ReportState]", e.code ? e.code : e, e.errors ? e.errors : "");
      }
    }
  }

  /** callbacks **/
  send (name, values) {
    switch (name) {
      case "screen":
        log("[CALLBACK] Send screen:", values);
        this.sendSocketNotification("CB_SCREEN", values);
        break;
      case "volume":
        log("[CALLBACK] Send volume:", values);
        this.sendSocketNotification("CB_VOLUME", values);
        break;
      case "volumeMute":
        log("[CALLBACK] Send volume Mute:", values);
        this.sendSocketNotification("CB_VOLUME-MUTE", values);
        break;
      case "volumeUp":
        log("[CALLBACK] Send volume Up");
        this.sendSocketNotification("CB_VOLUME-UP");
        break;
      case "volumeDown":
        log("[CALLBACK] Send volume Down");
        this.sendSocketNotification("CB_VOLUME-DOWN");
        break;
      case "setPage":
        log("[CALLBACK] Send setInput:", values);
        this.sendSocketNotification("CB_SET-PAGE", values);
        break;
      case "setNextPage":
        log("[CALLBACK] Send setNextPage");
        this.sendSocketNotification("CB_SET-NEXT-PAGE");
        break;
      case "setPreviousPage":
        log("[CALLBACK] Send setPreviousPage");
        this.sendSocketNotification("CB_SET-PREVIOUS-PAGE");
        break;
      case "Alert":
        log("[CALLBACK] Send Alert:", values);
        this.sendSocketNotification("CB_ALERT", values);
        break;
      case "Done":
        log("[CALLBACK] Send Alert Done:", values);
        this.sendSocketNotification("CB_DONE", values);
        break;
      case "Locate":
        log("[CALLBACK] Send Locate");
        this.sendSocketNotification("CB_LOCATE");
        break;
      case "SpotifyPlay":
        log("[CALLBACK] Send SpotifyPlay");
        this.sendSocketNotification("CB_SPOTIFY-PLAY");
        break;
      case "SpotifyPause":
        log("[CALLBACK] Send SpotifyPause");
        this.sendSocketNotification("CB_SPOTIFY-PAUSE");
        break;
      case "SpotifyPrevious":
        log("[CALLBACK] Send SpotifyPrevious");
        this.sendSocketNotification("CB_SPOTIFY-PREVIOUS");
        break;
      case "SpotifyNext":
        log("[CALLBACK] Send SpotifyNext");
        this.sendSocketNotification("CB_SPOTIFY-NEXT");
        break;
      case "TVPlay":
        log("[CALLBACK] Send TVPlay", values);
        this.sendSocketNotification("CB_TV-PLAY", values);
        break;
      case "TVNext":
        log("[CALLBACK] Send TVNext");
        this.sendSocketNotification("CB_TV-NEXT");
        break;
      case "TVPrevious":
        log("[CALLBACK] Send TVPrevious");
        this.sendSocketNotification("CB_TV-PREVIOUS");
        break;
      case "RadioPlay":
        log("[CALLBACK] Send RadioPlay", values);
        this.sendSocketNotification("CB_RADIO-PLAY", values);
        break;
      case "RadioNext":
        log("[CALLBACK] Send RadioNext");
        this.sendSocketNotification("CB_RADIO-NEXT");
        break;
      case "RadioPrevious":
        log("[CALLBACK] Send RadioPrevious");
        this.sendSocketNotification("CB_RADIO-PREVIOUS");
        break;
      case "Stop":
        log("[CALLBACK] Send Stop");
        this.sendSocketNotification("CB_STOP");
        break;
      case "Restart":
        log("[CALLBACK] Send Restart MM²");
        this.sendSocketNotification("CB_RESTART");
        break;
      case "Close":
        log("[CALLBACK] Send Close MM²");
        this.sendSocketNotification("CB_CLOSE");
        break;
      case "Reboot":
        log("[CALLBACK] Send Reboot");
        this.sendSocketNotification("CB_REBOOT");
        break;
      case "Shutdown":
        log("[CALLBACK] Send Shutdown");
        this.sendSocketNotification("CB_SHUTDOWN");
        break;
      default:
        log("[CALLBACK] Unknow callback:", name);
        break;
    }
  }
}

module.exports = smarthome;
