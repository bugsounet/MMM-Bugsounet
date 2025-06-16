"use strict";

const http = require("node:http");
const path = require("node:path");

const si = require("systeminformation");
const express = require("express");
const bodyParserErrorHandler = require("express-body-parser-error-handler");
const cors = require("cors");
const Socket = require("socket.io");
const { createProxyMiddleware, fixRequestBody } = require("http-proxy-middleware");
const cookieParser = require("cookie-parser");

const HyperWatch = require("./hyperwatch");

var pty = null;
var log = () => { /* do nothing */ };

class website {
  constructor (config, cb = () => {}) {
    this.lib = config.lib;
    this.sendSocketNotification = (...args) => cb.sendSocketNotification(...args);
    this.config = config;

    if (config.debug) log = (...args) => { console.log("[WEBSITE] [Web]", ...args); };
    if (config.pty) {
      pty = require("node-pty");
    } else {
      console.log(`[WEBSITE] EXT-Website Server Version: ${require("../package.json").version} rev: ${require("../package.json").rev}`);
    }
    this.website = {
      EXTStatus: {}, // status of EXT
      initialized: false,
      app: null,
      server: null,
      HyperWatch: null,
      errorInit: false,
      listening: "127.0.0.1"
    };

    this.MMVersion = global.version;
    this.root_path = __dirname;
    this.BugsounetModulePath = path.resolve(this.root_path, "../../../");
    this.WebsiteModulePath = `${this.BugsounetModulePath}/EXTs/EXT-Website`;
    this.WebPath = `${this.WebsiteModulePath}/web`;
  }

  async init () {
    HyperWatch.enable();
    console.log("[WEBSITE] [Web] Loading Website...");

    if (this.website.errorInit) return;

    this.website.listening = await this.purposeIP();

    log("Listening:", this.website.listening);

    console.log("[WEBSITE] [Web] [Server] Loading Main Server...");
    await this.createWebsite();
    await this.server();
  }

  /** Start Website Server **/
  server () {
    return new Promise((resolve) => {
      this.website.server
        .listen(this.config.server_Port, "0.0.0.0", () => {
          console.log(`[WEBSITE] [Web] [Server] Start listening on port ${this.config.server_Port}`);
          console.log(`[WEBSITE] [Web] [Server] Available locally at http://${this.website.listening}:${this.config.server_Port}`);
          this.website.initialized = true;
          this.sendSocketNotification("INITIALIZED");
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
        target: this.config.API,
        changeOrigin: false,
        xfwd: true,
        pathFilter: ["/api"],
        plugins: [ProxyRequestLogger],
        on: {
          onProxyReq: fixRequestBody,
          error: (err, req, res) => {
            console.error("[WEBSITE] [Web] API Proxy ERROR", err);
            res.writeHead(500, {
              "Content-Type": "text/plain"
            });
            res.end(`${err.message}`);
          }
        }
      });

      const SmartHomeProxy = createProxyMiddleware({
        target: "http://127.0.0.1:8083",
        changeOrigin: true,
        xfwd: true,
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

      this.website.app.use(express.json());

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
        extensions: ["css", "js", "html", "map", "woff2"],
        index: false,
        maxAge: "1d",
        redirect: false,
        setHeaders (res) {
          res.set("x-timestamp", Date.now());
        }
      };

      var io = new Socket.Server(this.website.server);

      this.website.app
        .use(this.logRequest)
        .use(cors({ origin: "*" }))
        .use("/assets", express.static(`${this.WebPath}/assets`, options))
        .use("/html", express.static(`${this.WebPath}/html`, options))

        .use("/jsoneditor", express.static(`${this.WebsiteModulePath}/node_modules/jsoneditor`, options))
        .use("/xterm", express.static(`${this.WebsiteModulePath}/node_modules/xterm`, options))
        .use("/xterm-addon-fit", express.static(`${this.WebsiteModulePath}/node_modules/xterm-addon-fit`, options))
        .use("/alertify", express.static(`${this.BugsounetModulePath}/node_modules/alertifyjs/build`, options))
        .use("/animate.css", express.static(`${this.WebsiteModulePath}/node_modules/animate.css`, options))
        .use("/fontawesome", express.static(`${this.WebsiteModulePath}/node_modules/@fortawesome/fontawesome-free`, options))
        .use("/bootstrap", express.static(`${this.WebsiteModulePath}/node_modules/bootstrap/dist`, options))

        .get("/login", (req, res) => {
          const logged = this.hasValidCookie(req);
          if (logged) return res.redirect("/");
          res.clearCookie("MMM-Bugsounet");
          res.sendFile(`${this.WebPath}/login.html`);
        })

        .get("/logout", (req, res) => {
          res.clearCookie("MMM-Bugsounet");
          res.redirect("/login");
        })

        .post("/auth", (req, res) => this.login(req, res))

        .get("/", (req, res, next) => this.auth(req, res, next), (req, res) => {
          res.sendFile(`${this.WebPath}/index.html`);
        })

        .get("/viewConfig", (req, res, next) => this.auth(req, res, next), (req, res) => {
          res.sendFile(`${this.WebPath}/viewConfig.html`);
        })

        .get("/editConfig", (req, res, next) => this.auth(req, res, next), (req, res) => {
          res.sendFile(`${this.WebPath}/editConfig.html`);
        })

        .get("/logs", (req, res, next) => this.auth(req, res, next), (req, res) => {
          var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
          res.sendFile(`${this.WebPath}/logs.html`);

          io.once("connection", async (socket) => {
            log(`[${ip}] Connected to Terminal Logs:`, req.user);
            socket.on("disconnect", (err) => {
              log(`[${ip}] Disconnected from Terminal Logs:`, req.user, `[${err}]`);
            });
            var pastLogs = await this.readAllMMLogs(HyperWatch.logs());
            io.emit("terminal.logs", pastLogs);
            HyperWatch.stream().on("stdData", (data) => {
              if (typeof data === "string") io.to(socket.id).emit("terminal.logs", data.replace(/\r?\n/g, "\r\n"));
            });
          });
        })

        .get("/SSH", (req, res, next) => this.auth(req, res, next), (req, res) => {
          var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
          res.sendFile(`${this.WebPath}/SSH.html`);

          io.once("connection", (client) => {
            log(`[${ip}] Connected to Terminal:`, req.user);
            client.on("disconnect", (err) => {
              log(`[${ip}] Disconnected from Terminal:`, req.user, `[${err}]`);
            });
            var cols = 80;
            var rows = 24;
            if (!pty) {
              console.warn("[WEBSITE] Server mode: Terminal is disabled!");
              io.to(client.id).emit("terminal.incData", "This Terminal is disabled in server mode.");
              return;
            }
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

        .get("/Tools", (req, res, next) => this.auth(req, res, next), (req, res) => {
          res.sendFile(`${this.WebPath}/tools.html`);
        })

        .get("/System", (req, res, next) => this.auth(req, res, next), (req, res) => {
          res.sendFile(`${this.WebPath}/system.html`);
        })

        .get("/3rdParty", (req, res, next) => this.auth(req, res, next), (req, res) => {
          res.sendFile(`${this.WebPath}/3rdparty.html`);
        })

        .get("/APIDocs", (req, res, next) => this.auth(req, res, next), (req, res) => {
          res.sendFile(`${this.WebPath}/API.html`);
        })

        .get("/About", (req, res, next) => this.auth(req, res, next), (req, res) => {
          res.sendFile(`${this.WebPath}/about.html`);
        })

        .get("/Account", (req, res, next) => this.auth(req, res, next), (req, res) => {
          res.sendFile(`${this.WebPath}/account.html`);
        })

      /*
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
      */

        .get("/robots.txt", (req, res) => {
          res.sendFile(`${this.WebPath}/robots.txt`);
        })

        .get("/favicon.ico", (req, res) => {
          res.sendFile(`${this.WebPath}/assets/images/favicon.ico`);
        })

        .get("/404", (req, res) => {
          res.status(404).sendFile(`${this.WebPath}/404.html`);
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
      response = await fetch(`${this.config.API}/api/login`, {
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
      let expire = result.expire_in;
      console.log(`[WEBSITE] [Web] [${ip}] Login ${user}`);
      res.cookie("MMM-Bugsounet", { token: token, user: user }, {
        httpOnly: true,
        maxAge: expire * 1000
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
