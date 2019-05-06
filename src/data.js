export const breakpoints = [
  {name: "xs", min: 0},
  {name: "lg", min: 900},
];

export const classMap = (staticClasses, ...classes) => {
  for (const c of classes) if (c) staticClasses += " " + c.trim();
  return staticClasses;
};

export const trackFile = "tracks.json";

export const framerate = 30;
export const playerSize = {w: 14.0 * 1.5, h: 8.0 * 1.5};
export const imageSize  = {w: 16.0 * 1.5, h: 10.0 * 1.5};

export const debug = process.env.NODE_ENV === "development";