import React, {Component} from "react";
import "../Style/Game.scss";
import {classMap, doIntersect, framerate, MDeg} from "../utils";
import {withContext} from "./Context";

class Game extends Component {
  activeKeys = new Set();

  data = {track: [], car: []};

  playerVector = {speed: {a: 0, l: 0}, drift: {a: 0, l: 0}, inertia: {a: 0, l: 0}};
  gamepadState = undefined;

  state = {
    player: {x: 0, y: 0, a: 0},
    paused: true,
    gamepad: 0,
  };

  //region Component Events
  componentDidMount() {
    this.props.setCallback(this._componentDidMount);
  }

  _componentDidMount = () => {
    document.addEventListener("keydown", this.keyEvent);
    document.addEventListener("keyup", this.keyEvent);
    window.addEventListener("gamepadconnected", this.gamePadEvent);
    window.addEventListener("gamepaddisconnected", this.gamePadEvent);
    this.initPlayer();
    this.props.setCallback(this.initPlayer);
  };

  componentWillUnmount() {
    document.removeEventListener("keydown", this.keyEvent);
    document.removeEventListener("keyup", this.keyEvent);
    window.removeEventListener("gamepadconnected", this.gamePadEvent);
    window.removeEventListener("gamepaddisconnected", this.gamePadEvent);
  }
  //endregion

  initPlayer = () => {
    const {track: track_i, car: car_i} = this.props.context;
    const {tracks, cars} = this.props.context.data;
    if (track_i === undefined || !tracks[track_i]) return;
    this.data = {track: tracks[track_i], car: cars[car_i]};
    this.setState({player: {...this.data.track.startPos}, paused: false}, this.frame);
    this.playerVector.speed = {a: 0, l: 0};
  };

  keyEvent = e => {
    if (["Control", "Alt", "Shift"].includes(e.key)) return;
    if (e.type === "keydown") {
      this.activeKeys.add(e.code);
    } else if (e.type === "keyup") {
      this.activeKeys.delete(e.code);
    }
  };
  gamePadEvent = e => {
    if (e.type === "gamepadconnected") {
      this.setState(s => ({gamepad: s.gamepad+1}));
    } else if (e.type === "gamepaddisconnected") {
      this.setState(s => ({gamepad: s.gamepad-1}));
    }
  };

  frame = () => {
    if (this.state.paused || new Date() - this.lastTimeout < 500.0 / framerate) return;
    this.setState(s => {
      let {player, gamepad} = s;
      const {
        track: {friction = 1, size, scale = 1, walls = []},
        car: {playerSize = {w: 0, y: 0}, braking = 1, tankSteering = false, steering = 1, acceleration = {f: 1, b: 1}, weight, grip}
      } = this.data;
      const {speed} = this.playerVector;
      let x, y;
      if (this.props.context.gamepad && gamepad > 0 && (this.gamepadState = navigator.getGamepads()[0])) {
        let {axes: [x1], buttons: [,,,,,, {value: lt}, {value: rt}]} = this.gamepadState;
        if (Math.abs(x1) < 0.1) x1 = 0; if (Math.abs(x1) > 0.9) x1 = Math.sign(x1);
        x = (rt - lt) * 0.1;
        y = x1 * 1.5;
      } else if (this.activeKeys.size > 0) {
        x = (this.activeKeys.has("KeyW") - this.activeKeys.has("KeyS")) * .1;
        y = (this.activeKeys.has("KeyD") - this.activeKeys.has("KeyA")) * 1.5;
      }

      if (x) {
        if (speed.l === 0 || Math.sign(speed.l) === Math.sign(x)) speed.l += x * friction * acceleration[Math.sign(x) > 0 ? "f" : "b"] * grip / weight;
        else speed.l += x * friction * braking * grip / weight * 2.5;
      } else {
        if (Math.abs(speed.l) > friction * 0.2) speed.l -= Math.sign(speed.l) * friction / weight * 0.2;
        else speed.l = 0;
      }

      if (y) {
        speed.a += y;
      } else {
        if (Math.abs(speed.a) > 0.75 * friction) speed.a -= 0.75 * Math.sign(speed.a) * friction;
        else speed.a = 0;
      }


      speed.l = Math.max(-5, Math.min(7.5, speed.l));
      speed.a = Math.max(-10, Math.min(10, speed.a));

      const saveState = {...player};

      player.a += (tankSteering ? 1 : Math.sqrt(Math.abs(speed.l) / 10)) * speed.a * steering;
      player.x += MDeg.cos(player.a) * speed.l * scale;
      player.y += MDeg.sin(player.a) * speed.l * scale;

      const ps = (([[x1, y1], [x2, y2]]) => [
        {x:  x1, y:  y1}, // br
        {x:  x2, y:  y2}, // fl,
        {x: -x1, y: -y1}, // bl
        {x: -x2, y: -y2}, // fr
      ])((([x0, y0]) => [
        [-x0 + y0 / 2, y0 + x0 / 2],
        [ x0 + y0 / 2,-y0 + x0 / 2]
      ])([
        playerSize.w / 2 * scale * MDeg.cos(player.a),
        playerSize.w / 2 * scale * MDeg.cos(player.a + 90)
      ]));
      for (const pv of ps) {
        if (
          player.x + pv.x > size.x || player.x - pv.x < 0 ||
          player.y + pv.y > size.y || player.y - pv.y < 0
        ) {
          speed.l *= -.25;
          player.x = Math.max(pv.x, Math.min(size.x - pv.x, player.x));
          player.y = Math.max(pv.y, Math.min(size.y - pv.y, player.y));
          break;
        }
      }

      for (let i = 0; i < ps.length; i++) { ps[i].x += player.x; ps[i].y += player.y; }
      const sides = [];
      for (let i = 0; i < 4; i++) sides[i] = [ps[i], ps[(i + 1) % 4]];
      outer: for (const wall of walls) {
        for (const side of sides) {
          if (doIntersect({x: wall.x1, y: wall.y1}, {x: wall.x2, y: wall.y2}, ...side)) {
            player = saveState;
            speed.l *= -.25;
            break outer;
          }
        }
      }

      return {player: player};
    });
    this.lastTimeout = new Date();
    setTimeout(this.frame, 1000 / framerate);
  };

  render() {
    const {context: {debug}, setCallback, className = "", ...rest} = this.props;
    const {track, car} = this.data;
    return <div className={classMap("pane pane-center game", className)} {...rest}>
      {(() => {
        if (!track) return "No track selected";
        const {size = {x: 0, y: 0}, scale = 1, walls = [], startLine} = track;
        const {imageSize = {w: 0, h: 0}, playerSize = {w: 0, h: 0}} = car;
        const {player} = this.state;
        const ps = (([[x1, y1], [x2, y2]]) => [
          {x:  x1, y:  y1}, // br
          {x:  x2, y:  y2}, // fl,
          {x: -x1, y: -y1}, // bl
          {x: -x2, y: -y2}, // fr
        ])((([x, y]) => [
          [-x + y / 2, y + x / 2],
          [ x + y / 2,-y + x / 2]
        ])([
          playerSize.w / 2 * scale * MDeg.cos(player.a),
          playerSize.w / 2 * scale * MDeg.cos(player.a + 90)
        ]));
        const sides = [[ps[0], ps[1]], [ps[1], ps[2]], [ps[2], ps[3]], [ps[3], ps[0]]];
        const gamepad = (() => {
          if (!debug || this.state.gamepad === 0 || !this.props.gamepad || !this.gamepadState) return undefined;
          const {axes: [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = [], buttons = []} = this.gamepadState;
          return <g transform={`scale(${scale}) translate(20 20)`}>
            <circle r={10} fill="transparent" stroke="gray"/>
            <circle r={10} cx={25} fill="transparent" stroke="gray"/>
            <circle r={2} cx={x1*10} cy={y1*10} fill="gray"/>
            <circle r={2} cx={x2*10+25} cy={y2*10} fill="gray"/>
            {buttons.map((v, k) => <circle key={k} r={2} cx={k*5+40} cy={(v.value-0.5)*15} fill="gray"/>)}
          </g>;
        })();
        return <svg viewBox={`${-scale} ${-scale} ${size.x + 2 * scale} ${size.y + 2 * scale}`}>
          <rect width="100%" height="100%" fill="rgba(255,255,255,0.2)"/>
          <line {...startLine} stroke="green" strokeWidth={2 * scale}/>
          {debug ? <line x2={this.playerVector.speed.l*10*scale} stroke="yellow" strokeWidth={scale} transform={`translate(${player.x} ${player.y}) rotate(${player.a}) rotate(${this.playerVector.speed.a})`}/> : undefined}
          {gamepad}
          <image
            x={-imageSize.w /2 *scale} y={-imageSize.h /2 *scale} height={imageSize.h * scale} xlinkHref={`assets/${car.model}`}
            transform={`translate(${player.x} ${player.y}) rotate(${player.a})`}
          />
          {debug ? <g transform={`translate(${player.x} ${player.y})`} stroke="green" strokeWidth={scale}>
            {sides.map((v, k) => <line key={k} x1={v[0].x} y1={v[0].y} x2={v[1].x} y2={v[1].y}/>)}
          </g> : undefined}
          {debug ? <g transform={`translate(${player.x} ${player.y})`} fill="red">
            <circle r={scale} cx={ps[0].x} cy={ps[0].y} fill={"#FF00FF"}/>
            <circle r={scale} cx={ps[1].x} cy={ps[1].y} fill={"#FF0000"}/>
            <circle r={scale} cx={ps[2].x} cy={ps[2].y} fill={"#FFFF00"}/>
            <circle r={scale} cx={ps[3].x} cy={ps[3].y} fill={"#00FF00"}/>
          </g> : undefined}
          {walls.map((v, k) => <line key={k} {...v} stroke="white" strokeWidth={2 * scale} strokeLinecap="round"/>)}
        </svg>;
      })()}
    </div>;
  }
}

export default withContext(Game);