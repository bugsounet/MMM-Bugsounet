var defaultConfig = {
  module: "MMM-GoogleAssistant/EXTs/EXT-Screen",
  disabled: false,
  config: {
    debug: false,
    detectorSleeping: false
  }
};

var schema = {
  title: "EXT-Screen",
  description: "{PluginDescription}",
  type: "object",
  properties: {
    module: {
      type: "string",
      title: "{PluginName}",
      default: "MMM-GoogleAssistant/EXTs/EXT-Screen"
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
        detectorSleeping: {
          type: "boolean",
          title: "{EXT-Screen_Sleeping}",
          default: false
        }
      }
    }
  },
  required: ["module", "config"]
};

exports.default = defaultConfig;
exports.schema = schema;
