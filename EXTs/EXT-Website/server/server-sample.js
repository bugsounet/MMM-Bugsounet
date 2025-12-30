/*
 * Default website config for remote using (server)
 */

let config = {
  debug: true,
  API: "http://127.0.0.1:8085", // API remote server
  server_Port: 8081 // EXT-Website port
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
const website = require("../components/website");

this.website = new website(config, {
  sendSocketNotification: (...args) => {
    console.log("[WEBSITE]", ...args);
  }
});

this.website.init({});
