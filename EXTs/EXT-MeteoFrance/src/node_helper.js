/*
 * Module: EXT-MeteoFrance
 * from MMM-DarkSkyForecast (Jeff Clarke)
 * from MMM-Weather (bugsounet)
 * recoded for MeteoFrance
 *
 * @bugsounet
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");

var log = () => { /* do nothing */ };
const { getWeather } = require("meteofrance_api");

module.exports = NodeHelper.create({

  start () {
    this.interval = null;
    this.weathers = [];
    this.weathersResult = [];
  },

  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case "SET_CONFIG":
        this.initialize(payload);
        break;
    }
  },

  initialize (config) {
    console.log("[MeteoFrance] EXT-MeteoFrance Version:", require("./package.json").version, "rev:", require("./package.json").rev);
    this.config = config;
    if (this.config.debug) log = (...args) => { console.log("[MeteoFrance]", ...args); };
    if (typeof this.config.place === "object" && this.config.place.length) {
      this.weathers = this.config.place;
    }
    else if (typeof this.config.place === "string") {
      this.weathers.push(this.config.place);
    }
    else return this.sendError("'place:' nom de ville manquante!");

    this.sendSocketNotification("WEATHER_PLACES", this.weathers);

    /* define updateInterval limit */
    if (this.config.updateInterval < 300000) {
      console.warn("[MeteoFrance] updateInterval to low... correct to 300000 (5 mins)");
      this.config.updateInterval = 300000;
    }
    if (this.config.updateInterval > 3600000) {
      console.warn("[MeteoFrance] updateInterval to high... correct to 3600000 (1 hour)");
      this.config.updateInterval = 3600000;
    }

    /* fetch loop */
    this.fetchData();
    this.scheduleUpdate(this.config.updateInterval);
    this.sendSocketNotification("INITIALIZED");
  },

  async fetchData () {
    this.weathersResult = [];
    log("Weather Fetch all data...");
    await Promise.all(this.weathers.map(
      async (place) => {
        log("Weather Fetch data for:", place);
        let fetcher = await this.fetchWeather(place);
        if (fetcher) {
          this.weathersResult.push(fetcher);
          log("Done:", place);
        }
        else log("No Data:", place);
      }
    ));
    if (this.weathersResult.length) this.sendSocketNotification("DATA_UPDATE", this.weathersResult);
  },

  async fetchWeather (place) {
    return new Promise((resolv) => {
      getWeather(place)
        .then((weather) => {
          if (!weather) {
            console.error("[MeteoFrance] **ERROR No Data**");
            resolv(null);
            return;
          }
          if (weather.properties.country !== "FR - France") {
            this.sendError(`${place}: Ce module est uniquement disponible pour les villes Française!`);
            resolv(null);
            return;
          }
          let date = weather.last_update;
          let update = new Intl.DateTimeFormat("fr",
            {
              dateStyle: "long",
              timeStyle: "short"
            }).format(date);
          weather.update = update;
          if (weather.nowcast?.weather_icon) {
            weather.nowcast.weather_background = this.searchBackground(weather.nowcast.weather_icon);
          }
          log(`Fetched last update for ${place}:`, weather.update);
          resolv(weather);
        })
        .catch((error) => {
          this.sendError(error);
          resolv(null);
        });
    });
  },

  searchBackground (icon) {
    const name = icon.split("https://meteofrance.com/modules/custom/mf_tools_common_theme_public/svg/weather/")[1].split(".")[0];
    var background = null;
    switch (name) {
      case "p1j":
      case "p1bisj":
        background = "soleil";
        break;
      case "p2j":
      case "p2bisj":
      case "p3j":
      case "p3bisj":
      case "p4j":
      case "p4bisj":
      case "p5j":
      case "p5bisj":
        background = "soleil_nuage";
        break;
      case "p6j":
      case "p6bisj":
      case "p7j":
      case "p7bisj":
      case "p8j":
      case "p8bisj":
      case "p6n":
      case "p6bisn":
      case "p7n":
      case "p7bisn":
      case "p8n":
      case "p8bisn":
        background = "brouilard";
        break;
      case "p9j":
      case "p9bisj":
      case "p10j":
      case "p10bisj":
      case "p11j":
      case "p11bisj":
      case "p12j":
      case "p12bisj":
      case "p13j":
      case "p13bisj":
      case "p14j":
      case "p14bisj":
      case "p15j":
      case "p15bisj":
      case "p9n":
      case "p9bisn":
      case "p10n":
      case "p10bisn":
      case "p11n":
      case "p11bisn":
      case "p12n":
      case "p12bisn":
      case "p13n":
      case "p13bisn":
      case "p14n":
      case "p14bisn":
      case "p15n":
      case "p15bisn":
        background = "pluie";
        break;
      case "p16j":
      case "p16bisj":
      case "p16n":
      case "p16bisn":
        background = "orage";
        break;
      case "p17j":
      case "p17bisj":
      case "p18j":
      case "p18bisj":
      case "p19j":
      case "p19bisj":
      case "p20j":
      case "p20bisj":
      case "p21j":
      case "p21bisj":
      case "p22j":
      case "p22bisj":
      case "p23j":
      case "p23bisj":
      case "p17n":
      case "p17bisn":
      case "p18n":
      case "p18bisn":
      case "p19n":
      case "p19bisn":
      case "p20n":
      case "p20bisn":
      case "p21n":
      case "p21bisn":
      case "p22n":
      case "p22bisn":
      case "p23n":
      case "p23bisn":
        background = "neige";
        break;
      case "p24j":
      case "p24bisj":
      case "p25j":
      case "p25bisj":
      case "p26j":
      case "p26bisj":
      case "p27j":
      case "p27bisj":
      case "p28j":
      case "p28bisj":
      case "p29j":
      case "p29bisj":
      case "p30j":
      case "p30bisj":
      case "p24n":
      case "p24bisn":
      case "p25n":
      case "p25bisn":
      case "p26n":
      case "p26bisn":
      case "p27n":
      case "p27bisn":
      case "p28n":
      case "p28bisn":
      case "p29n":
      case "p29bisn":
      case "p30n":
      case "p30bisn":
        background = "orage";
        break;
      case "p31j":
      case "p31bisj":
      case "p31n":
      case "p31bisn":
        background = "soleil_nuage";
        // sable
        break;
      case "p32j":
      case "p32bisj":
      case "p33j":
      case "p33bisj":
      case "p34j":
      case "p34bisj":
      case "p32n":
      case "p32bisn":
      case "p33n":
      case "p33bisn":
      case "p34n":
      case "p34bisn":
        background = "orage";
        break;

      case "p1n":
      case "p1bisn":
        background = "lune";
        break;
      case "p2n":
      case "p2bisn":
      case "p3n":
      case "p3bisn":
      case "p4n":
      case "p4bisn":
      case "p5n":
      case "p5bisn":
        background = "lune_nuage";
        break;

      default:
        console.error(`[MeteoFrance] Unkown icon: ${name}, Thanks to inform developer!`);
        background = "unknow";
        break;
    }
    return background;
  },

  /** update process **/
  scheduleUpdate (delay) {
    clearInterval(this.interval);
    this.interval = setInterval(() => {
      this.fetchData();
    }, delay);
  },

  sendError (error, message) {
    console.error(`[MeteoFrance] **ERREUR** ${error}`, message ? message : "");
    this.sendSocketNotification("ERROR", error.message || error);
  }
});
