/** Vocal control for EXT-YouTube **/
/**  @bugsounet  **/
/** 06/02/2022 **/

var recipe = {
  transcriptionHooks: {
    YouTube: {
      pattern: "youtube (.*)",
      command: "YouTube_SEARCH"
    }
  },

  commands: {
    YouTube_SEARCH: {
      notificationExec: {
        notification: "EXT_YOUTUBE-SEARCH",
        payload: (params) => { return params[1]; }
      },
      soundExec: {
        chime: "open"
      },
      displayResponse: false
    }
  }
};
exports.recipe = recipe;
