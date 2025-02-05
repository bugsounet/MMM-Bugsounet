var defaultConfig = {
  module: "MMM-GoogleAssistant/EXTs/EXT-SmartHome",
  disabled: false,
  config: {
    debug: false,
    username: "admin",
    password: "admin",
    CLIENT_ID: null
  }
};

var schema = {
  title: "EXT-SmartHome",
  description: "{PluginDescription}",
  type: "object",
  properties: {
    module: {
      type: "string",
      title: "{PluginName}",
      default: "MMM-GoogleAssistant/EXTs/EXT-SmartHome"
    },
    disabled: {
      type: "boolean",
      title: "{PluginDisable}",
      default: false
    },
    config: {
      type: "object",
      title: "{PluginConfiguration}",
      properties: {
        debug: {
          type: "boolean",
          title: "{PluginDebug}",
          default: false
        },
        username: {
          type: "string",
          title: "{EXT-SmartHome_username}",
          default: "admin"
        },
        password: {
          type: "string",
          title: "{EXT-SmartHome_password}",
          default: "admin"
        },
        CLIENT_ID: {
          type: ["string", "null"],
          title: "{EXT-SmartHome_CLIENTID}",
          default: null
        }
      },
      required: ["username", "password"]
    }
  },
  required: ["module"]
};

exports.default = defaultConfig;
exports.schema = schema;
