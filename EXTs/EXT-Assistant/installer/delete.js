const path = require("node:path");
const fs = require("node:fs");
const readline = require("readline");
const { OAuth2Client } = require("google-auth-library");

const config = {
  credentials: null,
  token: null,
  project_id: null
};

const debug = process.argv.slice(2) === "dev" ? true : false;

console.log("~~~");
console.log("~MMM-GoogleAssistant~ Device Delete", debug ? "~~ debug Mode ~~" : "");
console.log("~~~");
console.log(" ");


// import open
async function loadOpen () {
  const loaded = await import("open");
  return loaded.default;
}


async function Auth (config) {
  const open = await loadOpen();
  return new Promise((res) => {
    config.credentials = path.resolve(__dirname, "../credentials.json");

    // make sure we have a credentials to read from
    if (!fs.existsSync(config.credentials)) {
      console.error("[GA] Missing \"credentials.json\" file");
      process.exit();
    }

    const keyData = require(config.credentials);
    const key = keyData.installed || keyData.web;
    const oauthClient = new OAuth2Client(key.client_id, key.client_secret, key.redirect_uris[0]);
    let tokens;
    config.project_id = key.project_id;

    const url = oauthClient.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/assistant-sdk-prototype"]
    });

    // open the URL
    console.log("[GA] Opening OAuth URL. Return here with your code.\n");
    open(url).catch(() => {
      console.log("[GA] Failed to automatically open the URL\n");
    });
    console.log("[GA] If your browser will not open, you can copy/paste this URL:\n", url);
    console.log(" ");

    // create the interface to accept the code
    const reader = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    reader.question("[GA] Paste your code: ", (oauthCode) => {
      if (!oauthCode) process.exit();
      // get our tokens to save
      oauthClient.getToken(oauthCode, (error, tkns) => {
        // if we have an error, print it and kill the process
        if (error) {
          console.error("[GA] Error getting tokens:", error);
          process.exit();
        }
        // if we didn't have an error, save the tokens
        tokens = tkns;
        oauthClient.setCredentials(tokens);
        if (debug) console.log("[GA] Token:", tokens);
        config.token = tokens.access_token;
        console.log(" ");
        return res();
      });
    });
  });
}

Auth(config).then(() => {
  if (debug) console.log("[GA] Final config:", config);
  removeDevice(config)
    .then(() => process.exit())
    .catch(() => process.exit());
});

/** delete **/
function removeDevice (config) {
  return new Promise((res, rej) => {
    try {
      const projectId = config.project_id;
      const accesstoken = config.token;
      const deviceId = "MMM-GoogleAssistant";

      fetch(`https://embeddedassistant.googleapis.com/v1alpha2/projects/${projectId}/devices/${deviceId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accesstoken}`,
            "Content-Type": "application/json"
          }
        })
        .then((response) => {
          if (debug) console.log("[GA] Status/code: ", response.statusText, `[${response.status}]`);
          return response.json();
        })
        .then(async (data) => {
          if (data.error) {
            console.error("[GA] Error:", data.error);
            return rej();
          }
          if (debug) console.log("[GA] Instance data:", data);
          console.log("[GA] Instance deleted:", deviceId);
          await deviceDelete(config);
          return res();
        });
    } catch (e) {
      console.error(`[GA] ${e}`);
      return rej();
    }
  });
}

/** delete Model **/
function deviceDelete (config) {
  return new Promise((res, rej) => {
    try {
      const projectId = config.project_id;
      const accesstoken = config.token;
      const modelId = `${projectId}-bugsounet_GA`;
      fetch(`https://embeddedassistant.googleapis.com/v1alpha2/projects/${projectId}/deviceModels/${modelId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accesstoken}`,
            "Content-Type": "application/json"
          }
        })
        .then((response) => {
          if (debug) console.log("[GA] Status/code: ", response.statusText, `[${response.status}]`);
          return response.json();
        })
        .then((data) => {
          if (data.error) {
            console.error("[GA] Error:", data.error);
            return rej();
          }
          console.log("[GA] Jarvis Device deleted:", modelId, "from", projectId);
          return res();
        });
    } catch (e) {
      console.error(`[GA] ${e}`);
      return rej();
    }
  });
}
