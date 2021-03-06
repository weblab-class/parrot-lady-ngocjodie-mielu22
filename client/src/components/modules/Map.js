import React, { Component } from "react";
import { get, post } from "../../utilities";

import DialogueBox from "../pages/DialogueBox.js";
import Convos from "../pages/Convos";
import Player from "./Player.js";
import Box from "./Box.js";
// import AWARDS_DEFINITION from "./awardsDefinition.js";




/**
 * PROPS:
 * @param {number} width
 * @param {number} height
 * @param {string} key for us to tell exactly what piece is rendering (many pieces could share a CSS class)
 * @param {string} name for className in Game.css to render
 * @param {number[]} start --> where player starts on this map
 * @param {Object[]} objects player obstacles --> look for a special one labelled goal
 * @param {(String) => ()} switch for switching to the next map
 * 
 */

class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      playerx: null,
      playery: null,
      last_dir: "down",
      held_dir: null,
      speed: 8,
      fps: 60,
      intervalid: null,
      situation: "moving",  //can be "moving", "dialoguing", or "interacting"
      overlay: null, //there can only be one overlay -- or change to interactable so that it won't even try to process 2 interactions at once
      ids: [],

      //"moving"      = only time when playerx/y can be changed and Player re-rendered
      //"dialoguing"  = when dialogue box things are happening --> pay attention to choices and send them to server(?) immediately after
      //"interacting" = when Box's onClick things are happening --> can't do anything else til it's clicked again
      //maybe dialoguing is the same as interacting ...
    };
  }

  componentDidMount() {
    get("/api/choice", { userId: this.props.userId}).then((what) => { //api call to wipe the player's previous choices
        console.log("from the mount GET", what); /////////////////////////////////////////////////////////////////
        this.setState({
          playerx: this.props.start[0],
          playery: this.props.start[1],
          intervalid: setInterval(this.placeChar, this.state.fps),
          ids: what["choices"],
        });
    });

    
    const directions = {
      "ArrowUp": "up",
      "ArrowDown": "down",
      "ArrowLeft": "left",
      "ArrowRight": "right",
      "w": "up",
      "s": "down",
      "a": "left",
      "d": "right",
    }

    window.addEventListener("keydown", (e) => {
      const dir = directions[e.key];
      this.setState({
        last_dir: dir,
        held_dir: dir,
      });
    });

    window.addEventListener("keyup", (e) => {
      const dir = directions[e.key];
      this.setState({
        held_dir: null,
        last_dir: dir,
      });
    });
  }

  placeChar = () => {
    if (this.state.situation !== "moving") {
      return;
    }

    const dir = this.state.held_dir;
    let newx = this.state.playerx;
    let newy = this.state.playery;

    if (dir) {
      if (dir === "right") {
        newx += this.state.speed;
      } else if (dir === "left") {
        newx -= this.state.speed;
      } else if (dir === "up") {
        newy -= this.state.speed;
      } else if (dir === "down") {
        newy += this.state.speed;
      }
    }

    if (newx < 0) { //left
      newx = 0;
    } else if (newx > this.props.width) { //right
      newx = this.props.width;
    } else if (newy < 0) { //top
      newy = 0;
    } else if (newy > this.props.height) { //bottom
      newy = this.props.height;
    }

    for (const i in this.props.objects) {
      let delta = this.checkCollision(this.props.objects[i], newx, newy, dir);
      if (delta[0] !== newx || delta[1] !== newy) {
        if (i === "exit") {
          this.props.switch(); //moves to the next map
        }
        newx = delta[0];
        newy = delta[1];
        break; // since it can only collide with one obstacle at a time
      }
    }

    this.setState({
      playerx: newx,
      playery: newy,
    });
  }

  checkCollision = (thing, xpos, ypos, direction) => {//thing = [className, x, y, width, height]
    const topBorder = thing[2];             // y
    const bottomBorder = thing[2] + thing[4]; // y + h
    const leftBorder = thing[1];            // x
    const rightBorder = thing[1] + thing[3];  // x + w 
    let final = [xpos, ypos];

    // if new (x,y) bad and old (x,y) fine, kick them back out
    if ((xpos > leftBorder && xpos < rightBorder) && (ypos > topBorder && ypos < bottomBorder)) {
      if (direction === "right") { //as in, going right pushed x into the obstacle
        final[0] = leftBorder;
      } else if (direction === "left") {
        final[0] = rightBorder;
      } else if (direction === "down") {
        final[1] = topBorder;
      } else if (direction === "up") {
        final[1] = bottomBorder;
      } //only deal with single directions because we don't move diagonal
    }
    return final;
  }


  distancetest = (x1, y1, x2, y2, w2, h2, limit) => {
    let a = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5;      //corner distances
    let b = ((x2 + w2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5;
    let c = ((x2 - x1) ** 2 + (y2 + h2 - y1) ** 2) ** 0.5;
    let d = ((x2 + w2 - x1) ** 2 + (y2 + h2 - y1) ** 2) ** 0.5;
    if (a < limit || b < limit || c < limit || d < limit) {
      return true;
    }
    return false;
  }


  interaction = (properties) => { // onClick function --doesn't work for invisible CSS class
    const type = properties.id;
    const close = this.distancetest(this.state.playerx, this.state.playery, properties.x, properties.y, properties.width, properties.height, 64);

    if (type === "START") { //tester
      post("/api/choice", { choice: "WIPE" }).then(() => { //api call to wipe the player's previous choices
        this.props.switch(); // Council background
      });
    } else if (type === "starting") { //for 1st Council
      if (this.batchofIDs(["900"])){ //finished 1st Council Scene
        this.props.switch(); //home w/ Laia
      } else {
        this.startConversation(18); // make first map after start the Council background
      }
    } else if (type === "from1to2") { //for 2nd Council
      if (this.batchofIDs(["922"])) { //finished it
        this.props.switch();
      } else if (this.batchofIDs(["426"])) { //start - got water
        this.startConversation(20);
      } else { //start - didn't get water
        this.startConversation(21); 
      }
    } else if (type === "from2to3") { //for 3rd Council
      if (this.batchofIDs(["933"])) { //finished it
        this.props.switch();

        //badomen = !this.noneofIDs(["666","663","664"])   badtrial = !this.noneofIDs(["122","124"])
        //nonebad = this.noneofIDs(["122","124","666","663","664"])
      } else if (this.noneofIDs(["122","124","666","663","664"])) { //good omens, good trials
        this.startConversation(23);
      } else if (!this.noneofIDs(["666","663","664"]) && this.noneofIDs(["122","124"])) { // bad omens, good trials
        this.startConversation(24);
      } else if (!this.noneofIDs(["122","124"]) && !this.noneofIDs(["666","663","664"])) { //bad omens, bad trials
        this.startConversation(25);
      } else { //good omens, bad trials --> default
        this.startConversation(26);
      }
    } else if (type === "finalverdict") { //for last (4th) Council
      if (this.batchofIDs(["944"])) { //finished it --> ending game
        this.props.switch();
      } else if (this.batchofIDs(["321"])) { //caught in lie
        if (!this.noneofIDs(["5","6"])) { //ate fruit
          this.startConversation(30);
        } else {
          this.startConversation(29);
        }
      } else if (this.batchofIDs(["222"]) && !this.batchofIDs(["321"])) { //blame Cassandra
        if (this.batchofIDs(["6"])) { //fruit
          this.startConversation(32);
        } else {
          this.startConversation(33);
        }
      } else { //innocent b/c of honesty
        this.startConversation(31);
      }
    }
                                                                                                                                                                             /// 663?
    const awardsDefinition = {"sly": ["927","469"], "liar": ["877", "780", "439"], "cinnamon":["12"],"flameo":['927'], "eye":["469", "936"], "dove":["719"], "fruit":["6"], "omens":['666','664']};

    if (type === "END") { //after last (4th) Council
      get("/api/choice").then((important_choices) => {
        Object.entries(awardsDefinition).forEach((awardName, decisions) => {
          console.log("hello im here 1"); ////////////////////////////////////////////////////////////////////
          let getAwards = true;
          for (let s in decisions) {
            if (!important_choices.includes(s)) {
              getAwards = false;
            }
          }
          if (getAwards) {
            post("/api/awards", { award: awardName[0] })
          }
        })
      }
    )}

    if (!close) {
      console.log("too far from the thing it clicked on"); ////////////////////////////////////////////////
      return;
    }

    //specific cases may/will require hardcoding

    if (type === "turtle") {
      this.startConversation(19);

    } else if (type === "telescopeLeft") { //how telescopes work
      this.showNewThing("telescope-view"); //aesthetic view

    } else if (type === "telescopeRight") {
      if (!this.noneofIDs(["7","8"])) { //gave fruit to old woman
        post("/api/choice", {choice: "444"} ).then(()=>{ //POST request that they've seen healthy Cassandra
          console.log("got a teaser"); //////////////////////////////////////////////////////////////////////
        });
        this.showNewThing("telescope-younglady");
      } else {
        this.showNewThing("telescope-oldlady");
      }
                                                      //promised water
    } else if (type === "fountain" && this.batchofIDs(["12"]) && !this.batchofIDs(["426"])) { //promised water and haven't gotten any yet
      this.startConversation(36);

    } else if (type === "bag" && !this.batchofIDs(["88"])) { //haven't gotten bag yet
      this.startConversation(35);

    } else if (type === "grape") {  //can't press on grapes twice?
      this.startConversation(2);
      post("/api/choice", {choice: "150"} ).then(()=>{ //got bag
        console.log("got fruit"); //////////////////////////////////////////////////////////////////////////////
      });

    } else if (type === "lyingDownCassandra") { //old woman
      if (this.batchofIDs(["426", "12"])) { //promised water and got it -- same # as fountain's POST
        this.startConversation(4);
      } else if (this.batchofIDs(["12"])){ //promised water
        this.startConversation(13);
      } else if (this.batchofIDs(["15", "150"])){ //promised fruit and got it
        this.startConversation(3);
      } else if (this.batchofIDs(["15"])){ //promised fruit
        this.startConversation(12);
      } else { // 1st time talking
        this.startConversation(1);
      }

    } else if (type === "leia") { //Laia
      if (this.batchofIDs(["14"])) { //sold bag
        this.startConversation(6);
      } else if (this.batchofIDs(["88"])) { //got bag
        this.startConversation(5);
      } else if (this.batchofIDs(["80"])) { //talked to her before
        this.startConversation(11); //don't see her anywhere else right?
      } else { //start 
        this.startConversation(0); // or would this automatically start after first Council Scene?
      }

    } else if (type === "youngCassandra") {
      if (this.batchofIDs(["933"])) { //finished 3rd Council Scene
        if (this.batchofIDs(["8"])) { //fruit
          this.startConversation(28);
        } else {
          this.startConversation(27);
        }
      } else { //finished 2nd Council Scene aka 1st flashback
        if (this.batchofIDs(["42","505","600"])) { //finished all tests
          this.startConversation(37);
        } else if (this.batchofIDs(["444"])) { //saw young Cassandra
          this.startConversation(8);
        } else { //enter temple normally
          this.startConversation(7);
        }
      }

    } else if (type === "leaderGirl") { //Livia
      if (this.batchofIDs(["505","122"]) || this.batchofIDs(["505","124"])) { //failed chellah
        this.startConversation(16);
      } else if (this.batchofIDs(["505","300"])) { //passed chellah
        this.startConversation(15);
      } else if (!this.noneofIDs(["5","6"])) { //start chellah after eating 1 or many grapes
        this.startConversation(22);
      } else { //start chellah with no fruit
        this.startConversation(10);
      }

    } else if (type === "angryGirl") { //Juno
      if (this.batchofIDs(["600"])) { //finished toy test
        this.startConversation(14);
      } else {
        this.startConversation(9);
      }

    } else if (type === "riddlesGirl") { //Fortunata
      if (this.batchofIDs(["42"])) { //finished riddles
        this.startConversation(17);
      } else {
        this.startConversation(34);
      }

    } else {
      console.log("Hello there. ~From",type); //////////////////////////////////////////////////////////////////
    }
  }




                //name = CSS className
  showNewThing = (name) => { //mostly for telescope but maybe for others, you never know ...
    // callback function that'll render another box based on what the caller Box says
    // assume it's a square that's supposed to cover the page: x=230, y=22, w=500, h=500
    if (this.state.overlay !== null) {
      return;
    }

    this.setState({
      situation: "interacting",                                         //because there can only be 1 at a time
      overlay: <Box name={name} x={30} y={22} width={900} height={500} id={"newthing"} key={"newthing"} interact={this.hideNewThing} />,
    });
  }

  hideNewThing = (name) => {
    // callback function that'll get back to Player movement and normal game play
    this.setState({
      situation: "moving",
      overlay: null,
    });
  }


  startConversation = (index) => { //different function because IT tells Player when to continue gameplay
    if (this.state.overlay !== null) {
      return;
    }

    this.setState({
      situation: "dialoguing",
      overlay: <DialogueBox key={"convo"} dialogue={Convos[index]} ending={this.endConversation} />,
    });
  }

  endConversation = (id) => {

    if (id == "901") {
      this.props.switch("Council2");
    } else if (id == "902") {
      this.props.switch("Council3");
    } else if (id == "903") {
      this.props.switch("Council4");
    } 

    get("/api/choice", { userId: this.props.userId}).then((what) => { //api call to wipe the player's previous choices
      this.setState({
        situation: "moving",
        overlay: null,
        ids: what["choices"],
      }); 
    });
  }

  batchofIDs = (array) => {
    for (const i in array) {
      if (!this.state.ids.includes(array[i])) { //if any are missing
        return false;
      }
    }
    return true;
  }

  noneofIDs = (array) => {
    for (const i in array) {
      if (this.state.ids.includes(array[i])) { //if any are present
        return false;
      }
    }
    return true;
  }



  componentWillUnmount(){
    clearInterval(this.state.intervalid);

    window.removeEventListener("keydown", (e) => {
      const dir = directions[e.key];
      this.setState({
        last_dir: dir,
        held_dir: dir,
      });
    });

    window.removeEventListener("keyup", (e) => {
      const dir = directions[e.key];
      this.setState({
        held_dir: null,
        last_dir: dir,
      });
    });
  }

  render() {
    let objs = [];

    for (const key in this.props.objects) {
      objs.push(<Box key={key} id={key} name={this.props.objects[key][0]} x={this.props.objects[key][1]} y={this.props.objects[key][2]} width={this.props.objects[key][3]} height={this.props.objects[key][4]} interact={this.interaction} />);
    }

    const mapStyle = {
      width: `${this.props.width}px`,
      height: `${this.props.height}px`,
    }

    let art = this.props.name + " pixel-art"

    return (
      <div className={art} style={mapStyle} >
        {objs}
        <Player x={this.state.playerx} y={this.state.playery} last_dir={this.state.last_dir} held_dir={this.state.held_dir} />
        {this.state.overlay}
      </div>
    );
  }
}

export default Map;