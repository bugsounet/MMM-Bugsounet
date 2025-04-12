"use strict";

const EventEmitter = require("events");
const util = require("node:util");
const readline = require("readline");
const fs = require("node:fs");
const url = require("node:url");
const http = require("node:http");
const { OAuth2Client } = require("google-auth-library");

function Auth (Config) {
  var config = {};
  if (Config !== undefined) config = Config;

  // make sure we have a key file to read from
  if (config.keyFilePath === undefined) {
    throw new Error("Missing \"keyFilePath\" from config (should be where your JSON file is)");
  }

  if (config.savedTokensPath === undefined) {
    throw new Error("Missing \"savedTokensPath\" from config (this is where your OAuth2 access tokens will be saved)");
  }

  const keyData = require(config.keyFilePath);
  const key = keyData.installed || keyData.web;

  // check credentials
  if (!key) {
    throw new Error("Bad credentials");
  }

  if (!key.redirect_uris) {
    throw new Error("Bad credentials missing: redirect_uris");
  }

  if (!key.client_id) {
    throw new Error("Bad credentials missing: client_id");
  }

  if (!key.client_secret) {
    throw new Error("Bad credentials missing: client_secret");
  }

  if (config.force && !config.inputReader && key.redirect_uris[0] !== "http://localhost:8888") {
    throw new Error("Bad credentials redirect_uris (1) must be http://localhost:8888");
  }

  const oauthClient = new OAuth2Client(key.client_id, key.client_secret, key.redirect_uris[0]);
  let tokens;

  const saveTokens = () => {
    oauthClient.setCredentials(tokens);
    this.emit("ready", oauthClient);

    try {
      fs.writeFile(config.savedTokensPath, JSON.stringify(tokens), () => {});
    } catch (error) {
      console.log("Error saving tokens:", error.message);
    }
  };

  const getTokens = async () => {
    const open = await loadOpen();

    const authorizeUrl = oauthClient.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/assistant-sdk-prototype"],
      prompt: "consent"
    });

    if (config.inputReader) {
      // open the URL
      console.log("Opening OAuth URL. Return here with your code.\n");
      open(authorizeUrl).catch(() => {
        console.log("Failed to automatically open the URL\n");
      });
      console.log("If your browser will not open, you can copy/paste this URL:\n", authorizeUrl);

      // create the interface to accept the code
      const reader = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
      });

      reader.question("Paste your code: ", processTokens);

    } else {

      /*
       * Read read google code in headless from http://localhost:8888
       * Based from https://github.com/googleapis/google-auth-library-nodejs#oauth2
       */
      http
        .createServer(async (req, res) => {
          try {
            if (req.url.indexOf("/?") > -1) {
              // acquire the code from the querystring, and close the web server.
              const qs = new url.URL(req.url, "http://localhost:8888")
                .searchParams;
              const code = qs.get("code");
              console.log(`Code is: ${code}`);
              res.end("Authentication successful!");
              if (code) processTokens(code);
            }
          } catch (e) {
            console.error(e);
          }
        })
        .listen(8888, () => {
          // open the browser to the authorize url to start the workflow
          open(authorizeUrl, { wait: false }).then((cp) => {
            console.log("Waiting Google Code...");
            cp.unref();
          });
        });
    }
  };

  const processTokens = (oauthCode) => {
    if (!oauthCode) {
      console.error("\nError: No code given");
      process.exit(-1);
    }

    // get our tokens to save
    oauthClient.getToken(oauthCode, (error, tkns) => {
      // if we have an error, print it and kill the process
      if (error) {
        console.error("\nError getting tokens:", error);
        process.exit(-1);
      }

      // if we didn't have an error, save the tokens
      tokens = tkns;
      saveTokens();
    });
  };

  // if the tokens are already saved, we can skip having to get the code for now
  process.nextTick(() => {
    if (config.savedTokensPath) {
      if (config.force) {
        try {
          fs.unlinkSync(config.savedTokensPath);
          console.warn("Old Token deleted.");
        } catch {
          // Perfect file don't exist: do nothing!
        }
      }
      try {
        const tokensFile = fs.readFileSync(config.savedTokensPath);
        tokens = JSON.parse(tokensFile);
      } catch {
        // we need to get the tokens
        getTokens();
      } finally {
        if (tokens !== undefined) saveTokens();
      }
    }
  });

  return this;
}


// import Open library and use default function only
async function loadOpen () {
  const loaded = await import("open");
  return loaded.default;
}

util.inherits(Auth, EventEmitter);
module.exports = Auth;
