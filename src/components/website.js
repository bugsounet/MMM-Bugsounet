"use strict";

const fs = require("node:fs");
const util = require("node:util");
const readline = require("readline");
const Stream = require("stream");
const http = require("node:http");
const pty = require("node-pty");
const si = require("systeminformation");
const semver = require("semver");
const express = require("express");
const bodyParserErrorHandler = require("express-body-parser-error-handler");
const bodyParser = require("body-parser");
const cors = require("cors");
const Socket = require("socket.io");
const { createProxyMiddleware, fixRequestBody } = require("http-proxy-middleware");

const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const swaggerUi = require("swagger-ui-express");

const { rateLimit } = require("express-rate-limit");
const { slowDown } = require("express-slow-down");

var log = () => { /* do nothing */ };

class website {
  constructor (config, cb = () => {}) {
    this.lib = config.lib;
    this.config = config.config;
    this.sendSocketNotification = (...args) => cb.sendSocketNotification(...args);
    this.sendInternalCallback = (value) => cb.sendInternalCallback(value);

    if (config.debug) log = (...args) => { console.log("[Bugsounet] [Web]", ...args); };

    this.website = {
      MMConfig: null, // real config file (config.js)
      EXT: null, // EXT plugins list
      EXTConfigured: [], // configured EXT in config
      EXTInstalled: [], // installed EXT in MM
      EXTStatus: {}, // status of EXT
      EXTVersions: {},
      user: { _id: 1, username: "admin", password: "admin" },
      initialized: false,
      app: null,
      server: null,
      api: null,
      serverAPI: null,
      translations: null,
      loginTranslation: null,
      language: null,
      HyperWatch: null,
      radio: null,
      freeTV: {},
      systemInformation: {
        lib: null,
        result: {}
      },
      homeText: null,
      errorInit: false,
      listening: "127.0.0.1",
      APIDocs: false,
      healthDownloader: null
    };
    this.MMVersion = global.version;
    this.root_path = global.root_path;
    this.BugsounetModulePath = `${this.root_path}/modules/MMM-Bugsounet`;
    this.WebsitePath = `${this.root_path}/modules/MMM-Bugsounet/website`;
    this.APIDOCS = {};
    this.secret = this.encode(`MMM-Bugsounet v:${require("../package.json").version} rev:${require("../package.json").rev} API:v${require("../package.json").api}`);
    this.rateLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      skip: () => !this.config.useLimiter,
      validate: {
        xForwardedForHeader: false,
        trustProxy: false
      }
    });

    this.API_rateLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      skip: () => !this.config.useLimiter,
      validate: {
        xForwardedForHeader: false,
        trustProxy: false
      }
    });

    this.speedLimiter = slowDown({
      windowMs: 15 * 60 * 1000,
      delayAfter: 2,
      maxDelayMs: 5000,
      skip: () => !this.config.useLimiter,
      validate: {
        xForwardedForHeader: false,
        trustProxy: false
      }
    });

    this.API_speedLimiter = slowDown({
      windowMs: 15 * 60 * 1000,
      delayAfter: 2,
      maxDelayMs: 5000,
      skip: () => !this.config.useLimiter,
      validate: {
        xForwardedForHeader: false,
        trustProxy: false
      }
    });
  }

  async init (data) {
    console.log("[Bugsounet] [Web] Loading Website...");
    this.website.MMConfig = await this.readConfig();
    let Translations = data.translations;

    if (!this.website.MMConfig) { // should not happen ! ;)
      this.website.errorInit = true;
      console.error("[Bugsounet] [Web] Error: MagicMirror config.js file not found!");
      this.sendSocketNotification("ERROR", "MagicMirror config.js file not found!");
      return;
    }
    await this.MMConfigAddress();
    if (this.lib.error || this.website.errorInit) return;

    this.website.language = this.website.MMConfig.language;
    this.website.EXT = data.EXT_DB.sort();
    this.website.translations = Translations;
    this.website.loginTranslation = {
      welcome: this.website.translations["Login_Welcome"],
      username: this.website.translations["Login_Username"],
      password: this.website.translations["Login_Password"],
      error: this.website.translations["Login_Error"],
      login: this.website.translations["Login_Login"]
    };
    this.website.homeText = await this.getHomeText();
    this.website.freeTV = await this.readFreeTV();
    this.website.radio = await this.readRadio();

    this.website.systemInformation.lib = new this.lib.SystemInformation(this.website.translations, this.website.MMConfig.units);
    this.website.systemInformation.result = await this.website.systemInformation.lib.initData();

    if (!this.config.username && !this.config.password) {
      console.error("[Bugsounet] [Web] Your have not defined user/password in config!");
      console.error("[Bugsounet] [Web] Using default credentials");
    } else {
      if ((this.config.username === this.website.user.username) || (this.config.password === this.website.user.password)) {
        console.warn("[Bugsounet] [Web] WARN: You are using default username or default password");
        console.warn("[Bugsounet] [Web] WARN: Don't forget to change it!");
      }
      this.website.user.username = this.config.username;
      this.website.user.password = this.config.password;
    }

    this.website.EXTConfigured = this.searchConfigured();
    this.website.EXTInstalled = this.searchInstalled();
    this.website.listening = await this.purposeIP();
    this.website.APIDocs = data.useAPIDocs;

    log("EXT plugins in database:", this.website.EXT.length);
    log("Find", this.website.EXTInstalled.length, "installed plugins in MagicMirror");
    log("Find", this.website.EXTConfigured.length, "configured plugins in config file");
    log("Language set:", this.website.language);
    log("Listening:", this.website.listening);
    log("APIDocs:", this.website.APIDocs);

    console.log("[Bugsounet] [Web] [API] Loading API Server...");
    await this.createAPI();
    await this.serverAPI();

    console.log("[Bugsounet] [Web] [Server] Loading Main Server...");
    await this.createWebsite();
    await this.server();
  }

  /** Start Website Server **/
  server () {
    return new Promise((resolve) => {
      this.website.server
        .listen(8081, "0.0.0.0", () => {
          console.log("[Bugsounet] [Web] [Server] Start listening on port 8081");
          console.log(`[Bugsounet] [Web] [Server] Available locally at http://${this.website.listening}:8081`);
          this.website.initialized = true;
          resolve();
        })
        .on("error", (err) => {
          console.error("[Bugsounet] [Web] [Server] Can't start web server!");
          console.error("[Bugsounet] [Web] [Server] Error:", err.message);
          this.sendSocketNotification("ERROR", "Can't start web server!");
        });
    });
  }

  /** log any website traffic **/
  logRequest (req, res, next) {
    var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    log(`[${ip}] [${req.method}] ${req.url}`);
    next();
  }

  /** add custom Headers **/
  customHeaders (req, res, next) {
    let version = require("../package.json").version;
    res.setHeader("X-Powered-By", `MMM-Bugsounet v${version}`);
    next();
  }

  /** Website Middleware **/
  createWebsite () {
    return new Promise((resolve) => {
      const ProxyRequestLogger = (proxyServer) => {
        proxyServer.on("proxyReq", (proxyReq, req) => {
          let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
          let url = req.url.startsWith("/api") ? req.url : `/smarthome${req.url}`;
          log(`[${ip}] [PROXY] ${url}`);
        });
      };
      const SmartHomeProxy = createProxyMiddleware({
        target: "http://127.0.0.1:8083",
        changeOrigin: false,
        pathFilter: ["/smarthome"],
        pathRewrite: { "^/smarthome": "" },
        plugins: [ProxyRequestLogger],
        on: {
          onProxyReq: fixRequestBody,
          error: (err, req, res) => {
            console.error("[Bugsounet] [Web] SmartHome Proxy ERROR", err);
            if (!this.website.EXTStatus["EXT-SmartHome"].hello) {
              res.redirect("/404");
            } else {
              res.writeHead(500, {
                "Content-Type": "text/plain"
              });
              res.end(`${err.message}`);
            }
          }
        }
      });
      const APIProxy = createProxyMiddleware({
        target: "http://127.0.0.1:8085",
        changeOrigin: false,
        pathFilter: ["/api"],
        plugins: [ProxyRequestLogger],
        on: {
          onProxyReq: fixRequestBody,
          error: (err, req, res) => {
            console.error("[Bugsounet] [Web] API Proxy ERROR", err);
            res.writeHead(500, {
              "Content-Type": "text/plain"
            });
            res.end(`${err.message}`);
          }
        }
      });

      this.website.app = express();
      this.website.server = http.createServer(this.website.app);
      log("Create website needed routes...");

      // reverse proxy for API and EXT-SmartHome
      this.website.app.use(APIProxy);
      this.website.app.use(SmartHomeProxy);

      this.website.app.use(this.customHeaders);

      // For parsing post request's data/body
      this.website.app.use(bodyParser.json());
      this.website.app.use(bodyParser.urlencoded({ extended: true }));

      this.website.app.use(bodyParserErrorHandler(
        {
          onError: (err, req) => {
            let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
            console.error(`[Bugsounet] [Web] [${ip}] [${req.method}] ${req.url}`);
            console.error("[Bugsounet] [Web] bodyparser error:", err.type);
            log("body:", err.body);
            console.error("[Bugsounet] [Web] detail:", err.message);
          },
          errorMessage: (err) => {
            return `Body Parser failed to parse request (${err.type}) --> ${err.message}`;
          }
        }
      ));

      this.website.app.use(cookieParser());

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

      this.website.healthDownloader = function (req, res) {
        res.redirect("/");
      };

      var io = new Socket.Server(this.website.server);

      this.website.app
        .use(this.logRequest)
        .use(cors({ origin: "*" }))
        .use("/Login.js", express.static(`${this.WebsitePath}/tools/Login.js`))
        .use("/Home.js", express.static(`${this.WebsitePath}/tools/Home.js`))
        .use("/Terminal.js", express.static(`${this.WebsitePath}/tools/Terminal.js`))
        .use("/MMConfig.js", express.static(`${this.WebsitePath}/tools/MMConfig.js`))
        .use("/Tools.js", express.static(`${this.WebsitePath}/tools/Tools.js`))
        .use("/System.js", express.static(`${this.WebsitePath}/tools/System.js`))
        .use("/About.js", express.static(`${this.WebsitePath}/tools/About.js`))
        .use("/Restart.js", express.static(`${this.WebsitePath}/tools/Restart.js`))
        .use("/Die.js", express.static(`${this.WebsitePath}/tools/Die.js`))
        .use("/Shutdown.js", express.static(`${this.WebsitePath}/tools/Shutdown.js`))
        .use("/Reboot.js", express.static(`${this.WebsitePath}/tools/Reboot.js`))
        .use("/Fetch.js", express.static(`${this.WebsitePath}/tools/Fetch.js`))
        .use("/3rdParty.js", express.static(`${this.WebsitePath}/tools/3rdParty.js`))
        .use("/APIDocs.js", express.static(`${this.WebsitePath}/tools/APIDocs.js`))
        .use("/assets", express.static(`${this.WebsitePath}/assets`, options))

        .use("/jsoneditor", express.static(`${this.BugsounetModulePath}/node_modules/jsoneditor`))
        .use("/xterm", express.static(`${this.BugsounetModulePath}/node_modules/@xterm/xterm`))
        .use("/xterm-addon-fit", express.static(`${this.BugsounetModulePath}/node_modules/@xterm/addon-fit`))
        .use("/alertify", express.static(`${this.BugsounetModulePath}/node_modules/alertifyjs/build`))

        .get("/login", this.speedLimiter, this.rateLimiter, (req, res) => {
          const logged = this.hasValidCookie(req);
          if (logged) return res.redirect("/");
          res.clearCookie("MMM-Bugsounet");
          res.sendFile(`${this.WebsitePath}/login.html`);
        })

        .get("/logout", (req, res) => {
          res.clearCookie("MMM-Bugsounet");
          res.redirect("/login");
        })

        .post("/auth", this.speedLimiter, this.rateLimiter, (req, res) => this.login(req, res))

        .get("/", (req, res, next) => this.auth(req, res, next), (req, res) => {
          res.sendFile(`${this.WebsitePath}/index.html`);
        })

        .get("/Terminal", (req, res, next) => this.auth(req, res, next), (req, res) => {
          var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
          res.sendFile(`${this.WebsitePath}/terminal.html`);

          io.once("connection", async (socket) => {
            log(`[${ip}] Connected to Terminal Logs:`, req.user);
            socket.on("disconnect", (err) => {
              log(`[${ip}] Disconnected from Terminal Logs:`, req.user, `[${err}]`);
            });
            var pastLogs = await this.readAllMMLogs(this.lib.HyperWatch.logs());
            io.emit("terminal.logs", pastLogs);
            this.lib.HyperWatch.stream().on("stdData", (data) => {
              if (typeof data === "string") io.to(socket.id).emit("terminal.logs", data.replace(/\r?\n/g, "\r\n"));
            });
          });
        })

        .get("/ptyProcess", (req, res, next) => this.auth(req, res, next), (req, res) => {
          var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
          res.sendFile(`${this.WebsitePath}/pty.html`);
          io.once("connection", (client) => {
            log(`[${ip}] Connected to Terminal:`, req.user);
            client.on("disconnect", (err) => {
              log(`[${ip}] Disconnected from Terminal:`, req.user, `[${err}]`);
            });
            var cols = 80;
            var rows = 24;
            var ptyProcess = pty.spawn("bash", [], {
              name: "xterm-color",
              cols: cols,
              rows: rows,
              cmd: process.env.HOME,
              env: process.env
            });
            ptyProcess.on("data", (data) => {
              io.to(client.id).emit("terminal.incData", data);
            });
            client.on("terminal.toTerm", (data) => {
              ptyProcess.write(data);
            });
            client.on("terminal.size", (size) => {
              ptyProcess.resize(size.cols, size.rows);
            });
          });
        })

        .get("/MMConfig", (req, res, next) => this.auth(req, res, next), (req, res) => {
          res.sendFile(`${this.WebsitePath}/mmconfig.html`);
        })

        .get("/Tools", (req, res, next) => this.auth(req, res, next), (req, res) => {
          res.sendFile(`${this.WebsitePath}/tools.html`);
        })

        .get("/System", (req, res, next) => this.auth(req, res, next), (req, res) => {
          res.sendFile(`${this.WebsitePath}/system.html`);
        })

        .get("/About", (req, res, next) => this.auth(req, res, next), (req, res) => {
          res.sendFile(`${this.WebsitePath}/about.html`);
        })

        .get("/3rdpartymodules", (req, res, next) => this.auth(req, res, next), (req, res) => {
          res.sendFile(`${this.WebsitePath}/3rdpartymodules.html`);
        })

        .get("/APIDocs", (req, res, next) => this.auth(req, res, next), (req, res) => {
          res.sendFile(`${this.WebsitePath}/APIDocs.html`);
        })

        .get("/Restart", (req, res, next) => this.auth(req, res, next), (req, res) => {
          res.sendFile(`${this.WebsitePath}/restarting.html`);
        })

        .get("/Die", (req, res, next) => this.auth(req, res, next), (req, res) => {
          res.sendFile(`${this.WebsitePath}/die.html`);
        })

        .get("/SystemRestart", (req, res, next) => this.auth(req, res, next), (req, res) => {
          res.sendFile(`${this.WebsitePath}/reboot.html`);
        })

        .get("/SystemDie", (req, res, next) => this.auth(req, res, next), (req, res) => {
          res.sendFile(`${this.WebsitePath}/shutdown.html`);
        })

        .get("/EditMMConfig", (req, res, next) => this.auth(req, res, next), (req, res) => {
          res.sendFile(`${this.WebsitePath}/EditMMConfig.html`);
        })

        .get("/download/*", (req, res) => {
          this.website.healthDownloader(req, res);
        })

        .get("/robots.txt", (req, res) => {
          res.sendFile(`${this.WebsitePath}/robots.txt`);
        })

        .get("/404", (req, res) => {
          res.status(404).sendFile(`${this.WebsitePath}/404.html`);
        })

        .get("/*", this.speedLimiter, this.rateLimiter, (req, res) => {
          console.warn("[Bugsounet] [Web] Don't find:", req.url);
          res.redirect("/404");
        });

      resolve();
    });
  }

  /** Start API Server **/
  serverAPI () {
    return new Promise((resolve) => {
      this.website.serverAPI
        .listen(8085, "127.0.0.1", () => {
          console.log("[Bugsounet] [Web] [API] Start listening on port 8085");
          this.sendSocketNotification("SendNoti", "Bugsounet_WEBSITE-API_STARTED");
          resolve();
        })
        .on("error", (err) => {
          console.error("[Bugsounet] [Web] [API] Can't start API server!");
          console.error("[Bugsounet] [Web] [API] Error:", err.message);
          this.sendSocketNotification("ERROR", "Can't start API server!");
        });
    });
  }

  /** log any API traffic **/
  logAPIRequest (req, res, next) {
    log(`[API] [${req.method}] ${req.url}`);
    next();
  }

  /** add custom API Headers **/
  customAPIHeaders (req, res, next) {
    let version = require("../package.json").api;
    res.setHeader("X-Powered-By", `MMM-Bugsounet API v${version}`);
    next();
  }

  /** API Middleware **/
  createAPI () {
    return new Promise((resolve) => {
      this.website.api = express();
      this.website.serverAPI = http.createServer(this.website.api);
      log("[API] Create API needed routes...");

      // add current server IP to APIDocs
      if (this.website.APIDocs) {
        this.APIDocs = require("../website/api/swagger.json");
        this.APIDocs.servers[1] = {
          url: `http://${this.website.listening}:8081`
        };
      }

      this.website.api
        .use(this.logAPIRequest)
        .use(this.customAPIHeaders)
        .use(bodyParser.json())
        .use(bodyParser.urlencoded({ extended: true }))
        .use(cors({ origin: "*" }))
        .use(bodyParserErrorHandler(
          {
            onError: (err, req) => {
              let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
              console.error(`[Bugsounet] [Web] [API] [${ip}] [${req.method}] ${req.url}`);
              console.error("[Bugsounet] [Web] [API] bodyparser error:", err.type);
              log("[API] body:", err.body);
              console.error("[Bugsounet] [Web] [API] detail:", err.message);
            },
            errorMessage: (err) => {
              return `Body Parser failed to parse request (${err.type}) --> ${err.message}`;
            }
          }
        ))

        .use("/api/docs", swaggerUi.serve, (req, res, next) => {
          if (this.website.APIDocs) {
            this.APIDocs.info.version = require("../package.json").api;
            let remoteUrl = `${req.headers["x-forwarded-proto"] === "https" ? "https" : "http"}://${req.get("host")}`;
            if (this.APIDocs.servers[1].url !== remoteUrl) {
              this.APIDocs.servers[2] = {
                url: remoteUrl
              };
            } else {
              // delete old value
              this.APIDocs.servers[2] = {};
              this.APIDocs.servers.pop();
            }
            swaggerUi.setup(this.APIDocs, {
              swaggerOptions: {
                defaultModelsExpandDepth: -1,
                docExpansion: "none",
                displayRequestDuration: true
              },
              customCss: ".swagger-ui .topbar { display: none }",
              customCssUrl: "/assets/css/SwaggerDark.css",
              customSiteTitle: "MMM-Bugsounet API",
              customfavIcon: "/assets/img/FavIcon.png"
            })(req, res, next);
          }
          else res.redirect("/404");
        })

        .get("/api", this.API_speedLimiter, this.API_rateLimiter, (req, res) => {
          res.json({ api: "OK", docs: this.website.APIDocs });
        })

        .get("/api/translations/login", this.API_speedLimiter, this.API_rateLimiter, (req, res) => {
          res.json(this.website.loginTranslation);
        })

        .post("/api/login", this.API_speedLimiter, this.API_rateLimiter, (req, res) => this.login(req, res, true))

        .get("/api/*", this.API_speedLimiter, this.API_rateLimiter, (res, req, next) => this.hasValidToken(res, req, next), (req, res) => this.GetAPI(req, res))
        .post("/api/*", this.API_speedLimiter, this.API_rateLimiter, (res, req, next) => this.hasValidToken(res, req, next), (req, res) => this.PostAPI(req, res))
        .put("/api/*", this.API_speedLimiter, this.API_rateLimiter, (res, req, next) => this.hasValidToken(res, req, next), (req, res) => this.PutAPI(req, res))
        .delete("/api/*", this.API_speedLimiter, this.API_rateLimiter, (res, req, next) => this.hasValidToken(res, req, next), (req, res) => this.DeleteAPI(req, res))

        .get("/*", this.API_rateLimiter, this.API_speedLimiter, (req, res) => {
          console.warn("[Bugsounet] [Web] [API] Don't find:", req.url);
          res.status(404).json({ error: "You Are Lost in Space" });
        });

      console.log(`[Bugsounet] [Web] [API] API v${require("../package.json").api}`);
      resolve();
    });
  }

  /** GET API **/
  async GetAPI (req, res) {
    switch (req.url) {
      case "/api/version":
        var version = await this.searchVersion();
        if (version.error) {
          res.status(206).json(version);
        } else {
          res.json(version);
        }
        break;

      case "/api/translations/common":
        res.json(this.website.translations);
        break;

      case "/api/translations/homeText":
        res.json({ homeText: this.website.homeText });
        break;

      case "/api/system/sysInfo":
        this.website.systemInformation.result = await this.website.systemInformation.lib.Get();
        res.json(this.website.systemInformation.result);
        break;

      case "/api/EXT/versions":
        res.json(this.website.EXTVersions);
        break;

      case "/api/EXT":
        res.json(this.website.EXT);
        break;

      case "/api/EXT/installed":
        res.json(this.website.EXTInstalled);
        break;

      case "/api/EXT/configured":
        res.json(this.website.EXTConfigured);
        break;

      case "/api/EXT/status":
        res.json(this.website.EXTStatus);
        break;

      case "/api/config/MM":
        try {
          let stringify = JSON.stringify(this.website.MMConfig);
          let encoded = this.encode(stringify);
          res.json({ config: encoded });
        } catch (e) {
          res.status(500).json({ error: e.message });
        }
        break;

      case "/api/backups":
        var names = await this.loadBackupNames();
        res.json(names);
        break;

      case "/api/backups/file":
        if (!req.headers["backup"]) return res.status(400).send("Bad Request");
        var availableBackups = await this.loadBackupNames();
        if (availableBackups.indexOf(req.headers["backup"]) === -1) return res.status(404).json({ error: "Not Found" });
        log(`[API] Request backup config of ${req.headers["backup"]}`);
        var file = await this.loadBackupFile(req.headers["backup"]);
        var stringify = JSON.stringify(file);
        var encoded = this.encode(stringify);
        res.json({ config: encoded });
        break;

      case "/api/EXT/RadioPlayer":
        if (!this.website.EXTStatus["EXT-RadioPlayer"].hello || !this.website.radio) return res.status(404).json({ error: "Not Found" });
        var allRadio = Object.keys(this.website.radio);
        res.json(allRadio);
        break;

      case "/api/EXT/Updates":
        if (!this.website.EXTStatus["EXT-Updates"].hello) return res.status(404).json({ error: "Not Found" });
        var updates = this.filterObject(this.website.EXTStatus["EXT-Updates"].module, "canBeUpdated", true);
        if (!updates.length) return res.status(404).send("Not Found");
        res.json(updates);
        break;

      case "/api/EXT/FreeboxTV":
        if (!this.website.EXTStatus["EXT-FreeboxTV"].hello) return res.status(404).json({ error: "Not Found" });
        if (this.website.language !== "fr") return res.status(409).json({ error: "Reserved for French language" });
        var allTV = Object.keys(this.website.freeTV);
        res.json(allTV);
        break;

      default:
        console.warn("[Bugsounet] [Web] [API] Don't find:", req.url);
        res.status(404).json({ error: "You Are Lost in Space" });
        break;
    }
  }

  /** PUT API **/
  async PutAPI (req, res) {
    var resultSaveConfig = {};
    switch (req.url) {
      case "/api/config/MM":
        if (!req.body["config"]) return res.status(400).json({ error: "Bad Request" });
        log("[API] Receiving write MagicMirror config...");
        try {
          let decoded = JSON.parse(this.decode(req.body["config"]));
          resultSaveConfig = await this.saveConfig(decoded);
        } catch (e) {
          log("[API] Request error", e.message);
          res.status(400).send("Bad Request");
          return;
        }
        log("[API] Write config result:", resultSaveConfig);
        if (resultSaveConfig.done) {
          res.json(resultSaveConfig);
          this.website.MMConfig = await this.readConfig();
          log("[API] Reload config");
        } else if (resultSaveConfig.error) {
          res.status(500).json({ error: resultSaveConfig.error });
        }
        break;

      case "/api/EXT/Volume/speaker":
        if (!this.website.EXTStatus["EXT-Volume"].hello) return res.status(404).json({ error: "Not Found" });
        var speaker = req.body["volume"];
        if (typeof (speaker) !== "number" || speaker < 0 || speaker > 100 || isNaN(speaker)) return res.status(400).json({ error: "Bad Request" });
        log("[API] Request speaker volume change to", speaker);
        this.sendSocketNotification("SendNoti", { noti: "Bugsounet_VOLUME-SPEAKER_SET", payload: speaker || "0" });
        res.json({ done: "ok" });
        break;

      case "/api/EXT/Volume/recorder":
        if (!this.website.EXTStatus["EXT-Volume"].hello) return res.status(404).json({ error: "Not Found" });
        var recorder = req.body["volume"];
        if (typeof (recorder) !== "number" || recorder < 0 || recorder > 100) return res.status(400).json({ error: "Bad Request" });
        log("[API] Request recorder volume change to", recorder);
        this.sendSocketNotification("SendNoti", { noti: "Bugsounet_VOLUME-RECORDER_SET", payload: recorder || "0" });
        res.json({ done: "ok" });
        break;

      case "/api/EXT/Updates":
        if (!this.website.EXTStatus["EXT-Updates"].hello) return res.status(404).json({ error: "Not Found" });
        var updates = this.filterObject(this.website.EXTStatus["EXT-Updates"].module, "canBeUpdated", true);
        if (!updates.length) return res.status(404).json({ error: "Not Found" });
        log("[API] Request send updates");
        this.sendSocketNotification("SendNoti", "Bugsounet_UPDATES-UPDATE");
        res.json({ done: "ok" });
        break;

      case "/api/EXT/Spotify/play":
        if (!this.website.EXTStatus["EXT-Spotify"].hello) return res.status(404).json({ error: "Not Found" });
        if (this.website.EXTStatus["EXT-Spotify"].play) return res.status(409).json({ error: "Already playing" });
        log("[API] Request send Spotify play");
        this.sendSocketNotification("SendNoti", "Bugsounet_SPOTIFY-PLAY");
        res.json({ done: "ok" });
        break;

      case "/api/EXT/Spotify/pause":
        if (!this.website.EXTStatus["EXT-Spotify"].hello) return res.status(404).json({ error: "Not Found" });
        if (this.website.EXTStatus["EXT-Spotify"].play) return res.status(409).json({ error: "Already pausing" });
        log("[API] Request send Spotify pause");
        this.sendSocketNotification("SendNoti", "Bugsounet_SPOTIFY-PAUSE");
        res.json({ done: "ok" });
        break;

      case "/api/EXT/Spotify/toggle":
        if (!this.website.EXTStatus["EXT-Spotify"].hello) return res.status(404).json({ error: "Not Found" });
        log("[API] Request send Spotify toogle");
        this.sendSocketNotification("SendNoti", "Bugsounet_SPOTIFY-PLAY-TOGGLE");
        res.json({ done: "ok" });
        break;

      case "/api/EXT/Spotify/stop":
        if (!this.website.EXTStatus["EXT-Spotify"].hello) return res.status(404).json({ error: "Not Found" });
        if (!this.website.EXTStatus["EXT-Spotify"].play) return res.status(409).json({ error: "Not playing" });
        log("[API] Request send Spotify stop");
        this.sendSocketNotification("SendNoti", "Bugsounet_SPOTIFY-STOP");
        res.json({ done: "ok" });
        break;

      case "/api/EXT/Spotify/next":
        if (!this.website.EXTStatus["EXT-Spotify"].hello) return res.status(404).json({ error: "Not Found" });
        if (!this.website.EXTStatus["EXT-Spotify"].play) return res.status(409).json({ error: "Not playing" });
        log("[API] Request send Spotify next");
        this.sendSocketNotification("SendNoti", "Bugsounet_SPOTIFY-NEXT");
        res.json({ done: "ok" });
        break;

      case "/api/EXT/Spotify/previous":
        if (!this.website.EXTStatus["EXT-Spotify"].hello) return res.status(404).json({ error: "Not Found" });
        if (!this.website.EXTStatus["EXT-Spotify"].play) return res.status(409).json({ error: "Not playing" });
        log("[API] Request send Spotify previous");
        this.sendSocketNotification("SendNoti", "Bugsounet_SPOTIFY-PREVIOUS");
        res.json({ done: "ok" });
        break;

      case "/api/EXT/Spotify":
        if (!this.website.EXTStatus["EXT-Spotify"].hello) return res.status(404).json({ error: "Not Found" });
        var query = req.body["query"];
        var type = req.body["type"];
        var ArrayType = ["artist", "album", "playlist", "track"];
        if (!query || typeof (query) !== "string" || !type || ArrayType.indexOf(type) === -1) return res.status(400).json({ error: "Bad Request" });
        var pl = {
          type: type,
          query: query,
          random: false
        };
        log("[API] Request send Spotify search:", pl);
        this.sendSocketNotification("SendNoti", { noti: "Bugsounet_SPOTIFY-SEARCH", payload: pl });
        res.json({ done: "ok" });
        break;

      case "/api/EXT/Screen":
        if (!this.website.EXTStatus["EXT-Screen"].hello) return res.status(404).json({ error: "Not Found" });
        var power = req.body["power"];
        if (!power || typeof (power) !== "string") return res.status(400).json({ error: "Bad Request" });
        log("[API] Request send screen power:", power);
        if (power === "OFF") {
          if (!this.website.EXTStatus["EXT-Screen"].power) return res.status(409).json({ error: "Already OFF" });
          this.sendSocketNotification("SendNoti", "Bugsounet_SCREEN-FORCE_END");
          return res.json({ done: "ok" });
        }
        if (power === "ON") {
          if (this.website.EXTStatus["EXT-Screen"].power) return res.status(409).json({ error: "Already ON" });
          this.sendSocketNotification("SendNoti", "Bugsounet_SCREEN-FORCE_WAKEUP");
          return res.json({ done: "ok" });
        }
        res.status(400).send("Bad Request");
        break;

      case "/api/EXT/FreeboxTV":
        if (!this.website.EXTStatus["EXT-FreeboxTV"].hello) return res.status(404).json({ error: "Not Found" });
        if (this.website.language !== "fr") return res.status(409).send("Reserved for French language");
        var TV = req.body["TV"];
        if (!TV || typeof (TV) !== "string") return res.status(400).json({ error: "Bad Request" });
        var allTV = Object.keys(this.website.freeTV);
        if (allTV.indexOf(TV) === -1) return res.status(404).json({ error: "Not Found" });
        log("[API] Request send FreeboxTV channel:", TV);
        this.sendSocketNotification("SendNoti", { noti: "Bugsounet_FREEBOXTV-PLAY", payload: TV });
        res.json({ done: "ok" });
        break;

      case "/api/EXT/RadioPlayer":
        if (!this.website.EXTStatus["EXT-RadioPlayer"].hello || !this.website.radio) return res.status(404).json({ error: "Not Found" });
        if (!req.body["radio"]) return res.status(400).json({ error: "Bad Request" });
        var allRadio = Object.keys(this.website.radio);
        if (allRadio.indexOf(req.body["radio"]) === -1) return res.status(404).json({ error: "Not Found" });
        log("[API] Request radio change to", req.body["radio"]);
        this.sendSocketNotification("SendNoti", { noti: "Bugsounet_RADIO-PLAY", payload: req.body["radio"] });
        res.json({ done: "ok" });
        break;

      case "/api/backups/file":
        if (!req.headers["backup"]) return res.status(400).json({ error: "Bad Request" });
        var availableBackups = await this.loadBackupNames();
        if (availableBackups.indexOf(req.headers["backup"]) === -1) return res.status(404).json({ error: "Not Found" });
        log("[API] Request backup:", req.headers["backup"]);
        var file = await this.loadBackupFile(req.headers["backup"]);
        resultSaveConfig = await this.saveConfig(file);
        log("[API] Write config result:", resultSaveConfig);
        if (resultSaveConfig.done) {
          res.json(resultSaveConfig);
          this.website.MMConfig = await this.readConfig();
          log("[API] Reload config");
        } else if (resultSaveConfig.error) {
          res.status(500).json({ error: resultSaveConfig.error });
        }
        break;

      case "/api/backups/external":
        try {
          console.log("[API] Receiving External backup...");
          let config = req.body["config"];
          let decoded = JSON.parse(this.decode(config));
          var linkExternalBackup = await this.saveExternalConfig(decoded);
          if (linkExternalBackup.data) {
            log("[API] Generate link:", linkExternalBackup.data);
            setTimeout(() => {
              this.deleteDownload(linkExternalBackup.data);
            }, 1000 * 60);
            this.website.healthDownloader = (req_, res_) => {
              if (req_.params[0] === linkExternalBackup.data) {
                res_.sendFile(`${this.BugsounetModulePath}/download/${linkExternalBackup.data}`);
                this.website.healthDownloader = function (req_, res_) {
                  res_.redirect("/");
                };
              } else {
                res_.redirect("/");
              }
            };
            res.json({ file: `/download/${linkExternalBackup.data}`, expire_in: 60 });
          } else {
            res.status(500).json({ error: "Internal Server Error" });
          }
        } catch (e) {
          console.error("[Bugsounet] [Web] [API] Request error", e.message);
          res.status(400).json({ error: "Bad Request" });
        }
        break;
      case "/api/MM":
        var notification = req.body["notification"];
        var payload = req.body["payload"];
        if (!notification || typeof (notification) !== "string") return res.status(400).json({ error: "Bad Request" });
        log("Notification:", notification);
        if (payload) {
          log("With payload:", payload);
          this.sendSocketNotification("SendNoti", { noti: notification, payload: payload });
        } else {
          this.sendSocketNotification("SendNoti", notification);
        }
        res.status(202).json({ done: "ok" });
        break;
      default:
        console.warn("[Bugsounet] [Web] [API] Don't find:", req.url);
        res.status(404).json({ error: "You Are Lost in Space" });
    }
  }

  /** POST API **/
  async PostAPI (req, res) {
    switch (req.url) {
      case "/api/EXT/stop":
        this.sendInternalCallback("STOP");
        res.json({ done: "ok" });
        break;

      case "/api/system/restart":
        setTimeout(() => this.sendInternalCallback("RESTART"), 1000);
        res.json({ done: "ok" });
        break;

      case "/api/system/die":
        setTimeout(() => this.sendInternalCallback("DIE"), 1000);
        res.json({ done: "ok" });
        break;

      case "/api/system/reboot":
        setTimeout(() => this.sendInternalCallback("REBOOT"), 1000);
        res.json({ done: "ok" });
        break;

      case "/api/system/shutdown":
        setTimeout(() => this.sendInternalCallback("SHUTDOWN"), 1000);
        res.json({ done: "ok" });
        break;

      case "/api/system/alert":
        if (!this.website.EXTStatus["Bugsounet_Ready"]) return res.status(404).json({ error: "Not Found" });
        var alert = req.body["alert"];
        if (typeof (alert) !== "string" || alert.length < 5) return res.status(400).json({ error: "Bad Request" });
        log("[API] Request send Alert:", alert);
        this.sendSocketNotification("SENDALERT", {
          type: "information",
          message: alert,
          sender: req.user?.id ? req.user.id : "MMM-Bugsounet", // <-- to check
          timer: 30 * 1000,
          sound: "modules/MMM-Bugsounet/website/tools/message.mp3",
          icon: "modules/MMM-Bugsounet/website/assets/img/bugsounet.png"
        });
        res.json({ done: "ok" });
        break;

      case "/api/backups/external":
        try {
          let decoded = this.decode(req.body["config"]);
          log("[API] Receiving External backup...");
          var transformExternalBackup = await this.transformExternalBackup(decoded);
          if (transformExternalBackup.error) {
            res.status(500).json({ error: transformExternalBackup.error });
          } else {
            let stringify = JSON.stringify(transformExternalBackup);
            let encode = this.encode(stringify);
            res.json({ config: encode });
          }
        } catch (e) {
          log("[API] Request error", e.message);
          res.status(400).json({ error: "Bad Request" });
        }
        break;
      default:
        console.warn("[Bugsounet] [Web] [API] Don't find:", req.url);
        res.status(404).json({ error: "You Are Lost in Space" });
    }
  }

  /** DELETE API **/
  async DeleteAPI (req, res) {
    switch (req.url) {
      case "/api/backups":
        log("[API] Receiving delete backup demand...");
        var deleteBackup = await this.deleteBackup();
        log("[API] Delete backup result:", deleteBackup);
        res.json(deleteBackup);
        break;

      default:
        console.warn("[Bugsounet] [Web] [API] Don't find:", req.url);
        res.status(404).json({ error: "You Are Lost in Space" });
    }
  }

  /*************/
  /*** Tools ***/
  /*************/

  // verify authenticate, if failed redirect to login page
  auth (req, res, next) {
    try {
      const { cookies } = req;

      if (!cookies || !cookies["MMM-Bugsounet"]) {
        console.warn("[Bugsounet] [Web] [AUTH] Missing MMM-Bugsounet cookie");
        return res.redirect("/login");
      }

      const accessToken = cookies["MMM-Bugsounet"];
      jwt.verify(accessToken, this.secret, (err, decoded) => {
        if (err) {
          console.warn("[Bugsounet] [Web] [AUTH] decode Error !", err.message);
          return res.redirect("/login");
        }
        const user = decoded.user;

        if (!user || user !== this.website.user.username) {
          console.warn(`[Bugsounet] [Web] [AUTH] User ${user} not exists`);
          return res.redirect("/login");
        }

        req.user = user;
        next();
      });
    } catch (err) {
      console.error("[Bugsounet] [Web] [AUTH] Error 500!", err.message);
      return res.status(500).json({ error: "Internal error" });
    }
  }

  // login deals with username // password in Basic
  login (req, res, api) {
    var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const authorization = req.headers.authorization;
    const params = authorization?.split(" ");
    var APIResult = {
      error: "Invalid credentials"
    };

    if (!authorization) {
      console.warn(`[Bugsounet] [Web] ${api ? "[API] " : ""}[${ip}] Bad Login: missing authorization type`);
      APIResult.description = "Missing authorization type";
      return res.status(401).json(APIResult);
    }

    if (params[0] !== "Basic") {
      console.warn(`[Bugsounet] [Web] ${api ? "[API] " : ""}[${ip}] Bad Login: Basic authorization type only`);
      APIResult.description = "Authorization type Basic only";
      return res.status(401).json(APIResult);
    }

    if (!params[1]) { // must never happen
      console.warn(`[Bugsounet] [Web] ${api ? "[API] " : ""}[${ip}] Bad Login: missing Basic params`);
      APIResult.description = "Missing Basic params";
      return res.status(401).json(APIResult);
    }

    const base64Credentials = this.decode(params[1]);
    const [username, password] = base64Credentials.split(":");

    if (username === this.website.user.username && password === this.website.user.password) {
      const token = jwt.sign(
        {
          user: this.website.user.username
        },
        this.secret,
        { expiresIn: "1h" }
      );

      console.log(`[Bugsounet] [Web] ${api ? "[API] " : ""}[${ip}] Welcome ${username}, happy to serve you!`);

      if (api) {
        this.API_rateLimiter.resetKey(req.ip);
        this.API_speedLimiter.resetKey(req.ip);
        APIResult = {
          access_token: token,
          token_type: "Bearer",
          expire_in: 3600
        };
        res.json(APIResult);
      } else {
        this.rateLimiter.resetKey(req.ip);
        this.speedLimiter.resetKey(req.ip);
        res.cookie("MMM-Bugsounet", token, {
          httpOnly: true,
          //secure: true,
          maxAge: 3600000
        });
        res.json({ session: token });
      }
    } else {
      console.warn(`[Bugsounet] [Web] ${api ? "[API] " : ""}[${ip}] Bad Login: Invalid username or password`);
      APIResult.description = "Invalid username or password";
      if (api) res.status(401).json(APIResult);
      else res.status(403).json(APIResult);
    }
  }

  // decode cookie for relogin
  hasValidCookie = (req) => {
    try {
      const { cookies } = req;

      if (!cookies || !cookies["MMM-Bugsounet"]) return null;

      const accessToken = cookies["MMM-Bugsounet"];
      jwt.verify(accessToken, this.secret, (err, decoded) => {
        if (err) return null;

        const user = decoded.user;
        if (!user || user !== this.website.user.username) return null;

        this.rateLimiter.resetKey(req.ip);
        this.speedLimiter.resetKey(req.ip);

        return true;
      });
    } catch (err) {
      console.error("[Bugsounet] [Web] Cookie Error !", err.message);
      return null;
    }
  };

  // decode and verify token
  hasValidToken = (req, res, next) => {
    var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    try {
      const { headers } = req;
      const authorization = headers.authorization;
      const params = authorization?.split(" ");

      if (!authorization) {
        console.warn(`[Bugsounet] [Web] [API] [${ip}] Bad Login: missing authorization type`);
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (params[0] !== "Bearer") {
        console.warn(`[Bugsounet] [Web] [API] [${ip}] Bad Login: Bearer authorization type only`);
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!params[1]) { // must never happen
        console.warn(`[Bugsounet] [Web] [API] [${ip}] Bad Login: missing Basic params`);
        return res.status(401).json({ error: "Unauthorized" });
      }

      const accessToken = params[1];
      jwt.verify(accessToken, this.secret, (err, decoded) => {
        if (err) {
          if (err.message === "jwt expired") console.warn("[Bugsounet] [Web] [API] Token expired !");
          else console.error("[Bugsounet] [Web] [API] Token decode Error !", err.message);
          return res.status(401).json({ error: "Unauthorized" });
        }
        const user = decoded.user;
        if (!user || user !== this.website.user.username) return res.status(401).json({ error: "Unauthorized" });
        req.user = user;
        this.API_rateLimiter.resetKey(req.ip);
        this.API_speedLimiter.resetKey(req.ip);
        next();
      });
    } catch (err) {
      console.error("[Bugsounet] [Web] [API] Token Fatal Error !", err.message);
      return res.status(500).json({ error: "Internal error" });
    }
  };

  // encode rule
  encode (input) {
    return btoa(input);
  }

  // decode rule
  decode (input) {
    return atob(input);
  }

  readConfig () {
    return new Promise((resolve) => {
      var MMConfig = undefined;
      let file = `${this.root_path}/config/config.js`;
      if (fs.existsSync(file)) {
        log("Read MM² config:", file);
        MMConfig = require(file);
        MMConfig = this.configStartMerge(MMConfig);
      }
      log("Read MM² Config: Done");
      resolve(MMConfig);
    });
  }

  readTMPBackupConfig (file) {
    return new Promise((resolve) => {
      try {
        var TMPConfig = undefined;
        if (fs.existsSync(file)) {
          TMPConfig = require(file);
          TMPConfig = this.configStartMerge(TMPConfig);
          fs.unlink(file, (err) => {
            if (err) {
              resolve({ error: "Error when deleting file" });
              return console.error("[Bugsounet] [Web] [DELETE] error", err);
            }
            log("Successfully deleted:", file);
          });
          resolve(TMPConfig);
        }
      } catch (e) {
        console.error("[Bugsounet] [Web] [DELETE] Error on reading file", e.message);
        resolve({ error: "Error on reading file" });
      }
    });
  }

  /** read streamsConfig.json of EXT-FreeboxTV**/
  readFreeTV () {
    return new Promise((resolve) => {
      var streamsConfig = {};
      let file = `${this.root_path}/modules/MMM-Bugsounet/EXTs/EXT-FreeboxTV/streamsConfig.json`;
      if (fs.existsSync(file)) streamsConfig = require(file);
      resolve(streamsConfig);
    });
  }

  readRadio () {
    return new Promise((resolve) => {
      var RadioResult = undefined;
      const radio = this.website.MMConfig.modules.find((m) => m.module === "MMM-Bugsounet/EXTs/EXT-RadioPlayer" && !m.disabled);
      if (radio?.config?.streams) {
        let file = `${this.root_path}/modules/MMM-Bugsounet/EXTs/EXT-RadioPlayer/${radio.config.streams}`;
        if (fs.existsSync(file)) RadioResult = require(file);
        else console.error(`[Bugsounet] [Web] [Radio] error when loading file: ${file}`);
      }
      resolve(RadioResult);
    });
  }

  /** search installed EXT from DB**/
  searchConfigured () {
    try {
      var Configured = [];
      this.website.MMConfig.modules.find((m) => {
        if (m.module.startsWith("MMM-Bugsounet/EXTs/")) {
          let plugin = m.module.split("MMM-Bugsounet/EXTs/")[1];
          if (this.website.EXT.includes(plugin)) Configured.push(plugin);
        }
      });
      return Configured.sort();
    } catch (e) {
      console.error(`[Bugsounet] [Web] Error! ${e}`);
      return Configured.sort();
    }
  }

  /** search installed EXT **/
  searchInstalled () {
    var Installed = [];
    var ext = this.website.EXT;
    ext.find((m) => {
      if (fs.existsSync(`${this.root_path}/modules/MMM-Bugsounet/EXTs/${m}/node_helper.js`)) {
        let name = require(`${this.root_path}/modules/MMM-Bugsounet/EXTs/${m}/package.json`).name;
        if (name === m) Installed.push(m);
        else console.warn(`[Bugsounet] [Web] Found: ${m} but in package.json name is not the same: ${name}`);
      }
    });
    return Installed.sort();
  }

  /** timeStamp for backup **/
  timeStamp () {
    var now = new Date(Date.now());
    var date = [now.getFullYear(), now.getMonth() + 1, now.getDate()];
    var time = [now.getHours(), now.getMinutes(), now.getSeconds()];
    for (var i = 0; i < 3; i++) {
      if (time[i] < 10) {
        time[i] = `0${time[i]}`;
      }
      if (date[i] < 10) {
        date[i] = `0${date[i]}`;
      }
    }
    return `${date.join("")}-${time.join(":")}`;
  }

  /** Save MagicMirror config with backup **/
  saveConfig (MMConfig) {
    return new Promise((resolve) => {
      const configPath = `${this.root_path}/config/config.js`;
      const configPathTMP = `${this.root_path}/config/configTMP.js`;
      const backupFile = `config.js.${this.timeStamp()}`;
      const backupPath = `${this.BugsounetModulePath}/backup/${backupFile}`;
      var source = fs.createReadStream(configPath);
      var destination = fs.createWriteStream(backupPath);

      source.pipe(destination, { end: false });
      source.on("end", () => {
        var header = `/*** GENERATED BY @bugsounet MMM-Bugsounet v${require("../package.json").version} ***/\n\nvar config = `;
        var footer = "\n\n/*************** DO NOT EDIT THE LINE BELOW ***************/\nif (typeof module !== 'undefined') {module.exports = config;}\n";

        fs.writeFile(configPathTMP, header + util.inspect(MMConfig, {
          showHidden: false,
          depth: null,
          maxArrayLength: null,
          compact: false
        }) + footer, (error) => {
          if (error) {
            resolve({ error: "Error when writing file" });
            return console.error("[Bugsounet] [Web] [WRITE] error", error);
          }
          log("Saved TMP configuration!");
          log("Backup saved in", backupPath);
          log("Check Function in config and revive it...");

          const readFileLineByLine = (inputFile, outputFile) => {
            var FunctionSearch = new RegExp(/(.*)(`|')\[FUNCTION\](.*)(`|')/, "g");
            fs.unlink(outputFile, (err) => {
              if (err) {
                resolve({ error: "Error when deleting file" });
                return console.error("[Bugsounet] [Web] [DELETE] error", err);
              }
            });
            var instream = fs.createReadStream(inputFile);
            var outstream = new Stream();
            outstream.readable = true;
            outstream.writable = true;

            var rl = readline.createInterface({
              input: instream,
              output: outstream,
              terminal: false
            });

            rl.on("line", (line) => {
              var Search = FunctionSearch.exec(line);
              if (Search) {
                var reviverFunction = this.reviver(Search);
                return fs.appendFileSync(outputFile, `${reviverFunction}\n`);
              }
              fs.appendFileSync(outputFile, `${line}\n`);
            });
            instream.on("end", () => {
              fs.unlink(inputFile, (err) => {
                if (err) {
                  resolve({ error: "Error when deleting file" });
                  return console.error("[Bugsounet] [Web] [DELETE] error", err);
                }
                // !! ALL is ok !!
                resolve({
                  done: "ok",
                  backup: backupFile
                });
              });
            });
          };

          readFileLineByLine(configPathTMP, configPath);
        });
      });
      destination.on("error", (error) => {
        resolve({ error: "Error when writing file" });
        console.error("[Bugsounet] [Web] [WRITE]", error);
      });
    });
  }

  saveExternalConfig (Config) {
    return new Promise((resolve) => {
      var time = Date.now();
      var configPathTMP = `${this.BugsounetModulePath}/tmp/configTMP.js`;
      var configPathOut = `${this.BugsounetModulePath}/download/${time}.js`;

      var header = `/*** GENERATED BY @bugsounet MMM-Bugsounet v${require("../package.json").version} ***/\n\nvar config = `;
      var footer = "\n\n/*************** DO NOT EDIT THE LINE BELOW ***************/\nif (typeof module !== 'undefined') {module.exports = config;}\n";

      fs.writeFile(configPathTMP, header + util.inspect(Config, {
        showHidden: false,
        depth: null,
        maxArrayLength: null,
        compact: false
      }) + footer, (error) => {
        if (error) {
          resolve({ error: "Error when writing file" });
          return console.error("[Bugsounet] [Web] [WRITE] error", error);
        }

        const readFileLineByLine = (inputFile, outputFile) => {
          var FunctionSearch = new RegExp(/(.*)(`|')\[FUNCTION\](.*)(`|')/, "g");
          var instream = fs.createReadStream(inputFile);
          var outstream = new Stream();
          outstream.readable = true;
          outstream.writable = true;

          var rl = readline.createInterface({
            input: instream,
            output: outstream,
            terminal: false
          });

          rl.on("line", (line) => {
            var Search = FunctionSearch.exec(line);
            if (Search) {
              var reviverFunction = this.reviver(Search);
              return fs.appendFileSync(outputFile, `${reviverFunction}\n`);
            }
            fs.appendFileSync(outputFile, `${line}\n`);
          });
          instream.on("end", () => {
            console.log("[Bugsounet] [Web] Saved new backup configuration for downloading !");
            fs.unlink(inputFile, (err) => {
              if (err) {
                resolve({ error: "Error when deleting file" });
                return console.error("[Bugsounet] [Web] [DELETE] error", err);
              }
              resolve({ data: `${time}.js` });
            });
          });
        };
        readFileLineByLine(configPathTMP, configPathOut);
      });
    });
  }

  deleteDownload (file) {
    var inputFile = `${this.BugsounetModulePath}/download/${file}`;
    fs.unlink(inputFile, (err) => {
      if (err) {
        return console.error("[Bugsounet] [Web] error", err);
      }
      log("Successfully deleted:", inputFile);
    });
  }

  transformExternalBackup (backup) {
    return new Promise((resolve) => {
      try {
        var tmpFile = `${this.BugsounetModulePath}/tmp/config.${this.timeStamp()}.tmp`;
        fs.writeFile(tmpFile, backup, async (err) => {
          if (err) {
            console.error("[Bugsounet] [Web] [externalBackup]", err);
            resolve({ error: "Error when writing external tmp backup file" });
          } else {
            const result = await this.readTMPBackupConfig(tmpFile);
            resolve(result);
          }
        });
      } catch {
        resolve({ error: "Invalid file" });
      }
    });
  }

  /** check plugin in config **/
  checkPluginInConfig (plugin) {
    let index = this.website.EXTConfigured.indexOf(plugin);
    if (index > -1) return true;
    else return false;
  }

  /** list of all backups **/
  loadBackupNames () {
    return new Promise((resolve) => {
      const regex = "config.js";
      var List = [];
      var FileList = fs.readdirSync(`${this.BugsounetModulePath}/backup/`);
      FileList.forEach((file) => {
        const testFile = file.match(regex);
        if (testFile) List.push(file);
      });
      List.sort();
      List.reverse();
      resolve(List);
    });
  }

  /** delete all backups **/
  deleteBackup () {
    return new Promise((resolve) => {
      const regex = "config.js";
      var FileList = fs.readdirSync(`${this.BugsounetModulePath}/backup/`);
      FileList.forEach((file) => {
        const testFile = file.match(regex);
        if (testFile) {
          let pathFile = `${this.BugsounetModulePath}/backup/${file}`;
          try {
            fs.unlinkSync(pathFile);
            log("Removed:", file);
          } catch {
            console.error("[Bugsounet] [Web] Error occurred while trying to remove this file:", file);
          }
        }
      });
      resolve({ done: "ok" });
    });
  }

  /** read and send bakcup **/
  loadBackupFile (file) {
    return new Promise((resolve) => {
      var BackupConfig = {};
      let filePath = `${this.BugsounetModulePath}/backup/${file}`;
      if (fs.existsSync(filePath)) {
        BackupConfig = require(filePath);
        BackupConfig = this.configStartMerge(BackupConfig);
      }
      resolve(BackupConfig);
    });
  }

  /** get default ip address **/
  getIP () {
    return new Promise((resolve) => {
      var Interfaces = [];
      si.networkInterfaceDefault()
        .then((defaultInt) => {
          si.networkInterfaces().then((data) => {
            var int = 0;
            data.forEach((Interface) => {
              var info = {};
              if (Interface.type === "wireless") {
                info = {
                  ip: Interface.ip4 ? Interface.ip4 : "unknow",
                  default: (Interface.iface === defaultInt) ? true : false
                };
              }
              if (Interface.type === "wired") {
                info = {
                  ip: Interface.ip4 ? Interface.ip4 : "unknow",
                  default: (Interface.iface === defaultInt) ? true : false
                };
              }
              if (Interface.iface !== "lo") Interfaces.push(info);
              if (int === data.length - 1) resolve(Interfaces);
              else int += 1;
            });
          });
        })
        .catch(() => {
          var info = {};
          info = {
            ip: "127.0.0.1",
            default: true
          };
          Interfaces.push(info);
          resolve(Interfaces);
        });
    });
  }

  /** search and purpose and ip address **/
  async purposeIP () {
    var IP = await this.getIP();
    var found = 0;
    return new Promise((resolve) => {
      IP.forEach((network) => {
        if (network.default) {
          resolve(network.ip);
          found = 1;
        }
      });
      if (!found) resolve("127.0.0.1");
    });
  }

  /** config merge **/
  configStartMerge (result) {
    var stack = Array.prototype.slice.call(arguments, 0);
    var item;
    var key;
    while (stack.length) {
      item = stack.shift();
      for (key in item) {
        if (item.hasOwnProperty(key)) {
          if (typeof result[key] === "object" && result[key] && Object.prototype.toString.call(result[key]) !== "[object Array]") {
            if (typeof item[key] === "object" && item[key] !== null) {
              result[key] = this.configStartMerge({}, result[key], item[key]);
            } else {
              result[key] = item[key];
            }
          } else {

            if (Object.prototype.toString.call(result[key]) === "[object Array]") {
              result[key] = this.configStartMerge([], result[key], item[key]);
            } else if (Object.prototype.toString.call(result[key]) === "[object Object]") {
              result[key] = this.configStartMerge({}, result[key], item[key]);
            } else if (Object.prototype.toString.call(result[key]) === "[object Function]") {
              let tmp = JSON.stringify(item[key], this.replacer, 2);
              tmp = tmp.slice(0, -1);
              tmp = tmp.slice(1);
              result[key] = tmp;
            } else {
              result[key] = item[key];
            }
          }
        }
      }
    }
    return result;
  }

  configMerge (result) {
    var stack = Array.prototype.slice.call(arguments, 1);
    var item;
    var key;
    while (stack.length) {
      item = stack.shift();
      for (key in item) {
        if (item.hasOwnProperty(key)) {
          if (typeof result[key] === "object" && result[key] && Object.prototype.toString.call(result[key]) !== "[object Array]") {
            if (typeof item[key] === "object" && item[key] !== null) {
              result[key] = this.configMerge({}, result[key], item[key]);
            } else {
              result[key] = item[key];
            }
          } else result[key] = item[key];
        }
      }
    }
    return result;
  }

  /** create logs file from array **/
  readAllMMLogs (logs) {
    return new Promise((resolve) => {
      var result = "";
      logs.forEach((log) => {
        result += log.replace(/\r?\n/g, "\r\n");
      });
      resolve(result);
    });
  }

  /** set plugin as used and search version/rev **/
  async setEXTVersions (module) {
    if (this.website.EXTVersions[module] !== undefined) {
      this.sendSocketNotification("ERROR", `Already Activated: ${module}`);
      console.error(`Already Activated: ${module}`);
      return;
    }
    else log("Detected:", module);
    this.website.EXTVersions[module] = {
      version: require(`../EXTs/${module}/package.json`).version,
      rev: require(`../EXTs/${module}/package.json`).rev
    };

    let scanUpdate = await this.checkUpdate(module, this.website.EXTVersions[module].version);
    this.website.EXTVersions[module].last = scanUpdate.last;
    this.website.EXTVersions[module].update = scanUpdate.update;
    this.website.EXTVersions[module].beta = scanUpdate.beta;

    // scan every 60secs or every 15secs with GA app
    // I'm afraid about lag time...
    // maybe 60 secs is better
    setInterval(() => {
      this.checkUpdateInterval(module, this.website.EXTVersions[module].version);
    }, 1000 * 60);
  }

  async checkUpdateInterval (module, version) {
    let scanUpdate = await this.checkUpdate(module, version);
    this.website.EXTVersions[module].last = scanUpdate.last;
    this.website.EXTVersions[module].update = scanUpdate.update;
    this.website.EXTVersions[module].beta = scanUpdate.beta;
  }

  checkUpdate (module, version) {
    let remoteFile = `https://raw.githubusercontent.com/bugsounet/MMM-Bugsounet/refs/heads/main/EXTs/${module}/package.json`;
    let result = {
      last: version,
      update: false,
      beta: false
    };
    return new Promise((resolve) => {
      fetch(remoteFile)
        .then((response) => response.json())
        .then((data) => {
          result.last = data.version;
          if (semver.gt(result.last, version)) result.update = true;
          else if (semver.gt(version, result.last)) result.beta = true;
          resolve(result);
        })
        .catch((e) => {
          console.error(`[Bugsounet] [Web] Error on fetch last version of ${module}:`, e.message);
          resolve(result);
        });
    });
  }

  // Function() in config ?
  replacer (key, value) {
    if (typeof value === "function") {
      log("FUNCTION Replace", value.toString());
      return `[FUNCTION]${value.toString()}`;
    }
    return value;
  }

  reviver (value) {
    // value[1] = feature
    // value[3] = function()
    log("Function found!");
    var charsReplacer = value[3].replace(/\\n/g, "\n");
    charsReplacer = charsReplacer.replace(/\\/g, "");
    var result = value[1] + charsReplacer;
    log("Function Reviver line:\n", result);
    return result;
  }

  async getHomeText () {
    var Home = null;
    let lang = this.website.language;
    let langHome = `${this.WebsitePath}/home/${lang}.home`;
    let defaultHome = `${this.WebsitePath}/home/default.home`;
    if (fs.existsSync(langHome)) {
      console.log(`[Bugsounet] [Web] [Translation] [Home] Use: ${lang}.home`);
      Home = await this.readThisFile(langHome);
    } else {
      console.log("[Bugsounet] [Web] [Translation] [Home] Use: default.home");
      Home = await this.readThisFile(defaultHome);
    }
    return Home;
  }

  readThisFile (file) {
    return new Promise((resolve) => {
      fs.readFile(file, (err, input) => {
        if (err) {
          console.log("[Bugsounet] [Web] [Translation] [Home] Error", err);
          resolve();
        }
        resolve(input.toString());
      });
    });
  }

  MMConfigAddress () {
    return new Promise((resolve) => {
      if (this.website.MMConfig.address === "0.0.0.0") {
        this.website.errorInit = true;
        console.error("[Bugsounet] [Web] Error: You can't use '0.0.0.0' in MagicMirror address config");
        this.sendSocketNotification("ERROR", "You can't use '0.0.0.0' in MagicMirror address config");
        setTimeout(() => process.exit(), 5000);
        resolve(true);
      } else resolve(false);
    });
  }

  setEXTStatus (EXTs) {
    this.website.EXTStatus = EXTs;
  }

  getEXTStatus () {
    return this.website.EXTStatus;
  }

  /** search a in object a filtred value
   * sample object -->
    {
     ...
      'EXT-Updates': {
        module: 'EXT-Updates',
        behind: 6,
        current: 'dev',
        hash: '',
        tracking: 'origin/dev',
        isBehindInStatus: false,
        canBeUpdated: true,
        notify: false
      },
      ...
    }
    --> filterObject(object, "canBeUpdated", true)
    ----> will return Array of key with object found contain `canBeUpdated: true`
    ----> [ "EXT-Updates" ]
  */

  filterObject (obj, filter, filterValue) {
    var result = [];
    const FiltredObject = Object.keys(obj).reduce((acc, val) => (obj[val][filter] === filterValue ? { ...acc, [val]: obj[val] } : acc), {});
    if (Object.keys(FiltredObject).length) {
      result = Object.keys(FiltredObject);
    }
    return result;
  }

  searchVersion () {
    var APIResult = {
      version: require(`${this.BugsounetModulePath}/package.json`).version,
      rev: require(`${this.BugsounetModulePath}/package.json`).rev,
      api: require(`${this.BugsounetModulePath}/package.json`).api,
      lang: this.website.language,
      last: "0.0.0",
      needUpdate: false
    };
    let remoteFile = "https://raw.githubusercontent.com/bugsounet/MMM-Bugsounet/refs/heads/main/package.json";
    return new Promise((resolve) => {
      fetch(remoteFile)
        .then((response) => response.json())
        .then((data) => {
          APIResult.last = data.version;
          if (semver.gt(APIResult.last, APIResult.version)) APIResult.needUpdate = true;
          resolve(APIResult);
        })
        .catch(() => {
          console.error("[Bugsounet] [Web] [API] Error on fetch last version number");
          APIResult.error = "Error on fetch last version number";
          resolve(APIResult);
        });
    });
  }
}
module.exports = website;
