/*
 * Module: FranceInfo
 */

Module.register("EXT-FranceInfo", {
  defaults: {
    debug: false,
    update: 15 * 60 * 1000,
    speed: 15 * 1000,
    maxItems: 100,
    fontSize: "120%",
    flux: [
      "Les Titres",
      //"Vidéos",
      //"Diaporamas",
      //"France",
      //"Politique",
      //"Société",
      //"Faits divers",
      //"Justice",
      "Monde"
      //"Afrique",
      //"Amériques",
      //"Europe",
      //"Proche Orient",
      //"Environnement",
      //"Tendances",
      //"Entreprises",
      //"Marchés",
      //"Immobilier",
      //"Sports",
      //"Foot",
      //"Rugby",
      //"F1",
      //"Découvertes",
      //"Sciences",
      //"Santé",
      //"Animaux",
      //"Bizarre",
      //"Buzz+",
      //"Médias",
      //"Cinéma",
      //"Musique",
      //"Internet"
    ],
    vertical: {
      useVertical: false,
      width: "450px",
      imageMaxWidth: "20vw",
      imageMaxHeight: "20vh"
    }
  },

  /** demarrage et initialisation **/
  start () {
    this.item = 0;
    this.RSS = [];
    this.update = null;
    this.fade = null;
    console.log("[FRINFO] Démarrage de MMM-FranceInfo");
  },

  /** notification envoyer depuis d'autres modules **/
  notificationReceived (notification, payload, sender) {
    switch (notification) {
      case "Bugsounet_READY":
        if (sender.name === "MMM-Bugsounet") this.sendSocketNotification("CONFIG", this.config);
        break;
    }
  },

  /** notification reçu depuis le node_helper **/
  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case "INITIALIZED":
        console.log("[FRINFO] Prêt!");
        this.item = 0;
        this.displayChoice();
        this.sendNotification("Bugsounet_HELLO", this.name);
        break;
      case "DATA":
        if (this.config.debug) console.log("[FRINFO] Data", payload);
        this.RSS = payload;
        this.item = -1;
        break;
    }
  },

  /** choisi l'article suivant selon le delai d'update **/
  DisplayNext (force) {
    if (this.config.speed < 10 * 1000) this.config.speed = 10 * 1000;
    if (force) {
      this.item++;
      this.displayChoice();
    }
    clearInterval(this.update);
    this.update = setInterval(() => {
      this.item++;
      this.displayChoice();
    }, this.config.speed);
  },

  /** affiche l'article **/
  displayChoice () {
    if (this.RSS.length === 0) {
      this.item = -1;
      return this.DisplayNext();
    }
    if (this.item > this.RSS.length - 1) {
      this.item = -1;
      return this.DisplayNext(true);
    }
    if (!this.RSS[this.item] || !this.RSS[this.item].description || this.RSS[this.item].description === "") return this.DisplayNext(true);

    var title = document.getElementById("FRANCEINFO_TITLE");
    var image = document.getElementById("FRANCEINFO_IMAGE");
    var description = document.getElementById("FRANCEINFO_DESCRIPTION");
    var source = document.getElementById("FRANCEINFO_SOURCE");
    var published = document.getElementById("FRANCEINFO_TIME");
    var contener = document.getElementById("FRANCEINFO_CONTENER");

    contener.classList.add("hideArticle");
    contener.classList.remove("showArticle");

    source.classList.remove("start");
    source.classList.add("stop");

    description.classList.add("hideArticle");
    description.classList.remove("showArticle");

    this.fade = setTimeout(() => {
      if (this.RSS[this.item]) {
        var Source = this.RSS[this.item].from + (this.config.debug ? ` [${this.item}/${this.RSS.length - 1}]` : "");
        var Title = this.RSS[this.item].title;

        image.src = this.RSS[this.item].image;
        image.addEventListener("error", () => { image.src = this.file("franceinfo.png"); }, false);

        if (this.config.vertical.useVertical) {
          title.innerHTML = "";
          description.innerHTML = this.RSS[this.item].description;
          source.innerHTML = Title;
          published.textContent = moment(new Date(this.RSS[this.item].pubdate)).isValid()
            ? `${Source} ~ ${moment(new Date(this.RSS[this.item].pubdate)).fromNow()}`
            : `${Source} ~ ${this.RSS[this.item].pubdate}`;
        } else {
          title.innerHTML = Title;
          description.innerHTML = this.RSS[this.item].description;
          source.textContent = this.RSS[this.item].from + (this.config.debug ? ` [${this.item}/${this.RSS.length - 1}]` : "");
          published.textContent = moment(new Date(this.RSS[this.item].pubdate)).isValid()
            ? moment(new Date(this.RSS[this.item].pubdate)).fromNow()
            : this.RSS[this.item].pubdate;
        }

        contener.classList.remove("hideArticle");
        contener.classList.add("showArticle");
        source.classList.remove("stop");
        source.classList.add("start");
        description.classList.remove("hideArticle");
        description.classList.add("showArticle");
        this.DisplayNext();
      } else {
        console.log("[FRINFO] RSS error");
        this.item = 0;
        this.displayChoice();
      }
    }, 1200);
  },

  /** Cree la structure du dom **/
  getDom () {
    var wrapper = document.createElement("div");

    var contener = document.createElement("div");
    contener.id = "FRANCEINFO_CONTENER";
    contener.classList.add("hideArticle");
    contener.style.fontSize = this.config.fontSize;
    if (this.config.vertical.useVertical) {
      contener.classList.add("vertical");
      contener.style.width = this.config.vertical.width;
    }

    var article = document.createElement("div");
    article.id = "FRANCEINFO_ARTICLE";

    var logo = document.createElement("div");
    logo.id = "FRANCEINFO_LOGO";
    article.appendChild(logo);
    var partA = document.createElement("div");
    partA.id = "FRANCEINFO_LOGO_PARTA";
    partA.textContent = "franceinfo";
    logo.appendChild(partA);
    var partB = document.createElement("div");
    partB.id = "FRANCEINFO_LOGO_PARTB";
    partB.textContent = ":";
    logo.appendChild(partB);

    var title = document.createElement("div");
    title.id = "FRANCEINFO_TITLE";
    if (this.config.vertical.useVertical) title.classList.add("vertical");
    contener.appendChild(article);
    article.appendChild(title);

    var content = document.createElement("div");
    content.id = "FRANCEINFO_CONTENT";
    if (this.config.vertical.useVertical) content.classList.add("vertical");
    var infoContener = document.createElement("div");
    infoContener.id = "FRANCEINFO_INFO";
    var image = document.createElement("img");
    image.id = "FRANCEINFO_IMAGE";
    if (this.config.vertical.useVertical) {
      image.classList.add("vertical");
      image.style.maxWidth = this.config.vertical.imageMaxWidth;
      image.style.maxHeight = this.config.vertical.imageMaxHeight;
    }

    var source = document.createElement("div");
    source.id = "FRANCEINFO_SOURCE";
    if (this.config.vertical.useVertical) source.classList.add("vertical");
    infoContener.appendChild(image);
    infoContener.appendChild(source);

    var description = document.createElement("div");
    description.id = "FRANCEINFO_DESCRIPTION";
    if (this.config.vertical.useVertical) description.classList.add("vertical");

    infoContener.appendChild(description);
    contener.appendChild(content);
    content.appendChild(infoContener);

    var footer = document.createElement("div");
    footer.id = "FRANCEINFO_FOOTER";
    var published = document.createElement("div");
    published.id = "FRANCEINFO_TIME";
    if (this.config.vertical.useVertical) published.classList.add("vertical");
    contener.appendChild(footer);
    footer.appendChild(published);

    wrapper.appendChild(contener);

    return wrapper;
  },

  /** page de style **/
  getStyles () {
    return ["EXT-FranceInfo.css"];
  }
});
