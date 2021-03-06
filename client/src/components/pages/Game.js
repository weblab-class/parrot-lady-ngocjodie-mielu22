import React, { Component } from "react";
import { get } from "../../utilities";


import Map from "../modules/Map.js"; //separate js files for map info like obstacles
import { mapinfo } from "../modules/MapInfo.js";
import "./Game.css";
// import DialogueBox from "./DialogueBox.js";
// import Convos from "./Convos";


/** QUESTIONS FOR OFFICE HOURS
 * 
 * FUNCTIONS TO TAKE CARE OF
 * - how to modify dialogueOptions in conversing function in Game.js
 * - sending, extracting, and using action IDs that change the story in Map, DialogueBox, Awards, Playthroughs, and Profile.js 
 *  
 * Things and Places We Need to Hardcode
 * - every kind of png in Game.css
 * - every path/scene in MapInfo.js
 * - every possible object interaction in the interaction function in Map.js ... wait, should I generalize that? --> considering all the this.doThings functions, I'd say no...?
 * - every potential conversation in Convos.js
 * 
 * low priority tasks
 * - if showNewThing dimensions should be altered or variable in Map.js
 * - desired radius for interaction function in Map.js
 * - desired speed and fps in state in Map.js
 * - the currentMap the game starts at in Game.js
 * - eliminating unnecessary files, comments, and code everywhere
 * 
 * ACCOMPLISHED
 * - exit function in handleAnswer or closing state in DialogueBox.js
 */



/**
 * path = "/game"
 * 
 * PROPS
 * @param userId ~don't know how/why/when I'll need it yet though
 */

class Game extends Component {
  constructor(props){
    super(props);
    this.state = {
      dimensions: [960, 544],  //same as .Game-frame
      currentMap: "tempstart",
    };
  }

  componentDidMount(){     // for api calls
    //
    get("/api/choice", { userId: this.props.userId}).then((ret) => {
      console.log("from Game's GET request:", ret); //////////////////////////////////////////////////////////////////////
    });
  }

  switchScenes = (map) => {
    let next = null;
    if (map) {
      next = map;
    } else {
      next = mapinfo[this.state.currentMap].nextmap;
    }
    this.setState({
      currentMap: next,
    });
  }
  
  render() {
    const info = mapinfo[this.state.currentMap];

    return(
        <div className="Game-frame">

          <div className="corner_topleft"></div>    {/* I, personally, could care less about these 4 */}
          <div className="corner_topright"></div>
          <div className="corner_bottomleft"></div>
          <div className="corner_bottomright"></div>

          <div className="camera">
            <Map key={this.state.currentMap} name={info.thismap} start={info.playerstart} objects={info.objects} switch={this.switchScenes} width={this.state.dimensions[0]} height={this.state.dimensions[1]} />
          </div>

        </div>
    );
  }
}

export default Game;