var NodeHelper = require("node_helper");
var ping = require("ping");
const { Freebox } = require("./components/freebox");

var FB = () => { /* do nothing */ };

module.exports = NodeHelper.create({
  start () {
    console.log("[Freebox] Starting...");
    this.freebox = null;
    this.pingValue = null;
    this.interval = null;
    this.cache = {};
    this.update = null;
    this.FreeboxVersion = null;
    this.init = false;
  },

  async Freebox (config) {
    this.Freebox_OS(config, this.config.showClientRate || this.config.showClientCnxType).then(
      (res) => {
        if (Object.keys(this.cache).length === 0) this.makeCache(res);
        else {
          this.makeResult(res);
          this.updateInterval();
        }
      },
      (err) => {
        console.error(`[Freebox] ${err}`);
        this.updateInterval();
      }
    );
  },

  scan () {
    if (this.config.showPing) this.Ping();
    this.Freebox(this.config.freebox);
  },

  /** scan main loop **/
  updateInterval () {
    clearInterval(this.update);
    this.counterUpdate = this.config.updateDelay;

    this.update = setInterval(() => {
      this.counterUpdate -= 1000;
      if (this.counterUpdate <= 0) {
        clearInterval(this.update);
        this.scan();
      }
    }, 1000);
  },

  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case "INIT":
        this.config = payload;
        if (this.config.debug) FB = (...args) => { console.log("[Freebox]", ...args); };
        console.log("[Freebox] Version:", require("./package.json").version, "rev:", require("./package.json").rev);
        this.scan();
        console.log("[Freebox] Started!");
        break;
      case "SCAN":
        this.updateInterval();
        break;
      case "CACHE":
        this.cache = {};
        this.scan();
        this.updateInterval();
        break;
    }
  },

  sendInfo (noti, payload) {
    if (this.config.verbose) FB(`Send notification: ${noti}`, payload);
    this.sendSocketNotification(noti, payload);
  },

  makeCache (res) {
    this.cache = {};
    if (this.config.debug) this.sendSocketNotification("debug", res);

    res.Client.forEach((client) => {
      this.cache[client.l2ident.id] = {
        name: client.primary_name ? client.primary_name : "(Appareil sans nom)",
        type: client.host_type,
        show: (!this.config.showFree && client.vendor_name.toLowerCase() === "freebox sas") ? false : this.config.showClient
      };
    });

    this.cache = this.sortBy(this.cache, this.config.sortBy);

    this.sendInfo("INITIALIZED", this.cache);
    this.makeResult(res);
  },

  sortBy (data, sort) {
    var result = {};

    /** sort by type or by name **/
    if (sort === "type" || sort === "name") {
      FB("Sort cache by", sort);
      var arr = [];
      for (var mac in data) {
        if (data.hasOwnProperty(mac)) {
          var obj = {};
          obj[mac] = data[mac];
          obj.Sort = data[mac][sort].toLowerCase();
          arr.push(obj);
        }
      }

      arr.sort((a, b) => {
        var at = a.Sort;
        var bt = b.Sort;
        return at > bt ? 1 : (at < bt ? -1 : 0);
      });

      arr.forEach((dataFreebox) => {
        delete dataFreebox.Sort;
        for (var macClient in dataFreebox) {
          result[macClient] = dataFreebox[macClient];
        }
      });
    } else if (sort === "mac") {

      /** sort by MAC **/
      FB("Sort cache by", sort);
      var macAddr = Object.keys(data);
      macAddr.sort();
      macAddr.forEach((macSort) => {
        result[macSort] = data[macSort];
      });
    } else {

      /** other return the same **/
      FB("Cache not sorted");
      result = data;
    }
    return result;
  },

  makeResult (res) {
    res.Clients = [];
    var device = {};

    res.Client.forEach((client) => {

      /** Array of client with used value in object **/
      device = {
        mac: client.l2ident.id,
        name: client.primary_name ? client.primary_name : "(Appareil sans nom)",
        ip: null,
        type: client.host_type,
        vendor: client.vendor_name,
        debitDown: null,
        debitUp: null,
        active: client.active,
        repeater: false,
        access_type: null,
        signal: null,
        signal_percent: null,
        signal_bar: null,
        standard: null,
        eth: null
      };

      let ip = client?.l3connectivities?.find((cnx) => cnx.af === "ipv4" && cnx.active);
      device.ip = ip ? ip.addr : null;
      if (client.access_point?.connectivity_type === "wifi") {
        if (client.access_point?.wifi_information.band === "2d4g") device.band = "2d4g";
        if (client.access_point?.wifi_information.band === "5g") device.band = "5g";
        if (client.access_point?.wifi_information.band === "6g") device.band = "6g";
        if (client.access_point?.wifi_information.band === "60g") device.band = "60g";
        if (client.access_point?.wifi_information.signal) {
          device.signal = client.access_point.wifi_information.signal;
          device.signal_percent = this.wifiPercent(device.signal);
          device.signal_bar = this.wifiBar(device.signal_percent);
        }
        if (client.access_point?.tx_rate) device.debitDown = this.convert(client.access_point.tx_rate * 8, 0, 1); // Warn debit en bytes! (base 8)
        else device.debitDown = "0 Ko/s";
        if (client.access_point?.rx_rate) device.debitUp = this.convert(client.access_point.rx_rate * 8, 0, 1); // Warn debit en bytes! (base 8)
        else device.debitUp = "0 Ko/s";
        if (client.access_point?.wifi_information?.standard) device.standard = client.access_point.wifi_information.standard;
      }

      if (this.config.showClientRate || this.config.showClientCnxType) {
        res.EthCnx.forEach((info) => {
          if (info.mac_list) {
            if (!info.mac_list.length) return; // return an object ???
            var macList = info.mac_list.map((mac_list) => { return mac_list.mac; });
            macList.forEach((mac) => {
              if (client.l2ident.id === mac) {
                if (client.access_point?.connectivity_type === "wifi" && client.access_point?.type === "repeater") device.repeater = true;
                else if (res[info.id] && res[info.id].tx_bytes_rate) {
                  if (this.config.showEthClientRate) {
                    device.debitDown = this.convert(res[info.id].tx_bytes_rate, 0, 1);
                    device.debitUp = this.convert(res[info.id].rx_bytes_rate, 0, 1);
                  }
                  device.access_type = "ethernet";
                  device.eth = info.id;
                }
                else {

                  /* try again next time */
                }
              }
            });
          }
        });
      }

      // consider virtual machine is connected without vendor_name and with only 1 names length !
      if (client.active && client.names?.length === 1 && client.vendor_name === "") device.access_type = "VM";
      res.Clients.push(device);
    });

    /** delete all Freebox result **/
    delete res.Client;
    delete res[1];
    delete res[2];
    delete res[3];
    delete res[4];
    delete res[5];
    delete res[6];
    delete res.EthCnx;

    res.Ping = this.config.showPing ? this.pingValue : null;
    this.sendInfo("RESULT", res);
  },

  Ping () {
    ping.promise.probe(this.config.pingAdress,
      {
        timeout: 2,
        extra: ["-4"]
      })
      .then((res) => {
        if (res.alive) this.pingValue = `${res.time} ms`;
        else this.pingValue = "Erreur !";
      });
  },

  /** Freebox OS API CALL **/
  async Freebox_OS (config, clientRate) {
    FB("Start Query Freebox Server:");
    var output;

    const freebox = new Freebox(config);
    await freebox.login();

    if (!this.init) {
      FB("Quering Freebox Model...");
      const FreeboxVersion = await freebox.request({
        method: "GET",
        url: "api_version/"
      });

      this.FreeboxVersion = this.ModelSearh(FreeboxVersion.data.box_model_name);
      FB("Found:", this.FreeboxVersion);
      this.init = true;
    }

    FB("Quering Client...");
    const clients = await freebox.request({
      method: "GET",
      url: "lan/browser/pub/"
    });

    FB("Quering ALL Ethernet Cnx...");
    var ethCnx = await freebox.request({
      method: "GET",
      url: "switch/status/"
    });

    if (clientRate) {
      FB("Quering Ethernet on port 1...");
      var eth1 = await freebox.request({
        method: "GET",
        url: "switch/port/1/stats"
      });

      FB("Quering Ethernet on port 2...");
      var eth2 = await freebox.request({
        method: "GET",
        url: "switch/port/2/stats"
      });

      FB("Quering Ethernet on port 3...");
      var eth3 = await freebox.request({
        method: "GET",
        url: "switch/port/3/stats"
      });

      FB("Quering Ethernet on port 4...");
      var eth4 = await freebox.request({
        method: "GET",
        url: "switch/port/4/stats"
      });

      if (this.config.checkFreePlug) {
        FB("Quering Freeplug...");
        var eth5 = await freebox.request({
          method: "GET",
          url: "switch/port/5/stats"
        });
      }
      if (this.config.checkSFP) {
        FB("Quering SFP...");
        var eth6 = await freebox.request({
          method: "GET",
          url: "switch/port/9999/stats"
        });
      }
    }
    FB("Quering Connexion...");
    const cnx = await freebox.request({
      method: "GET",
      url: "connection/"
    });
    FB("Done!");

    let bandwidthUp = this.convert(cnx.data.result.bandwidth_up, 1, 2);
    let bandwidthDown = this.convert(cnx.data.result.bandwidth_down, 1, 2);
    let debitDown = this.convert(cnx.data.result.rate_down, 0, 2);
    let debitUp = this.convert(cnx.data.result.rate_up, 0, 2);
    let type = (cnx.data.result.media === "xdsl") ? "xDSL" : ((cnx.data.result.media === "ftth") ? "FTTH" : "Inconnu");
    let degroup = (cnx.data.result.type === "rfc2684") ? true : false;

    output = {
      Model: this.FreeboxVersion,
      Type: type,
      Degroup: degroup,
      BandwidthDown: bandwidthDown,
      BandwidthUp: bandwidthUp,
      DebitDown: debitDown,
      DebitUp: debitUp,
      IP: cnx.data.result.ipv4,
      Client: clients.data.result ? clients.data.result : [],
      EthCnx: clientRate && ethCnx.data.result ? ethCnx.data.result : [],
      1: clientRate && eth1.data.result ? eth1.data.result : [],
      2: clientRate && eth2.data.result ? eth2.data.result : [],
      3: clientRate && eth3.data.result ? eth3.data.result : [],
      4: clientRate && eth4.data.result ? eth4.data.result : [],
      5: clientRate && this.config.checkFreePlug && eth5.data.result ? eth5.data.result : [],
      6: clientRate && this.config.checkSFP && eth6.data.result ? eth6.data.result : []
    };

    await freebox.logout();
    return output;
  },

  convert (data, type = 0, FixTo = 0) {
    // type 0: octet / type:1 bytes
    var value = Number(data);

    if (value > 1000000000) {
      value = Number((value / 1000000000).toFixed(FixTo));
      if (type === 0) value = `${value} Go/s`;
      if (type === 1) value = `${value} Gb/s`;
      return value;
    }
    if (value > 1000000) {
      value = Number((value / 1000000).toFixed(FixTo));
      if (type === 0) value = `${value} Mo/s`;
      if (type === 1) value = `${value} Mb/s`;
      return value;
    }
    value = Number((value / 1000).toFixed(FixTo));
    if (type === 0) value = `${value} Ko/s`;
    if (type === 1) value = `${value} Kb/s`;
    return value;
  },

  /** Signal wifi en % **/
  wifiPercent (dB) {
    var quality = 2 * (dB + 100);

    if (dB <= -80) quality = 0;
    else if (dB >= -50) quality = 100;

    return quality;
  },

  /** nbre de barre wifi selon % quality) **/
  wifiBar (percent) {
    return parseInt(((percent * 5) / 100).toFixed(0));
  },

  ModelSearh (model) {
    try {
      const freebox = model.split(" ");
      var version = freebox[1];
      const rev = freebox[2];
      switch (version) {
        case "v9":
          version = "Ultra";
          break;
        case "v8":
          version = "Pop";
          break;
        case "v7":
          version = "Delta";
          break;
        case "Server":
        case "v6":
          version = "Révolution";
          break;
        default:
          console.warn("[Freebox] Freebox Version not found !");
          console.warn("[Freebox] Please contact developer with this freebox model:", model);
          break;
      }
      let FreeboxName = `Freebox ${version} ${rev}`;
      return FreeboxName;
    } catch {
      console.warn("[Freebox] Error Freebox model formating!");
      console.warn("[Freebox] Please contact developer with this freebox model:", model);
      return model;
    }
  }
});
