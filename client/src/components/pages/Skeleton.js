import React, { Component } from "react";
import "../../utilities.css";
import "./Skeleton.css";
import "./Game.js";
import bg from "./background_frontpage.jpg";




//TODO: REPLACE WITH YOUR OWN CLIENT_ID
const GOOGLE_CLIENT_ID = "929690839465-7el5elpd43lv4fgmh53vvcfegqbp961n.apps.googleusercontent.com";

class Skeleton extends Component {
  constructor(props) {
    super(props);
    // Initialize Default State
    this.state = {};
  }

  componentDidMount() {
    // remember -- api calls go here!
  }

  render() {
    return (
      <>
      <div className="Skeleton-bg">
  <img src={bg} className="Skeleton-img"/>
    </div>
      <p className="Skeleton-paraheader">
      Choose your role and prove your innocence.
      </p>
      <div className="Skeleton-paragraph">
        The sacred flames have gone out, and the council believes you are to blame.
      </div>
      </>
    );
  }
}

export default Skeleton;
