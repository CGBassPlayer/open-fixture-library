import xmlbuilder from 'xmlbuilder';
import Fixture from '../../lib/model/Fixture.js';
import Mode from '../../lib/model/Mode.js';
import Capability from '../../lib/model/Capability.js';

import CHANNEL_TYPE_MAPPINGS from './map.js';


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
  let idx = 0
  mode.channels.forEach((channel) => {
    // Fine channels are included in the coarse channel entry so
    // we need to ignore them.
    if (fixture.fineChannelAliases.indexOf(channel.name) >= 0) {
      return;
    }
    idx = idx + 1;
    const courseChannel = fixture.coarseChannels.find(o => o.key === channel.key) || {};
    const fineChannel = fixture.fineChannels.find(o => o.coarseChannel === courseChannel);
    let mappingKey;
    switch (courseChannel.type.toUpperCase()) {
      case "SINGLE COLOR":
        mappingKey = courseChannel.color.toUpperCase();
        break;
      default:
        mappingKey = courseChannel.type.toUpperCase();
    }
    const channelType = CHANNEL_TYPE_MAPPINGS[mappingKey] || {};

    channelTypes.push({
      "@index": `${idx - 1}`,
      "@attribute": channelType.attribute,
      "@feature": channelType.feature,
      "@preset": channelType.preset,
      "@course": `${mode.channels.indexOf(channel) + 1}`,
      "@fine": fineChannel !== undefined ? mode.channels.indexOf(fineChannel) + 1 : null,
      "@default": courseChannel.hasDefaultValue ? courseChannel.defaultValue : null,
      ChannelFunction: {
        "@index": "0",
        // TODO Add check for things other than P/T angles
        "@from": courseChannel.capabilities[0].angle !== null ? getAngle(courseChannel.capabilities[0].angle[1].number).start : null,
        "@to": courseChannel.capabilities[0].angle !== null ? getAngle(courseChannel.capabilities[0].angle[1].number).end : null,
        "@min_dmx_24": "0",
        "@max_dmx_24": "16777215",
        "@physfrom": courseChannel.capabilities[0].angle !== null ? getAngle(courseChannel.capabilities[0].angle[1].number).start : null,
        "@physto": courseChannel.capabilities[0].angle !== null ? getAngle(courseChannel.capabilities[0].angle[1].number).end : null,
        "@subattribute": channelType.subattribute,
        "@attribute": channelType.attribute,
        "@feature": channelType.feature,
        "@preset": channelType.preset,
        ChannelSet: getChannelSets(courseChannel.capabilities, fineChannel !== undefined)
      }
    });
  });
  return channelTypes;
}

/**
 * @param {Capability[]} capabilities channel capabilities
 * @param {boolean} hasFineChannel if channel has a fine option
 * @returns list of objects for the channel sets
 */
function getChannelSets(capabilities, hasFineChannel) {
  const channelSets = [];

  // If the channel has 1 capability, add min, center, max sets
  if (capabilities.length === 1) {
    channelSets.push({
      "@index": "0",
      "@name": "min",
      "@from_dmx": capabilities[0].dmxRange.start,
      "@to_dmx": capabilities[0].dmxRange.start
    });
    channelSets.push({
      "@index": "1",
      "@name": "center",
      "@from_dmx": capabilities[0].dmxRange.center,
      "@to_dmx": capabilities[0].dmxRange.center
    });
    channelSets.push({
      "@index": "2",
      "@name": "max",
      "@from_dmx": capabilities[0].dmxRange.end,
      "@to_dmx": capabilities[0].dmxRange.end
    });
  } else {
    capabilities.forEach((cap, i) => {
      channelSets.push({
        "@index": `${i}`,
        "@name": cap.name,
        "@from_dmx": `${cap.dmxRange.start}`,
        "@to_dmx": `${cap.dmxRange.end}`
      });
    });
  }

  return channelSets;
}

/**
 * @param {number} fullAngle 
 * @returns angles with 0 being in the middle
 */
function getAngle(fullAngle) {
  return {
    start: Math.floor(fullAngle / 2) * -1,
    end: Math.floor(fullAngle / 2)
  }
}

/**
 * Convert a 8 bit hex value (0-255) into a natural value (0-100)
 * @param {number} hex 
 * @returns Natural Value
 */
function convertToNatural(hex) {
  return Math.floor((hex / 255) * 100)
}