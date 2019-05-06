import React, {Component} from "react";
import "../Style/Game.scss";
import {classMap, debug, framerate, imageSize, playerSize} from "../data";
import playerSprite from "../Style/Assets/player.svg";

class Game extends Component {
  activeKeys = new Set();

  playerVector = {a: 0, l: 0};

  state = {
    player: {x: 0, y: 0, a: 0},
    paused: true,
    gamepad: 0
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
    const a = this.props.track.data.startPos.a / 180 * Math.PI;
    this.setState({player: {...this.props.track.data.startPos, a: a}, paused: false}, this.frame);
    this.playerVector.a = a;
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
      const {data: {method = 1, friction = 1, steering = true, size, scale = 1}} = this.props.track;
      const v = this.playerVector;
      switch (method) {
        case 0:
          if (this.props.gamepad && gamepad > 0) {
            let {axes: [y1], buttons: [,,,,,, {value: lt}, {value: rt}]} = navigator.getGamepads()[0];
            if (Math.abs(y1) < 0.1) y1 = 0; if (Math.abs(y1) > 0.9) y1 = Math.sign(y1);
            v.a += (steering ? v.l/5 * 0.1 : 0.05) * y1;
            v.l -= 0.1 * (lt - rt);
          } else if (this.activeKeys.size > 0) {
            if (["KeyW", "KeyS"].some(v => this.activeKeys.has(v)))
              v.l += (this.activeKeys.has("KeyS") ? -1 : 1) * 0.1;
            if (["KeyD", "KeyA"].some(v => this.activeKeys.has(v)))
              v.a += (this.activeKeys.has("KeyA") ? -1 : 1) * (steering ? v.l/5 * 0.1 : 0.05);
          }

          player.x += Math.cos(v.a) * v.l * scale;
          player.y += Math.sin(v.a) * v.l * scale;
          player.a = v.a * scale;

          const ps = (([[x1, y1], [x2, y2]]) => [
            {x:  x1, y:  y1}, // br
            {x:  x2, y:  y2}, // fl,
            {x: -x1, y: -y1}, // bl
            {x: -x2, y: -y2}, // fr
          ])((([x, y]) => [
            [-x + y / 2, y + x / 2],
            [ x + y / 2,-y + x / 2]
          ])([
            playerSize.w / 2 * scale * Math.cos(v.a),
            playerSize.w / 2 * scale * Math.cos(v.a + Math.PI / 2)
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
          if (Math.abs(v.l) > 0.05) v.l -= 0.05 * Math.sign(v.l) * friction;
          else v.l = 0;
          v.l = Math.max(-5, Math.min(7.5, v.l));
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
            const v = this.playerVector;
            const ps = (([[x1, y1], [x2, y2]]) => [
              {x:  x1, y:  y1}, // br
              {x:  x2, y:  y2}, // fl,
              {x: -x1, y: -y1}, // bl
              {x: -x2, y: -y2}, // fr
            ])((([x, y]) => [
              [-x + y / 2, y + x / 2],
              [ x + y / 2,-y + x / 2]
            ])([
              playerSize.w / 2 * scale * Math.cos(v.a),
              playerSize.w / 2 * scale * Math.cos(v.a + Math.PI / 2)
            ]));
            return <svg viewBox={`${-scale} ${-scale} ${size.x + 2 * scale} ${size.y + 2 * scale}`}>
              <rect width="100%" height="100%" fill="rgba(255,255,255,0.2)"/>
              <line {...startLine} stroke="green" strokeWidth={2 * scale}/>
              {/*<line x2={v.l*10} stroke="yellow" transform={`translate(${player.x} ${player.y}) rotate(${v.a*180/Math.PI})`}/>*/}
              <image
                x={-imageSize.w /2 *scale} y={-imageSize.h /2 *scale} height={imageSize.h * scale} xlinkHref={playerSprite}
                transform={`translate(${player.x} ${player.y}) rotate(${player.a*180/Math.PI/scale})`}
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