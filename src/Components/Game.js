import React, {Component} from "react";
import "../Style/Game.scss";
import {classMap, debug, framerate, imageSize, MDeg, playerSize} from "../data";
import playerSprite from "../Style/Assets/player.svg";

class Game extends Component {
  activeKeys = new Set();

  playerVector = {a: 0, l: 0};
  gamepadState = undefined;

  state = {
    player: {x: 0, y: 0, a: 0},
    paused: true,
    gamepad: 0,
  };

  //region Component Events
  componentDidMount() {
    document.addEventListener("keydown", this.keyEvent);
    document.addEventListener("keyup", this.keyEvent);
    window.addEventListener("gamepadconnected", this.gamePadEvent);
    window.addEventListener("gamepaddisconnected", this.gamePadEvent);
    if (this.props.track) this.initPlayer();
  }
  componentWillUnmount() {
    document.removeEventListener("keydown", this.keyEvent);
    document.removeEventListener("keyup", this.keyEvent);
    window.removeEventListener("gamepadconnected", this.gamePadEvent);
    window.removeEventListener("gamepaddisconnected", this.gamePadEvent);
  }
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.track && this.props.track) this.initPlayer();
  }
  //endregion

  initPlayer = () => {
    if (!this.props.track.data.startPos) return;
    this.setState({player: {...this.props.track.data.startPos}, paused: false}, this.frame);
    // this.playerVector.a = a;
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
    if (this.state.paused) return;
    this.setState(s => {
      const {player, gamepad} = s;
      const {data: {method = -1, friction = 1, steering = true, size, scale = 1}} = this.props.track;
      const v = this.playerVector;
      switch (method) {
        case 0:
          let x, y;
          if (this.props.gamepad && gamepad > 0 && (this.gamepadState = navigator.getGamepads()[0])) {
            // this.gamepadState = navigator.getGamepads()[0]; // TODO: check if this actually works
            let {axes: [x1], buttons: [,,,,,, {value: lt}, {value: rt}]} = this.gamepadState;
            if (Math.abs(x1) < 0.1) x1 = 0; if (Math.abs(x1) > 0.9) x1 = Math.sign(x1);
            // v.l -= 0.1 * (lt - rt);
            x = 0.1 * (rt - lt);
            // v.a += x1 * 1.5;
            y = x1 * 1.5;
          } else if (this.activeKeys.size > 0) {
            if (["KeyW", "KeyS"].some(v => this.activeKeys.has(v)))
              // v.l += (this.activeKeys.has("KeyS") ? -0.75 : 1) * 0.1;
              x = (this.activeKeys.has("KeyS") ? -0.75 : 1) * 0.1;
            if (["KeyD", "KeyA"].some(v => this.activeKeys.has(v)))
              y = (this.activeKeys.has("KeyA") ? -1 : 1) * 1.5;
              // v.a += (this.activeKeys.has("KeyA") ? -1 : 1) * 1.5;
          }

          if (x) {
            v.l += x;
          } else {
            if (Math.abs(v.l) > 0.2 * friction) v.l -= 0.2 * Math.sign(v.l) * friction;
            else v.l = 0;
          }

          if (y) {
            v.a += y;
          } else {
            if (Math.abs(v.a) > 0.75 * friction) v.a -= 0.75 * Math.sign(v.a) * friction;
            else v.a = 0;
          }


          v.l = Math.max(-5, Math.min(7.5, v.l));
          v.a = Math.max(-10, Math.min(10, v.a));

          player.a += v.a;
          player.x += MDeg.cos(player.a) * v.l * scale;
          player.y += MDeg.sin(player.a) * v.l * scale;

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
          for (const pv of ps) {
            if (
              player.x + pv.x > size.x || player.x - pv.x < 0 ||
              player.y + pv.y > size.y || player.y - pv.y < 0
            ) {
              v.l = -v.l * .25;
              player.x = Math.max(pv.x, Math.min(size.x - pv.x, player.x));
              player.y = Math.max(pv.y, Math.min(size.y - pv.y, player.y));
              break;
            }
          }

          return {player: player};
        case 1:
          return {};
        default:
          return {};
      }
    });
    setTimeout(this.frame, 1000 / framerate);
  };

  render() {
    const {track, className, gamepad, ...rest} = this.props;
    return <div className={classMap("pane pane-center game", className)} {...rest}>
      {(() => {
        if (!track) return "No track selected";
        switch ((track.data || {}).method) {
          case 0:
            const {data: {size, scale = 1, walls, startLine}} = track;
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
            const gamepad = (() => {
              if (!debug || this.state.gamepad === 0 || !this.props.gamepad || !this.gamepadState) return undefined;
              console.log(this.gamepadState.axes);
              const {axes: [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = [], buttons = []} = this.gamepadState;
              console.log(buttons);
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
              <line x2={this.playerVector.l*10*scale} stroke="yellow" strokeWidth={scale} transform={`translate(${player.x} ${player.y}) rotate(${player.a}) rotate(${this.playerVector.a})`}/>
              {gamepad}
              <image
                x={-imageSize.w /2 *scale} y={-imageSize.h /2 *scale} height={imageSize.h * scale} xlinkHref={playerSprite}
                transform={`translate(${player.x} ${player.y}) rotate(${player.a})`}
              />
              {debug ? <g transform={`translate(${player.x} ${player.y})`} fill="red">
                <circle r={scale} cx={ps[0].x} cy={ps[0].y} fill={"#FF00FF"}/>
                <circle r={scale} cx={ps[1].x} cy={ps[1].y} fill={"#FF0000"}/>
                <circle r={scale} cx={ps[2].x} cy={ps[2].y} fill={"#FFFF00"}/>
                <circle r={scale} cx={ps[3].x} cy={ps[3].y} fill={"#00FF00"}/>
              </g> : undefined}
              {walls.map((v, k) => <line key={k} {...v} stroke="white" strokeWidth={2 * scale}/>)}
            </svg>;
          case 1:
            return "WIP";
          default:
            return "Invalid/WIP track";
        }
      })()}
    </div>;
  }
}

export default Game;