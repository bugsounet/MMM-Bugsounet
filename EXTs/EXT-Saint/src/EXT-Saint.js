/*
 * Module: EXT-Saint
 */

Module.register("EXT-Saint", {
  defaults: {
    debug: false,
    personalize: {
      displayTomorrow: false,
      todayText: "Aujourd'hui, nous fêtons:",
      tomorrowText: "Demain, nous fêterons:",
      displayIcon: true
    },
    update: 60 * 1000
  },

  start () {
    console.log("[SAINT] Starting EXT-Saint...");
  },

  notificationReceived (notification) {
    switch (notification) {
      case "Bugsounet_READY":
        this.sendSocketNotification("CONFIG", this.config);
        break;
    }
  },

  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case "INITIALIZED":
        console.log("[SAINT] Ready");
        this.sendNotification("Bugsounet_HELLO", this.name);
        break;
      case "DATA":
        if (this.config.debug) console.log("[SAINT] Data", payload);
        this.Saint = payload;
        this.displayData();
        break;
    }
  },

  getDom () {
    var saint = document.createElement("div");
    saint.id = "EXT-SAINT";

    var today = document.createElement("div");
    today.id = "TODAY";

    var tomorrow = document.createElement("div");
    tomorrow.id = "TOMORROW";

    saint.appendChild(today);
    saint.appendChild(tomorrow);
    return saint;
  },

  displayData () {
    var today = document.getElementById("TODAY");
    var tomorrow = document.getElementById("TOMORROW");
    if (this.config.personalize.displayIcon) today.innerHTML = `<span class="fas fa-bible"></span> ${this.Saint.today}`;
    else {
      today.textContent = `${this.config.personalize.todayText} ${this.Saint.today}`;
      if (this.config.personalize.displayTomorrow) tomorrow.textContent = `${this.config.personalize.tomorrowText} ${this.Saint.tomorrow}`;
    }
  },

  /*
 *  To debug,
 * @todo with css will be better !
  displayData: function() {
    this.hide(500, () => {
      var saint = document.getElementById("SAINT")
      saint.innerHTML = "<span class=\"fas fa-bible\"></span> " + this.Saint
      this.show(500)
    })
  },
*/

  getStyles () {
    return ["EXT-Saint.css", "font-awesome.css"];
  }
});
