import xmlbuilder from 'xmlbuilder';
import Fixture from '../../lib/model/Fixture.js';
import Mode from '../../lib/model/Mode.js';


export const version = `0.1.0`;

/**
 * @param {Fixture[]} fixtures An array of Fixture objects, see our fixture model
 * @param {object} options Some global options
 * @returns {Promise<object[], Error>} All generated files (see file schema above)
 */
export async function exportFixtures(fixtures, options) {
  const outFiles = []

  fixtures.map(fixture => {
    fixture.modes.map(mode => {
      outFiles.push(generateFile(fixture, mode, options));
    });
  });

  return outFiles;
}

/**
 * Generate fixture file to be downloaded
 * @param {Fixture} fixture the fixture to download
 * @param {Mode} mode the fixtures mode
 * @param {object} options Global options
 * @returns {object} the file that will be downloaded
 */
function generateFile(fixture, mode, options) {
  const maFixture = {
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
          short_name: fixture.shortName,
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
              },
              ChannelType: getChannelTypes(fixture, mode)
            }
          }
        }
      }
    };

  let xml = xmlbuilder.begin()
    .dec('1.0', 'UTF-8')
    .ele(maFixture);

  return {
    name: `${fixture.manufacturer.key}@${fixture.key}@${mode.shortName}.xml`,
    content: xml.end({
      pretty: true,
      indent: '  '
    }),
    mimetype: `application/xml`,
  }
}

/**
 * @param {Fixture} fixture the current fixture
 * @param {Mode} mode the current mode
 * @param {object} maFixture the object being generated into xml
 * @returns {object[]} the list of channels for that fixture in that mode
 */
function getChannelTypes(fixture, mode) {
  const channelTypes = [];
  mode.channels.forEach((channel, idx) => {
  channelTypes.push({
      "@index": `${idx}`,
      "@attribute": `${channel.key.toUpperCase()}`,
      "@feature": "",
      "@preset": "",
      "@course": `${mode.channels.indexOf(channel) + 1}`,
      "@fine": ``,
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
    });
  });
  return channelTypes;
}
