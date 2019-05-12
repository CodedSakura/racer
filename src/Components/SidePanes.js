import React from "react";
import "../Style/SidePanes.scss";
import {classMap} from "../utils";
import {withContext} from "./Context";

export const Options = withContext(props => {
  const {toggleSize, toggleGamepad, toggleDebug, className, context: {gamepad, debug}, ...rest} = props;
  return <div className={classMap("options pane", className)} {...rest}>
    <h2>Options</h2>
    <div className="entry-cont">
      <div onClick={toggleDebug}>
        <span>Toggle Debugging</span>
        <span className="align-right">({debug.toString()})</span>
      </div>
      <div onClick={toggleSize}><span>Toggle Size</span></div>
      <div onClick={() => {
          if (document.fullscreenElement) document.exitFullscreen().then();
          else document.documentElement.requestFullscreen().then();
        }}>
        <span>{document.fullscreenElement ? "Exit" : "Go"} fullscreen</span>
      </div>
      <div onClick={toggleGamepad}>
        <span>Toggle Controller</span>
        <span className="align-right">({gamepad ? "on" : "off"})</span>
      </div>
    </div>
  </div>;
});

export const Tracks = props => {
  const {tracks = [], setTrack = () => {}, className = "", ...rest} = props;
  return <div className={classMap("tracks pane", className)} {...rest}>
    <h2>Tracks</h2>
    {tracks.length > 0 ? <div className="entry-cont">{tracks.map((v, k) => <div key={k} onClick={() => setTrack(k)}>{v.name}</div>)}</div> : <div>No tracks found</div>}
  </div>;
};

export const Cars = props => {
  const {cars = [], setCar = () => {}, className = "", ...rest} = props;
  return <div className={classMap("cars pane", className)} {...rest}>
    <h2>Cars</h2>
    {cars.length > 0 ? <div className="entry-cont">{cars.map((v, k) => <div key={k} onClick={() => setCar(k)}>{v.name}</div>)}</div> : <div>No cars found</div>}
  </div>;
};

export const Stats = withContext(props => {
  const {className, context: {debug}, ...rest} = props;
  return <div className={classMap("stats pane", className)} {...rest}>
    <h2>Stats</h2>
    <div>Version: a0.5</div>
    <div>Debug: {debug.toString()}</div>
  </div>;
});
