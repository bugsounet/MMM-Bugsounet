# EXT-FranceInfo

Affiche les flux rss de `franceinfo:` sur MagicMirror²

![franceinfo](https://raw.githubusercontent.com/bugsounet/EXT-FranceInfo/dev/franceinfo.png)

## Screenshot

![FRINFO](https://raw.githubusercontent.com/bugsounet/EXT-FranceInfo/main/FRINFO.png)

## Installation

```sh
cd ~/MagicMirror/modules
git clone https://github.com/bugsounet/EXT-FranceInfo
cd EXT-FranceInfo
npm install
```

## Configuration

### Simple

```js
    {
      module: "MMM-Bugsounet/EXTs/EXT-FranceInfo",
      position: "bottom_bar",
      configDeepMerge: true
    }
```

### Personalisée

```js
    {
      module: "MMM-Bugsounet/EXTs/EXT-FranceInfo",
      position: "bottom_bar",
      configDeepMerge: true,
      config: {
        debug: false,
        update: 15*60*1000,
        speed: 15*1000,
        maxItems: 100,
        flux: [
          "Les Titres",
          //"Vidéos",
          //"Diaporamas",
          //"France",
          //"Politique",
          //"Société",
          //"Faits divers",
          //"Justice",
          "Monde",
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
      }
    },
```

## Structure

### Champ `debug`

| Champ | type | valeur par défaut
|---|---|---
| debug | BOOLEAN | false

Si vous définissez `debug` sur true `true`, les logs détaillé seront écrit en console. (généralement réservé aux développeurs)

### Champ `update`

| Champ | type | valeur par défaut
|---|---|---
| update | NUMBER | 15\*60*1000

Temps d'intervale des mise a jours des information RSS en ms. (par défaut: 15min)

### Champ `speed`

| Champ | type | valeur par défaut
|---|---|---
| speed | NUMBER | 15*1000

Temps d'affichage de l'article. (par défaut: 15sec)

### Champ `maxItem`

| Champ | type | valeur par défaut
|---|---|---
| maxItem | NUMBER | 100

Nombre d'article qui peuvent être affiché (Utilise en cas de plusieures requetes RSS)

### Champ `flux: []`

|Champ | type | valeur par défaut
|---|---|---
|flux | ARRAY of STRING | [ "Les Titres" , "Monde" ]

32 Flux RSS disponible:

* Les Titres
* Vidéos
* Diaporamas
* France
* Politique
* Société
* Faits divers
* Justice
* Monde
* Afrique
* Amériques
* Europe
* Proche Orient
* Environnement
* Tendances
* Entreprises
* Marchés
* Immobilier
* Sports
* Foot
* Rugby
* F1
* Découvertes
* Sciences
* Santé
* Animaux
* Bizarre
* Buzz+
* Médias
* Cinéma
* Musique
* Internet

### Champ `vertical: {}`

| Champ | type | valeur par défaut
|---|---|---
| useVertical | BOOLEAN | false
| width | STRING | 450px
| imageMaxWidth | STRING | 20vw
| imageMaxHeight | STRING | 20vh

* useVertical: utilisation du module dans une position veticale
* width: largeur du module
* imageMaxWidth: largeur maximale de l'image
* imageMaxHeight: hauteur maximale de l'image

## Crédits

* Développeur:
  * @bugsounet
* Licence: MIT
