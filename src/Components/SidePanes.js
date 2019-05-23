import React from "react";
import "../Style/SidePanes.scss";
import {classMap} from "../utils";
import {withContext} from "./Context";

export const Options = withContext(props => {
  const {context: {gamepad, debug}, toggleSize, toggleGamepad, toggleDebug, className = "", ...rest} = props;
  return <div className={classMap("options pane", className)} {...rest}>
    <h2>Options</h2>
    <div className="entry-cont">
      <div onClick={toggleDebug} className={classMap("", debug && "selected")}>
        <span>Toggle Debugging</span>
        {/*<span className="align-right">({debug.toString()})</span>*/}
      </div>
      <div onClick={toggleSize}><span>Toggle Size</span></div>
      <div onClick={() => {
          if (document.fullscreenElement) document.exitFullscreen().then();
          else document.documentElement.requestFullscreen().then();
        }}>
        <span>{document.fullscreenElement ? "Exit" : "Go"} fullscreen</span>
      </div>
      <div onClick={toggleGamepad} className={classMap("", gamepad && "selected")}>
        <span>Toggle Controller</span>
        {/*<span className="align-right">({gamepad ? "on" : "off"})</span>*/}
      </div>
    </div>
  </div>;
});

export const Tracks = withContext(props => {
  const {context: {data: {tracks = []}, track}, setTrack = () => {}, className = "", ...rest} = props;
  return <div className={classMap("tracks pane", className)} {...rest}>
    <h2>Tracks</h2>
    {tracks.length > 0 ? <div className="entry-cont">{tracks.map((v, k) =>
      <div key={k} onClick={() => setTrack(k)} className={classMap("", track === k && "selected")}>{v.name || `#${k+1}`}{v.description ? <div className="entry-desc">{v.description}</div> : undefined}</div>)}
    </div> : <div>No tracks found</div>}
  </div>;
});

export const Cars = withContext(props => {
  const {context: {data: {cars = []}, car}, setCar = () => {}, className = "", ...rest} = props;
  return <div className={classMap("cars pane", className)} {...rest}>
    <h2>Cars</h2>
    {cars.length > 0 ? <div className="entry-cont">{cars.map((v, k) =>
      <div key={k} onClick={() => setCar(k)} className={classMap("", car === k && "selected")}>{v.name || `#${k+1}`}{v.description ? <div className="entry-desc">{v.description}</div> : undefined}</div>)}
    </div> : <div>No cars found</div>}
  </div>;
});

export const Stats = withContext(props => {
  const {context: {debug}, className = "", ...rest} = props;
  return <div className={classMap("stats pane", className)} {...rest}>
    <h2>Stats</h2>
    <div>Version: a1.0.4</div>
    <div>Debug: {debug.toString()}</div>
  </div>;
});
