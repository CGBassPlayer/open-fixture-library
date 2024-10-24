/**
 * @readonly
 */
const CHANNEL_TYPE_MAPPINGS = {
  // DIMMER
  INTENSITY: {
    attribute: "DIM",
    feature: "DIMMER",
    preset: "DIMMER",
    subattribute: "DIM"
  },
  SHUTTER: {
    attribute: "SHUTTER",
    feature: "SHUTTER",
    preset: "BEAM",
    subattribute: "SHUTTER"
  },

  // POSITION
  PAN: {
    attribute: "PAN",
    feature: "POSITION",
    preset: "POSITION",
    subattribute: "PAN"
  },
  TILT: {
    attribute: "TILT",
    feature: "POSITION",
    preset: "POSITION",
    subattribute: "TILT"
  },
  PANTILTSPEED: {
    attribute: "POSITIONMSPEED",
    feature: "POSITION",
    preset: "POSITION",
    subattribute: "TILT"
  },

  // OFL_TYPE : {
  //     attribute: "",
  //     feature: "",
  //     preset: "",
  //     subattribute: ""
  // },

  // COLOR
  RED: {
    attribute: "COLORRGB1",
    feature: "COLORRGB",
    preset: "COLOR",
    subattribute: "COLORRGB1"
  },
  GREEN: {
    attribute: "COLORRGB2",
    feature: "COLORRGB",
    preset: "COLOR",
    subattribute: "COLORRGB2"
  },
  BLUE: {
    attribute: "COLORRGB3",
    feature: "COLORRGB",
    preset: "COLOR",
    subattribute: "COLORRGB3"
  },
  WHITE: {
    attribute: "COLORRGB5",
    feature: "COLORRGB",
    preset: "COLOR",
    subattribute: "COLORRGB5"
  },
  AMBER: {
    attribute: "COLORRGB4",
    feature: "COLORRGB",
    preset: "COLOR",
    subattribute: "COLORRGB4"
  },
  UV: {
    attribute: "COLORRGB15",
    feature: "COLORRGB",
    preset: "COLOR",
    subattribute: "COLORRGB15"
  },
  CYAN: {
    attribute: "COLORRGB12",
    feature: "COLORRGB",
    preset: "COLOR",
    subattribute: "COLORRGB12"
  },
  MAGENTA: {
    attribute: "COLORRGB13",
    feature: "COLORRGB",
    preset: "COLOR",
    subattribute: "COLORRGB13"
  },
  YELLOW: {
    attribute: "COLORRGB14",
    feature: "COLORRGB",
    preset: "COLOR",
    subattribute: "COLORRGB14"
  },
  "WARM WHITE": {
    attribute: "COLORRGB6",
    feature: "COLORRGB",
    preset: "COLOR",
    subattribute: "COLORRGB6"
  },
  "COOL WHITE": {
    attribute: "COLORRGB7",
    feature: "COLORRGB",
    preset: "COLOR",
    subattribute: "COLORRGB7"
  },
  LIME: {
    attribute: "COLORRGB19",
    feature: "COLORRGB",
    preset: "COLOR",
    subattribute: "COLORRGB19"
  },
  INDIGO: {
    attribute: "COLORRGB11",
    feature: "COLORRGB",
    preset: "COLOR",
    subattribute: "COLORRGB11"
  }
};

export default CHANNEL_TYPE_MAPPINGS;
