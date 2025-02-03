const NodeHelper = require("node_helper");
const axios = require("axios");
const schedule = require("node-schedule");

module.exports = NodeHelper.create({
  
  start: function () {
    console.log("MMM-Linky node_helper démarré...");
    this.scheduleDataFetch();
  },

scheduleDataFetch: function () {  
    const randomHour = Math.floor(Math.random() * (12 - 10 + 1)) + 10;
    const randomMinute = Math.floor(Math.random() * 60);
    const cronExpression = `${randomMinute} ${randomHour} * * *`;
    const job = schedule.scheduleJob(cronExpression, () => {  
        console.log(`Exécution de la récupération des données à ${randomHour}:${randomMinute < 10 ? '0' : ''}${randomMinute}`);  
        this.sendnotificationschedule();
    });

    console.log(`Tâche planifiée pour ${randomHour}:${randomMinute < 10 ? '0' : ''}${randomMinute} UTC.`);  
},


sendnotificationschedule : function(){
	this.sendSocketNotification("CONSUMPTION_SCHEDULE");
},


getConsumptionData: function (url, token, prm, startDate, endDate, period) {
    const endpoint = `${url}?prm=${prm}&start=${startDate}&end=${endDate}`;
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    console.log(`Requête API envoyée : ${endpoint}`);

    axios
      .get(endpoint, config)

      .then((response) => {
		console.log("Données reçues de l'API :", response.data);
        const data = response.data;

        this.sendSocketNotification("CONSUMPTION_DATA", data);
      })

      .catch((error) => {
        console.error("Erreur lors de la récupération des données :", error.response ? error.response.data : error.message);
      });
  },
  
socketNotificationReceived: function (notification, payload) {

  if (notification === "GET_CONSUMPTION_DATA") {
    console.log("Notification GET_CONSUMPTION_DATA reçue, récupération des données...");
    const { url, token, prm, startDate, endDate, period} = payload;
    this.getConsumptionData(url, token, prm, startDate, endDate, period);
  }
},
});
