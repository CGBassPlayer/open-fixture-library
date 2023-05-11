export const version = `0.1.0`; // semantic versioning of export plugin

const ma2FixtureFileHeaders = `xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://schemas.malighting.de/grandma2/xml/MA http://schemas.malighting.de/grandma2/xml/2.8.123/MA.xsd" xmlns="http://schemas.malighting.de/grandma2/xml/MA" major_vers="3" minor_vers="1" stream_vers="0"`;

/**
 * @param {Fixture[]} fixtures An array of Fixture objects, see our fixture model
 * @param {object} options Some global options, for example:
 * @param {string} options.baseDirectory Absolute path to OFL's root directory
 * @param {Date} options.date The current time.
 * @param {string | undefined} options.displayedPluginVersion Replacement for plugin version if the plugin version is used in export.
 * @returns {Promise<*[]>} All generated files (see file schema above)
 */
export async function exportFixtures(fixtures, options) {
  const outfiles = [];

  for (const fixture of fixtures) {
    for (const mode of fixture.modes) {
      outfiles.push({
        mimetype: `application/xml`,
        name: `${fixture.manufacturer.key.replaceAll(`-`, `_`).toLowerCase()}@${fixture.key.replaceAll(`-`, `_`).toLowerCase()}@${mode.shortName}.xml`,
        content: `<MA ${ma2FixtureFileHeaders}>
  <FixtureType name="${fixture.name} mode=${mode.name}">
    <InfoItems>
      <Info type="Note" date="${getFormattedDate()}">Generated from OFL MA2 export plugin</Info>
    </InfoItems>
    ${generateMetaData(fixture)}
    <Modules>
      <Module name="Main Module" class="${mapMaFixtureType(fixture)}" beamtype="None" beamangle="0" beamIntensity="0">
        <Body>
          <Size x="" y="" z="" />
        </Body>
      </Module>
    </Modules>
  </FixtureType>
</MA>` });
    }
  }

  return outfiles;
}

/**
 * Generate xml for the metadata about a fixture.
 * @param fixture
 * @returns {string} raw xml
 */
function generateMetaData(fixture) {
  let xml = ``;
  xml += `<manufacturer>${fixture.manufacturer.name}</manufacturer>\n`;
  if (fixture.manufacturer.shortName !== undefined) {
    xml += `<short_manufacturer>fixture.manufacturer.shortName</short_manufacturer>\n`;
  }
  if (fixture.shortName !== undefined) {
    xml += `<shortname>${fixture.shortName}</shortname>\n`;
  }

  return xml;
}

/**
 * Figures out what the best type of MA fixture is for the OFL category and the bulb provided
 * @param fixture
 */
function mapMaFixtureType(fixture) {
  // `None`, `Mirror`, `Headmover`, `Conventional`, `LED`  // More types exist, but are not worth having here
  for (const category of fixture.categories) {
    if (category === `Moving Head`) {
      return `Headmover`;
    }
  }
  if (fixture.bulb.type !== ``) {
    return fixture.bulb.type.toUpperCase().includes(`LED`) ? `LED` : `Conventional`;
  }
  return `None`;
}

/**
 * Get current datetime returned as a properly formatted string.
 * @returns {string} formatted datetime
 */
function getFormattedDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, `0`)}-${String(now.getDate()).padStart(2, `0`)}T${String(now.getHours()).padStart(2, `0`)}:${String(now.getMinutes()).padStart(2, `0`)}:${String(now.getSeconds()).padStart(2, `0`)}`;
}
