Module.register("MMM-Linky", {
  defaults: {
    url: "https://conso.boris.sh/api/daily_consumption",
    token: "votre-token-ici",
    prm: "123456789",
    periode: 1,
    annee_n_minus_1: 1,
  },

  start: function () {
    Log.info("MMM-Linky démarré...");
    this.consumptionData = {};
    this.chart = null;
    this.ChartJsLoaded = false;
    this.getData();

    // Forcer une mise à jour du DOM après 30 secondes
    setTimeout(() => {
      console.log("Forçage de l'affichage après 30 secondes...");
      this.updateDom();
    }, 30000);
  },

  getStyles: function () {
    return ["MMM-Linky.css"];
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "CONSUMPTION_SCHEDULE") {
      this.getData();
      return;
    }

    if (notification === "CONSUMPTION_DATA") {
      console.log("Données brutes reçues de l'API dans le module : ", payload);

      const payloadArray = Array.isArray(payload) ? payload : [payload];

      payloadArray.forEach((item) => {
        if (item.start && item.end && item.interval_reading) {
          const { start, interval_reading } = item;
          const year = start.split("-")[0];

          if (!this.consumptionData[year]) {
            this.consumptionData[year] = [];
          }

          interval_reading.forEach((reading) => {
            const day = parseInt(reading.date.split("-")[2]);
            const month = parseInt(reading.date.split("-")[1]) - 1;
            const value = parseFloat(reading.value);

            const isDuplicate = this.consumptionData[year].some(
              (entry) => entry.day === day && entry.month === month && entry.value === value
            );

            if (!isDuplicate) {
              this.consumptionData[year].push({ day, month, value });
            }
          });
        } else {
          console.error("Format inattendu des données :", item);
        }
      });

      this.updateDom();
    }
  },

  processLocalData: function (data) {
    console.log("Données locales chargées :", data);
    const years = new Set();

    data.forEach((entry) => {
      const year = entry.start.split("-")[0];
      if (!this.consumptionData[year]) {
        this.consumptionData[year] = [];
      }

      entry.interval_reading.forEach((reading) => {
        const day = parseInt(reading.date.split("-")[2]);
        const month = parseInt(reading.date.split("-")[1]) - 1;
        const value = parseFloat(reading.value);

        this.consumptionData[year].push({
          day,
          month,
          value,
        });
      });

      years.add(year);
    });

    this.updateDom();
  },

  calculateDates: function (yearOffset = 0) {
    const today = new Date();
    today.setFullYear(today.getFullYear() - yearOffset);
    const endDate = today.toISOString().split("T")[0];

    let startDate;

    switch (this.config.periode) {
      case 1:
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 1);
        break;
      case 2:
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 3);
        break;
      case 3:
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      default:
        Log.error("MMM-Linky: periode invalide.");
        return null;
    }

    return { startDate: startDate.toISOString().split("T")[0], endDate };
  },
  
  getHeaderText: function () {
    const periodTexts = {
      1: "Consommation électricité de la veille",
      2: "Consommation électricité des 3 derniers jours",
      3: "Consommation électricité des 7 derniers jours",
    };
    return periodTexts[this.config.periode] || "Consommation électricité";
  }, 

  getData: function () {
    const dates = this.calculateDates();
    if (!dates) return;

    this.sendSocketNotification("GET_CONSUMPTION_DATA", {
      url: this.config.url,
      token: this.config.token,
      prm: this.config.prm,
      startDate: dates.startDate,
      endDate: dates.endDate,
      period: this.config.periode,
    });

    if (this.config.annee_n_minus_1 === 1) {
      const previousYearDates = this.calculateDates(1);
      if (previousYearDates) {
        this.sendSocketNotification("GET_CONSUMPTION_DATA", {
          url: this.config.url,
          token: this.config.token,
          prm: this.config.prm,
          startDate: previousYearDates.startDate,
          endDate: previousYearDates.endDate,
          period: this.config.periode,
        });
      }
    }
  },


  loadChartJs: function (callback) {
    if (typeof Chart === "undefined") {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/chart.js";
      script.onload = callback;
      document.head.appendChild(script);
    } else {
      callback();
    }
  },

getDom: function () {
    let wrapper = document.createElement("div");
    console.log("Données de consommation : ", this.consumptionData);

    const header = document.createElement("div");
    header.innerHTML = this.getHeaderText();
    header.classList.add("header");
    wrapper.appendChild(header);

    if (Object.keys(this.consumptionData).length > 0) {
        console.log("Données de consommation trouvées, préparation du graphique...");
        const days = [];
        const datasets = [];
        const colors = ["rgba(251, 39, 227, 0.8)", "rgba(39, 238, 245, 0.8)"];

        let index = 0;
        for (const year in this.consumptionData) {
            const data = this.consumptionData[year].sort((a, b) => {
                if (a.month === b.month) {
                    return a.day - b.day;
                }
                return a.month - b.month;
            });

            const values = data.map((item) => item.value);

            if (index === 0) {
                days.push(
                    ...data.map(
                        (item) =>
                            `${item.day}-${
                                ["janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"][item.month]
                            }`
                    )
                );
            }

            datasets.push({
                label: year,
                data: values,
                backgroundColor: colors[index],
                borderColor: colors[index].replace("0.8", "1"),
                borderWidth: 1,
            });
            index++;
        }

        console.log("Données des graphiques : ", { labels: days, datasets });

        let chartContainer = document.createElement("canvas");
        wrapper.appendChild(chartContainer);

        // Ajout du message d'attente
        let waitingMessage = document.createElement("div");
        waitingMessage.innerHTML = "Veuillez patienter, vos données arrivent...";
        waitingMessage.style.color = "#ffffff";
        waitingMessage.style.textAlign = "center";
        waitingMessage.style.marginTop = "10px";
        wrapper.appendChild(waitingMessage);

        // Création du graphique après le chargement de Chart.js
        this.ensureChartJsLoaded(() => {
            try {
                // Création du graphique
                this.createChart(chartContainer, days, datasets);
                console.log("Graphique créé avec succès");

                // Retirer le message d'attente
                wrapper.removeChild(waitingMessage);

                // Attendre que le graphique soit bien affiché
                setTimeout(() => {
                    // Vérification de l'état du graphique
                    if (chartContainer.width > 0 && chartContainer.height > 0) {
                        console.log("Graphique affiché avec succès");

                        // Une fois le graphique affiché, afficher le message de comparaison
                        const currentYearTotal = this.calculateTotalConsumption(new Date().getFullYear().toString());
                        const previousYearTotal = this.calculateTotalConsumption((new Date().getFullYear() - 1).toString());

                        let message = "";
                        let color = "";
                        let periodText = "";

                        switch (this.config.periode) {
                            case 1:
                                periodText = "le dernier jour";
                                break;
                            case 2:
                                periodText = "les 3 derniers jours";
                                break;
                            case 3:
                                periodText = "les 7 derniers jours";
                                break;
                            default:
                                periodText = "période inconnue";
                        }

                        if (currentYearTotal < previousYearTotal) {
                            message = `Félicitations, votre consommation d'énergie a baissé sur ${periodText} par rapport à l'année dernière !`;
                            color = "green";
                        } else if (currentYearTotal > previousYearTotal) {
                            message = `Attention, votre consommation d'énergie a augmenté sur ${periodText} par rapport à l'année dernière !`;
                            color = "red";
                        } else {
                            message = `Votre consommation d'énergie est stable sur ${periodText} par rapport à l'année dernière.`;
                            color = "yellow";
                        }

                        // Création du message de comparaison
                        const messageElement = document.createElement("div");
                        messageElement.innerHTML = `<span style="color: ${color};">${message}</span>`;
                        messageElement.style.textAlign = "left";
                        messageElement.style.fontSize = "16px";
                        messageElement.style.maxWidth = "100%";
                        messageElement.style.wordWrap = "break-word";
                        messageElement.style.lineHeight = "1.2";
                        messageElement.style.marginTop = "10px";
                        wrapper.appendChild(messageElement);
                    } else {
                        console.log("Le graphique n'a pas été affiché correctement, tentative de réinitialisation.");
                    }
                }, 1000); // Attendre 1 seconde après la création du graphique avant de montrer le message

            } catch (error) {
                console.error("Erreur lors de la création du graphique : ", error);
                // Affichage d'un message d'erreur si nécessaire
            }
        });

    } else {
        console.log("Aucune donnée de consommation trouvée.");
    }

    return wrapper;
},

  ensureChartJsLoaded: function (callback) {
    if (!this.ChartJsLoaded) {
      this.loadChartJs(() => {
        this.ChartJsLoaded = true;
        callback();
      });
    } else {
      callback();
    }
  },
  
	loadChartJs: function (callback) {
	if (typeof Chart === "undefined") {
	  const script = document.createElement("script");
	  script.src = "https://cdn.jsdelivr.net/npm/chart.js";
	  script.onload = callback;
	  document.head.appendChild(script);
	} else {
	  callback();
	}
	},

	  createChart: function (chartContainer, days, datasets) {
		if (this.chart && typeof this.chart.destroy === "function") {
		  this.chart.destroy();
		}
	  
	  if (datasets.length > 0 && days.length > 0) {
		this.chart = new Chart(chartContainer, {
		  type: "bar",
		  data: {
			labels: days,
			datasets,
		  },
		  options: {
			responsive: true,
			plugins: {
			  legend: {
				labels: {
				  color: "white",
				},
			  },
			},
			scales: {
			  y: {
				ticks: {
				  callback: (value) => value + " kWh",
				  color: "#ffffff",
				},
				title: {
				  display: true,
				  text: "Consommation (kWh)",
				  color: "#ffffff",
				},
			  },
			  x: {
				ticks: {
				  color: "#ffffff",
				},
			  },
			},
		  },
		});
	  } else {
		console.log("Impossible de créer le graphique : données invalides.");
	  }
	},


  calculateTotalConsumption: function (year) {
    let total = 0;

    if (this.consumptionData[year]) {
      this.consumptionData[year].forEach((data) => {
        total += data.value;
      });
    }

    return total;
  },
});
