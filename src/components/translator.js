/**
 * Main translator based from MagicMirror²
 * Modified for MMM-Bugsounet API using and node_helper using
 */

/**
 * Translation to load
 * First is core translation
 * <translation lang>:<translation file>
 */
const translations = {
  en: "en.json",
  fr: "fr.json",
  de: "de.json",
  es: "es.json",
  it: "it.json",
  nl: "nl.json",
  tr: "tr.json"
};

const translationsPath = `${global.root_path}/modules/MMM-Bugsounet/translations`;

/* main Translator */
const Translator = (function () {

  /**
   * Load a JSON file.
   * @param {string} file Path of the file we want to load.
   * @returns {Promise<object>} the translations in the specified file
   */

  async function loadJSON (file) {
    return new Promise(function (resolve) {
      let fileInfo = null;
      try {
        fileInfo = require(`${translationsPath}/${file}`);
      } catch {
        console.error(`[Bugsounet] [Translator] loading json file: ${file} failed`);
      }
      resolve(fileInfo);
    });
  }

  return {
    coreTranslations: {},
    translations: {},

    /**
     * Load a translation for a given key for a given language.
     * @param {string} language translation.
     * @param {string} key The key of the text to translate.
     * @param {object} variables The variables to use within the translation template (optional)
     * @returns {string} the translated key
     */
    translate (lang, key, variables = {}) {

      /**
       * Combines template and variables like:
       * template: "Please wait for {timeToWait} before continuing with {work}."
       * variables: {timeToWait: "2 hours", work: "painting"}
       * to: "Please wait for 2 hours before continuing with painting."
       * @param {string} template Text with placeholder
       * @param {object} variables Variables for the placeholder
       * @returns {string} the template filled with the variables
       */
      function createStringFromTemplate (template, variables) {
        if (Object.prototype.toString.call(template) !== "[object String]") {
          return template;
        }
        let templateToUse = template;
        return templateToUse.replace(new RegExp("{([^}]+)}", "g"), function (_unused, varName) {
          return varName in variables ? variables[varName] : `{${varName}}`;
        });
      }

      if (this.translations[lang] && key in this.translations[lang]) {
        console.log(`[Bugsounet] [Translator] [${lang}] ${key}`);
        return createStringFromTemplate(this.translations[lang][key], variables);
      }

      if (key in this.coreTranslations) {
        console.log(`[Bugsounet] [Translator] [core] ${key}`);
        return createStringFromTemplate(this.coreTranslations[key], variables);
      }

      return key;
    },

    /**
     * Load a translation file (json) and remember the data.
     * @param {string} Language translation file.
     * @param {string} file Path of the file we want to load.
     */
    async load (lang, file) {
      console.log(`[Bugsounet] [Translator] Loading ${lang} translation from ${file}`);

      if (this.translations[lang]) {
        console.warn(`[Bugsounet] [Translator] Already loaded: ${lang} translation`);
        return;
      }

      const json = await loadJSON(file);
      this.translations[lang] = json;
    },

    /**
     * Load the core translations.
     */
    async loadCoreTranslations () {
      console.log("[Bugsounet] [Translator] Loading core translation");
      this.coreTranslations = await loadJSON(translations["en"]);
    },

    /**
     * Load the other language translations.
     */
    async loadTranslations () {
      for (let language of Object.keys(translations)) {
        const translationFile = translations[language];
        if (language !== "en") await this.load(language, translationFile);
      }
    }
  };
}());

module.exports = Translator;
