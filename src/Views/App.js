import React, {Component} from "react";
import {Cars, Options, Stats, Tracks} from "../Components/SidePanes";
import Game from "../Components/Game";
import "../Style/App.scss";
import {breakpoints, classMap, debug, trackFile} from "../utils";
import {Context} from "../Components/Context";

class App extends Component {
  state = {
    gridSize: undefined, big: undefined,
    data: {}, track: 0, car: 0,
    gamepad: true,
    debug: debug,
    callback: () => {}
  };

  componentWillMount() {
    this.resizeEvent();
    fetch(trackFile).then(r => r.json()).then(t => this.setState({data: t}, this.state.callback));
  }

  componentDidMount() {
    window.addEventListener("resize", this.resizeEvent);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.resizeEvent);
  }


  resizeEvent = () => {
    let i = 0, w = window.innerWidth;
    while (i < breakpoints.length && w >= breakpoints[i].min) i++; i--;
    if (this.state.big === undefined) {
      this.setState({gridSize: breakpoints[i].name, big: breakpoints[i].name !== "lg"});
    } else {
      this.setState({gridSize: breakpoints[i].name});
    }
  };

  render() {
    return <Context.Provider value={this.state}>
      <div className={classMap("main container", this.state.big && "mobile")}>
        <div className="pane pane-left container cont-col fill">
          <Tracks setTrack={n => this.setState({track: n}, this.state.callback)}/>
          <Cars setCar={n => this.setState({car: n})}/>
        </div>
        <Game setCallback={f => this.setState({callback : f}, this.state.callback)}/>
        <div className="pane pane-right container cont-col fill">
          <Stats/>
          <Options
            toggleSize={() => this.setState(s => ({big: !s.big}))}
            toggleGamepad={() => this.setState(s => ({gamepad: !s.gamepad}))}
            toggleDebug={() => this.setState(s => ({debug: !s.debug}))}
          />
        </div>
      </div>
    </Context.Provider>;
  }
}

export default App;