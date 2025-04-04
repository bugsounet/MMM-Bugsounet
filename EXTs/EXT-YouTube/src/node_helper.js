/** MMM-YouTube helper **/

"use strict";
var NodeHelper = require("node_helper");
var YouTubeSearch = require("./components/youtube-search");

let log = () => { /* do nothing */ };

module.exports = NodeHelper.create({
  start () {
    this.config = {};
    this.session = null;
  },

  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case "INIT":
        this.config = payload;
        this.initialize();
        break;
      case "YT_SEARCH":
        this.YoutubeSearch(payload);
        break;
      case "Session":
        this.session = payload;
        if (payload === null) log("Reset Session");
        else log("Received session:", payload);
        break;
      case "Volume-Min":
        if (!this.config.username || !this.config.password) return console.warn("|YT] Volume Min: Not available");
        if (!this.session) return console.error("|YT] Volume Min: No session found");
        this.YoutubeVolume(10);
        break;
      case "Volume-Max":
        if (!this.config.username || !this.config.password) return console.warn("|YT] Volume Max: Not available");
        if (!this.session) return console.error("|YT] Volume Max: No session found");
        this.YoutubeVolume(100);
        break;
    }
  },

  async initialize () {
    console.log(`[YT] ${require("./package.json").name} Version:`, require("./package.json").version, "rev:", require("./package.json").rev);
    if (this.config.debug) log = (...args) => { console.log("[YT]", ...args); };
    console.log("[YT] YouTube Search Function initilized.");
    this.sendSocketNotification("YT_INITIALIZED");

    console.log("[YT] EXT-YouTube is Ready.");
  },

  /** YouTube Search **/
  async YoutubeSearch (query) {
    log("Search for:", query);
    try {
      let results = await YouTubeSearch.search(query, 1);
      let item = results.items[0];
      //log("Results:", item)
      let title = item.title;
      let thumbnail = item.thumbnail;
      let videoID = item.id;
      log("Found YouTube Title:", title, "videoID:", videoID);
      this.sendSocketNotification("YT_FOUND", { title: title, thumbnail: thumbnail });
      this.sendSocketNotification("YT_RESULT", videoID);
    } catch (e) {
      console.error("[YT] YouTube Search error: ", e.toString());
      this.sendSocketNotification("YT_SEARCH_ERROR");
    }
  },

  YoutubeVolume (volume) {
    let body = {
      session: this.session,
      username: this.config.username,
      volume: volume
    };
    fetch("https://youtube.bugsounet.fr/volumeControl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) console.error(`[YT] Volume: ${data.error}`);
        else log(`Volume: ${data.volume}`);
      })
      .catch((err) => {
        console.error(`[YT] Volume: ${err}`);
      });
  }
});
