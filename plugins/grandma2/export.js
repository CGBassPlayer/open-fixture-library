import sanitize from 'sanitize-filename'
import xmlbuilder from 'xmlbuilder';

export const version = `0.1.0`; // semantic versioning of export plugin

/**
 * @param {Fixture[]} fixtures An array of Fixture objects, see our fixture model
 * @param {object} options Some global options, for example:
 * @param {string} options.baseDirectory Absolute path to OFL's root directory
 * @param {Date} options.date The current time.
 * @param {string | undefined} options.displayedPluginVersion Replacement for plugin version if the plugin version is used in export.
 * @returns {Promise<object[], Error>} All generated files (see file schema above)
 */
export async function exportFixtures(fixtures, options) {
  const outfiles = await Promise.all(fixtures.map(async fixture => {
    const xml = xmlbuilder.begin()
      .declaration(`1.0`, `UTF-8`
      .element({
        MA: {
          'xmlns:xsd': `http://www.w3.org/2001/XMLSchema`,
          'xmlns:xsi': `http://www.w3.org/2001/XMLSchema-instance`,
          'xsi:schemaLocation': `http://schemas.malighting.de/grandma2/xml/MA http://schemas.malighting.de/grandma2/xml/2.8.123/MA.xsd`,
          'xmlns': `http://schemas.malighting.de/grandma2/xml/MA`,
          'major_vers': `3`,
          'minor_vers': `1`,
          'stream_vers': `0`
        }
      }))
  }));

  return outfiles;
}