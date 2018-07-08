const xml2js = require(`xml2js`);

module.exports.name = `QLC+ 4.11.2`;
module.exports.version = `0.4.2`;

module.exports.import = function importQLCplus(str, filename, resolve, reject) {
  const parser = new xml2js.Parser();
  const timestamp = new Date().toISOString().replace(/T.*/, ``);

  const out = {
    manufacturers: {},
    fixtures: {},
    warnings: {}
  };
  const fixture = {
    $schema: `https://raw.githubusercontent.com/OpenLightingProject/open-fixture-library/master/schemas/fixture.json`
  };

  new Promise((res, rej) => {
    parser.parseString(str, (parseError, xml) => {
      if (parseError) {
        rej(parseError);
      }
      else {
        res(xml);
      }
    });
  })
    .then(xml => {
      const qlcPlusFixture = xml.FixtureDefinition;
      fixture.name = qlcPlusFixture.Model[0];

      const manKey = slugify(qlcPlusFixture.Manufacturer[0]);
      const fixKey = `${manKey}/${slugify(fixture.name)}`;
      out.warnings[fixKey] = [`Please check if manufacturer is correct.`];

      fixture.categories = [qlcPlusFixture.Type[0]];

      fixture.meta = {
        authors: qlcPlusFixture.Creator[0].Author[0].split(/,\s*/),
        createDate: timestamp,
        lastModifyDate: timestamp,
        importPlugin: {
          plugin: `qlcplus`,
          date: timestamp,
          comment: `created by ${qlcPlusFixture.Creator[0].Name[0]} (version ${qlcPlusFixture.Creator[0].Version[0]})`
        }
      };

      // fill in one empty mode so we don't have to check this case anymore
      if (!(`Mode` in qlcPlusFixture)) {
        qlcPlusFixture.Mode = [{
          Physical: [{}]
        }];
      }

      fixture.physical = getOflPhysical(qlcPlusFixture.Mode[0].Physical[0], {});
      fixture.matrix = {};
      fixture.availableChannels = {};
      fixture.templateChannels = {};

      const doubleByteChannels = [];
      for (const channel of qlcPlusFixture.Channel || []) {
        fixture.availableChannels[channel.$.Name] = getOflChannel(channel);

        if (channel.Group[0].$.Byte === `1`) {
          doubleByteChannels.push(channel.$.Name);
        }
      }

      mergeFineChannels(fixture, doubleByteChannels, out.warnings[fixKey]);

      fixture.modes = qlcPlusFixture.Mode.map(mode => getOflMode(mode, fixture.physical, out.warnings[fixKey]));

      cleanUpFixture(fixture, qlcPlusFixture);

      out.fixtures[fixKey] = fixture;

      resolve(out);
    })
    .catch(parseError => {
      reject(`Error parsing '${filename}'.\n${parseError.toString()}`);
    });
};

/**
 * @param {!object} qlcPlusChannel The QLC+ channel object.
 * @returns {!object} The OFL channel object.
 */
function getOflChannel(qlcPlusChannel) {
  const channel = {
    type: getOflChannelType(qlcPlusChannel)
  };

  if (`Colour` in qlcPlusChannel && qlcPlusChannel.Colour[0] !== `Generic`) {
    channel.color = qlcPlusChannel.Colour[0];
  }

  channel.fineChannelAliases = [];

  if (channel.type === `Intensity`) {
    channel.crossfade = true;
  }

  if (`Capability` in qlcPlusChannel) {
    channel.capabilities = qlcPlusChannel.Capability.map(cap => getOflCapability(cap));
  }

  return channel;
}

/**
 * @param {!object} qlcPlusChannel The QLC+ channel object.
 * @returns {!string} The OFL channel type.
 */
function getOflChannelType(qlcPlusChannel) {
  if (qlcPlusChannel.Group[0]._ === `Colour`) {
    return `Multi-Color`;
  }

  if (`Colour` in qlcPlusChannel && qlcPlusChannel.Colour[0] !== `Generic`) {
    return `Single Color`;
  }

  const nameRegexps = {
    'Color Temperature': /\b(?:colou?r[\s-]*temperature|ctc|cto)\b/,
    Strobe: /\bstrob/,
    Iris: /\biris\b/,
    Focus: /\bfocus\b/,
    Zoom: /\bzoom\b/
  };

  return Object.keys(nameRegexps).find(
    channelType => qlcPlusChannel.$.Name.toLowerCase().match(nameRegexps[channelType])
  ) || qlcPlusChannel.Group[0]._;
}

/**
 * @param {!object} qlcPlusCapability The QLC+ capability object.
 * @returns {!object} The OFL capability object.
 */
function getOflCapability(qlcPlusCapability) {
  const cap = {
    range: [parseInt(qlcPlusCapability.$.Min), parseInt(qlcPlusCapability.$.Max)],
    name: qlcPlusCapability._
  };

  if (`Color` in qlcPlusCapability.$) {
    cap.color = qlcPlusCapability.$.Color;
  }

  if (`Color2` in qlcPlusCapability.$) {
    cap.color2 = qlcPlusCapability.$.Color2;
  }

  if (`res` in qlcPlusCapability.$) {
    cap.image = qlcPlusCapability.$.res;
  }

  return cap;
}

/**
 * @param {!object} qlcPlusPhysical The QLC+ mode's physical object.
 * @param {!object} oflFixPhysical The OFL fixture's physical object.
 * @returns {!object} The OFL mode's physical object.
 */
function getOflPhysical(qlcPlusPhysical, oflFixPhysical) {
  const physical = {};

  addDimensions();
  addTechnical();

  if (`Bulb` in qlcPlusPhysical) {
    physical.bulb = {};
    addBulb();
  }

  if (`Lens` in qlcPlusPhysical) {
    physical.lens = {};
    addLens();
  }

  if (`Focus` in qlcPlusPhysical) {
    physical.focus = {};
    addFocus();
  }

  for (const section of [`bulb`, `lens`, `focus`]) {
    if (JSON.stringify(physical[section]) === `{}`) {
      delete physical[section];
    }
  }

  return physical;


  /**
   * Handles the Dimensions section.
   */
  function addDimensions() {
    if (!(`Dimensions` in qlcPlusPhysical)) {
      return;
    }

    const width = parseFloat(qlcPlusPhysical.Dimensions[0].$.Width);
    const height = parseFloat(qlcPlusPhysical.Dimensions[0].$.Height);
    const depth = parseFloat(qlcPlusPhysical.Dimensions[0].$.Depth);
    const weight = parseFloat(qlcPlusPhysical.Dimensions[0].$.Weight);

    const dimensionsArray = [width, height, depth];

    if (width + height + depth !== 0 && JSON.stringify(dimensionsArray) !== JSON.stringify(oflFixPhysical.dimensions)) {
      physical.dimensions = dimensionsArray;
    }

    if (weight !== 0.0 && oflFixPhysical.weight !== weight) {
      physical.weight = weight;
    }
  }

  /**
   * Handles the Technical section.
   */
  function addTechnical() {
    if (!(`Technical` in qlcPlusPhysical)) {
      return;
    }

    const power = parseFloat(qlcPlusPhysical.Technical[0].$.PowerConsumption);
    if (power !== 0 && oflFixPhysical.power !== power) {
      physical.power = power;
    }

    const DMXconnector = qlcPlusPhysical.Technical[0].$.DmxConnector;
    if (DMXconnector !== `` && oflFixPhysical.DMXconnector !== DMXconnector) {
      physical.DMXconnector = DMXconnector;
    }
  }

  /**
   * Handles the Bulb section.
   */
  function addBulb() {
    const type = qlcPlusPhysical.Bulb[0].$.Type;
    if (type !== `` && getOflPhysicalProperty(`bulb`, `type`) !== type) {
      physical.bulb.type = type;
    }

    const colorTemp = parseFloat(qlcPlusPhysical.Bulb[0].$.ColourTemperature);
    if (colorTemp && getOflPhysicalProperty(`bulb`, `colorTemperature`) !== colorTemp) {
      physical.bulb.colorTemperature = colorTemp;
    }

    const lumens = parseFloat(qlcPlusPhysical.Bulb[0].$.Lumens);
    if (lumens && getOflPhysicalProperty(`bulb`, `lumens`) !== lumens) {
      physical.bulb.lumens = lumens;
    }
  }

  /**
   * Handles the Lens section.
   */
  function addLens() {
    const name = qlcPlusPhysical.Lens[0].$.Name;
    if (name !== `` && getOflPhysicalProperty(`lens`, `name`) !== name) {
      physical.lens.name = name;
    }

    const degMin = parseFloat(qlcPlusPhysical.Lens[0].$.DegreesMin);
    const degMax = parseFloat(qlcPlusPhysical.Lens[0].$.DegreesMax);
    const degreesMinMax = [degMin, degMax];

    if ((degMin !== 0.0 || degMax !== 0.0)
      && (JSON.stringify(getOflPhysicalProperty(`lens`, `degreesMinMax`)) !== JSON.stringify(degreesMinMax))) {
      physical.lens.degreesMinMax = degreesMinMax;
    }
  }

  /**
   * Handles the Focus section.
   */
  function addFocus() {
    const type = qlcPlusPhysical.Focus[0].$.Type;
    if (type && getOflPhysicalProperty(`focus`, `type`) !== type) {
      physical.focus.type = type;
    }

    const panMax = parseFloat(qlcPlusPhysical.Focus[0].$.PanMax);
    if (panMax && getOflPhysicalProperty(`focus`, `panMax`) !== panMax) {
      physical.focus.panMax = panMax;
    }

    const tiltMax = parseFloat(qlcPlusPhysical.Focus[0].$.TiltMax);
    if (tiltMax && getOflPhysicalProperty(`focus`, `tiltMax`) !== tiltMax) {
      physical.focus.tiltMax = tiltMax;
    }
  }

  /**
   * Helper function to get data from the OFL fixture's physical data.
   * @param {!string} section The section object property name.
   * @param {!string} property The property name in the section,
   * @returns {*} The property data, or undefined.
   */
  function getOflPhysicalProperty(section, property) {
    if (!(section in oflFixPhysical)) {
      return undefined;
    }

    return oflFixPhysical[section][property];
  }
}

/**
 * @param {!object} qlcPlusMode The QLC+ mode object.
 * @param {!object} oflFixPhysical The OFL fixture's physical object.
 * @param {!Array.<!string>} warningsArray This fixture's warnings array in the `out` object.
 * @returns {!object} The OFL mode object.
 */
function getOflMode(qlcPlusMode, oflFixPhysical, warningsArray) {
  const mode = {
    name: qlcPlusMode.$.Name
  };

  const physical = getOflPhysical(qlcPlusMode.Physical[0], oflFixPhysical);

  if (JSON.stringify(physical) !== `{}`) {
    mode.physical = physical;
  }

  mode.channels = [];
  for (const ch of (qlcPlusMode.Channel || [])) {
    mode.channels[parseInt(ch.$.Number)] = ch._;
  }

  if (`Head` in qlcPlusMode) {
    qlcPlusMode.Head.forEach((head, index) => {
      if (head.Channel === undefined) {
        return;
      }

      const channelList = head.Channel.map(ch => mode.channels[parseInt(ch)]).join(`, `);

      warningsArray.push(`Please add ${mode.name} mode's Head #${index + 1} to the fixture's matrix. The included channels were ${channelList}.`);
    });
  }

  return mode;
}

/**
 * @param {!object} fixture The OFL fixture object.
 * @param {!Array.<!string>} doubleByteChannels Array of channel keys for fine channels.
 * @param {!Array.<!string>} warningsArray This fixture's warnings array in the `out` object.
 */
function mergeFineChannels(fixture, doubleByteChannels, warningsArray) {
  const fineChannelRegex = /\s+fine$|16[-_\s]*bit$/i;

  for (const chKey of doubleByteChannels) {
    try {
      if (!fineChannelRegex.test(chKey)) {
        throw new Error(`The corresponding coarse channel could not be detected.`);
      }

      const coarseChannelKey = getCoarseChannelKey(chKey);
      if (!coarseChannelKey) {
        throw new Error(`The corresponding coarse channel could not be detected.`);
      }

      fixture.availableChannels[coarseChannelKey].fineChannelAliases.push(chKey);

      const fineChannel = fixture.availableChannels[chKey];
      if (`capabilities` in fineChannel && fineChannel.capabilities.length > 1) {
        throw new Error(`Merge its capabilities into channel '${coarseChannelKey}'.`);
      }

      delete fixture.availableChannels[chKey];
    }
    catch (error) {
      warningsArray.push(`Please check 16bit channel '${chKey}': ${error.message}`);
    }
  }


  /**
   * @param {!string} fineChannelKey The key of the fince channel.
   * @returns {?string} The key of the corresponding coarse channel, or null if it could not be detected.
   */
  function getCoarseChannelKey(fineChannelKey) {
    // e.g. "Pan" instead of "Pan Fine"
    const coarseChannelKey = fineChannelKey.replace(fineChannelRegex, ``);

    return Object.keys(fixture.availableChannels).find(
      key => key === coarseChannelKey || key.replace(fineChannelKey, ``).match(/^(?:\s+|\s+coarse)$/i)
    );
  }
}

/**
 * @param {!object} fixture The OFL fixture object.
 * @param {!object} qlcPlusFixture The QCL+ fixture object.
 */
function cleanUpFixture(fixture, qlcPlusFixture) {
  // delete empty fineChannelAliases arrays
  for (const chKey in fixture.availableChannels) {
    if (fixture.availableChannels[chKey].fineChannelAliases.length === 0) {
      delete fixture.availableChannels[chKey].fineChannelAliases;
    }
  }

  const fixtureUsesHeads = qlcPlusFixture.Mode.some(mode => `Head` in mode);
  if (!fixtureUsesHeads) {
    delete fixture.matrix;
    delete fixture.templateChannels;
  }
}

/**
 * @param {!string} str The string to slugify.
 * @returns {!string} A slugified version of the string, i.e. only containing lowercase letters, numbers and dashes.
 */
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9-]+/g, ` `).trim().replace(/\s+/g, `-`);
}