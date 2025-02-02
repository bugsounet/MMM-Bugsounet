# EXT-Freebox

EXT-Freebox permet d'afficher, sur votre Mirroir, divers informations de votre [Freebox](https://www.free.fr/freebox/) en temps réél.

* Model de la Freebox.
* Bande Passante.
* Adresse IP.
* Appareils connectés.
* Débit utilisé (total et/ou par appareil).
* Ping de votre mirroir vers google.fr (ou autre)
* Type de connexion utilisé par les appareils. (ethernet, wifi, machine virtuelle)

## Screenshot

![screenshot](/EXTs/EXT-Freebox/screenshot.png)

## Installation

* Clonez le module dans le dossier module:

```sh
cd ~/MagicMirror/modules/MMM-Bugsounet
npm run setup:EXT-Freebox
```

* Associer `EXT-Freebox` à votre Freebox Server.

```sh
cd ~/MagicMirror/modules/MMM-Bugsounet
npm run setup:EXT-Freebox:register

Merci de vérifier votre écran LCD de votre Freebox Server et autoriser l'enregistrement de l'application.
```

* Validez l'association par la flèche de droite de l'écran LCD de votre Freebox Server.
  
* Sauvegarder précieusement l'information de connexion.

```js
    freebox: {
      app_token: 'xxxxxxxxxxxxxxxxxxxxxxxxx',
      app_id: 'fbx.EXT-Freebox',
      api_domain: 'xxxxx.fbxos.fr',
      https_port: xxxx,
      api_base_url: '/api/',
      api_version: 'xxx.x'
    },
```

> **Attention:** Les informations fournies par la Freebox sont à considérer comme des identifiants!
> Ne JAMAIS les divulguer car cela permet d'avoir un accès à votre freebox à distance!

## Configuration

Pour afficher le module, inserez ceci dans votre ficher `config.js`

### Configuration Minimale

Remplacer le contenu de `freebox` par les valeurs de connexion fourni par votre Freebox Server.

```js
{
  module: "MMM-Bugsounet/EXTs/EXT-Freebox",
  position: "top_left",
  animateIn: "fadeInLeft",
  animateOut: "fadeOutLeft",
  config: {
    freebox: { // inserez vos informations de connexion
      app_token: 'xxxxxxxxxxxxxxxxxxxxxxxxx',
      app_id: 'fbx.EXT-Freebox',
      api_domain: 'xxxxx.fbxos.fr',
      https_port: xxxx,
      api_base_url: '/api/',
      api_version: 'xxx.x'
    },
  }
},
```

### Configuration Personalisée

Ceci est la configuration par defaut si vous definissez aucune valeurs

```js
{
  module: "MMM-Bugsounet/EXTs/EXT-Freebox",
  position: 'top_left',
  animateIn: "fadeInLeft",
  animateOut: "fadeOutLeft",
  config: {
    freebox: { // inserez vos informations de connexion
      app_token: 'xxxxxxxxxxxxxxxxxxxxxxxxx',
      app_id: 'fbx.EXT-Freebox',
      api_domain: 'xxxxx.fbxos.fr',
      https_port: xxxx,
      api_base_url: '/api/',
      api_version: 'xxx.x'
    },
    debug: false,
    verbose: false,
    updateDelay:  5 * 1000,
    zoom: 110,
    activeOnly: false,
    showModel: true,
    showIcon: true,
    showButton: true,
    showBandWidth: true,
    showRate: true,
    showClient: true,
    showClientRate: true,
    showEthClientRate: false,
    showClientRateDownOnly: false,
    showClientIP: false,
    showClientCnxType: true,
    showWifiStandard: true,
    showFree: true,
    showIP: true,
    showPing: true,
    pingAdress: "google.fr",
    textWidth: 250,
    excludeMac: [],
    sortBy: null,
    checkFreePlug: false,
    checkSFP: false
  }
},
```

| Option  | Description | Type | Defaut |
| ------- | --- | --- | --- |
| debug | Active le mode de debuguage | Boolean | false |
| verbose | Active le mode verbose en console | Boolean| false |
| updateDelay | Delai de mise à jour en ms | Number | 5 * 1000 (5 sec) |
| zoom | Zoom global du module (en pourcent) -- 100 est considéré 100% | Number | 110 |
| activeOnly | Affiche uniquement les appareils connectés | Boolean | false |
| showModel | Affiche le model de Freebox utilisé | Boolean | true |
| showIcon| Affiche les icones personalisés des appareils | Boolean | true |
| showButton | Affiche les boutons de status de connexion | Boolean | true |
| showBandWidth | Affiche la bande passante de votre connexion | Boolean | true |
| showRate | Affiche le débit utilisé de votre connexion | Boolean | true |
| showClient | Affiche la liste des appareils | Boolean | true |
| showClientRate | Affiche le débit des appareils | Boolean | true |
| showEthClientRate | Affiche le débit de connexion de l'appareil connecté sur le port ethernet. | Boolean | false |
| showClientRateDownOnly | Affiche uniquement le debit descendant des appareils | Boolean | true |
| showClientIP | Affiche l'addresse IPv4 des appareils | Boolean | false |
| showClientCnxType | Affiche le type de connexion des appareils | Boolean | true |
| showWifiStandard | Affiche la norme de connexion utilisée | Bolean | true |
| showFree | Affiche les Freebox Player et répéteurs | Boolean | true |
| showIP | Affiche l'adresse ip de votre connexion | Boolean | true |
| showPing | Affiche le ping entre le mirroir et google.fr | Boolean | true |
| pingAdress| personalisation de l'adresse a ping | String | google.fr |
| textWidth | Largeur du texte à afficher (mini: 220) | Number | 250 |
| excludeMac | Ne pas afficher les appareils connectés avec certaines adresses MAC | Array | [] |
| sortBy | Classement des appareils connectés par : "type", "name", "mac" ou null pour classement par defaut| String | null |
| checkFreePlug| Permet de verifier et d'afficher les connexions via FreePlug sur le réseau (Freebox Delta uniquement)| Boolean | false |
| checkSFP| Permet de verifier et d'afficher les connexions via la carte SFP sur le réseau (Freebox Delta/Ultra uniquement)| Boolean | false |

Note sur `showEthClientRate`:

* Ne fonctionne que si un seul appareil est connecté par port ethernet.
* Activer sur vous n'utiliser pas de swtich/hub sur votre Freebox!

### Legende des icones de connexion

* ![eth1](/EXTs/EXT-Freebox/resources/eth1.png) Connexion depuis le port Ethernet numéro 1
* ![eth2](/EXTs/EXT-Freebox/resources/eth2.png) Connexion depuis le port Ethernet numéro 2
* ![eth3](/EXTs/EXT-Freebox/resources/eth3.png) Connexion depuis le port Ethernet numéro 3
* ![eth4](/EXTs/EXT-Freebox/resources/eth4.png) Connexion depuis le port Ethernet numéro 4
* ![cpl](/EXTs/EXT-Freebox/resources/cpl.png) Connexion depuis le port CPL
* ![sfp](/EXTs/EXT-Freebox/resources/sfp.png) Connexion depuis le port SFP
* ![2d4g_5](/EXTs/EXT-Freebox/resources/wifi/2d4g_5.png) Connexion depuis le wifi 2.4Ghz
* ![2d4g_5](/EXTs/EXT-Freebox/resources/wifi/5g_5.png) Connexion depuis le wifi 5Ghz
* ᴿ Cconnexion depuis un répéteur Wifi
* ![VM](/EXTs/EXT-Freebox/resources/fromFreeboxOS/VM.svg) Machine Virtuelle
* ![What](/EXTs/EXT-Freebox/resources/fromFreeboxOS/what.svg) Connexion indéterminée

### Legende des icones de norme de connexion wifi

* <img src="/EXTs/EXT-Freebox/resources/standard/Wi-Fi_1.png" width=20px alt="wifi1" /> Connexion avec la norme 802.11b (wifi 1)
* <img src="/EXTs/EXT-Freebox/resources/standard/Wi-Fi_2.png" width=20px alt="wifi2" /> Connexion avec la norme 802.11a (wifi 2)
* <img src="/EXTs/EXT-Freebox/resources/standard/Wi-Fi_3.png" width=20px alt="wifi3" /> Connexion avec la norme 802.11g (wifi 3)
* <img src="/EXTs/EXT-Freebox/resources/standard/Wi-Fi_4.png" width=20px alt="wifi4" /> Connexion avec la norme 802.11n (wifi 4)
* <img src="/EXTs/EXT-Freebox/resources/standard/Wi-Fi_5.png" width=20px alt="wifi5" /> Connexion avec la norme 802.11ac (wifi 5)
* <img src="/EXTs/EXT-Freebox/resources/standard/Wi-Fi_6.png" width=20px alt="wifi6" /> Connexion avec la norme 802.11ax (wifi 6)
* <img src="/EXTs/EXT-Freebox/resources/standard/Wi-Fi_7.png" width=20px alt="wifi7" /> Connexion avec la norme 802.11be (wifi 7)

### Personalisation de l'affichage des noms et des icones des appareils connectés

* Utilisez l'interface `FreeboxOS` de votre Freebox Server (Periphériques Réseau)
* Utilisez l'application `Freebox Connect` sur votre téléphone (Appareils)

## Notes

* Les essais ont été effectués avec une Freebox Ultra.
* Merci de me confirmer le bon fonctionnement sur les autres Freebox!
* Ne fonctionne pas avec les Freebox Crystal et antérieur (API différante)

## Test Freebox

* Ultra: api v11.1 (Freebox OS v4.8)
* Révolution: api v10.2 (Freebox OS v4.7)

## Donation

Si vous aimez ce module, un petit café est bien sympatique :)

[Donation](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=TTHRH94Y4KL36&source=url)
