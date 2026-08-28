function hslToRgb(hue: number, saturation: number, lightness: number): [number, number, number] {
  if (hue === undefined || Number.isNaN(hue)) {
    return [0, 0, 0];
  }

  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const huePrime = hue / 60;
  const secondComponent = chroma * (1 - Math.abs((huePrime % 2) - 1));
  const segment = Math.floor(huePrime);

  let red = 0;
  let green = 0;
  let blue = 0;

  if (segment === 0) {
    red = chroma;
    green = secondComponent;
  } else if (segment === 1) {
    red = secondComponent;
    green = chroma;
  } else if (segment === 2) {
    green = chroma;
    blue = secondComponent;
  } else if (segment === 3) {
    green = secondComponent;
    blue = chroma;
  } else if (segment === 4) {
    red = secondComponent;
    blue = chroma;
  } else if (segment === 5) {
    red = chroma;
    blue = secondComponent;
  }

  const adjustment = lightness - chroma / 2;

  return [
    Math.abs(Math.round((red + adjustment) * 255)),
    Math.abs(Math.round((green + adjustment) * 255)),
    Math.abs(Math.round((blue + adjustment) * 255)),
  ];
}

function clamp(value: number, max: number, min: number) {
  return value > max ? max : value < min ? min : value;
}

function cycleHue(value: number) {
  let hue = clamp(value, 1e7, -1e7);
  while (hue < 0) hue += 360;
  while (hue > 359) hue -= 360;
  return hue;
}

function hslToHex(hue: number, saturation: number, luminosity: number) {
  const rgb = hslToRgb(cycleHue(hue), clamp(saturation, 100, 0) / 100, clamp(luminosity, 100, 0) / 100);
  return `#${rgb.map((channel) => (256 + channel).toString(16).slice(-2)).join('')}`;
}

export default hslToHex;
