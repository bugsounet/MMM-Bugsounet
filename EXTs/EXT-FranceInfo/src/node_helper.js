/*
 * Module: FranceInfo
 *
 * By @bugsounet -- Dupont Cédric <bugsounet@bugsounet.fr>
 * MIT Licensed.
 */

const stream = require("stream");
const NodeHelper = require("node_helper");
const FeedMe = require("feedme");

var log = () => { /* do nothing */ };

module.exports = NodeHelper.create({

  /** Initialisation au demarrage des données **/
  start () {
    console.log("[FRINFO] MMM-FranceInfo Version:", require("./package.json").version);
    this.RSS = [];
    this.RSSConfig = [];
    this.RSSLoaded = [];
    this.flux = [
      {
        from: "Les Titres",
        url: "https://www.francetvinfo.fr/titres.rss"
      },
      {
        from: "Diaporamas",
        url: "https://www.francetvinfo.fr/images/slideshows.rss"
      },
      {
        from: "Vidéos",
        url: "https://www.francetvinfo.fr/images/videos.rss"
      },
      {
        from: "France",
        url: "https://www.francetvinfo.fr/france.rss"
      },
      {
        from: "Politique",
        url: "https://www.francetvinfo.fr/politique.rss"
      },
      {
        from: "Société",
        url: "https://www.francetvinfo.fr/societe.rss"
      },
      {
        from: "Faits divers",
        url: "https://www.francetvinfo.fr/faits-divers.rss"
      },
      {
        from: "Justice",
        url: "https://www.francetvinfo.fr/justice.rss"
      },
      {
        from: "Monde",
        url: "https://www.francetvinfo.fr/monde.rss"
      },
      {
        from: "Afrique",
        url: "https://www.francetvinfo.fr/afrique.rss"
      },
      {
        from: "Amériques",
        url: "https://www.francetvinfo.fr/ameriques.rss"
      },
      {
        from: "Europe",
        url: "https://www.francetvinfo.fr/europe.rss"
      },
      {
        from: "Proche Orient",
        url: "https://www.francetvinfo.fr/proche-orient.rss"
      },
      {
        from: "Environnement",
        url: "https://www.francetvinfo.fr/environnement.rss"
      },
      {
        from: "Tendances",
        url: "https://www.francetvinfo.fr/tendances.rss"
      },
      {
        from: "Entreprises",
        url: "https://www.francetvinfo.fr/entreprises.rss"
      },
      {
        from: "Marchés",
        url: "https://www.francetvinfo.fr/marches.rss"
      },
      {
        from: "Immobilier",
        url: "https://www.francetvinfo.fr/immobilier.rss"
      },
      {
        from: "Sports",
        url: "https://www.francetvinfo.fr/sports.rss"
      },
      {
        from: "Foot",
        url: "https://www.francetvinfo.fr/foot.rss"
      },
      {
        from: "Rugby",
        url: "https://www.francetvinfo.fr/rugby.rss"
      },
      {
        from: "F1",
        url: "https://www.francetvinfo.fr/f1.rss"
      },
      {
        from: "Découvertes",
        url: "https://www.francetvinfo.fr/decouverte.rss"
      },
      {
        from: "Sciences",
        url: "https://www.francetvinfo.fr/sciences.rss"
      },
      {
        from: "Santé",
        url: "https://www.francetvinfo.fr/sante.rss"
      },
      {
        from: "Animaux",
        url: "https://www.francetvinfo.fr/animaux.rss"
      },
      {
        from: "Bizarre",
        url: "https://www.francetvinfo.fr/bizarre.rss"
      },
      {
        from: "Buzz+",
        url: "https://www.francetvinfo.fr/culture.rss"
      },
      {
        from: "Médias",
        url: "https://www.francetvinfo.fr/medias.rss"
      },
      {
        from: "Cinéma",
        url: "https://www.francetvinfo.fr/cinema.rss"
      },
      {
        from: "Musique",
        url: "https://www.francetvinfo.fr/musique.rss"
      },
      {
        from: "Internet",
        url: "https://www.francetvinfo.fr/internet.rss"
      }
    ];
    this.updateTimer = null;
  },

  /** donnée reçu depuis le module MMM-FranceInfo.js **/
  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case "CONFIG":
        this.config = payload;
        if (this.config.debug) log = (...args) => { console.log("[FRINFO]", ...args); };
        this.config.update = this.getUpdateTime(this.config.update);
        log("Config:", this.config);
        this.checkConfig();
        log("RSSConfig:", this.RSSConfig);
        this.initialize();
        break;
    }
  },

  /** Verif de la config et cree la config finale des liens RSS a lire **/
  checkConfig () {
    this.RSSConfig = [];
    this.config.flux.forEach((flux) => {
      if (this.flux.map((e) => { return e.from; }).indexOf(flux) < 0) {
        console.log("[FRINFO] Erreur, Flux Rss inconnu:", flux);
      } else {
        this.flux.map((e) => {
          if (e.from === flux) this.RSSConfig.push(e);
        });
      }
    });
  },

  /** initialisation des données **/
  async initialize () {
    await this.getInfos();
    if (this.RSSLoaded.indexOf("Error") === -1) log(`Flux RSS chargé: ${this.config.flux.length}/${this.flux.length}`, this.RSSLoaded);
    else log("Some error detected, retry on next fetch");
    console.log("[FRINFO] MMM-FranceInfo est maintenant initialisé !");
    this.sendSocketNotification("INITIALIZED");
    this.scheduleNextFetch();
  },

  /** stock les données + post traitement : classe par dates, limite nombre d'entrée **/
  async getInfos () {
    this.RSSLoaded = await this.checkRSS();

    log("Titres trouvés:", this.RSS.length);
    var removeDupli = this.removeDuplicates(this.RSS, "title");
    log("Doublons supprimés:", this.RSS.length - removeDupli.length);
    this.RSS = removeDupli;

    this.RSS.sort(function (a, b) {
      var dateA = new Date(a.pubdate);
      var dateB = new Date(b.pubdate);
      return dateB - dateA;
    });
    log("Titres classés par date: Done ✓");

    if (this.config.maxItems > 0) {
      this.RSS = this.RSS.slice(0, this.config.maxItems);
      log("Titres affichés: ", this.RSS.length);
    }

    this.sendDATA(this.RSS);
  },

  /** récupere toute les données selon les urls **/
  checkRSS () {
    let data = [];
    this.RSSConfig.forEach((flux) => {
      data.push(this.getRssInfo(flux.from, flux.url));
    });
    return Promise.all(data);
  },

  /** interrogation de l'url et traitement des donnée **/
  getRssInfo (from, url) {
    return new Promise((resolve) => {
      const rss = new FeedMe();
      const nodeVersion = Number(process.version.match(/^v(\d+\.\d+)/)[1]);
      const headers = {
        "User-Agent": `Mozilla/5.0 (Node.js ${nodeVersion}) MMM-FranceInfo v${require("./package.json").version} (https://github.com/bugsounet/MMM-FranceInfo)`,
        "Cache-Control": "max-age=0, no-cache, no-store, must-revalidate",
        Pragma: "no-cache"
      };

      log("Fetch Rss infos:", from, `(${url})`);

      fetch(url, { headers: headers })
        .then(NodeHelper.checkFetchStatus)
        .then((response) => response.body)
        .then((data) => {
          let nodeStream;
          nodeStream = stream.Readable.fromWeb(data);
          nodeStream.pipe(rss);
        })
        .catch((error) => {
          console.log(`[FRINFO] Error! ${error}`);
          resolve("Error");
        });

      rss.on("item", (item) => {
        this.RSS.push({
          title: item.title,
          description: item.description,
          pubdate: item.pubdate,
          image: item.enclosure && item.enclosure.url ? item.enclosure.url : null,
          url: item.link,
          from: from
        });
      });
      rss.on("end", () => {
        log("Fetch done:", from);
        resolve(from);
      });
      rss.on("error", (error) => {
        log("Fetch error:", url, error);
        resolve();
      });
    });
  },

  /** envoie les Datas a MMM-FranceInfo.js **/
  sendDATA (data) {
    if (data.length) this.sendSocketNotification("DATA", data);
    else console.log("[FRINFO] Erreur: Aucune donnée...");
  },

  /** Mise a jour des données **/
  async update () {
    this.RSS = [];
    this.RSSLoaded = [];
    await this.getInfos();
    log("Mise à jours effectué");
  },

  /** Timer des mise a jours **/
  scheduleNextFetch () {
    if (this.config.update < 60 * 1000) this.config.update = 60 * 1000;

    clearInterval(this.updateTimer);
    log("Update Timer On:", this.config.update, "ms");
    this.updateTimer = setInterval(() => {
      this.update();
    }, this.config.update);
  },

  /** ***** **/
  /** Tools **/
  /** ***** **/

  /** convert h m s to ms **/
  getUpdateTime (str) {
    let ms = 0,
      time, type, value;
    let time_list = (`${str}`).split(" ").filter((v) => v !== "" && (/^(\d{1,}\.)?\d{1,}([wdhms])?$/i).test(v));

    for (let i = 0, len = time_list.length; i < len; i++) {
      time = time_list[i];
      type = time.match(/[wdhms]$/i);

      if (type) {
        value = Number(time.replace(type[0], ""));

        switch (type[0].toLowerCase()) {
          case "w":
            ms += value * 604800000;
            break;
          case "d":
            ms += value * 86400000;
            break;
          case "h":
            ms += value * 3600000;
            break;
          case "m":
            ms += value * 60000;
            break;
          case "s":
            ms += value * 1000;
            break;
        }
      } else if (!isNaN(parseFloat(time)) && isFinite(time)) {
        ms += parseFloat(time);
      }
    }
    return ms;
  },

  /** remove duplicate **/
  removeDuplicates (originalArray, prop) {
    var newArray = [];
    var lookupObject = {};

    for (var i in originalArray) {
      lookupObject[originalArray[i][prop]] = originalArray[i];
    }

    for (i in lookupObject) {
      newArray.push(lookupObject[i]);
    }
    return newArray;
  }

});
