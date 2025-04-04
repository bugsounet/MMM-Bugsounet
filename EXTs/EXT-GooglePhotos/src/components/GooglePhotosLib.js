/** Main @eouia code
 ** Needed review for less complexity
 ** and only usable for MMM-GoogleAssistant function
 **/

"use strict";

const EventEmitter = require("events");
const util = require("util");
const readline = require("readline");
const fs = require("fs");
const path = require("path");
const https = require("node:https");
const { OAuth2Client } = require("google-auth-library");
const moment = require("dayjs");
const Axios = require("axios");

function sleep (ms = 1000) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function Auth (Config, debug = false, error = () => {}) {
  const log = (debug) ? (...args) => { console.log("[GPHOTOS:AUTH]", ...args); } : () => {};
  var config = Config;
  if (config === undefined) config = {};
  if (config.keyFilePath === undefined) {
    console.log("[GPHOTOS:AUTH] Error: Missing \"keyFilePath\" from config");
    error("GPhotos: Missing \"keyFilePath\" from config");
    return;
  }
  if (config.savedTokensPath === undefined) {
    console.log("[GPHOTOS:AUTH] Error: Missing \"savedTokensPath\" from config");
    error("GPhotos: Missing \"savedTokensPath\" from config");
    return;
  }
  var creds = path.resolve(__dirname, config.keyFilePath);
  if (!fs.existsSync(creds)) {
    console.log("[GPHOTOS:AUTH] Error: Missing Credentials.");
    error("GPhotos: Missing Credentials.");
    return;
  }
  const key = require(config.keyFilePath).installed || require(config.keyFilePath).web;
  const oauthClient = new OAuth2Client(key.client_id, key.client_secret, key.redirect_uris[0]);
  let tokens;
  const saveTokens = (first = false) => {
    oauthClient.setCredentials(tokens);
    var expired = false;
    if (tokens.expiry_date < Date.now()) {
      expired = true;
      log("Token is expired.");
    }
    if (expired || first) {
      oauthClient.refreshAccessToken()
        .then((tk) => {
          tokens = tk.credentials;
          var tp = path.resolve(__dirname, config.savedTokensPath);
          fs.writeFileSync(tp, JSON.stringify(tokens));
          log("Token is refreshed.");
          this.emit("ready", oauthClient);
        })
        .catch((err) => {
          console.error("[GPHOTOS:AUTH] Error:", err.message);
          error(`GPhotos: ${err.message}`);
        });
    } else {
      log("Token is alive.");
      this.emit("ready", oauthClient);
    }
  };

  const getTokens = async () => {
    const open = await loadOpen();
    const url = oauthClient.generateAuthUrl({
      access_type: "offline",
      scope: [config.scope],
      prompt: "consent"
    });
    log(`Opening OAuth URL.\n\n${url}\n\nReturn here with your code.`);
    open(url).catch(() => {
      log("Failed to automatically open the URL. Copy/paste this in your browser:\n", url);
    });
    if (typeof config.tokenInput === "function") {
      config.tokenInput(processTokens);
      return;
    }
    const reader = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });
    reader.question("> Paste your code: ", processTokens);
  };
  const processTokens = (oauthCode) => {
    if (!oauthCode) process.exit(-1);
    oauthClient.getToken(oauthCode, (error, tkns) => {
      if (error) throw new Error("Error getting tokens:", error);
      tokens = tkns;
      saveTokens(true);
    });
  };
  process.nextTick(() => {
    if (config.savedTokensPath) {
      try {
        var file = path.resolve(__dirname, config.savedTokensPath);
        const tokensFile = fs.readFileSync(file);
        tokens = JSON.parse(tokensFile);
      } catch {
        getTokens();
      } finally {
        if (tokens !== undefined) saveTokens();
      }
    }
  });
  return this;
}
util.inherits(Auth, EventEmitter);

class GPhotos {
  constructor (config, debug, cb = () => {}) {
    this.sendSocketNotification = cb;
    this.debug = false;

    /* @todo make default config
    if (!options.hasOwnProperty("authOption")) {
      throw new Error("Invalid auth information.")
      return false
    }
    */
    this.debug = debug ? debug : this.debug;
    this.config = config;
    this.auth = {
      keyFilePath: this.config.CREDENTIALS,
      savedTokensPath: this.config.TOKEN,
      scope: "https://www.googleapis.com/auth/photoslibrary https://www.googleapis.com/auth/photoslibrary.sharing"
    };
    this.albums = {
      album: [],
      shared: []
    };
    this.scanInterval = 1000 * 60 * 55; // fixed. no longer needs to be fixed
    this.scanTimer = null;
    this.albumsScan = [];
    this.photosScan = [];
    this.localPhotoList = [];
    this.localPhotoPntr = 0;
    this.initializeTimer = null;
    this.path = this.config.CACHE;
    this.uploadAlbumId = null;
    this.log("config:", this.config);
  }

  log (...args) {
    if (this.debug) console.log("[GPHOTOS]", ...args);
  }

  onAuthReady (job = () => {}) {
    var auth = null;
    try {
      auth = new Auth(this.auth, this.debug, (error) => { this.sendSocketNotification("ERROR", error); });
    } catch (e) {
      console.error("[GPHOTOS]", e.toString());
    }
    auth.on("ready", (client) => {
      job(client);
    });
  }

  /** external functions **/
  async start () {
    //set timer, in case if fails to retry in 1 min
    clearTimeout(this.initializeTimer);
    this.initializeTimer = setTimeout(() => {
      this.start();
    }, 1 * 60 * 1000);

    this.log("Starting Initialization");
    this.log("Getting album list");
    var albums = await this.getAlbums();
    if (this.config.uploadAlbum) {
      var uploadAlbum = albums.find((a) => {
        return (a.title === this.config.uploadAlbum) ? true : false;
      });
      var needUpdateAlbumsList = false;
      if (uploadAlbum) {
        if (uploadAlbum.hasOwnProperty("shareInfo") && uploadAlbum.isWriteable) {
          this.log(`Confirmed Uploadable album: ${this.config.uploadAlbum} (${uploadAlbum.id})`);
          this.uploadAlbumId = uploadAlbum.id;
        } else {
          this.log(`This album is not uploadable: ${this.config.uploadAlbum}`);
          await this.createSharedAlbum(this.config.uploadAlbum);
          needUpdateAlbumsList = true;
        }
      } else {
        this.log(`Can't find uploadable album: ${this.config.uploadAlbum}`);
        await this.createSharedAlbum(this.config.uploadAlbum);
        needUpdateAlbumsList = true;
      }
    }

    if (needUpdateAlbumsList) albums = await this.getAlbums();

    for (var ta of this.config.albums) {
      var matched = albums.find((a) => {
        if (ta === a.title) return true;
        return false;
      });
      var exists = (albums, album) => {
        return albums.some((expected) => album.id === expected.id);
      };
      if (!matched) {
        this.log(`Can't find "${ta}" in your album list.`);
      } else if (!exists(this.albumsScan, matched)) {
        this.albumsScan.push(matched);
      }
    }
    this.log(`Finish Album scanning. Properly scanned: ${this.albumsScan.length}`);
    for (var a of this.albumsScan) {
      var url = `${a.coverPhotoBaseUrl}=w160-h160-c`;
      var fpath = path.resolve(this.path, "cache", a.id);
      let file = fs.createWriteStream(fpath);
      if (a.coverPhotoBaseUrl) https.get(url, (response) => {
        response.pipe(file);
      });
    }
    this.log("Initialized");
    this.sendSocketNotification("GPhotos_INIT", this.albumsScan);

    //load cached list - if available
    fs.readFile(`${this.path}/cache/photoListCache.json`, "utf-8", (err, data) => {
      if (err) { this.log("unable to load cache", err); }
      else {
        this.localPhotoList = JSON.parse(data.toString());
        this.log(`successfully loaded cache of ${this.localPhotoList.length} photos`);
        this.prepAndSendChunk(5); //only 5 for extra fast startup
      }
    });

    this.log("Initialization complete!");
    clearTimeout(this.initializeTimer);
    this.log("Start first scanning.");
    this.startScanning();
  }

  stop () {
    clearInterval(this.scanTimer);
  }

  startScanning () {
    // set up interval, then 1 fail won't stop future scans
    this.scanTimer = setInterval(() => {
      this.scanJob();
    }, this.scanInterval);

    // call for first time
    this.scanJob();
  }

  async prepAndSendChunk (desiredChunk = 50) {
    try {
      //find which ones to refresh
      if (this.localPhotoPntr < 0 || this.localPhotoPntr >= this.localPhotoList.length) { this.localPhotoPntr = 0; }
      var numItemsToRefresh = Math.min(desiredChunk, this.localPhotoList.length - this.localPhotoPntr, 50); //50 is api limit
      this.log(`num to ref: ${numItemsToRefresh} DesChunk: ${desiredChunk} totalLength: ${this.localPhotoList.length} Pntr: ${this.localPhotoPntr}`);


      // refresh them
      var list = [];
      if (numItemsToRefresh > 0) {
        list = await this.updateTheseMediaItems(this.localPhotoList.slice(this.localPhotoPntr, this.localPhotoPntr + numItemsToRefresh));
      }

      if (list.length > 0) {
        // update the localList
        this.localPhotoList.splice(this.localPhotoPntr, list.length, ...list);

        // send updated pics
        this.sendSocketNotification("GPhotos_PICT", list);

        // update pointer
        this.localPhotoPntr = this.localPhotoPntr + list.length;
        this.log(`refreshed: ${list.length} totalLength: ${this.localPhotoList.length} Pntr: ${this.localPhotoPntr}`);

        this.log(`just sent ${list.length} more picts`);
      } else {
        this.log(`couldn't send ${list.length} picts`);
      }
    } catch (err) {
      this.log("failed to refresh and send chunk: ", err);
    }
  }

  scanJob () {
    return new Promise((resolve) => {
      this.log("Start Album scanning");
      const step = async () => {
        try {
          if (this.albumsScan.length > 0) {
            this.photosScan = await this.getImageList();
            resolve(true);
          } else {
            this.log("There is no album to get photos.");
            resolve(false);
          }
        } catch (err) {
          console.error("[GPHOTOS]", err.toString());
        }
      };
      step();
    });
  }

  getImageList () {
    var photoCondition = (photo) => {
      if (!photo.hasOwnProperty("mediaMetadata")) return false;
      var data = photo.mediaMetadata;
      if (data.hasOwnProperty("video")) return false;
      if (!data.hasOwnProperty("photo")) return false;
      return true;
    };
    return new Promise((resolve) => {
      const step = async () => {
        var photos = [];
        try {
          for (var album of this.albumsScan) {
            this.log(`Prepping to get photo list from '${album.title}'`);
            var list = await this.getImageFromAlbum(album.id, photoCondition);
            this.log(`Got ${list.length} photo(s) from '${album.title}'`);
            photos = photos.concat(list);
          }
          if (photos.length > 0) {
            if (this.config.sort === "new" || this.config.sort === "old") {
              photos.sort((a, b) => {
                var at = moment(a.mediaMetadata.creationTime);
                var bt = moment(b.mediaMetadata.creationTime);
                if (at.isBefore(bt) && this.config.sort === "new") return 1;
                if (at.isAfter(bt) && this.config.sort === "old") return 1;
                return -1;
              });
            } else {
              for (var i = photos.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var t = photos[i];
                photos[i] = photos[j];
                photos[j] = t;
              }
            }
            this.log(`Total indexed photos: ${photos.length}`);
            this.localPhotoList = photos;
            fs.writeFile(`${this.path}/cache/photoListCache.json`, JSON.stringify(this.localPhotoList, null, 4), (err) => {
              if (err) {
                console.error("[GPHOTOS]", err);
              } else {
                this.log("Photo list cache saved");
              }
            });
          }

          return (photos);
        } catch (err) {
          console.error("[GPHOTOS]", err.toString());
        }
      };
      resolve(step());
    });
  }

  /** internal functions **/
  generateToken (success = () => {}, fail = () => {}) {
    this.onAuthReady(() => {
      const isTokenFileExist = () => {
        var fp = path.resolve(__dirname, this.auth.savedTokensPath);
        if (fs.existsSync(fp)) return true;
        return false;
      };
      if (isTokenFileExist()) success();
      fail();
    });
  }

  request (token, endPoint = "", method = "get", params = null, data = null) {
    return new Promise((resolve) => {
      try {
        let baseURL = "https://photoslibrary.googleapis.com/v1/";
        var url = baseURL + endPoint;
        var config = {
          method: method,
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        if (params) url = `${url}/?${params}`;
        if (data) config.body = JSON.stringify(data);
        fetch(url, config)
          .then((response) => response.json())
          .then((data) => resolve(data))
          .catch((error) => {
            console.error("[GPHOTOS]", error.toString());
            console.error("[GPHOTOS] ----- Report ----- ");
            console.error("[GPHOTOS] fetch config:", config);
            console.error("[GPHOTOS] Details:", error);
            console.error("[GPHOTOS] ----- End of Report ----- ");
          });
      } catch (error) {
        console.error("[GPHOTOS]", error);
      }
    });
  }

  getAlbums () {
    return new Promise((resolve) => {
      const step = async () => {
        try {
          var albums = await this.getAlbumType("albums");
          var shared = await this.getAlbumType("sharedAlbums");
          for (var s of shared) {
            var isExist = albums.find((a) => {
              if (a.id === s.id) return true;
              return false;
            });
            if (!isExist) albums.push(s);
          }
          resolve(albums);
        } catch (e) {
          console.error("[GPHOTOS]", e.toString());
        }
      };
      step();
    });
  }


  getAlbumType (type = "albums") {
    if (type !== "albums" && type !== "sharedAlbums") throw new Error("Invalid parameter for .getAlbumType()", type);
    return new Promise((resolve) => {
      this.onAuthReady((client) => {
        var token = client.credentials.access_token;
        var list = [];
        const getAlbum = async (pageSize = 50, pageToken = "") => {
          this.log("Getting Album info chunks.");
          var params = new URLSearchParams({
            pageSize: pageSize,
            pageToken: pageToken
          });
          try {
            var data = await this.request(token, type, "get", params, null);

            if (data[type] && Array.isArray(data[type])) {
              list = list.concat(data[type]);
            }
            if (data.nextPageToken) {
              const generous = async () => {
                await sleep(500);
                getAlbum(pageSize, data.nextPageToken);
              };
              generous();
            } else {
              this.albums[type] = list;
              resolve(list);
            }
          } catch (err) {
            console.error("[GPHOTOS]", err.toString());
          }
        };
        getAlbum();
      });
    });
  }

  getImageFromAlbum (albumId, isValid = null, maxNum = 99999) {
    return new Promise((resolve) => {
      this.onAuthReady((client) => {
        var token = client.credentials.access_token;
        var list = [];
        const getImage = async (pageSize = 50, pageToken = "") => {
          this.log(`Indexing photos now. total: ${list.length}`);
          try {
            var data = {
              albumId: albumId,
              pageSize: pageSize,
              pageToken: pageToken
            };
            var response = await this.request(token, "mediaItems:search", "post", null, data);
            if (response.hasOwnProperty("mediaItems") && Array.isArray(response.mediaItems)) {
              for (var item of response.mediaItems) {
                if (list.length < maxNum) {
                  item._albumId = albumId;
                  if (typeof isValid === "function") {
                    if (isValid(item)) list.push(item);
                  } else {
                    list.push(item);
                  }
                }
              }
              if (list.length >= maxNum) {
                resolve(list); // full with maxNum
              } else {
                if (response.nextPageToken) {
                  const generous = async () => {
                    await sleep(500);
                    getImage(50, response.nextPageToken);
                  };
                  generous();
                } else {
                  resolve(list); // all found but lesser than maxNum
                }
              }
            } else {
              resolve(list); // empty
            }
          } catch (err) {
            console.error("[GPHOTOS] .getImageFromAlbum()", err.toString());
          }
        };
        getImage();
      });
    });
  }

  async updateTheseMediaItems (items) {
    return new Promise((resolve) => {
      if (items.length <= 0) { resolve(items); }
      this.onAuthReady((client) => {
        var token = client.credentials.access_token;
        this.log(`received: ${items.length} to refresh`);
        var params = new URLSearchParams();
        var ii;
        for (ii in items) {
          params.append("mediaItemIds", items[ii].id);
        }
        const refr = async () => {
          var response = await this.request(token, "mediaItems:batchGet", "get", params, null);
          if (response.hasOwnProperty("mediaItemResults") && Array.isArray(response.mediaItemResults)) {
            for (var i = 0; i < response.mediaItemResults.length; i++) {
              if (response.mediaItemResults[i].hasOwnProperty("mediaItem")) {
                items[i].baseUrl = response.mediaItemResults[i].mediaItem.baseUrl;
              }
            }
            resolve(items);
          }
        };
        refr();
      });
    });
  }

  createAlbum (albumName) {
    return new Promise((resolve) => {
      this.onAuthReady((client) => {
        var token = client.credentials.access_token;
        const create = async () => {
          try {
            var created = await this.request(token, "albums", "post", null, {
              album: {
                title: albumName
              }
            });
            resolve(created);
          } catch (err) {
            this.log(".createAlbum() ", err.toString());
            this.log(err);
            throw err;
          }
        };
        create();
      });
    });
  }

  shareAlbum (albumId) {
    return new Promise((resolve) => {
      this.onAuthReady((client) => {
        var token = client.credentials.access_token;
        const create = async () => {
          try {
            var shareInfo = await this.request(
              token,
              `albums/${albumId}:share`,
              "post",
              null,
              {
                sharedAlbumOptions: {
                  isCollaborative: true,
                  isCommentable: true
                }
              }
            );
            resolve(shareInfo);
          } catch (err) {
            this.log(".shareAlbum()", err.toString());
            this.log(err);
            throw err;
          }
        };
        create();
      });
    });
  }

  upload (path) {
    // to code with native fetch
    // not possible actually or ... not find how
    return new Promise((resolve) => {
      this.onAuthReady((client) => {
        var token = client.credentials.access_token;
        const upload = async () => {
          try {
            let newFile = fs.createReadStream(path);
            var url = "uploads";
            var option = {
              method: "post",
              url: url,
              baseURL: "https://photoslibrary.googleapis.com/v1/",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-type": "application/octet-stream",
                //X-Goog-Upload-Content-Type: mime-type
                "X-Goog-Upload-Protocol": "raw"
              }
            };
            option.data = newFile;
            Axios(option).then((ret) => {
              resolve(ret.data);
            }).catch((e) => {
              this.log(".upload:resultResolving ", e.toString());
              this.log(e);
              throw e;
            });
          } catch (err) {
            this.log(".upload()", err.toString());
            this.log(err);
            throw err;
          }
        };
        upload();
      });
    });
  }

  create (uploadToken, albumId) {
    return new Promise((resolve) => {
      this.onAuthReady((client) => {
        var token = client.credentials.access_token;
        const create = async () => {
          try {
            let fileName = moment().format("[MM_]YYYYMMDD_HHmm");
            var result = await this.request(
              token,
              "mediaItems:batchCreate",
              "post",
              null,
              {
                albumId: albumId,
                newMediaItems: [
                  {
                    description: "Uploaded by EXT-GooglePhotos",
                    simpleMediaItem: {
                      uploadToken: uploadToken,
                      fileName: fileName
                    }
                  }
                ],
                albumPosition: {
                  position: "LAST_IN_ALBUM"
                }
              }
            );
            resolve(result);
          } catch (err) {
            this.log(".create() ", err.toString());
            this.log(err);
            throw err;
          }
        };
        create();
      });
    });
  }

  async createSharedAlbum (album) {
    try {
      var albums = await this.getAlbums();
      var matched = albums.find((a) => {
        if (a.title === album) return true;
        return false;
      });
      if (matched) {
        console.warn(`[GPHOTOS] Album ${album} is already existing.`);
      } else {
        console.log(`[GPHOTOS] Album ${album} will be created.`);
        var r = await this.createAlbum(album);
        await this.shareAlbum(r.id);
        console.log(`[GPHOTOS] Album ${album} is created.`);

        /** rescan again **/
        albums = await this.getAlbums();
        albums.find((a) => {
          if (a.title === album) {
            this.uploadAlbumId = a.id;
            console.log(`[GPHOTOS] Configuration Updated, uploadAlbumId= ${this.uploadAlbumId}`);
            return true;
          }
          return false;
        });
      }
    } catch (err) {
      console.error("[GPHOTOS]", err);
    }
  }

  prepareUpload (path) {
    if (!this.uploadAlbumId) {
      console.error("[GPHOTOS] No uploadable album exists.");
      this.sendSocketNotification("ERROR", "No uploadable album exists.");
      return;
    }
    const step = async () => {
      var uploadToken = await this.upload(path);
      if (uploadToken) {
        await this.create(uploadToken, this.uploadAlbumId);
        console.log(`[GPHOTOS] Upload completed. [${path}]`);
      } else {
        console.error("[GPHOTOS] Upload Fails.");
        this.sendSocketNotification("ERROR", "Upload Fails.");
      }
    };
    step();
  }
}

// import Open library and use default function only
async function loadOpen () {
  const loaded = await import("open");
  return loaded.default;
}

module.exports = GPhotos;
