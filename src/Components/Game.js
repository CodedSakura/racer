import React, {Component} from "react";
import "../Style/Game.scss";
import {classMap, framerate, playerSize} from "../data";
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
    if (this.props.track) {
      this.setState({player: this.props.track.startPos});
      this.playerVector.a = this.props.track.startPos.a;
    }
  }
  componentWillUnmount() {
    document.removeEventListener("keydown", this.keyEvent);
    document.removeEventListener("keyup", this.keyEvent);
    window.removeEventListener("gamepadconnected", this.gamePadEvent);
    window.removeEventListener("gamepaddisconnected", this.gamePadEvent);
  }
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.track && this.props.track) {
      this.setState({player: this.props.track.data.startPos, paused: false}, this.frame);
    }
  }
  //endregion

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
      const {data: {method, friction, steering, size}} = this.props.track;
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

          player.x += Math.cos(v.a) * v.l;
          player.y += Math.sin(v.a) * v.l;
          player.a = v.a;

          const _ps = {x: playerSize.w / 2 * Math.cos(v.a), y: playerSize.w / 2 * Math.cos(v.a + Math.PI / 2)};
          const ps = [
            {x: -_ps.x + _ps.y / 2, y:  _ps.y + _ps.x / 2},
            {x:  _ps.x - _ps.y / 2, y: -_ps.y - _ps.x / 2},
            {x: -_ps.x - _ps.y / 2, y:  _ps.y - _ps.x / 2},
            {x:  _ps.x + _ps.y / 2, y: -_ps.y + _ps.x / 2}
          ];
          for (const pv of ps) {
            if (
              player.x + pv.x > size.x || player.x - pv.x < 0 ||
              player.y + pv.y > size.y || player.y - pv.y < 0
            ) {
              v.l = -v.l * .5;
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
            const {data: {size, scale, walls, startLine}} = track;
            const {player} = this.state;
            // const v = this.playerVector;
            return <svg viewBox={`${-scale} ${-scale} ${size.x + 2 * scale} ${size.y + 2 * scale}`}>
              <rect width="100%" height="100%" fill="rgba(255,255,255,0.2)"/>
              <line {...startLine} stroke="green" strokeWidth={2 * scale}/>
              {/*<line x2={v.l*10} stroke="yellow" transform={`translate(${player.x} ${player.y}) rotate(${v.a*180/Math.PI})`}/>*/}
              <image
                x={-playerSize.w /2 *scale} y={-playerSize.h /2 *scale} height={playerSize.h * scale} xlinkHref={playerSprite}
                transform={`translate(${player.x} ${player.y}) rotate(${player.a*180/Math.PI})`}
              />
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