# EXT-MeteoFrance

![logo](https://github.com/bugsounet/EXT-MeteoFrance/blob/dev/resources/logo.png?raw=true)

`EXT-MeteoFrance` est un module météo qui affiche des informations de prévisions actuelles, horaires et quotidiennes à l'aide des données de l'API MétéoFrance.

## Screenshot

![screenshot](https://raw.githubusercontent.com/bugsounet/EXT-MeteoFrance/dev/screenshot.png)

## Installation

```sh
cd ~/MagicMirror/modules/MMM-Bugsounet
npm run setup:EXT-MeteoFrance
```

## Configuration

Pour afficher le module, inserez ceci dans votre ficher `config.js`

### Minimale

```js
{
  module: 'MMM-Bugsounet/EXTs/EXT-MeteoFrance',
  position: "top_right",
  animateIn: "fadeInRight",
  animateOut: "fadeOutRight",
  config: {
    place: "Paris"
    // place: [ "Paris", "Marseille", "Lille" ]
  }
},
```

### Personalisée

```js
{
  module: 'MMM-Bugsounet/EXTs/EXT-MeteoFrance',
  position: "top_right",
  animateIn: "fadeInRight",
  animateOut: "fadeOutRight",
  config: {
    debug: false,
    updateInterval: 10 * 60 * 1000,
    rotateInterval: 30 * 1000,
    place: "Paris",
    display: {
      HeaderPlaceName: false,
      Background: true,
      CurrentConditions: true,
      ExtraCurrentConditions: true,
      Precipitation: true,
      Wind: true,
      Feels: true,
      SunCondition: true,
      Humidity: true,
      UV: true,
      Summary: true,
      HourlyForecast: true,
      DailyForecast: true,
      MMBackground: true
    },
    personalize: {
      hourlyForecastInterval: 3,
      maxHourliesToShow: 3,
      maxDailiesToShow: 3
    }
  }
},
```

### Caractéristiques des Options

| Option  | Description | Type | Defaut |
| --- | --- | --- | --- |
| debug | Active le mode debug. | boolean | false |
| updateInterval | Intervalle entre chaque mise à jour. **Note:** Méteo-France mets à jours son API toutes les 15 mins.| number |  600000 |
| rotateInterval | Intervalle d'affichage entre chaque d'une ville. **Note:** Cette option est inactive lorqu'une unique ville est utilisée. | number | 30000 |
| place | Nom de la ville à afficher. **Note:** il est possible d'afficher plusieures villes avec ce format: `place: [ "Paris", "Marseille", "Lille" ]` | String ou Array of String | "Paris" |

#### Options `display`

| Option  | Description | Type | Defaut |
| --- | --- | --- | --- |
| HeaderPlaceName | Affiche le nom de la ville. **Note:** Cette option est activée automatiquement en cas d'utilisation de plusieures villes. | boolean | false |
| Backgound | Affiche le fond météo dynamique sur le module. | boolean |  true |
| CurrentConditions | Affiche l'icône des conditions actuelles et la température.| boolean | true |
| ExtraCurrentConditions | Afficher les conditions actuelles supplémentaires telles que les températures élevées/basses, les précipitations, la vitesse du vent, ... | boolean | true |
| Precipitation | Affiche les précipitations prévu pour la journée. | boolean | true |
| Wind | Affiche la vitesse du vent, sa direction ainsi que les rafales. | boolean | true |
| Feels | Affiche la température ressentie. | boolean | true |
| SunCondition | Affiche l'heure du levé ou du couché de soleil. | boolean | true |
| Humidity | Affiche le pourcentage d'humidité. | boolean | true |
| UV | Affiche l'indice d'Ultra-Violet.| boolean | true |
| Summary | Affiche une courte description du temps actuel. | boolean | true |
| HourlyForecast | Affiche les prévisions des heures à venir. | boolean | true |
| DailyForecast | Affiche les prévisions des jours suivants. | boolean | true |
| MMBackground | Affiche le fond d'écran dymamique sur MagicMirror² | boolean | true |

#### Options `personalize`

| Option  | Description | Type | Defaut |
| --- | --- | --- | --- |
| hourlyForecastInterval | Intervalle entre chaque heures de prévision.| number | 3 |
| maxHourliesToShow | Nombre de previsions horaires à afficher.| number | 3 |
| maxDailiesToShow | Nombre de prévisions journalières à afficher.| number | 3 |

## Crédits

* Author:
  * @bugsounet
* License: MIT

## Donation

Si vous aimez ce module, un petit café est bien sympatique :)

[Donation](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=TTHRH94Y4KL36&source=url)
