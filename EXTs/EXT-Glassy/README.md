# MMM-Glassy

This module allows to add a glass effect to MagicMirror² modules

## Screenshot

![Screenshot](https://github.com/bugsounet/MMM-Glassy/blob/dev/Screenshot.png?raw=true)

## Install

**`MMM-Glassy` need `MagicMirror²` v2.27.0 and above**

Clone the module into your `MagicMirror` module folder and execute npm install in the module folder.

```sh
  cd ~/MagicMirror/modules
  git clone https://github.com/bugsounet/MMM-Glassy
  cd MMM-Glassy
  npm install
```

## Configuration

### Simple Sample

This sample allow to apply glassy effect to all modules with default configuration.

```js
{
  module: "MMM-Glassy",
  disabled: false
},
```

### Personalized Sample

This example is the default configuration for customization

```js
{
  module: "MMM-Glassy",
  disabled: false,
  config: {
    debug: false,
    ignoreModules: [],
    modulePadding: "10px",
    moduleRadius: "10px",
    moduleShadow: "5px",
    moduleBackgroundRGB: "0,0,0",
    moduleBackgroundOpacity: "15%",
    moduleBorderRGB: "255,255,255",
    moduleBorderOpacity: "10%",
    moduleShadowOffsetX: "-5px",
    moduleShadowOffsetY: "-5px",
    moduleShadowBlur: "8px",
    moduleShadowColor: "black",
    moduleBlur: "5px",
    moduleSpacing: "15px",
    mirrorMargin: "10px",
    mirrorBackground: true,
    mirrorBackgroundFile: "default.jpg",
    mirrorBackgroundOnSuspend: true
  }
},
```

### Configuration Structure

| field | type | default | description |
| --- | --- | --- | --- |
| debug | BOOLEAN | false | enable or not debug mode |
| ignoreModules | ARRAY of STRING | [] | List of modules to ignore. |
| modulePadding | STRING | "10px" | Padding size to add for Glassy effect (around module). |
| moduleRadius | STRING | "10px" | Radius size to add for round effect of the glass |
| moduleShadow | STRING | "5px" | Shadow size to add for depth effect |
| moduleBackgroundRGB | STRING | "0,0,0" | Glass color choice  -- Note: must be in RGB -- By default: Black RGB color |
| moduleBackgroundOpacity | STRING | "15%" | Glass opacity |
| moduleBorderRGB | STRING | "255,255,255" | Glass border color -- Note: must be in RGB -- By default: White RGB color |
| moduleBorderOpacity | STRING | "10%" | Glass border opacity |
| moduleShadowOffsetX | STRING | "-5px" | Shadow effect size (OffSet X) |
| moduleShadowOffsetY | STRING | "-5px" | Shadow effect size (OffSet Y) |
| moduleShadowBlur | STRING | "8px" | Blur effect of the shadow effect |
| moduleShadowColor | STRING | "black" | Glass shadow color |
| moduleBlur | STRING | "5px" | Blur effect of the Glass (for background transparency)  |
| moduleSpacing | STRING | "15px" | Spacing between 2 modules -- Note: by default MagicMirror² have `30px` spacing |
| mirrorMargin | STRING | "10px" | Change MagicMirror² screen margin.-- Note: By default MagicMirror² have `60px` screen margin |
| mirrorBackground | BOOLEAN | true | Allows you to use a background defined for MagicMirror². |
| mirrorBackgroundFile | STRING | "default.jpg" | Filename of the background (must be in `resources` folder) |
| mirrorBackgroundOnSuspend | BOOLEAN | true | Display Background when `EXT-Glassy` is suspended. |

### Notes

* Find an RGB color: see [rgbcolorpicker](https://rgbcolorpicker.com/) website
  * In this module RGB Color feature  `x,y,z` is the result of rgb(`x,y,z`)
* Opacity percentage:
  * The smaller the percentage: more transparent it will be
* MagicMirror² Background:
  * You can use your own file. just save it into `resources` folder of `MMM-Glassy` module
  * Don't Forget in this case to use `mirrorBackgroundFile` feature.
  * You have some others `default` background in `resources` Folder, just check it!
* If you use another module for add a background to `MagicMirror²`:
  * Don't forget to set `mirrorBackground` to `false`
* Resources Warn:
  * Changing all modules to Glass Effect take a lot of resources
  * Maybe ignore somes modules can help your Raspberry Pi!
    * Use: `ignoreModules: ["MMM-Module", "MMM-Module2"]`

## Credit

* Author:
  * @bugsounet
* License: MIT

## Donation

 If you love this module, buy me a coffee :)

 [Donation](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=TTHRH94Y4KL36&source=url)
