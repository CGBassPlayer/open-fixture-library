import sanitize from 'sanitize-filename';
import xmlbuilder from "xmlbuilder";

import Fixture from '../../lib/model/Fixture';
import Mode from '../../lib/model/Mode';

export const version = `0.1.0`; // semantic versioning of export plugin

/**
 * @param {Fixture[]} fixtures An array of Fixture objects, see our fixture model
 * @param {object} options Some global options, for example:
 * @param {string} options.baseDirectory Absolute path to OFL's root directory
 * @param {Date} options.date The current time.
 * @param {string | undefined} options.displayedPluginVersion Replacement for plugin version if the plugin version is used in export.
 * @returns {Promise<*[]>} All generated files (see file schema above)
 */
export async function exportFixtures(fixtures, options) {
  const outFiles = await Promise.all(fixtures.map(async fixture => {
    try {
      return await getFixtureFiles(fixture, options);
    }
    catch (error) {
      throw new Error(`Exporting fixture ${fixture.manufacturer.key}/${fixture.key} failed: ${error}`, {
        cause: error,
      });
    }
  }));

  return outFiles
}

async function getFixtureFiles(fixture, options) {
  const modeFiles = await Promise.all(fixture.modes.map(mode => {
    try {
      return getFixtureModeFile(fixture, mode, options);
    } catch (err) {
      throw new Error(`Exporting fixture ${fixture.manufacturer.key}/${fixture.key}/${mode.name} mode failed: ${error}`, {
        cause: error,
      });
    }
  }));
  return modeFiles;
}

/**
 * @param {Fixture} fixture The fixure to export
 * @param {Mode} mode fixture mode
 * @param {object} options Global options
 * @returns {Promise<object>} The generated fixture file
 */
async function getFixtureModeFile(fixture, mode, options) {
  const xml = xmlbuilder.begin()
    .declaration('1.0', 'UTF-8')
    .element({
      MA: {
        "@major_vers": "3",
        "@minor_vers": "2",
        "@stream_vers": "2",
        Info: {
          "@datetime": fixture.meta.lastModifyDate.toISOString().split(".")[0],
          "@showfile": "Open Fixture Library"
        },
        FixtureType: {
          "@index": "0",
          "@name": fixture.name,
          "@mode": mode.name,
          InfoItems: {
            Info: "Created from Open Fixture Library GrandMA2 export plugin"
          },
          short_name: fixture.hasShortName ? fixture.shortName : fixture.name.slice(0, 8),
          manufacturer: fixture.manufacturer.name,
          short_manufacturer: fixture.manufacturer.name,
          Modules: {
            "@index": "0",
            Module: {
              "@index": "0",
              "@name": "Module",
              "@class": "Headmover", // TODO Add logic to figure out class from fixture category
              "@beam_angle": `${fixture.physical.lensDegreesMax}`,
              "@beam_intensity": `${fixture.physical.bulbLumens || 10000}`,
              Body: {
                Size: { // If physical dimensions are not provide, default to half meter square (default in ma fixture builder)
                  "@x": `${(fixture.physical.width || 500) / 1000}`,
                  "@y": `${(fixture.physical.depth || 500) / 1000}`,
                  "@z": `${(fixture.physical.height || 500) / 1000}`
                }
              }
            }
          }
        }
      }
    });

  // getChannelTypes(xml, mode)

  const sanitizedFileName = sanitize(`${fixture.manufacturer.name}@${fixture.name}@${mode.shortName}.xml`).replaceAll(/\s+/g, `-`);

  return await {
    name: `${sanitizedFileName}`,
    content: xml.end({
      pretty: true,
      indent: '  '
    }),
    mimetype: 'application/xml'
  };

}

/**
 * @param {Mode} mode the current mode
 * @returns {object} the list of channels for that fixture in that mode
 */
function getChannelTypes(xml, mode) {
  return mode.channels.reduce((acc, channel, idx) => {
    return {
      ...acc,
      ChannelType: {
        "@index": `${idx}`,
        "@attribute": "",
        "@feature": "",
        "@preset": "",
        "@course": "",
        "@fine": "",
        "@default": "",
        ChannelFunction: {
          "@index": "0",
          "@from": "",
          "@to": "",
          "@min_dmx_24": "",
          "@max_dmx_24": "",
          "@physfrom": "",
          "@physto": "",
          "@subattribute": "",
          "@attribute": "",
          "@feature": "",
          "@preset": "",
          // TODO Chanel Sets
        }
      }
    }
  });
}
