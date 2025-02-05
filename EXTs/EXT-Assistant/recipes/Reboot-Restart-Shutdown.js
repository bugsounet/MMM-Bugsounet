/**   Reboot, Restart, Shutdown, Screen  **/
/**   Vocal commands script              **/
/**   set partern in your language       **/
/**   @bugsounet                         **/
var recipe = {
  transcriptionHooks: {
    GA_REBOOT: {
      pattern: "reboot please",
      command: "GA_REBOOT"
    },
    GA_RESTART: {
      pattern: "restart please",
      command: "GA_RESTART"
    },
    GA_SHUTDOWN: {
      pattern: "shutdown please",
      command: "GA_SHUTDOWN"
    },
    GA_CLOSE: {
      pattern: "close please",
      command: "GA_CLOSE"
    }
  },

  commands: {
    GA_REBOOT: {
      soundExec: {
        chime: "close"
      },
      moduleExec: {
        module: "MMM-GoogleAssistant",
        exec: (module) => {
          module.EXTs.ActionsEXTs("EXT_GATEWAY-Reboot", null, module);
        }
      }
    },
    GA_RESTART: {
      soundExec: {
        chime: "close"
      },
      moduleExec: {
        module: "MMM-GoogleAssistant",
        exec: (module) => {
          module.EXTs.ActionsEXTs("EXT_GATEWAY-Restart", null, module);
        }
      }
    },
    GA_SHUTDOWN: {
      soundExec: {
        chime: "close"
      },
      moduleExec: {
        module: "MMM-GoogleAssistant",
        exec: (module) => {
          module.EXTs.ActionsEXTs("EXT_GATEWAY-Shutdown", null, module);
        }
      }
    },
    GA_CLOSE: {
      soundExec: {
        chime: "close"
      },
      moduleExec: {
        module: "MMM-GoogleAssistant",
        exec: (module) => {
          module.EXTs.ActionsEXTs("EXT_GATEWAY-Close", null, module);
        }
      }
    }
  }
};
exports.recipe = recipe; // Don't remove this line.
