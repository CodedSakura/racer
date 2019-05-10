import React from "react";
import "../Style/SidePanes.scss";
import {classMap, debug} from "../data";

export const Options = props => {
  const {toggleSize, size, toggleGamepad, gamepad, className, ...rest} = props;
  return <div className={classMap("options pane", className)} {...rest}>
    <h2>Options</h2>
    <div><button onClick={toggleSize}>Toggle Size</button> {size ? "(big)" : ""}</div>
    <div><button onClick={() => {
      if (document.fullscreenElement) document.exitFullscreen().then();
      else document.documentElement.requestFullscreen().then();
    }}>{document.fullscreenElement ? "Exit fullscreen" : "Go fullscreen"}</button></div>
    <div><button onClick={toggleGamepad}>Toggle Controller</button> ({gamepad ? "on" : "off"})</div>
  </div>;
};

export const Tracks = props => {
  const {tracks, setTrack, className, ...rest} = props;
  return <div className={classMap("tracks pane", className)} {...rest}>
    <h2>Tracks</h2>
    {tracks.length > 0 ? tracks.map((v, k) =>
      <div key={k} className="track" onClick={() => setTrack(k)}>{v.name}</div>
    ) : <div>No tracks found</div>}
  </div>;
};

export const Stats = props => {
  const {className, ...rest} = props;
  return <div className={classMap("stats pane pane-right", className)} {...rest}>
    <h2>Stats</h2>
    <div>Version: a0.4.2</div>
    <div>Debug: {debug.toString()}</div>
  </div>;
};