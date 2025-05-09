"use strict";
var logGA = () => { /* do nothing */ };
const path = require("path");
const fs = require("fs");
const HTMLParser = require("node-html-parser");
const Entities = require("html-entities");

class SCREENPARSER {
  constructor (config, debug) {
    this.config = config;
    if (debug === true) logGA = (...args) => { console.log("[GA] [SCREEN_PARSER]", ...args); };
  }

  parse (response, endCallback = () => {}) {
    if (response.screen) {
      var uri = this.config.responseOutputURI;
      var filePath = path.resolve(__dirname, "..", uri);
      if (!response.screen.originalContent) return;
      var str = response.screen.originalContent.toString("utf8");
      var disableTimeoutFromScreenOutput = (str) => {
        return str.replace(/document\.body,"display","none"/gim, () => {
          return "document.body,\"display\",\"block\"";
        });
      };
      str = disableTimeoutFromScreenOutput(str);
      str = str.replace("html", `html style="zoom:${this.config.responseOutputZoom}"`);

      var url = `/modules/MMM-Bugsounet/EXTs/EXT-Assistant/${this.config.responseOutputCSS}?seed=${Date.now()}`;
      str = str.replace(/<style>html,body[^<]+<\/style>/gmi, `<link rel="stylesheet" href="${url}">`);

      var ret = HTMLParser.parse(response.screen.originalContent);
      var dom = ret.querySelector(".popout-content");
      response.screen.text = dom ? dom.structuredText : null;
      response.text = dom && dom.querySelector(".show_text_content") ? dom.querySelector(".show_text_content").structuredText : null;
      response.screen = this.parseScreenLink(response.screen);
      response.screen.photos = [];
      var photos = ret.querySelectorAll(".photo_tv_image");
      if (photos) {
        for (var i = 0; i < photos.length; i++) {
          response.screen.photos.push(photos[i].attributes["data-image-url"]);
        }
      }

      fs.writeFile(filePath, str, (error) => {
        if (error) {
          console.error("[GA] [SCREEN_PARSER] SCREENOUTPUT_CREATION_ERROR", error);
          endCallback(error);
        } else {
          response.screen.path = filePath;
          response.screen.uri = uri;
          logGA("SCREEN_OUTPUT_CREATED");
          endCallback(response);
        }
      });
    }
  }


  parseScreenLink (screen) {
    var decode = Entities.decode;
    var html = screen.originalContent;
    screen.links = [];
    /* eslint-disable no-useless-escape */
    // need to be fixed
    var links = [
      /data-url=\"([^\"]+)\"/gmi,
      / (http[s]?\:\/\/[^ \)]+)[ ]?\)/gmi,
      /\: (http[s]?\:\/\/[^ <]+)/gmi
    ];
    /* eslint-enable no-useless-escape */
    var r = null;
    var res = [];
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      while ((r = link.exec(html)) !== null) {
        res.push(decode(r[1]));
      }
    }
    screen.links = res;
    logGA("[LINKS] Found:", screen.links.length);
    return screen;
  }
}

module.exports = SCREENPARSER;
