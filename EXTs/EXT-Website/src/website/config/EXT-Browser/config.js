var defaultConfig = {
  module: "MMM-GoogleAssistant/EXTs/EXT-Browser",
  disabled: false,
  config: {
    debug: false,
    displayDelay: 60 * 1000,
    scrollActivate: false,
    scrollStep: 25,
    scrollInterval: 1000,
    scrollStart: 5000
  }
};

var schema = {
  title: "EXT-Browser",
  description: "{PluginDescription}",
  type: "object",
  properties: {
    module: {
      type: "string",
      title: "{PluginName}",
      default: "MMM-GoogleAssistant/EXTs/EXT-Browser"
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
        displayDelay: {
          type: "number",
          title: "{EXT-Browser_Delay}",
          default: 60000
        },
        scrollActivate: {
          type: "boolean",
          title: "{EXT-Browser_Scroll}",
          default: false
        },
        scrollStep: {
          type: "number",
          title: "{EXT-Browser_Step}",
          default: 25
        },
        scrollInterval: {
          type: "number",
          title: "{EXT-Browser_Interval}",
          default: 1000
        },
        scrollStart: {
          type: "number",
          title: "{EXT-Browser_Start}",
          default: 5000
        }
      }
    }
  },
  required: ["module"]
};

exports.default = defaultConfig;
exports.schema = schema;
