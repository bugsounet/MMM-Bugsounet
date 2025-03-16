# EXT-PrixCarburants

Ce module permet d'afficher les prix des carburants des stations selon votre code postal

## Screenshot

![screenshot](/EXTs/EXT-PrixCarburants/screenshot.png)

## Installation

```sh
cd ~/MagicMirror/modules/MMM-Bugsounet
npm run setup:EXT-PrixCarburants
```

## Configuration

```js
{
  module: "MMM-Bugsounet/EXTs/EXT-PrixCarburants",
  position: "top_center",
  config: {
    debug: false,
    CodePostaux: [
      "08320",
      "59610"
    ],
    ignores: [
      /** Exemple de stations à ignorer
      {
        cp: "08320",
        ville: "HIERGES",
        station: "FIOUL SERVICE"
      },
      {
        cp: "59610",
        ville: "FOURMIES",
        station: "Carrefour"
      }
      **/
    ],
    Carburants: [
      1, // Gazole
      2, // SP95
      3, // E85
      4, // GPLc
      5, // E10
      6  // SP98
    ],
    Affiche: 5, // nombre de stations à afficher
    width: "450px", // largeur du module
    startDelay: 30*1000
  }
},
```

| Option | Description | Type | Défaut |
| --- | ---- | ----- | ---- |
| CodePostaux | Permets de scanner les stations selon les codes postaux | Tableau de code postaux | [ "08320", "59610" ] |
| ignores | Permets d'ignorer des stations afin de ne pas les afficher | Tableau d'object de station à ignorer | [] |
| Carburants | Permet d'afficher uniquement le type de carburant voulu. | Tableau de valeur | [ 1,2,3,4,5,6 ] |
| Affiche | Nombre maximum de stations à afficher | Nombre | 5 |
| width | Largeur du module (pour ajuster si besoin) | chaine de caractère  | "450px" |
| startDelay | Delai avant le démarrage du module en ms (30 sec par default --conseillé--) | Nombre | 30000 |

Type de `Carburants`

* 1: Gazole
* 2: SP95
* 3: E85
* 4: GPLc
* 5: E10
* 6: SP98

## Sources

* Ce module reprend plus ou moins le meme principe que le plugin [prixcarburants](https://github.com/floman321/prixcarburants) pour jeedom
* Ce module utilise la base de donnée [nationale du prix carburants](https://www.prix-carburants.gouv.fr/)

## Notes

* Afin de ne pas perturber le chargement des autres modules, ce module va mettre environ 30 secondes environ pour s'afficher lors du premier démarrage (démarrage différé via startDelay)
