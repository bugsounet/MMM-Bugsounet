/*
 * from https://github.com/karbassi/netatmo
 * adapted for MMM-Netatmo-Thermostat (only)
 * bugsounet 2024
 */

var util = require("util");
var fs = require("fs");
var path = require("path");
var EventEmitter = require("events").EventEmitter;

const BASE_URL = "https://api.netatmo.net";

var client_id;
var client_secret;
var access_token;
var refresh_token;

/**
 * @constructor
 * @param args
 */
var netatmo = function (args) {
  EventEmitter.call(this);
  this.authenticate(args);
};

util.inherits(netatmo, EventEmitter);

/**
 * handleFetchError
 * @param err
 * @param response
 * @param body
 * @param message
 * @param critical
 * @returns {Error}
 */
netatmo.prototype.handleFetchError = function (err, message, critical) {
  var errorMessage = "";
  if (typeof (err) === "object") {
    if (err.error && err.error_description) errorMessage = `${err.error} (${err.error_description})`;
    else if (err.cause) errorMessage = `${err.message} (${err.cause})`;
    else if (typeof (err.error) === "object") {
      if (err.error.code && err.error.message) errorMessage = `${err.error.message}`;
      else errorMessage = JSON.stringify(err.error);
    }
    else if (typeof (err.error) === "string") {
      errorMessage = err.error;
    }
    else errorMessage = JSON.stringify(err);
  } else {
    errorMessage = "No error response -- Received: $err";
  }
  var error = new Error(`${message}: ${errorMessage}`);
  if (critical) {
    this.emit("error", error);
  } else {
    this.emit("warning", error);
  }
  return error;
};

/**
 * https://dev.netatmo.com/apidocumentation/oauth#using-a-token
 * @param args
 * @param callback
 * @returns {netatmo}
 */
netatmo.prototype.authenticate = function (args, callback) {
  if (!args) {
    this.emit("error", new Error("Authenticate 'args' not set."));
    return this;
  }

  if (!args.client_id) {
    this.emit("error", new Error("Authenticate 'client_id' not set."));
    return this;
  }

  client_id = args.client_id;

  if (!args.client_secret) {
    this.emit("error", new Error("Authenticate 'client_secret' not set."));
    return this;
  }

  client_secret = args.client_secret;

  var file = path.resolve(__dirname, "../token.json");

  if (fs.existsSync(file)) {
    let tokenFile = JSON.parse(fs.readFileSync(file));
    console.log("[NETATMO] Use token.json for Authenticate");
    refresh_token = tokenFile.refresh_token;
    if (!refresh_token) {
      this.emit("error", new Error("Authenticate 'refresh_token' not found in token.json file."));
      return this;
    }
  } else {
    console.log("[NETATMO] Use config for Authenticate");
    if (!args.refresh_token) {
      this.emit("error", new Error("Authenticate 'refresh_token' not set."));
      return this;
    } else {
      refresh_token = args.refresh_token;
    }
  }

  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refresh_token);
  params.append("client_id", client_id);
  params.append("client_secret", client_secret);

  var url = util.format("%s/oauth2/token", BASE_URL);
  var fetchOptions = {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  };

  fetch(url, fetchOptions)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      if (data.error) {
        return this.handleFetchError(data, "Authenticate error", true);
      }

      this.writeToken(data);
      access_token = data.access_token;

      if (data.expires_in) {
        setTimeout(this.authenticate_refresh.bind(this), (data.expires_in - 60) * 1000, data.refresh_token);
      }

      this.emit("authenticated", data.expires_in - 60);

      if (callback) {
        return callback();
      }
      return this;
    })
    .catch((error) => {
      console.error("[NETATMO]", error)
      return this.handleFetchError(error, "Authenticate error", true);
    });

  return this;
};

/**
 * https://dev.netatmo.com/apidocumentation/oauth#refreshing-a-token
 * @param refresh_token
 * @returns {netatmo}
 */
netatmo.prototype.authenticate_refresh = function (refresh_token) {

  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refresh_token);
  params.append("client_id", client_id);
  params.append("client_secret", client_secret);

  var fetchOptions = {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  };

  var url = util.format("%s/oauth2/token", BASE_URL);

  fetch(url, fetchOptions)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      if (data.error) {
        access_token = null;
        return this.handleFetchError(data, "Authenticate refresh error", true);
      }

      this.writeToken(data);
      access_token = data.access_token;

      if (data.expires_in) {
        setTimeout(this.authenticate_refresh.bind(this), (data.expires_in - 60) * 1000, data.refresh_token);
      }

      this.emit("refreshed", data.expires_in - 60);

      return this;
    })
    .catch((error) => {
      access_token = null;
      return this.handleFetchError(error, "Authenticate refresh error");
    });

  return this;
};

/**
 * https://dev.netatmo.com/apidocumentation/energy#homesdata
 * @param options
 * @param callback
 * @returns {*}
 */
netatmo.prototype.getHomesData = function (options, callback) {
  // Wait until authenticated.
  if (!access_token) {
    return this.on("authenticated", function () {
      this.getHomesData(options, callback);
    });
  }

  var url = util.format("%s/api/homesdata", BASE_URL);

  const params = new URLSearchParams();
  params.append("access_token", access_token);

  if (options) {
    if (options.home_id) params.append("home_id", options.home_id);
    if (options.gateway_types) params.append("gateway_types", options.gateway_types);
  }

  var fetchOptions = {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  };

  fetch(url, fetchOptions)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      if (data.error) {
        return this.handleFetchError(data, "getHomesData error");
      }

      this.emit("get-homesdata", data.error, data.body);

      if (callback) {
        return callback(data.error, data.body);
      }

      return this;
    })
    .catch((error) => {
      return this.handleFetchError(error, "getHomesData error");
    });

  return this;
};

/**
 * https://dev.netatmo.com/apidocumentation/energy#homestatus
 * @param options
 * @param callback
 * @returns {*}
 */
netatmo.prototype.homeStatus = function (options, callback) {
  // Wait until authenticated.
  if (!access_token) {
    return this.on("authenticated", function () {
      this.homeStatus(options, callback);
    });
  }

  if (!options) {
    this.emit("error", new Error("homeStatus 'options' not set."));
    return this;
  }

  if (!options.home_id) {
    this.emit("error", new Error("homeStatus 'home_id' not set."));
    return this;
  }

  var url = util.format("%s/api/homestatus", BASE_URL);

  const params = new URLSearchParams();
  params.append("access_token", access_token);
  params.append("home_id", options.home_id);

  if (options) {
    if (options.device_types) {
      params.append("device_typed", options.device_types);
    }
  }

  var fetchOptions = {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  };

  fetch(url, fetchOptions)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      if (data.error) {
        return this.handleFetchError(data, "homeStatus error");
      }

      this.emit("get-homestatus", data.error, data.body);

      if (callback) {
        return callback(data.error, data.body);
      }

      return this;
    })
    .catch((error) => {
      return this.handleFetchError(error, "homeStatus error");
    });

  return this;
};

/**
 * Write Token to token.json file
 * @param output
 * @returns {*}
 */

netatmo.prototype.writeToken = function (output) {
  try {
    var file = path.resolve(__dirname, "../token.json");
    fs.writeFileSync(file, JSON.stringify(output));
    console.log("[NETATMO] token.json was written successfully");
    return output;
  } catch (error) {
    return this.handleFetchError(error, "writeToken error");
  }
};

module.exports = netatmo;
