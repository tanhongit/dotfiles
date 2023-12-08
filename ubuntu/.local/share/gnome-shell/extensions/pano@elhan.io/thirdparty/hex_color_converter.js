var lib = (function () {
  'use strict';

  const opacity$1 = (hex, opacity) => {
    if (typeof hex !== 'string' || !/^#([A-Fa-f0-9]{3}$|[A-Fa-f0-9]{6}$|[A-Fa-f0-9]{8}$)/.test(hex)) throw new Error('Invalid hexadecimal color value')
    if (typeof opacity !== 'number' || opacity > 1 || opacity < 0) throw new Error('Opacity should be float between 0 - 1')
    let color = hex.substring(1);
    if (color.length === 8) color = color.substring(0, color.length - 2);
    if (color.length === 3) color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
    color += Math.round(opacity * 255).toString(16).padStart(2, '0');
    return `#${color}`.toUpperCase()
  };

  var lib$1 = opacity$1;

  const opacity = lib$1;

  const convert = (color) => {
    if (typeof color !== 'string') throw new Error('Invalid rgb(a) color value')
    if (/^#([A-Fa-f0-9]{3}$|[A-Fa-f0-9]{6}$|[A-Fa-f0-9]{8}$)$/.test(color)) return color
    const rgb = /rgb\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)/.exec(color);
    const rgba = /rgba\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3}), ?(1|(0(?:\.\d{1,2})?))\)/.exec(color);
    if (rgb !== null) {
      let hexadecimal = '#';
      if (rgb[1].length > 1) hexadecimal += Number(rgb[1]).toString(16);
      else hexadecimal += '0' + Number(rgb[1]).toString(16);
      if (rgb[2].length > 1) hexadecimal += Number(rgb[2]).toString(16);
      else hexadecimal += '0' + Number(rgb[2]).toString(16);
      if (rgb[3].length > 1) hexadecimal += Number(rgb[3]).toString(16);
      else hexadecimal += '0' + Number(rgb[3]).toString(16);
      return hexadecimal.toUpperCase()
    } else if (rgba !== null) {
      let hexadecimal = '#';
      if (rgba[1].length > 1) hexadecimal += Number(rgba[1]).toString(16);
      else hexadecimal += '0' + Number(rgba[1]).toString(16);
      if (rgba[2].length > 1) hexadecimal += Number(rgba[2]).toString(16);
      else hexadecimal += '0' + Number(rgba[2]).toString(16);
      if (rgba[3].length > 1) hexadecimal += Number(rgba[3]).toString(16);
      else hexadecimal += '0' + Number(rgba[3]).toString(16);
      hexadecimal = opacity(hexadecimal, Number(rgba[4]));
      return hexadecimal.toUpperCase()
    } else throw new Error('Invalid rgb(a) color value')
  };

  var lib = convert;

  return lib;

})();
