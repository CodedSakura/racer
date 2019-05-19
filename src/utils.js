export const breakpoints = [
  {name: "xs", min: 0},
  {name: "lg", min: 900},
];

export const classMap = (staticClasses, ...classes) => {
  for (const c of classes) if (c) staticClasses += " " + c.trim();
  return [...new Set(staticClasses.trim().split(" "))].join(" ") || undefined;
};

export const rad = deg => deg/180*Math.PI;
export const deg = rad => rad/Math.PI*180;

export const MDeg = {
  sin: i => Math.sin(rad(i)),
  cos: i => Math.cos(rad(i)),
  tan: i => Math.tan(rad(i))
};

const orientation = ({x: px, y: py}, {x: qx, y: qy}, {x: rx, y: ry}) => Math.sign((qy - py) * (rx - qx) - (qx - px) * (ry - qy));
const onSegment   = ({x: px, y: py}, {x: qx, y: qy}, {x: rx, y: ry}) => qx <= Math.max(px, rx) && qx >= Math.min(px, rx) && qy <= Math.max(py, ry) && qy >= Math.min(py, ry);
export const doIntersect = (a, b, c, d)  => {
  const o1 = orientation(a, b, c), o2 = orientation(a, b, d), o3 = orientation(c, d, a), o4 = orientation(c, d, b);
  return (o1 !== o2 && o3 !== o4) || (o1 === 0 && onSegment(a, c, b)) || (o2 === 0 && onSegment(a, d, b)) || (o3 === 0 && onSegment(c, a, d)) || (o4 === 0 && onSegment(c, b, d));
};

export const trackFile = "data.json";

export const framerate = 30;

export const debug = process.env.NODE_ENV === "development";