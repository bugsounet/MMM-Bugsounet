/** setup nginx server with a domain name with https **/

const fs = require("node:fs");
var prompt = require("prompt");
const isValidDomain = require("is-valid-domain");
const systemd = require("../components/systemd");
const { empty, error, warning, success, info, isWin } = require("../../../installer/utils");

const Systemd = new systemd("nginx");

var server = `server {
  listen 80;

  server_name %domain%;

  location / {
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_set_header Host $http_host;
      proxy_set_header X-NginX-Proxy true;

      proxy_pass http://127.0.0.1:8081;
      proxy_redirect off;

      # Socket.IO Support
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
  }
}`;

async function main () {
  empty();
  this.domain = await promptDomain();
  await saveDomain();
  await nginx();
}


function promptDomain () {
  return new Promise((resolve) => {
    prompt.message = "";
    prompt.start();

    prompt.get({
      properties: {
        domain: {
          description: info("What is your domain name?")
        }
      }
    }, function (err, result) {
      if (err) {
        empty();
        error(`${err}`);
        process.exit(255);
      }
      if (!result.domain || !isValidDomain(result.domain)) {
        error("Error: domain name must be a valid!");
        return main();
      }
      success("OK");
      empty();
      resolve(result.domain);
    });
  });
}

function saveDomain () {
  return new Promise((resolve) => {
    info(`Writing your domain name: ${this.domain}`);
    fs.writeFile(`${__dirname}/DomainName`, this.domain, (err) => {
      if (err) {
        error(`Error:${err.message}`);
        return process.exit(255);
      }
      success("OK");
      empty();
      resolve();
    });
  });
}

function nginx () {
  return new Promise((resolve) => {
    server = server.replace("%domain%", this.domain);
    info("Your nginx server configuration will be:");
    info(server);
    empty();
    info("Writing Bugsounet configuration file...");
    fs.writeFile("/etc/nginx/sites-available/Bugsounet", server, async (err) => {
      if (err) {
        error(`Error:${err.message}`);
        return process.exit(1);
      }
      success("OK, writed in /etc/nginx/sites-available/Bugsounet");
      empty();
      await deleteDefault();
      await createSymLink();
      resolve(restartNginx());
    });
  });
}

function createSymLink () {
  info("Create Bugsounet Symlink in /etc/nginx/sites-enabled/Bugsounet ...");
  return new Promise((resolve) => {
    fs.access("/etc/nginx/sites-enabled/Bugsounet", fs.constants.F_OK, (err) => {
      if (!err) {
        warning("OK (Already created) in /etc/nginx/sites-enabled/Bugsounet");
        empty();
        resolve();
      } else {
        fs.symlink("/etc/nginx/sites-available/Bugsounet", "/etc/nginx/sites-enabled/Bugsounet", "file", (err) => {
          if (err) {
            error(`Error:${err.message}`);
            return process.exit(1);
          }
          success("OK");
          empty();
          resolve();
        });
      }
    });
  });
}

function deleteDefault () {
  info("Delete default Symlink...");
  return new Promise((resolve) => {
    fs.access("/etc/nginx/sites-enabled/default", fs.constants.F_OK, (err) => {
      if (!err) {
        fs.rm("/etc/nginx/sites-enabled/default", (err) => {
          if (err) {
            error(`Error: ${err.message}`);
            return process.exit(1);
          }
          success("OK, deleted /etc/nginx/sites-enabled/default");
          empty();
          resolve();
        });
      } else {
        success("OK (Not found)");
        empty();
        resolve();
      }
    });
  });
}

async function restartNginx () {
  info("Restart nginx with new configuration...");
  const nginxRestart = await Systemd.restart();
  if (nginxRestart.error) {
    error("Error when restart nginx!");
    error(`${nginxRestart.error}`);
    return process.exit(1);
  }
  success("OK");
  empty();
  warning("Before you continue: Don't forget to forward ports 80 and 443 to your Pi's IP address!");
}

function isRoot () {
  return !process.getuid();
}


if (isWin()) {
  error("This tool can't run under windows!");
} else {
  if (isRoot()) main();
  else error("Root level is needed (sudo)");
}
