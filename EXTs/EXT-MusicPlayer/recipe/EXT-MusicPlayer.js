/**  music commands for GoogleAssistant  **/
/**  multi Lang EN/FR/ (And Others...) **/
/**  modify pattern to your language if needed  **/
/**  @bugsounet  **/

var recipe = {
  transcriptionHooks: {

    /* EN Language */
    EN_START_MUSIC: {
      pattern: "music play",
      command: "START_MUSIC"
    },
    EN_STOP_MUSIC: {
      pattern: "music stop",
      command: "STOP_MUSIC"
    },
    EN_PAUSE_MUSIC: {
      pattern: "music pause",
      command: "PAUSE_MUSIC"
    },
    EN_NEXT_MUSIC: {
      pattern: "music next",
      command: "NEXT_MUSIC"
    },
    EN_PREVIOUS_MUSIC: {
      pattern: "music previous",
      command: "PREVIOUS_MUSIC"
    },
    EN_VOLUME_MUSIC: {
      pattern: "music volume (.*)",
      command: "VOLUME_MUSIC"
    },
    EN_REBUILD_MUSIC: {
      pattern: "music rebuild",
      command: "REBUILD_MUSIC"
    },
    EN_SWITCH_MUSIC: {
      pattern: "music switch",
      command: "SWITCH_MUSIC"
    },

    /* FR Language */
    FR_START_MUSIC: {
      pattern: "musique play",
      command: "START_MUSIC"
    },
    FR_STOP_MUSIC: {
      pattern: "musique stop",
      command: "STOP_MUSIC"
    },
    FR_PAUSE_MUSIC: {
      pattern: "musique pause",
      command: "PAUSE_MUSIC"
    },
    FR_NEXT_MUSIC: {
      pattern: "musique suivante",
      command: "NEXT_MUSIC"
    },
    FR_PREVIOUS_MUSIC: {
      pattern: "musique précédente",
      command: "PREVIOUS_MUSIC"
    },
    FR_VOLUME_MUSIC: {
      pattern: "musique volume (.*)",
      command: "VOLUME_MUSIC"
    },
    FR_REBUILD_MUSIC: {
      pattern: "musique base de données",
      command: "REBUILD_MUSIC"
    },
    FR_SWITCH_MUSIC: {
      pattern: "musique change source",
      command: "SWITCH_MUSIC"
    }

    /* Other Language ? */
  },

  commands: {
    START_MUSIC: {
      notificationExec: {
        notification: "EXT_MUSIC-PLAY"
      },
      soundExec: {
        chime: "open"
      }
    },
    STOP_MUSIC: {
      notificationExec: {
        notification: "EXT_MUSIC-STOP"
      },
      soundExec: {
        chime: "close"
      }
    },
    PAUSE_MUSIC: {
      notificationExec: {
        notification: "EXT_MUSIC-PAUSE"
      }
    },
    NEXT_MUSIC: {
      notificationExec: {
        notification: "EXT_MUSIC-NEXT"
      }
    },
    PREVIOUS_MUSIC: {
      notificationExec: {
        notification: "EXT_MUSIC-PREVIOUS"
      }
    },
    VOLUME_MUSIC: {
      notificationExec: {
        notification: "EXT_MUSIC-VOLUME_SET",
        payload: (params) => {
          return params[1];
        }
      }
    },
    REBUILD_MUSIC: {
      notificationExec: {
        notification: "EXT_MUSIC-REBUILD"
      }
    },
    SWITCH_MUSIC: {
      notificationExec: {
        notification: "EXT_MUSIC-SWITCH"
      }
    }
  }
};
exports.recipe = recipe;
