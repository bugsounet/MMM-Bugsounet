/*
 * Node_Helper: MMM-PrixCarburants
 *
 * By bugsounet ©2024
 * MIT Licensed.
 */

const { createWriteStream, readFileSync } = require("node:fs");
const { Readable } = require("node:stream");
var NodeHelper = require("node_helper");
const unzipper = require("unzipper");
const { convertXML } = require("simple-xml-to-json");

var log = () => { /* do nothing ! */ };

module.exports = NodeHelper.create({
  start () {
    this.carburants = [];
    this.stationsDB = {};
    this.departement = [];
    this.dataPath = `${__dirname}/data`;
    this.fileXML = "PrixCarburants_instantane.xml";
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "INIT":
        console.log(`[CARBURANTS] MMM-PrixCarburants Version: ${require("./package.json").version} rev: ${require("./package.json").rev}`);
        this.initialize(payload);
        break;
    }
  },

  initialize (config) {
    this.config = config;
    if (this.config.debug) log = (...args) => { console.log("[CARBURANTS]", ...args); };
    if (!this.config.CodePostaux.length) return console.error("[CARBURANTS] Manque CodePostaux !");
    else {
      // remove duplicate value in CodePostaux
      this.config.CodePostaux = [...new Set(this.config.CodePostaux)];
      console.log(`[CARBURANTS] Recherche avec Code Postaux: ${this.config.CodePostaux.toString()}`);
    }
    this.createStationsDB();
    log("Création de la base de données Stations...");
    this.DownloadXML();
    this.sendSocketNotification("INITIALIZED");
    setInterval(() => {
      log("Mise à jour de la base de données...");
      this.carburants = [];
      this.DownloadXML();
    }, 1000 * 60 * 60);
  },

  createStationsDB () {
    var tempDB = {
      stations: []
    };
    this.config.CodePostaux.forEach((code) => {
      if (code.startsWith("0")) {
        let departement = code.substring(2, 1);
        if (this.departement.indexOf(departement) > -1) return;
        log(`Chargement des stations du département 0${departement}`);
        let temp = require(`./data/listestations/stations${departement}.json`).stations;
        tempDB.stations = tempDB.stations.concat(temp);
        this.departement.push(departement);
      }
      else if (code.substring(0, 2) === "20") {
        let departement = 20;
        if (this.departement.indexOf(departement) > -1) return;
        log("Chargement des stations de la Corsica!");
        let temp1 = require("./data/listestations/stations2A.json").stations;
        let temp2 = require("./data/listestations/stations2B.json").stations;
        let temp = temp1.concat(temp2);
        tempDB.stations = tempDB.stations.concat(temp);
        this.departement.push(departement);
      }
      else {
        let departement = code.substring(0, 2);
        if (this.departement.indexOf(departement) > -1) return;
        log(`Chargement des stations du département ${departement}`);
        let temp = require(`./data/listestations/stations${departement}.json`).stations;
        tempDB.stations = tempDB.stations.concat(temp);
        this.departement.push(departement);
      }
    });
    if (this.config.ignores.length) {
      let tempIgnore = tempDB;
      tempIgnore.stations.forEach((station, id) => {
        this.config.ignores.forEach((ignore) => {
          if ((station.cp === ignore.cp) && (station.commune === ignore.ville) && (station.marque === ignore.station)) {
            log(`[Ignore] ${station.cp} ${station.commune}: ${station.marque}`);
            delete tempDB.stations[id];
          }
        });
      });
    }
    this.stationDB = tempDB;
  },

  DownloadXML () {
    this.downloadAndUnzip("https://donnees.roulez-eco.fr/opendata/instantane")
      .then((data) => {
        this.createDB(data);
        //sort by ville then by marque
        this.carburants.sort((a, b) => (a.ville.localeCompare(b.ville) || a.marque.localeCompare(b.marque)));
        log("DataBase created:", this.carburants);
        if (this.carburants.length) this.sendSocketNotification("DATA", this.carburants);
      })
      .catch(function (err) {
        console.error("[CARBURANTS]", err);
      });
  },

  downloadAndUnzip (url) {
    var download = (url) => {
      return new Promise((resolve, reject) => {
        fetch(url)
          .then((response) => {
            if (response.ok && response.body) {
              log("Téléchargement de la base de données des prix...");
              let writer = createWriteStream(`${this.dataPath}/download.zip`);
              const readable = Readable.fromWeb(response.body);
              readable.pipe(writer);
              readable.on("error", (error) => {
                console.error("[CARBURANTS] Download Error:", error);
                reject("Download Error");
              });
              readable.on("data", (chunk) => {
                log(`Received ${chunk.length} bytes of data.`);
              });
              readable.on("end", () => {
                log("Téléchargement Terminé.");
                resolve(`${this.dataPath}/download.zip`);
              });
            } else {
              console.error("[CARBURANTS] Error", response.status, response.statusText);
              reject(`Download Error: ${response.status} ${response.statusText}`);
            }
          })
          .catch((error) => {
            console.error("[CARBURANTS] Download Error:", error);
            reject(`Download Error: ${error.message}`);
          });
      });
    };

    var unzip = (file) => {
      return new Promise((resolve, reject) => {
        log(`Décompression ${file}...`);
        unzipper.Open.file(`${file}`)
          .then((directory) => {
            var XMLFile = directory.files.filter((file) => { return file.path === this.fileXML; })[0];
            if (XMLFile) {
              XMLFile
                .stream()
                .pipe(createWriteStream(`${this.dataPath}/database/${this.fileXML}`))
                .on("error", (err) => {
                  console.error("[CARBURANTS]", err);
                  reject("ERROR");
                })
                .on("finish", () => {
                  log("Décompression Terminée.");
                  resolve();
                });
            } else {
              console.error(`[CARBURANTS] UnZip -- file not found: ${this.fileXML}`);
              reject(`file not found: ${this.fileXML}`);
            }
          })
          .catch((err) => {
            console.error("[CARBURANTS] UnZip Error:", err);
            reject("UnZip ERROR");
          });
      });
    };

    return download(url)
      .then(unzip);
  },

  createDB () {
    log("Création de la base de données Affichage...");
    const xmlToConvert = readFileSync(`${this.dataPath}/database/${this.fileXML}`, {
      encoding: "UTF8"
    });

    const obj = convertXML(xmlToConvert);

    obj.pdv_liste.children.forEach((station) => {
      this.config.CodePostaux.forEach((code) => {
        if (station.pdv.cp === code) {
          var ids = {
            id: station.pdv.id,
            nom: null,
            ville: null,
            marque: null,
            logo: "AUCUNE.png",
            prix: []
          };
          log(`id: ${station.pdv.id}`);
          this.stationDB.stations.forEach((info) => {
            if (station.pdv.id === info.id) {
              log("Ville:", info.commune);
              ids.ville = info.commune;
              log("Marque:", info.marque);
              ids.marque = info.marque;
              log("Nom:", info.nom);
              ids.nom = info.nom;
              ids.logo = `${info.marque.replace(" ", "").toUpperCase()}.png`;
            }
          });
          station.pdv.children.forEach((info) => {
            if (info.prix) {
              log("Prix:", info.prix);
              ids.prix.push(info.prix);
            }
          });
          if (ids.ville) this.carburants.push(ids);
          log("---");
        }
      });
    });
  }
});
