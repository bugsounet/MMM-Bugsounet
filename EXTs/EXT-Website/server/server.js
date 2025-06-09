const website = require("../components/website");

let WebsiteHelperConfig = {
  debug: true
};

this.website = new website(WebsiteHelperConfig, { sendSocketNotification: (...args) => console.log(...args) });

this.website.init({});