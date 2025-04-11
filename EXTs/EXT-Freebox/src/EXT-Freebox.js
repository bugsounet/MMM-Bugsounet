var FB = () => { /* do nothing */ };

Module.register("EXT-Freebox", {
  defaults: {
    freebox: {},
    debug: false,
    verbose: false,
    updateDelay: 5 * 1000,
    zoom: 110,
    activeOnly: false,
    showModel: true,
    showIcon: true,
    showButton: true,
    showBandWidth: true,
    showRate: true,
    showClient: true,
    showClientRate: true,
    showEthClientRate: false,
    showClientRateDownOnly: true,
    showClientIP: false,
    showClientCnxType: true,
    showWifiStandard: true,
    showFree: true,
    showIP: true,
    showPing: true,
    pingAdress: "google.fr",
    textWidth: 250,
    excludeMac: [],
    sortBy: null,
    checkFreePlug: false,
    checkSFP: false
  },

  start () {
    this.Init = false;
    this.Freebox = {
      Hidden: true,
      BandwidthDown: null,
      BandwidthUp: null,
      DebitDown: null,
      DebitUp: null,
      IP: null,
      Degroup: false,
      Type: null,
      Clients: [],
      Cache: {},
      Ping: null
    };

    if (this.config.debug) FB = (...arg) => { console.log("[Freebox]", ...arg); };
    if (this.config.excludeMac.length > 0) {

      /** normalise les adresses MAC en majuscule **/
      this.config.excludeMac = this.config.excludeMac.map(function (x) { return x.toUpperCase(); });
    }
    if (this.config.textWidth < 200) this.config.textWidth = 200;
    if (typeof this.config.textWidth !== "number") this.config.textWidth = this.defaults.textWidth;
    console.log("[Freebox] Started...");
  },

  notificationReceived (notification, payload, sender) {
    switch (notification) {
      case "Bugsounet_READY":
        if (sender.name === "MMM-Bugsounet") this.sendSocketNotification("INIT", this.config);
        break;
    }
  },

  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case "INITIALIZED":
        if (!this.Init) {
          this.Init = true;
          this.sendNotification("Bugsounet_HELLO");
        }
        this.cache(payload);
        break;
      case "CACHE":
        this.cache(payload);
        break;
      case "RESULT":
        this.result(payload);
        break;
      case "debug":
        FB("DEBUG", payload);
        break;
    }
  },

  cache (payload) {
    this.Freebox.Cache = payload;
    FB("Cache:", this.Freebox);
    this.hideFreebox();
  },

  hideFreebox () {
    this.Freebox.Hidden = true;
    this.hide(1000, () => {}, { lockString: "FREEBOX_LOCKED" });
    this.callbackHide();
    FB("Hide module");
  },

  callbackHide () {
    this.updateDom();
    this.sendSocketNotification("SCAN");
  },

  showFreebox () {
    this.Freebox.Hidden = false;
    FB("Show module");
    this.show(1000, () => {}, { lockString: "FREEBOX_LOCKED" });
  },

  result (payload) {
    this.Freebox.Model = payload.Model;
    this.Freebox.Type = payload.Type;
    this.Freebox.Degroup = payload.Degroup;
    this.Freebox.BandwidthDown = payload.BandwidthDown;
    this.Freebox.BandwidthUp = payload.BandwidthUp;
    this.Freebox.DebitDown = payload.DebitDown;
    this.Freebox.DebitUp = payload.DebitUp;
    this.Freebox.IP = payload.IP;
    this.Freebox.Clients = payload.Clients;
    this.Freebox.Ping = payload.Ping;
    FB("Result:", this.Freebox);
    this.displayDom();
    if (this.Freebox.Hidden) this.showFreebox();
  },

  displayDom () {

    /** On applique les mises a jour en live ! **/

    /** affichage du model de la freebox **/
    var model = document.getElementById("FREE_MODEL");
    var modelIcon = model.querySelector("#FREE_ICON");

    var modelValue = model.querySelector("#FREE_VALUE");
    if (this.config.showIcon) modelIcon.classList.remove("hidden");
    if (this.config.showModel) model.classList.remove("hidden");
    modelValue.textContent = this.Freebox.Model;

    /** Bande Passante **/
    var bandWidth = document.getElementById("FREE_BAND");
    var bandWidthIcon = bandWidth.querySelector("#FREE_ICON");
    var bandWidthDown = document.getElementById("FREE_BAND_DOWN");
    var bandWidthUp = document.getElementById("FREE_BAND_UP");

    var bandWidthTypeValue = bandWidth.querySelector("#FREE_VALUE");
    var bandWidthDownValue = bandWidthDown.querySelector("#FREE_VALUE");
    var bandWidthUpValue = bandWidthUp.querySelector("#FREE_VALUE");
    if (this.config.showIcon) bandWidthIcon.classList.remove("hidden");
    if (this.config.showBandWidth) bandWidth.classList.remove("hidden");
    bandWidthTypeValue.textContent = this.Freebox.Type + (this.Freebox.Degroup ? " (Dégroupé): " : ": ");
    bandWidthDownValue.textContent = this.Freebox.BandwidthDown;
    bandWidthUpValue.textContent = this.Freebox.BandwidthUp;

    /** Adresse IP **/
    var IP = document.getElementById("FREE_IP");
    var IPIcon = IP.querySelector("#FREE_ICON");
    var IPDisplay = IP.querySelector("#FREE_VALUE");
    if (this.config.showIcon) IPIcon.classList.remove("hidden");
    if (this.config.showIP) IP.classList.remove("hidden");
    IPDisplay.textContent = this.Freebox.IP;

    /** Appareils connecté je suppose qu'il y a en plus d'un en memoire! donc pas de check... **/
    this.Freebox.Clients.forEach((client) => {
      var mac = client.mac;
      var cache = this.Freebox.Cache[mac];
      var excludeMac = this.config.excludeMac;

      var clientSelect = document.getElementsByClassName(mac)[0];

      /** Nouveau Client connecté -> rebuild du cache **/
      if (!clientSelect || (this.Freebox.Clients.length !== Object.keys(this.Freebox.Cache).length)) {
        FB(`Appareil inconnu [${mac}] - Rechargement du cache.`);
        return this.sendSocketNotification("CACHE");
      }

      /** Changement d'icone du client -> rebuild du cache **/
      if (cache.type !== client.type) {
        FB(`Type Appareil changé [${mac}] - ${cache.type} --> ${client.type}`);
        return this.sendSocketNotification("CACHE");
      }

      /** Le nom d'affichage a été changé **/
      var clientName = clientSelect.querySelector("#FREE_NAME");
      client.name = client.name ? client.name : "(Appareil sans nom)";
      if (cache.name !== client.name) {
        this.Freebox.Cache[mac].name = client.name;
        clientName.textContent = cache.name;
      }

      if (this.config.showClientIP) {

        /** Affichage IP **/
        var clientIP = clientSelect.querySelector("#FREE_CLIENTIP");
        clientIP.textContent = client.ip ? client.ip : "";
      }

      if (this.config.showWifiStandard) {

        /** Display wireless Standard */
        var clientStandard = clientSelect.querySelector("#FREE_STANDARD");
        if (client.standard === "a") clientStandard.className = `std_${client.standard}`;
        if (client.standard === "ac") clientStandard.className = `std_${client.standard}`;
        if (client.standard === "ax") clientStandard.className = `std_${client.standard}`;
        if (client.standard === "b") clientStandard.className = `std_${client.standard}`;
        if (client.standard === "be") clientStandard.className = `std_${client.standard}`;
        if (client.standard === "g") clientStandard.className = `std_${client.standard}`;
        if (client.standard === "n") clientStandard.className = `std_${client.standard}`;
      }

      /** Wifi ou Eth ? **/
      var clientAccess = clientSelect.querySelector("#FREE_ACCESS");
      if (this.config.showClientCnxType) {
        clientAccess.classList.remove("hidden");
        if (client.access_type === "ethernet") clientAccess.className = `ethernet${client.eth}`;
        else if (client.band === "2d4g") clientAccess.className = `signal2d4g_${client.signal_bar ? client.signal_bar : 0}`;
        else if (client.band === "5g") clientAccess.className = `signal5g_${client.signal_bar ? client.signal_bar : 0}`;
        else if (client.band === "6g") clientAccess.className = `signal6g_${client.signal_bar ? client.signal_bar : 0}`;
        else if (client.band === "60g") clientAccess.className = `signal60g_${client.signal_bar ? client.signal_bar : 0}`;

        /* can't really code it ... but can be handled with eth5/eth6
        else if (client.access_type === "freeplug") clientAccess.className= "freeplug"
        else if (client.access_type === "sfp") clientAccess.className= "sfp"
        */
        else if (client.access_type === "VM") clientAccess.className = "VM";
        // sometimes... WM is connected from repater !? (bug from api) -> displayed with what class `?`
        else if (!client.access_type && client.active) {
          clientAccess.className = "what";
          if (this.config.showWifiStandard) clientStandard.className = "";
        }
        else if (!client.active) clientAccess.className = "black";
        // add connexion from repeater with `R` in red
        if (client.repeater) clientAccess.classList.add("repeater");
        else clientAccess.classList.remove("repeater");
      }

      /** debit client **/
      var clientDebit = clientSelect.querySelector("#FREE_RATE");
      var clientDebitDown = clientSelect.querySelector("#FREE_RATE_DOWN");
      var clientDebitDownIcon = clientDebitDown.querySelector("#FREE_ICON");
      var clientDebitDownValue = clientDebitDown.querySelector("#FREE_VALUE");
      var clientDebitUp = clientSelect.querySelector("#FREE_RATE_UP");
      var clientDebitUpIcon = clientDebitUp.querySelector("#FREE_ICON");
      var clientDebitUpValue = clientDebitUp.querySelector("#FREE_VALUE");
      if (this.config.showClientRate) clientDebit.classList.remove("hidden");
      clientDebitDownValue.textContent = client.debitDown;
      if (!this.config.showClientRateDownOnly) {
        if (client.debitDown) {
          clientDebitDownIcon.classList.add("down");
          clientDebitUpIcon.classList.add("up");
        } else {
          clientDebitDownIcon.classList.add("black");
          clientDebitUpIcon.classList.add("black");
        }

        clientDebitDownIcon.classList.remove("hidden");
        clientDebitUp.classList.remove("hidden");
        clientDebitUpIcon.classList.remove("hidden");
        clientDebitUpValue.classList.remove("hidden");
        clientDebitUpValue.textContent = client.debitUp;
      }

      /** bouton **/
      var clientStatus = clientSelect.querySelector("INPUT");
      var clientIcon = clientSelect.querySelector("#FREE_ICON");
      var clientBouton = clientSelect.querySelector(".switch");
      if (this.config.showButton) clientBouton.classList.remove("FBhidden");
      clientStatus.checked = client.active;
      clientIcon.className = client.type + (client.active ? "1" : "0");
      if (this.config.showIcon) clientIcon.classList.remove("hidden");
      else clientIcon.classList.add("hidden");

      /** Exclude @mac **/
      if (cache.show && excludeMac.indexOf(mac) === -1) {
        if (this.config.activeOnly && client.active) clientSelect.classList.remove("hidden");
        else if (!this.config.activeOnly) clientSelect.classList.remove("hidden");
      }

      /** activeOnly **/
      if (this.config.activeOnly && !client.active) clientSelect.classList.add("hidden");
    });

    /** Affichage Débit utilisé en temps réél **/
    var debit = document.getElementById("FREE_DEBIT");
    var debitIcon = debit.querySelector("#FREE_ICON");
    var debitUp = document.getElementById("FREE_DEBIT_UP");
    var debitDown = document.getElementById("FREE_DEBIT_DOWN");
    var debitDownValue = debitDown.querySelector("#FREE_VALUE");
    var debitUpValue = debitUp.querySelector("#FREE_VALUE");

    if (this.config.showIcon) debitIcon.classList.remove("hidden");
    if (this.config.showRate) debit.classList.remove("hidden");
    debitDownValue.textContent = this.Freebox.DebitDown;
    debitUpValue.textContent = this.Freebox.DebitUp;

    /** Affichage Ping en temps réél **/
    var ping = document.getElementById("FREE_PING");
    var pingIcon = ping.querySelector("#FREE_ICON");
    var pingValue = ping.querySelector("#FREE_VALUE");

    if (this.config.showIcon) pingIcon.classList.remove("hidden");
    if (this.config.showPing) ping.classList.remove("hidden");
    pingValue.textContent = this.Freebox.Ping;

  },

  getDom () {
    var client = this.Freebox.Cache;

    var wrapper = document.createElement("div");
    wrapper.id = "FREE";
    if (!this.Init) {
      wrapper.id = "FREE_LOADING";
      wrapper.innerHTML = this.translate("LOADING");
      var free = document.createElement("div");
      free.id = "FREE_LOGO";
      wrapper.appendChild(free);
    } else {
      wrapper.innerHTML = "";
      wrapper.style.zoom = `${this.config.zoom}%`;

      /** on prepare le DOM en cachant tout **/

      /** Affichage du model de la Freebox **/
      var model = document.createElement("div");
      model.id = "FREE_MODEL";
      model.classList.add("hidden");

      var modelIcon = document.createElement("div");
      modelIcon.className = "free"; /// <-- to see
      modelIcon.classList.add("hidden");
      modelIcon.id = "FREE_ICON";
      model.appendChild(modelIcon);

      var modelDisplay = document.createElement("div");
      modelDisplay.id = "FREE_VALUE";
      model.appendChild(modelDisplay);

      wrapper.appendChild(model);

      /** Afficage de la bande passante **/
      var bandWidth = document.createElement("div");
      bandWidth.id = "FREE_BAND";
      bandWidth.classList.add("hidden");

      var bandWidthIcon = document.createElement("div");
      bandWidthIcon.className = "internet";
      bandWidthIcon.classList.add("hidden");
      bandWidthIcon.id = "FREE_ICON";
      bandWidth.appendChild(bandWidthIcon);

      var bandWidthType = document.createElement("div");
      bandWidthType.id = "FREE_BAND_TYPE";
      bandWidth.appendChild(bandWidthType);

      var bandWidthTypeValue = document.createElement("div");
      bandWidthTypeValue.id = "FREE_VALUE";
      bandWidthType.appendChild(bandWidthTypeValue);

      var bandWidthDown = document.createElement("div");
      bandWidthDown.id = "FREE_BAND_DOWN";
      bandWidth.appendChild(bandWidthDown);

      var bandWidthDownIcon = document.createElement("div");
      bandWidthDownIcon.className = "down";
      bandWidthDownIcon.id = "FREE_ICON";
      bandWidthDown.appendChild(bandWidthDownIcon);

      var bandWidthDownRate = document.createElement("div");
      bandWidthDownRate.id = "FREE_VALUE";
      bandWidthDownRate.className = "nomargin";
      bandWidthDown.appendChild(bandWidthDownRate);

      var bandWidthUp = document.createElement("div");
      bandWidthUp.id = "FREE_BAND_UP";
      bandWidth.appendChild(bandWidthUp);

      var bandWidthUpIcon = document.createElement("div");
      bandWidthUpIcon.className = "up";
      bandWidthUpIcon.id = "FREE_ICON";
      bandWidthUp.appendChild(bandWidthUpIcon);

      var bandWidthUpRate = document.createElement("div");
      bandWidthUpRate.id = "FREE_VALUE";
      bandWidthUpRate.className = "nomargin";
      bandWidthUp.appendChild(bandWidthUpRate);

      wrapper.appendChild(bandWidth);

      /** Adresse IP **/
      var IP = document.createElement("div");
      IP.id = "FREE_IP";
      IP.classList.add("hidden");
      var IPIcon = document.createElement("div");
      IPIcon.id = "FREE_ICON";
      IPIcon.className = "ip";
      IPIcon.classList.add("hidden");
      IP.appendChild(IPIcon);
      var IPText = document.createElement("div");
      IPText.id = "FREE_TEXT";
      IPText.textContent = "Adresse IP:";
      IP.appendChild(IPText);
      var IPDisplay = document.createElement("div");
      IPDisplay.id = "FREE_VALUE";

      IP.appendChild(IPDisplay);
      wrapper.appendChild(IP);

      /** appareils connecté **/
      if (Object.keys(client).length > 0) {
        for (let [item, value] of Object.entries(client)) {
          var id = item;
          var type = value.type;
          var setName = value.name;

          var clientData = document.createElement("div");
          clientData.id = "FREE_CLIENT";
          clientData.className = id;
          clientData.classList.add("hidden");

          var clientIcon = document.createElement("div");
          clientIcon.id = "FREE_ICON";
          clientIcon.className = `${type}0`;
          clientIcon.classList.add("hidden");
          clientData.appendChild(clientIcon);

          var clientName = document.createElement("div");
          clientName.id = "FREE_NAME";
          clientName.style.width = this.config.showClientIP ? `${this.config.textWidth - 80}px` : `${this.config.textWidth}px`;
          clientName.textContent = setName;
          clientData.appendChild(clientName);

          if (this.config.showClientIP) {
            var clientIP = document.createElement("div");
            clientIP.id = "FREE_CLIENTIP";
            clientData.appendChild(clientIP);
          }

          if (this.config.showWifiStandard) {
            var clientCnxStandard = document.createElement("div");
            clientCnxStandard.id = "FREE_STANDARD";
            clientCnxStandard.className = "black";
            clientData.appendChild(clientCnxStandard);
          }

          var clientCnxType = document.createElement("div");
          clientCnxType.id = "FREE_ACCESS";
          clientCnxType.className = "black";
          clientCnxType.classList.add("hidden");
          clientData.appendChild(clientCnxType);

          var clientDebit = document.createElement("div");
          clientDebit.id = "FREE_RATE";
          clientDebit.classList.add("hidden");
          clientData.appendChild(clientDebit);

          var clientDebitDown = document.createElement("div");
          clientDebitDown.id = "FREE_RATE_DOWN";
          if (this.config.showClientRateDownOnly) clientDebitDown.className = "noicon";
          clientDebit.appendChild(clientDebitDown);

          var clientDebitDownIcon = document.createElement("div");
          clientDebitDownIcon.className = "down hidden";
          clientDebitDownIcon.id = "FREE_ICON";
          clientDebitDown.appendChild(clientDebitDownIcon);

          var clientDebitDownRate = document.createElement("div");
          clientDebitDownRate.id = "FREE_VALUE";
          clientDebitDownRate.className = "nomargin";
          clientDebitDown.appendChild(clientDebitDownRate);

          var clientDebitUp = document.createElement("div");
          clientDebitUp.id = "FREE_RATE_UP";
          clientDebitUp.className = "up hidden";
          clientDebit.appendChild(clientDebitUp);

          var clientDebitUpIcon = document.createElement("div");
          clientDebitUpIcon.className = "up hidden";
          clientDebitUpIcon.id = "FREE_ICON";
          clientDebitUp.appendChild(clientDebitUpIcon);

          var clientDebitUpRate = document.createElement("div");
          clientDebitUpRate.id = "FREE_VALUE";
          clientDebitUpRate.className = "nomargin hidden";
          clientDebitUpRate.textContent = "-";
          clientDebitUp.appendChild(clientDebitUpRate);

          var clientStatus = document.createElement("div");
          clientStatus.className = "switch";
          clientStatus.classList.add("FBhidden");

          var clientButton = document.createElement("INPUT");
          clientButton.id = "switched";
          clientButton.type = "checkbox";
          clientButton.className = "switch-toggle switch-round";
          clientButton.checked = false;
          clientButton.disabled = true;

          var clientLabel = document.createElement("label");
          clientLabel.htmlFor = "swithed";

          clientStatus.appendChild(clientButton);
          clientStatus.appendChild(clientLabel);

          clientData.appendChild(clientStatus);

          wrapper.appendChild(clientData);
        }
      }

      /** debit utilisé **/
      var debit = document.createElement("div");
      debit.id = "FREE_DEBIT";
      debit.classList.add("hidden");

      var debitIcon = document.createElement("div");
      debitIcon.id = "FREE_ICON";
      debitIcon.className = "rate";
      debitIcon.classList.add("hidden");
      debit.appendChild(debitIcon);

      var debitText = document.createElement("div");
      debitText.id = "FREE_TEXT";
      debitText.textContent = "Débit total utilisé:";
      debit.appendChild(debitText);

      var debitDown = document.createElement("div");
      debitDown.id = "FREE_DEBIT_DOWN";
      debit.appendChild(debitDown);

      var debitDownIcon = document.createElement("div");
      debitDownIcon.className = "down";
      debitDownIcon.id = "FREE_ICON";
      debitDown.appendChild(debitDownIcon);

      var debitDownRate = document.createElement("div");
      debitDownRate.id = "FREE_VALUE";
      debitDownRate.className = "nomargin";
      debitDown.appendChild(debitDownRate);

      var debitUp = document.createElement("div");
      debitUp.id = "FREE_DEBIT_UP";
      debit.appendChild(debitUp);

      var debitUpIcon = document.createElement("div");
      debitUpIcon.className = "up";
      debitUpIcon.id = "FREE_ICON";
      debitUp.appendChild(debitUpIcon);

      var debitUpRate = document.createElement("div");
      debitUpRate.id = "FREE_VALUE";
      debitUpRate.className = "nomargin";
      debitUp.appendChild(debitUpRate);

      wrapper.appendChild(debit);

      /** ping **/
      var ping = document.createElement("div");
      ping.id = "FREE_PING";
      ping.classList.add("hidden");
      var pingIcon = document.createElement("div");
      pingIcon.id = "FREE_ICON";
      pingIcon.className = "ping";
      pingIcon.classList.add("hidden");
      ping.appendChild(pingIcon);
      var pingText = document.createElement("div");
      pingText.id = "FREE_TEXT";
      pingText.textContent = "Ping:";
      ping.appendChild(pingText);
      var pingDisplay = document.createElement("div");
      pingDisplay.id = "FREE_VALUE";

      ping.appendChild(pingDisplay);
      wrapper.appendChild(ping);
    }
    return wrapper;
  },

  /*****************************************/

  getScripts () {
    return ["moment.js"];
  },

  getStyles () {
    return ["EXT-Freebox.css"];
  }
});
