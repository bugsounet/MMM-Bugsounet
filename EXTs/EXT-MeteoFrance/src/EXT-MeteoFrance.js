/*
 * Module: EXT-MeteoFrance
 * from MMM-DarkSkyForecast (Jeff Clarke)
 * from MMM-Weather (bugsounet)
 * recoded for MeteoFrance
 *
 * @bugsounet
 * MIT Licensed.
 */

Module.register("EXT-MeteoFrance", {
  defaults: {
    debug: false,
    updateInterval: 10 * 60 * 1000,
    rotateInterval: 30 * 1000,
    place: "Paris",
    display: {
      HeaderPlaceName: false,
      CurrentConditions: true,
      Background: true,
      ExtraCurrentConditions: true,
      Summary: true,
      HourlyForecast: true,
      DailyForecast: true,
      Precipitation: true,
      Wind: true,
      Feels: true,
      SunCondition: true,
      Humidity: true,
      UV: true,
      MMBackground: true
    },
    personalize: {
      hourlyForecastInterval: 3,
      maxHourliesToShow: 3,
      maxDailiesToShow: 3
    }
  },

  start () {
    console.log("[MeteoFrance] Starting...");
    if (this.config.debug) this.log = (...args) => { console.log("[MeteoFrance]", ...args); };
    else this.log = () => { /* do nothing */ };
    this.error = null;
    this.weatherData = null;
    this.formattedWeatherData = null;
    this.last_update = [];
    this.weathers = [];
    this.first = true;
    this.place = 0;
    this.config = configMerge({}, this.defaults, this.config);

    /* define rotateInterval limit */
    if (this.config.rotateInterval < 15000) {
      console.warn("[MeteoFrance] rotateInterval to low... correct to 15000 (15 secs)");
      this.config.updateInterval = 15000;
    }
    if (this.config.updateInterval > 900000) {
      console.warn("[MeteoFrance] updateInterval to high... correct to 900000 (15 mins)");
      this.config.updateInterval = 900000;
    }
    this.weathersPlaces = [];
    this.MMBackgroundTimeout = null;
    this.lastBackground = null;
  },

  getScripts () {
    return ["moment.js"];
  },

  getStyles () {
    return [
      "EXT-MeteoFrance.css",
      this.file("node_modules/weathericons/css/weather-icons.min.css")
    ];
  },

  getTemplate () {
    return "EXT-MeteoFrance.njk";
  },

  getTemplateData () {
    return {
      phrases: {
        loading: this.translate("LOADING"),
        error: this.error
      },
      loading: this.formattedWeatherData === null ? true : false,
      error: this.error ? true : false,
      config: this.config,
      forecast: this.formattedWeatherData,
      update: this.weatherData && this.weatherData.update ? this.weatherData.update : this.translate("LOADING")
    };
  },

  notificationReceived (notification, payload, sender) {
    switch (notification) {
      case "DOM_OBJECTS_CREATED":
        if (this.config.display.MMBackground) this.MMBackground();
        break;
      case "Bugsounet_READY":
        if (sender.name === "MMM-Bugsounet") this.sendSocketNotification("SET_CONFIG", this.config);
        break;
    }
  },

  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case "INITIALIZED":
        this.sendNotification("Bugsounet_HELLO", this.name);
        break;
      case "DATA_UPDATE":
        if (this.error && payload.length !== this.weathersPlaces.length) return;
        this.error = null;
        this.weathers = payload;
        this.log("Reveiced data:", this.weathers);
        if (this.first) {
          this.displayWeather(0);
          this.first = false;
          if (this.weathers.length > 1) this.displayWeatherRotate();
        }
        else if (this.weathers.length === 1) this.displayWeather(0);
        break;
      case "ERROR":
        if (typeof payload === "object") {
          if (payload.code === "EAI_AGAIN") this.error = "Connection lost...";
          else this.error = payload.code;
        }
        else this.error = payload;
        console.error("[MeteoFrance] **ERROR**", this.error);
        this.updateDom(1000);
        break;
      case "WEATHER_PLACES":
        this.weathersPlaces = payload;
        break;
    }
  },

  displayWeather (place, force) {
    if (this.last_update[place] === this.weathers[place].last_update && !force) return;
    this.place = place;
    this.last_update[place] = this.weathers[place].last_update;
    this.weatherData = this.weathers[place];
    this.error = null;
    this.log("Used data:", this.weatherData);
    this.log("last_update data:", this.last_update[place]);
    this.formattedWeatherData = this.processWeatherData();
    this.updateDom(1000);
    if (this.config.display.MMBackground && !this.hidden) {
      setTimeout(() => {
        if (this.lastBackground !== this.formattedWeatherData.currently.MMBackground) {
          clearTimeout(this.MMBackgroundTimeout);
          const MMBackground = document.getElementById("Background_EXT-MeteoFrance");
          MMBackground.className = this.formattedWeatherData.currently.MMBackground;
          this.lastBackground = this.formattedWeatherData.currently.MMBackground;
          MMBackground.classList.add("fadein");
          this.MMBackgroundTimeout = setTimeout(() => MMBackground.classList.remove("fadein"), 2000);
        }
        //console.log("background:", this.formattedWeatherData.currently.background)
      }, 500);
    }
  },

  displayWeatherRotate () {
    this.rotote = setInterval(() => {
      this.place++;
      if (this.place > this.weathers.length - 1) this.place = 0;
      this.displayWeather(this.place, true);
    }, this.config.rotateInterval);
  },

  /*
    This prepares the data to be used by the Nunjucks template.  The template does not do any logic other
    if statements to determine if a certain section should be displayed, and a simple loop to go through
    the houly / daily forecast items.
  */
  processWeatherData () {
    var summary = `${this.weatherData.nowcast.weather_description}.`;
    var hourlies = [];
    var place = null;
    if (this.config.display.HeaderPlaceName || this.weathers.length > 1) {
      place = this.weatherData.properties.name;
    }

    if (this.config.display.HourlyForecast) {
      var displayCounter = 0;
      var currentIndex = this.config.personalize.hourlyForecastInterval;
      while (displayCounter < this.config.personalize.maxHourliesToShow) {
        if (this.weatherData.forecast[currentIndex] === null) {
          break;
        }
        hourlies.push(this.forecastItemFactory(this.weatherData.forecast[currentIndex], "hourly"));
        currentIndex += this.config.personalize.hourlyForecastInterval;
        displayCounter++;
      }
    }

    var dailies = [];

    if (this.config.display.DailyForecast) {
      // Merge all forecasts from the same day in a single map.
      const dailyMap = new Map();
      const today = moment().hours(12);

      for (let forecast of this.weatherData.forecast) {
        const date = moment(forecast.time).format("YYYY-MM-DD");
        if (!dailyMap.has(date)) dailyMap.set(date, [forecast]);
        else dailyMap.get(date).push(forecast);
      }

      for (let i = 0; i < this.config.personalize.maxDailiesToShow; i++) {
        const date = today.clone().add(i + 1, "day").format("YYYY-MM-DD");
        const values = dailyMap.get(date);

        if (Array.isArray(values)) {
          // Extract all non-null temperatures for the current day.
          const temps = values.map((item) => item.temperature).filter((temp) => temp !== null);
          // Select the displayed forecast somewhere in the middle of the data.
          const selected = values[Math.ceil(values.length / 2)];

          selected.temp = { min: Math.min(...temps), max: Math.max(...temps) };
          dailies.push(this.forecastItemFactory(selected, "daily"));
        }
      }
    }

    const result = {
      place: place,
      currently: {
        temperature: `${this.weatherData.nowcast.temperature}°`,
        iconPath: this.weatherData.nowcast.weather_icon,
        background: this.config.display.Background ? this.weatherData.nowcast.weather_background : "none",
        MMBackground: this.weatherData.nowcast.weather_background,
        tempRange: this.formatHiLowTemperature(this.weatherData.daily_forecast.T_max, this.weatherData.daily_forecast.T_min),
        precipitation: this.formatPrecipitation(this.weatherData.daily_forecast.total_precipitation_24h),
        wind: this.formatWind(this.weatherData.nowcast.wind_speed, this.weatherData.nowcast.wind_speed_gust, this.weatherData.nowcast.wind_icon),
        feels: `Ressenti ${Math.round(this.weatherData.nowcast.felt_temperature)}°`,
        sunRise: moment(this.weatherData.daily_forecast.sunrise_time).locale("fr").format("HH:mm"),
        sunSet: moment(this.weatherData.daily_forecast.sunset_time).locale("fr").format("HH:mm"),
        humidity: `${this.weatherData.nowcast.relative_humidity}%`,
        uv: Math.round(this.weatherData.daily_forecast.uv_index)
      },
      summary: summary,
      hourly: hourlies,
      daily: dailies
    };

    this.log("processWeatherData data:", result);
    return result;
  },

  /*
    Hourly and Daily forecast items are very similar.  So one routine builds the data
    objects for both.
   */
  forecastItemFactory (fData, type) {
    var fItem = new Object();

    // --------- Date / Time Display ---------
    if (type === "daily") {
      //day name (e.g.: "lun.")
      fItem.day = moment(fData.time).locale("fr").format("ddd");
    } else { //hourly
      //time (e.g.: "12h")
      //fItem.time = moment(fData.time).format("k[h]");
      //time (e.g: "2")
      fItem.time = moment(fData.time).locale("fr").format("h");
    }

    // --------- Icon ---------
    fItem.iconPath = fData.weather_icon;

    // --------- Temperature ---------

    if (type === "hourly") { //just display projected temperature for that hour
      fItem.temperature = `${Math.round(fData.temperature)}°`;
    } else { //display High / Low temperatures
      fItem.tempRange = this.formatHiLowTemperature(fData.temp.max, fData.temp.min);
    }

    // --------- Wind ---------
    fItem.wind = this.formatWind(fData.wind_speed, 0, fData.wind_icon);

    return fItem;
  },

  /*
    Returns a formatted data object for High / Low temperature range
   */
  formatHiLowTemperature (h, l) {
    return {
      high: `${Math.round(h)}°`,
      low: `${Math.round(l)}°`
    };
  },

  /*
    Returns a formatted data object for precipitation
   */
  formatPrecipitation (precipitation) {
    return {
      accumulation: precipitation ? `${precipitation} mm` : "0 mm"
    };

  },

  /*
    Returns a formatted data object for wind conditions
   */
  formatWind (speed, gust, icon) {
    var Beaufort = this.kmh2Beaufort(speed);

    return {
      windSpeed: `${Math.round(speed)} km/h`,
      windSpeedGust: gust ? `${Math.round(speed + gust)} km/h` : 0,
      windIcon: icon,
      Beaufort: Beaufort
    };
  },

  kmh2Beaufort (speed) {
    var kmh = Math.round(speed);
    var beaufort = 0;
    if (kmh >= 1 && kmh <= 5) beaufort = 1;
    else if (kmh >= 6 && kmh <= 11) beaufort = 2;
    else if (kmh >= 12 && kmh <= 19) beaufort = 3;
    else if (kmh >= 20 && kmh <= 28) beaufort = 4;
    else if (kmh >= 29 && kmh <= 38) beaufort = 5;
    else if (kmh >= 39 && kmh <= 49) beaufort = 6;
    else if (kmh >= 50 && kmh <= 61) beaufort = 7;
    else if (kmh >= 62 && kmh <= 74) beaufort = 8;
    else if (kmh >= 75 && kmh <= 88) beaufort = 9;
    else if (kmh >= 89 && kmh <= 102) beaufort = 10;
    else if (kmh >= 103 && kmh <= 117) beaufort = 11;
    else if (kmh >= 118) beaufort = 12;
    return beaufort;
  },

  MMBackground () {
    var nodes = document.getElementsByClassName("region fullscreen below");
    var pos = nodes[0];
    var children = pos.children[0];
    var module = document.createElement("div");
    module.id = "Background_EXT-MeteoFrance";
    module.className = "default";
    module.classList.add("fadein");
    pos.insertBefore(module, children);
    this.MMBackgroundTimeout = setTimeout(() => module.classList.remove("fadein"), 1000);
  },

  suspend () {
    if (this.config.display.MMBackground) {
      clearTimeout(this.MMBackgroundTimeout);
      const MMBackground = document.getElementById("Background_EXT-MeteoFrance");
      if (MMBackground) MMBackground.className = "hidden";
    }
    Log.log("EXT-MeteoFrance is suspended.");
  },

  resume () {
    if (this.config.display.MMBackground) {
      clearTimeout(this.MMBackgroundTimeout);
      const MMBackground = document.getElementById("Background_EXT-MeteoFrance");
      MMBackground.className = this.formattedWeatherData.currently.MMBackground;
    }
    Log.log("EXT-MeteoFrance is resumed.");
  }
});
