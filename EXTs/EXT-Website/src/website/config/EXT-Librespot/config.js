var defaultConfig = {
  module: "MMM-GoogleAssistant/EXTs/EXT-Librespot",
  disabled: false,
  config: {
    debug: false,
    deviceName: "MagicMirror",
    minVolume: 50,
    maxVolume: 100
  }
};

var schema = {
  title: "EXT-Librespot",
  description: "{PluginDescription}",
  type: "object",
  properties: {
    module: {
      type: "string",
      title: "{PluginName}",
      default: "MMM-GoogleAssistant/EXTs/EXT-Librespot"
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
        deviceName: {
          type: "string",
          title: "{EXT-Librespot_Name}",
          default: "MagicMirror"
        },
        minVolume: {
          type: "number",
          title: "{EXT-Librespot_Min}",
          default: 50,
          minimum: 0,
          maximum: 100
        },
        maxVolume: {
          type: "number",
          title: "{EXT-Librespot_Max}",
          default: 100,
          minimum: 1,
          maximum: 100
        }
      },
      required: ["email", "password", "deviceName"]
    }
  },
  required: ["module", "config"]
};

exports.default = defaultConfig;
exports.schema = schema;
