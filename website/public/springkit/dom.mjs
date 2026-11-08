// src/utils/named-colors.ts
var NAMED_COLORS = {
  aliceblue: 15792383,
  antiquewhite: 16444375,
  aqua: 65535,
  aquamarine: 8388564,
  azure: 15794175,
  beige: 16119260,
  bisque: 16770244,
  black: 0,
  blanchedalmond: 16772045,
  blue: 255,
  blueviolet: 9055202,
  brown: 10824234,
  burlywood: 14596231,
  cadetblue: 6266528,
  chartreuse: 8388352,
  chocolate: 13789470,
  coral: 16744272,
  cornflowerblue: 6591981,
  cornsilk: 16775388,
  crimson: 14423100,
  cyan: 65535,
  darkblue: 139,
  darkcyan: 35723,
  darkgoldenrod: 12092939,
  darkgray: 11119017,
  darkgreen: 25600,
  darkgrey: 11119017,
  darkkhaki: 12433259,
  darkmagenta: 9109643,
  darkolivegreen: 5597999,
  darkorange: 16747520,
  darkorchid: 10040012,
  darkred: 9109504,
  darksalmon: 15308410,
  darkseagreen: 9419919,
  darkslateblue: 4734347,
  darkslategray: 3100495,
  darkslategrey: 3100495,
  darkturquoise: 52945,
  darkviolet: 9699539,
  deeppink: 16716947,
  deepskyblue: 49151,
  dimgray: 6908265,
  dimgrey: 6908265,
  dodgerblue: 2003199,
  firebrick: 11674146,
  floralwhite: 16775920,
  forestgreen: 2263842,
  fuchsia: 16711935,
  gainsboro: 14474460,
  ghostwhite: 16316671,
  gold: 16766720,
  goldenrod: 14329120,
  gray: 8421504,
  green: 32768,
  greenyellow: 11403055,
  grey: 8421504,
  honeydew: 15794160,
  hotpink: 16738740,
  indianred: 13458524,
  indigo: 4915330,
  ivory: 16777200,
  khaki: 15787660,
  lavender: 15132410,
  lavenderblush: 16773365,
  lawngreen: 8190976,
  lemonchiffon: 16775885,
  lightblue: 11393254,
  lightcoral: 15761536,
  lightcyan: 14745599,
  lightgoldenrodyellow: 16448210,
  lightgray: 13882323,
  lightgreen: 9498256,
  lightgrey: 13882323,
  lightpink: 16758465,
  lightsalmon: 16752762,
  lightseagreen: 2142890,
  lightskyblue: 8900346,
  lightslategray: 7833753,
  lightslategrey: 7833753,
  lightsteelblue: 11584734,
  lightyellow: 16777184,
  lime: 65280,
  limegreen: 3329330,
  linen: 16445670,
  magenta: 16711935,
  maroon: 8388608,
  mediumaquamarine: 6737322,
  mediumblue: 205,
  mediumorchid: 12211667,
  mediumpurple: 9662683,
  mediumseagreen: 3978097,
  mediumslateblue: 8087790,
  mediumspringgreen: 64154,
  mediumturquoise: 4772300,
  mediumvioletred: 13047173,
  midnightblue: 1644912,
  mintcream: 16121850,
  mistyrose: 16770273,
  moccasin: 16770229,
  navajowhite: 16768685,
  navy: 128,
  oldlace: 16643558,
  olive: 8421376,
  olivedrab: 7048739,
  orange: 16753920,
  orangered: 16729344,
  orchid: 14315734,
  palegoldenrod: 15657130,
  palegreen: 10025880,
  paleturquoise: 11529966,
  palevioletred: 14381203,
  papayawhip: 16773077,
  peachpuff: 16767673,
  peru: 13468991,
  pink: 16761035,
  plum: 14524637,
  powderblue: 11591910,
  purple: 8388736,
  rebeccapurple: 6697881,
  red: 16711680,
  rosybrown: 12357519,
  royalblue: 4286945,
  saddlebrown: 9127187,
  salmon: 16416882,
  sandybrown: 16032864,
  seagreen: 3050327,
  seashell: 16774638,
  sienna: 10506797,
  silver: 12632256,
  skyblue: 8900331,
  slateblue: 6970061,
  slategray: 7372944,
  slategrey: 7372944,
  snow: 16775930,
  springgreen: 65407,
  steelblue: 4620980,
  tan: 13808780,
  teal: 32896,
  thistle: 14204888,
  tomato: 16737095,
  turquoise: 4251856,
  violet: 15631086,
  wheat: 16113331,
  white: 16777215,
  whitesmoke: 16119285,
  yellow: 16776960,
  yellowgreen: 10145074
};
function namedColorToRgb(name) {
  const key = name.toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(NAMED_COLORS, key)) return null;
  const packed = NAMED_COLORS[key];
  if (packed === void 0) return null;
  return { r: packed >> 16 & 255, g: packed >> 8 & 255, b: packed & 255 };
}

// src/utils/warnings.ts
var isDev = typeof process !== "undefined" && process.env?.NODE_ENV !== "production";
var warnedMessages = /* @__PURE__ */ new Set();
function warnOnce(message) {
  if (!isDev || warnedMessages.has(message)) return;
  warnedMessages.add(message);
  console.warn(`[SpringKit] ${message}`);
}

// src/utils/color.ts
var NUMBER = /[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/.source;
var FUNCTIONAL_COLOR_REGEX = new RegExp(
  String.raw`^(rgba?|hsla?)\(\s*(${NUMBER})(deg|%)?\s*,?\s*(${NUMBER})(%)?\s*,?\s*(${NUMBER})(%)?\s*(?:[,/]\s*(${NUMBER})(%)?\s*)?\)$`,
  "i"
);
function isColorString(value) {
  if (typeof value !== "string") return false;
  const input = value.trim();
  return /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(input) || /^(?:rgba?|hsla?)\(/i.test(input) || input.toLowerCase() === "transparent" || namedColorToRgb(input) !== null;
}
function parseColorRGBA(color) {
  const input = color.trim();
  if (input.toLowerCase() === "transparent") {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  if (/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(input)) {
    return { ...hexToRgb(input), a: hexAlpha(input) };
  }
  const match = input.match(FUNCTIONAL_COLOR_REGEX);
  if (match) {
    const fn = match[1].toLowerCase();
    const alphaValue = match[8];
    let a = 1;
    if (alphaValue !== void 0) {
      a = parseFloat(alphaValue) / (match[9] ? 100 : 1);
      a = Math.max(0, Math.min(1, a));
    }
    if (fn.startsWith("rgb")) {
      const channel = (value, percent) => Math.max(0, Math.min(255, Math.round(percent ? parseFloat(value) / 100 * 255 : parseFloat(value))));
      return {
        r: channel(match[2], match[3] === "%" ? "%" : void 0),
        g: channel(match[4], match[5]),
        b: channel(match[6], match[7]),
        a
      };
    }
    return {
      ...hslToRgb(parseFloat(match[2]), parseFloat(match[4]), parseFloat(match[6])),
      a
    };
  }
  const named = namedColorToRgb(input);
  if (named) return { ...named, a: 1 };
  warnOnce(`Unrecognized color "${color}"; using black.`);
  return { r: 0, g: 0, b: 0, a: 1 };
}
function hexAlpha(hex) {
  const cleanHex = hex.replace("#", "");
  if (cleanHex.length === 4) {
    return parseInt(cleanHex.charAt(3) + cleanHex.charAt(3), 16) / 255;
  }
  if (cleanHex.length === 8) {
    return parseInt(cleanHex.slice(6, 8), 16) / 255;
  }
  return 1;
}
function hexToRgb(hex) {
  const cleanHex = hex.replace("#", "");
  if (cleanHex.length === 3 || cleanHex.length === 4) {
    return {
      r: parseInt(cleanHex.charAt(0) + cleanHex.charAt(0), 16),
      g: parseInt(cleanHex.charAt(1) + cleanHex.charAt(1), 16),
      b: parseInt(cleanHex.charAt(2) + cleanHex.charAt(2), 16)
    };
  }
  return {
    r: parseInt(cleanHex.slice(0, 2), 16),
    g: parseInt(cleanHex.slice(2, 4), 16),
    b: parseInt(cleanHex.slice(4, 6), 16)
  };
}
function hslToRgb(h, s, l) {
  h = (h % 360 + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  if (s === 0) {
    const gray = Math.round(l * 255);
    return { r: gray, g: gray, b: gray };
  }
  const hue2rgb = (p2, q2, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p2 + (q2 - p2) * 6 * t;
    if (t < 1 / 2) return q2;
    if (t < 2 / 3) return p2 + (q2 - p2) * (2 / 3 - t) * 6;
    return p2;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, h / 360 + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h / 360) * 255),
    b: Math.round(hue2rgb(p, q, h / 360 - 1 / 3) * 255)
  };
}
function formatRGBA(color) {
  const channel = (v) => Math.round(Math.max(0, Math.min(255, v)));
  const rgb = `${channel(color.r)}, ${channel(color.g)}, ${channel(color.b)}`;
  const alpha = Math.round(Math.max(0, Math.min(1, color.a)) * 1e3) / 1e3;
  return alpha >= 1 ? `rgb(${rgb})` : `rgba(${rgb}, ${alpha})`;
}

// src/dom/values.ts
var NUMERIC_TEMPLATE = {
  id: "number",
  numeric: true,
  parts: ["", ""],
  kinds: ["n"],
  size: 1
};
var TOKEN_REGEX = /\burl\([^)]*\)|#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|(?:rgba?|hsla?)\([^)]*\)|[a-z][a-z0-9-]*|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi;
var ALPHA_EPSILON = 1e-6;
function parseString(value) {
  const parts = [];
  const kinds = [];
  const channels = [];
  const colors = [];
  let literal = "";
  let last = 0;
  for (const match of value.matchAll(TOKEN_REGEX)) {
    const text = match[0];
    const index = match.index ?? 0;
    const first = text.charCodeAt(0);
    const isNumber = first >= 48 && first <= 57 || text[0] === "." || text[0] === "-" || text[0] === "+";
    let color = null;
    if (!isNumber) {
      const isFunction = text.endsWith(")");
      const nested = isFunction && text.indexOf("(") !== text.lastIndexOf("(");
      const isCall = !isFunction && value[index + text.length] === "(";
      if (!nested && !isCall && isColorString(text)) color = parseColorRGBA(text);
      if (!color) continue;
    }
    literal += value.slice(last, index);
    parts.push(literal);
    literal = "";
    last = index + text.length;
    if (color) {
      kinds.push("c");
      const a = Math.max(0, Math.min(1, color.a));
      channels.push(color.r * a, color.g * a, color.b * a, a);
      colors.push(color);
    } else {
      kinds.push("n");
      channels.push(parseFloat(text));
      colors.push(void 0);
    }
  }
  literal += value.slice(last);
  parts.push(literal);
  return {
    raw: value,
    template: {
      id: `${kinds.join("")}${parts.join("")}`,
      numeric: false,
      parts,
      kinds,
      size: channels.length
    },
    channels,
    colors
  };
}
var cache = /* @__PURE__ */ new Map();
var CACHE_LIMIT = 500;
function parseAnimatableValue(value) {
  if (typeof value === "number") {
    return { raw: value, template: NUMERIC_TEMPLATE, channels: [value], colors: [] };
  }
  let parsed = cache.get(value);
  if (!parsed) {
    parsed = parseString(value);
    if (cache.size >= CACHE_LIMIT) cache.clear();
    cache.set(value, parsed);
  }
  return parsed;
}
var formatNumber = (value) => String(Math.round(value * 1e6) / 1e6 || 0);
function composeAnimatableValue(target, channels) {
  const { template } = target;
  if (template.numeric) return channels[0] ?? target.raw;
  let exact = true;
  for (let i = 0; i < template.size; i++) {
    const value = channels[i];
    if (value === void 0) return target.raw;
    if (value !== target.channels[i]) exact = false;
  }
  if (exact) return target.raw;
  let result = template.parts[0] ?? "";
  let c = 0;
  for (let i = 0; i < template.kinds.length; i++) {
    if (template.kinds[i] === "n") {
      result += formatNumber(channels[c]);
      c += 1;
    } else {
      const alpha = channels[c + 3];
      if (alpha <= ALPHA_EPSILON) {
        const color = target.colors[i] ?? { r: 0, g: 0, b: 0};
        result += formatRGBA({ r: color.r, g: color.g, b: color.b, a: 0 });
      } else {
        result += formatRGBA({
          r: channels[c] / alpha,
          g: channels[c + 1] / alpha,
          b: channels[c + 2] / alpha,
          a: alpha
        });
      }
      c += 4;
    }
    result += template.parts[i + 1] ?? "";
  }
  return result;
}
function hiddenChannelKey(key, index) {
  return `\0${key}\0${index}`;
}
var defaultChannelKeysOf = (key, value) => {
  if (value.template.numeric) return [key];
  const keys = [];
  for (let i = 0; i < value.template.size; i++) keys.push(hiddenChannelKey(key, i));
  return keys;
};
function parseAnimatableRecord(values) {
  const result = {};
  for (const key in values) result[key] = parseAnimatableValue(values[key]);
  return result;
}
function channelValuesOf(values, keysOf) {
  const result = {};
  for (const key in values) {
    const value = values[key];
    const keys = keysOf(key, value);
    for (let i = 0; i < keys.length; i++) result[keys[i]] = value.channels[i];
  }
  return result;
}
function composeAnimatableRecord(values, channels, keysOf) {
  const result = {};
  for (const key in values) {
    const value = values[key];
    result[key] = composeAnimatableValue(
      value,
      keysOf(key, value).map((channelKey) => channels[channelKey])
    );
  }
  return result;
}
function animatableSignature(values) {
  let signature = "";
  for (const key in values) {
    const value = values[key];
    signature += `${key}${typeof value === "number" ? "n" : "s"}${String(value)}`;
  }
  return signature;
}
function planTransition(from, to, keysOf, instant) {
  const plan = { jump: {}, set: {}, structural: false };
  for (const key in to) {
    const next = to[key];
    const previous = from[key];
    const sameTemplate = previous !== void 0 && previous.template.id === next.template.id;
    if (!sameTemplate) plan.structural = true;
    const destination = sameTemplate && !instant ? plan.set : plan.jump;
    const keys = keysOf(key, next);
    for (let i = 0; i < keys.length; i++) destination[keys[i]] = next.channels[i];
  }
  for (const key in from) {
    if (!(key in to)) plan.structural = true;
  }
  return plan;
}
function hasKeys(record) {
  for (const _ in record) return true;
  return false;
}

// src/dom/style.ts
var unitless = /* @__PURE__ */ new Set([
  "animationIterationCount",
  "aspectRatio",
  "borderImageOutset",
  "borderImageSlice",
  "borderImageWidth",
  "boxFlex",
  "boxFlexGroup",
  "boxOrdinalGroup",
  "columnCount",
  "columns",
  "fillOpacity",
  "flex",
  "flexGrow",
  "flexPositive",
  "flexShrink",
  "flexNegative",
  "flexOrder",
  "floodOpacity",
  "fontWeight",
  "gridArea",
  "gridRow",
  "gridRowEnd",
  "gridRowSpan",
  "gridRowStart",
  "gridColumn",
  "gridColumnEnd",
  "gridColumnSpan",
  "gridColumnStart",
  "lineClamp",
  "lineHeight",
  "opacity",
  "order",
  "orphans",
  "scale",
  "stopOpacity",
  "strokeDasharray",
  "strokeDashoffset",
  "strokeMiterlimit",
  "strokeOpacity",
  "strokeWidth",
  "tabSize",
  "widows",
  "zIndex",
  "zoom",
  "WebkitLineClamp"
]);
var transforms = /* @__PURE__ */ new WeakMap();
var transformKeys = /* @__PURE__ */ new Set(["x", "y", "z", "scale", "scaleX", "scaleY", "scaleZ", "rotate", "rotateX", "rotateY", "rotateZ", "skew", "skewX", "skewY", "perspective"]);
var cssName = (property) => property.startsWith("--") ? property : property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
var unit = (value, suffix, fallback = 0) => typeof value === "string" ? value : `${value ?? fallback}${suffix}`;
function transformStyle(values) {
  const parts = [];
  if (values.perspective !== void 0) parts.push(`perspective(${unit(values.perspective, "px")})`);
  if (values.x !== void 0 || values.y !== void 0 || values.z !== void 0) parts.push(`translate3d(${unit(values.x, "px")}, ${unit(values.y, "px")}, ${unit(values.z, "px")})`);
  if (values.scale !== void 0) parts.push(`scale(${values.scale})`);
  else if (values.scaleX !== void 0 || values.scaleY !== void 0) parts.push(`scale(${values.scaleX ?? 1}, ${values.scaleY ?? 1})`);
  if (values.scaleZ !== void 0) parts.push(`scaleZ(${values.scaleZ})`);
  for (const key of ["rotateX", "rotateY", "rotate", "skew", "skewX", "skewY"]) {
    const value = values[key] ?? (key === "rotate" ? values.rotateZ : void 0);
    if (value !== void 0) parts.push(`${key}(${unit(value, "deg")})`);
  }
  return parts.join(" ");
}
function writeStyle(element, property, value) {
  const style = element.style;
  if (!style) return;
  if (transformKeys.has(property)) {
    const values = transforms.get(element) ?? {};
    transforms.set(element, values);
    values[property] = value;
    style.transform = transformStyle(values);
  } else {
    const suffix = typeof value === "number" && value !== 0 && !property.startsWith("--") && !unitless.has(property) ? "px" : "";
    style.setProperty(cssName(property), `${value}${suffix}`);
  }
}
function writeStyles(element, values) {
  for (const key in values) if (values[key] !== void 0) writeStyle(element, key, values[key]);
}
function readStyle(element, property) {
  if (transformKeys.has(property)) return transforms.get(element)?.[property] ?? (property.startsWith("scale") ? 1 : 0);
  const value = element.style?.getPropertyValue(cssName(property)) || getComputedStyle(element).getPropertyValue(cssName(property));
  return value || (property === "opacity" ? 1 : 0);
}
var isReadable = (value) => typeof value === "object" && value !== null && typeof value.subscribe === "function";
function bindStyle(element, values) {
  const unsubscribers = [];
  for (const [key, value] of Object.entries(values)) {
    if (isReadable(value)) {
      writeStyle(element, key, value.get());
      unsubscribers.push(value.subscribe((next) => writeStyle(element, key, next)));
    } else writeStyle(element, key, value);
  }
  return () => {
    for (const unsubscribe of unsubscribers.splice(0)) unsubscribe();
  };
}
function bindAttribute(element, name, value) {
  element.setAttribute(name, String(value.get()));
  return value.subscribe((next) => element.setAttribute(name, String(next)));
}

export { animatableSignature, bindAttribute, bindStyle, channelValuesOf, composeAnimatableRecord, composeAnimatableValue, defaultChannelKeysOf, hasKeys, hiddenChannelKey, parseAnimatableRecord, parseAnimatableValue, planTransition, readStyle, transformStyle, writeStyle, writeStyles };
