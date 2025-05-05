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

var log = () => { /* do nothing */ };

class website {
  constructor (config, cb = () => {}) {
    this.lib = config.lib;
    this.config = config.config;
    this.sendSocketNotification = (...args) => cb.sendSocketNotification(...args);
    this.sendInternalCallback = (value) => cb.sendInternalCallback(value);

    if (config.debug) log = (...args) => { console.log("[WEBSITE] [Web]", ...args); };

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
    this.WebsiteModulePath = `${this.root_path}/modules/MMM-Bugsounet/EXTs/EXT-Website`;
    this.WebsitePath = `${this.root_path}/modules/MMM-Bugsounet/EXTs/EXT-Website/website`;
    this.APIDOCS = {};
  }

  async init (data) {
    console.log("[WEBSITE] [Web] Loading Website...");

    if (this.lib.error || this.website.errorInit) return;

    this.website.listening = await this.purposeIP();
    this.website.APIDocs = data.useAPIDocs;

    log("Listening:", this.website.listening);
    log("APIDocs:", this.website.APIDocs);

    console.log("[WEBSITE] [Web] [Server] Loading Main Server...");
    await this.createWebsite();
    await this.server();
  }

  /** Start Website Server **/
  server () {
    return new Promise((resolve) => {
      this.website.server
        .listen(8081, "0.0.0.0", () => {
          console.log("[WEBSITE] [Web] [Server] Start listening on port 8081");
          console.log(`[WEBSITE] [Web] [Server] Available locally at http://${this.website.listening}:8081`);
          this.website.initialized = true;
          resolve();
        })
        .on("error", (err) => {
          console.error("[WEBSITE] [Web] [Server] Can't start web server!");
          console.error("[WEBSITE] [Web] [Server] Error:", err.message);
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

      const SmartHomeProxy = createProxyMiddleware({
        target: "http://127.0.0.1:8083",
        changeOrigin: false,
        pathFilter: ["/smarthome"],
        pathRewrite: { "^/smarthome": "" },
        plugins: [ProxyRequestLogger],
        on: {
          onProxyReq: fixRequestBody,
          error: (err, req, res) => {
            console.error("[WEBSITE] [Web] SmartHome Proxy ERROR", err);
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

      this.website.app = express();
      this.website.server = http.createServer(this.website.app);
      log("Create website needed routes...");

      // reverse proxy for API and EXT-SmartHome
      this.website.app.use(APIProxy);
      this.website.app.use(SmartHomeProxy);

      this.website.app.use(this.customHeaders);

      this.website.app.use(express.json())

      this.website.app.use(bodyParserErrorHandler(
        {
          onError: (err, req) => {
            let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
            console.error(`[WEBSITE] [Web] [${ip}] [${req.method}] ${req.url}`);
            console.error("[WEBSITE] [Web] bodyparser error:", err.type);
            log("body:", err.body);
            console.error("[WEBSITE] [Web] detail:", err.message);
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

        .use("/jsoneditor", express.static(`${this.WebsiteModulePath}/node_modules/jsoneditor`))
        .use("/xterm", express.static(`${this.WebsiteModulePath}/node_modules/xterm`))
        .use("/xterm-addon-fit", express.static(`${this.WebsiteModulePath}/node_modules/xterm-addon-fit`))
        .use("/alertify", express.static(`${this.BugsounetModulePath}/node_modules/alertifyjs/build`))

        .get("/login", (req, res) => {
          const logged = this.hasValidCookie(req);
          if (logged) return res.redirect("/");
          res.clearCookie("MMM-Bugsounet");
          res.sendFile(`${this.WebsitePath}/login.html`);
        })

        .get("/logout", (req, res) => {
          res.clearCookie("MMM-Bugsounet");
          res.redirect("/login");
        })

        .post("/auth", (req, res) => this.login(req, res))

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

        .get("/download/:file", (req, res) => {
          this.website.healthDownloader(req, res);
        })

        .get("/robots.txt", (req, res) => {
          res.sendFile(`${this.WebsitePath}/robots.txt`);
        })

        .get("/404", (req, res) => {
          res.status(404).sendFile(`${this.WebsitePath}/404.html`);
        })

        .get("/:other", (req, res) => {
          console.warn("[WEBSITE] [Web] Don't find:", req.url);
          res.redirect("/404");
        });

      resolve();
    });
  }

  /*************/
  /*** Tools ***/
  /*************/

  // verify authenticate, if failed redirect to login page
  auth (req, res, next) {
    try {
      const { cookies } = req;
      console.log("cookies", cookies);

      if (!cookies || !cookies["MMM-Bugsounet"]) {
        console.warn("[WEBSITE] [Web] [AUTH] Missing MMM-Bugsounet cookie");
        return res.redirect("/login");
      }

      if (!cookies["MMM-Bugsounet"].token || !cookies["MMM-Bugsounet"].user) {
        console.warn("[WEBSITE] [Web] [AUTH] Bad MMM-Bugsounet cookie");
        return res.redirect("/login");
      }

      req.user = cookies["MMM-Bugsounet"].user;
      next();
    } catch (err) {
      console.error("[WEBSITE] [Web] [AUTH] Error 500!", err.message);
      return res.status(500).json({ error: "Internal error" });
    }
  }

  // login deals with username // password in Basic
  async login (req, res) {
    var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const authorization = req.headers.authorization;
    const params = authorization?.split(" ");
    var APIResult = {
      error: "Invalid credentials"
    };

    if (!authorization) {
      console.warn(`[WEBSITE] [Web] [${ip}] Bad Login: missing authorization type`);
      APIResult.description = "Missing authorization type";
      return res.status(401).json(APIResult);
    }

    if (params[0] !== "Basic") {
      console.warn(`[WEBSITE] [Web] [${ip}] Bad Login: Basic authorization type only`);
      APIResult.description = "Authorization type Basic only";
      return res.status(401).json(APIResult);
    }

    if (!params[1]) { // must never happen
      console.warn(`[WEBSITE] [Web] [${ip}] Bad Login: missing Basic params`);
      APIResult.description = "Missing Basic params";
      return res.status(401).json(APIResult);
    }

    var headers = {
      "Content-Type": "application/json"
    };

    headers = Object.assign(headers, { Authorization: authorization });

    var response;
    var result = {};

    try {
      response = await fetch("http://localhost:8085/api/login", {
        method: "POST",
        headers: headers
      });
    } catch {
      APIResult = {
        error: "No response from server"
      };
      res.status(500).json(APIResult);
      return;
    }

    try {
      result = await response.json();
    } catch {
      APIResult = {
        error: "No response from server"
      };
      res.status(500).json(APIResult);
      return;
    }

    if (response.ok) {
      let token = result.access_token;
      if (!token) {
        APIResult = {
          error: "Server return no token"
        };
        res.status(500).json(APIResult);
        return;
      }
      let user = result.user;
      if (!user) {
        APIResult = {
          error: "Server return no user"
        };
        res.status(500).json(APIResult);
        return;
      }
      let expire = result.expire_in
      console.log(`[WEBSITE] [Web] [${ip}] Login ${user}`);
      res.cookie("MMM-Bugsounet", { token: token, user: user }, {
        httpOnly: true,
        maxAge: expire*1000
      });
      res.json({ session: token });

    } else {
      APIResult = result;
      res.status(403).json(APIResult);
    }
  }

  // check cookie for relogin (server will check other)
  hasValidCookie = (req) => {
    try {
      const { cookies } = req;

      if (!cookies || !cookies["MMM-Bugsounet"]) return null;

      return true;
    } catch (err) {
      console.error("[WEBSITE] [Web] Cookie Error !", err.message);
      return null;
    }
  };

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

}
module.exports = website;
