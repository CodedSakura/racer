import React, {Component} from "react";
import {Options, Stats, Tracks} from "../Components/SidePanes";
import Game from "../Components/Game";
import "../Style/App.scss";
import {breakpoints, classMap, trackFile} from "../data";

class App extends Component {
  state = {
    gridSize: undefined, big: undefined,
    tracks: [], track: 0,
    gamepad: true
  };

  componentWillMount() {
    this.resizeEvent();
    fetch(trackFile).then(r => r.json()).then(t => {
      this.setState({tracks: t});
    });
  }

  componentDidMount() {
    window.addEventListener("resize", this.resizeEvent);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.resizeEvent);
  }


  resizeEvent = () => {
    let i = 0, w = window.innerWidth;
    // noinspection StatementWithEmptyBodyJS
    for (; i < breakpoints.length && w >= breakpoints[i].min; i++); i--;
    if (this.state.big === undefined) {
      this.setState({gridSize: breakpoints[i].name, big: breakpoints[i].name !== "lg"});
    } else {
      this.setState({gridSize: breakpoints[i].name});
    }
  };

  render() {
    return <div className={classMap("main container", this.state.big && "mobile")}>
      <div className="pane pane-left container cont-col fill">
        <Options
          toggleSize={() => {
            this.setState(s => ({big: !s.big}));
          }} size={this.state.big}
          toggleGamepad={() => this.setState(s => ({gamepad: !s.gamepad}))} gamepad={this.state.gamepad}
        />
        <Tracks tracks={this.state.tracks} setTrack={n => this.setState({track: n})}/>
      </div>
      <Game track={this.state.tracks[this.state.track]} gamepad={this.state.gamepad}/>
      <Stats/>
    </div>;
  }
}

export default App;