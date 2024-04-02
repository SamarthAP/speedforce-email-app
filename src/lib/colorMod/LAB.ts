const REF_X = 95.047;
const REF_Y = 100;
const REF_Z = 108.883;

export function transformation(t: number) {
  if (t > 0.008856) {
    return Math.pow(t, 1.0 / 3);
  }
  return 7.787 * t + 16.0 / 116;
}

// rgb color values to xyz
export function rgbToXyz(r: number, g: number, b: number) {
  if (r > 0.04045) {
    r = Math.pow((r + 0.055) / 1.055, 2.4);
  } else {
    r = r / 12.92;
  }

  if (g > 0.04045) {
    g = Math.pow((g + 0.055) / 1.055, 2.4);
  } else {
    g = g / 12.92;
  }

  if (b > 0.04045) {
    b = Math.pow((b + 0.055) / 1.055, 2.4);
  } else {
    b = b / 12.92;
  }

  r *= 100;
  g *= 100;
  b *= 100;

  return [
    r * 0.4124 + g * 0.3576 + b * 0.1805,
    r * 0.2126 + g * 0.7152 + b * 0.0722,
    r * 0.0193 + g * 0.1192 + b * 0.9505,
  ];
}

export function xyzToLab(x: number, y: number, z: number) {
  const xRatio = x / REF_X;
  const yRatio = y / REF_Y;
  const zRatio = z / REF_Z;

  return [
    yRatio > 0.008856 ? 116 * Math.pow(yRatio, 1.0 / 3) - 16 : 903.3 * yRatio,
    500 * (transformation(xRatio) - transformation(yRatio)),
    200 * (transformation(yRatio) - transformation(zRatio)),
  ];
}

export function labToXyz(lValue: number, a: number, b: number) {
  const p = (lValue + 16) / 116;
  return [
    REF_X * Math.pow(p + a / 500, 3),
    REF_Y * Math.pow(p, 3),
    REF_Z * Math.pow(p - b / 200, 3),
  ];
}

export function xyzToRgb(x: number, y: number, z: number) {
  x = x / 100;
  y = y / 100;
  z = z / 100;

  let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  let b = x * 0.0557 + y * -0.204 + z * 1.057;

  if (r > 0.0031308) {
    r = 1.055 * Math.pow(r, 1 / 2.4) - 0.055;
  } else {
    r = 12.92 * r;
  }

  if (g > 0.0031308) {
    g = 1.055 * Math.pow(g, 1 / 2.4) - 0.055;
  } else {
    g = 12.92 * g;
  }

  if (b > 0.0031308) {
    b = 1.055 * Math.pow(b, 1 / 2.4) - 0.055;
  } else {
    b = 12.92 * b;
  }

  return [r, g, b];
}

export function labToRgb(lValue: number, a: number, b: number) {
  const xyz = labToXyz(lValue, a, b);
  const rgb = xyzToRgb(xyz[0], xyz[1], xyz[2]);

  return [
    Math.min(255, Math.max(0, Math.round(rgb[0] * 255))),
    Math.min(255, Math.max(0, Math.round(rgb[1] * 255))),
    Math.min(255, Math.max(0, Math.round(rgb[2] * 255))),
  ];
}

export function rgbToLab(r: number, g: number, b: number) {
  const _r = r / 255.0;
  const _g = g / 255.0;
  const _b = b / 255.0;
  const xyz = rgbToXyz(_r, _g, _b);

  return xyzToLab(xyz[0], xyz[1], xyz[2]);
}
