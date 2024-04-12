import { labToRgb, rgbToLab } from "./LAB";

/* ========== FOR GRAYSCALE FILTER ========== */
// hue of inverted gray color, which is blue. TODO: avg of gray colors from palette
const GRAY_HUE = 212;
// min value of color ratio. min larger than max to invert color
const RATIO_MIN = 1;
// max value of color ratio. comes from pur gray color that has closest lightness (L value in CIELAB color space) to gray 900
// ex, white will be inverted to ~gray 900, and black will be inverted to white
const RATIO_MAX = 33 / 255;
// min value of saturation. the brighter the color, the less saturated it will be.
// this value determines the max amount of blue we are adding to the inverted grey color
const SATURATION_MIN = 0.05;
// max value of saturation.
const SATURATION_MAX = 0;
/* ========== FOR GRAYSCALE FILTER ========== */

/* ========== FOR INVERT FILTER ========== */
// lightness value of grey 900 base color in CIELAB color space
const BASE_GRAY_LIGHTNESS = 12.748;
/* ========== FOR INVERT FILTER ========== */

/* ========== FOR LINK COLOR FILTER ========== */
const LIGHT_LINK_TEXT_COLOR: Color = {
  // not in use atm
  r: 0x42,
  g: 0x85,
  b: 0xf4,
  a: 1,
};
const DARK_LINK_TEXT_COLOR: Color = {
  r: 0x25,
  g: 0x63,
  b: 0xeb,
  a: 1,
};
/* ========== FOR LINK COLOR FILTER ========== */

const BORDER_COLOR_CSS_PROPERTY_NAMES = [
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
];

// br, button, canvas, iframe, input, select, style, svg, textarea
export const DISALLOWED_TAGS = [
  "BR",
  "BUTTON",
  "CANVAS",
  "IFRAME",
  "INPUT",
  "SELECT",
  "STYLE",
  "SVG",
  "TEXTAREA",
];

// interface for color
interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

// interface for function that takes and element and its color and returns the dark mode color or null
interface ColorFilterFunction {
  (element: HTMLElement, color: Color): Color | null;
}

function scale(
  num: number,
  in_min: number,
  in_max: number,
  out_min: number,
  out_max: number
) {
  if (num < in_min) {
    return num;
  }

  return ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
}

function colorsAreEqual(color1: Color, color2: Color) {
  return (
    color1.r === color2.r &&
    color1.g === color2.g &&
    color1.b === color2.b &&
    color1.a === color2.a
  );
}

function colorToCssString(color: Color) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
}

function hueToRgb(temp1: number, temp2: number, vH: number) {
  if (vH < 0) {
    vH += 1;
  } else if (vH > 1) {
    vH -= 1;
  }

  if (6 * vH < 1) {
    return temp1 + (temp2 - temp1) * 6 * vH;
  }

  if (2 * vH < 1) {
    return temp2;
  }

  if (3 * vH < 2) {
    return temp1 + (temp2 - temp1) * (2 / 3 - vH) * 6;
  }

  return temp1;
}

function hslToRgb(h: number, s: number, l: number) {
  let r = 0;
  let g = 0;
  let b = 0;
  const normH = h / 360; // normalize h to [0, 1]

  if (s === 0) {
    r = g = b = l * 255;
  } else {
    let temp1 = 0;
    let temp2 = 0;

    if (l < 0.5) {
      temp2 = l * (1 + s);
    } else {
      temp2 = l + s - s * l;
    }

    temp1 = 2 * l - temp2;
    r = 255 * hueToRgb(temp1, temp2, normH + 1 / 3);
    g = 255 * hueToRgb(temp1, temp2, normH);
    b = 255 * hueToRgb(temp1, temp2, normH - 1 / 3);
  }

  return [Math.round(r), Math.round(g), Math.round(b)];
}

function rgbToHsl(r: number, g: number, b: number) {
  const normR = r / 255;
  const normG = g / 255;
  const normB = b / 255;

  const max = Math.max(normR, normG, normB);
  const min = Math.min(normR, normG, normB);

  let h = 0;
  let s = 0;

  const l = 0.5 * (max + min);

  if (max !== min) {
    if (max === normR) {
      h = (60 * (normG - normB)) / (max - min);
    } else if (max === normG) {
      h = (60 * (normB - normR)) / (max - min) + 120;
    } else if (max === normB) {
      h = (60 * (normR - normG)) / (max - min) + 240;
    }

    if (0 < l && l <= 0.5) {
      s = (max - min) / (2 * l);
    } else {
      s = (max - min) / (2 - 2 * l);
    }
  }

  return [Math.round(h + 360) % 360, s, l];
}

// grayscale color filter function
const grayscaleFilter: ColorFilterFunction = (element, color) => {
  if (color.r !== color.g || color.g !== color.b || color.a === 0) {
    // If the color is not grayscale or is transparent, return null
    return null;
  }

  // rgb values are the same
  const ratio = scale(color.r / 255, 0, 1, RATIO_MIN, RATIO_MAX);
  if (ratio === RATIO_MIN) {
    return {
      r: 0xff,
      g: 0xff,
      b: 0xff,
      a: color.a,
    };
  } else if (ratio <= RATIO_MAX) {
    return {
      r: 0x20,
      g: 0x21,
      b: 0x24,
      a: color.a,
    };
  }

  const saturation = scale(
    ratio,
    RATIO_MAX,
    RATIO_MIN,
    SATURATION_MIN,
    SATURATION_MAX
  );
  const rgb = hslToRgb(GRAY_HUE, saturation, ratio);

  return {
    r: rgb[0],
    g: rgb[1],
    b: rgb[2],
    a: color.a,
  };
};

const invertColorFilter: ColorFilterFunction = (element, color) => {
  if (color.a === 0) {
    return color;
  }

  const lab = rgbToLab(color.r, color.g, color.b);

  lab[0] = scale(lab[0], 0, 100, 100, BASE_GRAY_LIGHTNESS);

  let rgb = labToRgb(lab[0], lab[1], lab[2]);

  const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  hsl[1] = scale(hsl[1], 0.3, 1, 0.3, 0.8);

  rgb = hslToRgb(hsl[0], hsl[1], hsl[2]);

  return {
    r: rgb[0],
    g: rgb[1],
    b: rgb[2],
    a: color.a,
  };
};

const defaultLinkColorFilter = (element: HTMLElement, color: Color) => {
  if (element.tagName === "A") {
    return DARK_LINK_TEXT_COLOR;
  }

  return null;
};

function parseColor(cssString: string): Color | null {
  // matches rbga(255, 255, 255, 0.5) or rgba(255, 255, 255)
  const match = cssString.match(
    /^rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i
  );

  if (match) {
    return {
      r: parseFloat(match[1]),
      g: parseFloat(match[2]),
      b: parseFloat(match[3]),
      a: match[4] ? parseFloat(match[4]) : 1,
    };
  } else {
    return null;
  }
}

function applyFiltersToElement(
  element: HTMLElement,
  elementColor: Color,
  colorFilterFunctions: ColorFilterFunction[]
) {
  let filterResult = null;
  for (const filter of colorFilterFunctions) {
    filterResult = filter(element, elementColor);
    if (filterResult) {
      break;
    }
  }

  return filterResult || elementColor;
}

export function applyDarkModeToElement(element: HTMLElement) {
  const computedStyle = window.getComputedStyle(element);
  const backgroundColor = computedStyle.getPropertyValue("background-color");
  const borderColor = computedStyle.getPropertyValue("border-color");
  const textColor = computedStyle.getPropertyValue("color");

  const backgroundColorObject = parseColor(backgroundColor);
  const borderColorObject = parseColor(borderColor);
  const textColorObject = parseColor(textColor);

  // If any of the colors are not valid, return early
  // If border color of 4 sides are different,, the property value will be empty string
  // this will be handled when processing border color later
  if (!backgroundColorObject || !textColorObject) {
    return;
  }

  const processedBackgroundColor = colorToCssString(
    applyFiltersToElement(element, backgroundColorObject, [
      grayscaleFilter,
      invertColorFilter,
    ])
  );

  const processedTextColor = colorToCssString(
    applyFiltersToElement(element, textColorObject, [
      grayscaleFilter,
      defaultLinkColorFilter,
      invertColorFilter,
    ])
  );

  let processedBorderColor;
  if (borderColorObject) {
    processedBorderColor = colorToCssString(
      applyFiltersToElement(element, borderColorObject, [
        grayscaleFilter,
        invertColorFilter,
      ])
    );
  } else {
    const processedBorderColors = [];
    for (const borderColorProperty of BORDER_COLOR_CSS_PROPERTY_NAMES) {
      const colorObject = parseColor(
        computedStyle.getPropertyValue(borderColorProperty)
      );
      if (!colorObject) {
        return null;
      }

      const processedColor = colorToCssString(
        applyFiltersToElement(element, colorObject, [
          grayscaleFilter,
          invertColorFilter,
        ])
      );
      processedBorderColors.push(processedColor);
    }
    processedBorderColor = processedBorderColors.join(" ");
  }

  return [processedBackgroundColor, processedBorderColor, processedTextColor];
}
