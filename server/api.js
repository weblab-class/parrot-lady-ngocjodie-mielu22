/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/

const express = require("express");

// import models so we can interact with the database
const User = require("./models/user");

// import authentication library
const auth = require("./auth");

// api endpoints: all these paths will be prefixed with "/api/"
const router = express.Router();

//initialize socket
const socketManager = require("./server-socket");

router.post("/login", auth.login);
router.post("/logout", auth.logout);
router.get("/whoami", (req, res) => {
  if (!req.user) {
    // not logged in
    return res.send({});
  }

  res.send(req.user);
});

router.post("/initsocket", (req, res) => { //I don't think we need this?
  // do nothing if user not logged in
  if (req.user) socketManager.addUser(req.user, socketManager.getSocketFromSocketID(req.body.socketid));
  res.send({});
});

// |------------------------------|
// | write your API methods below!|
// |------------------------------|

//gets the number of playthroughs a user has won
router.get("/playthroughs", (req, res) => {
  User.findOne({_id: req.query.userId }).then(user => {
    if (!user) {
      res.status(402).send({ message: "nope" });
      return;
    }
    res.send({
      playthroughs: user.playthroughs
    });
  }).catch(err => {
    console.log(err);
    res.status(500).send({message: "unknown error"});
  });
});

//gets the names of the awards a player has won
router.get("/awards", (req, res) => {
  User.findOne({_id: req.query.userId }).then(user => {
    if (!user) {
      res.status(402).send({ message: "nope" });
      return;
    }
    console.log(user.awards)
    res.send({
      awards: user.awards
    });
  }).catch(err => {
    console.log(err);
    res.status(500).send({message: "unknown error"});
  });
});

router.post("/awards",  auth.ensureLoggedIn, (req, res) => {
  User.findOne({_id: req.user._id }).then(user => {
    if (!user) {
      res.status(402).send({ message: "nope" });
      return;
    }
    user.awards.push(req.body.award)
    user.save().then(()=>{
      res.send({
        awards: user.awards
      });
    }
    )
  }).catch(err => {
    console.log(err);
    res.status(500).send({message: "unknown error"});
  });
});

router.post("/choice", auth.ensureLoggedIn, (req, res) => {
  User.findOne({_id: req.user._id }).then(user => {
    if (!user) {
      res.status(402).send({ message: "nope" });
      return;
    }
    
    if (req.body.choice === "WIPE") { //the unique signal to wipe the choices
      user.choices = []
    } else if (user.choices) {
      mid = user.choices.filter(num => num !== null);
      user.choices = mid.concat([req.body.choice])
    } else {
      user.choices = [req.body.choice]
    }
    user.save().then((u) => res.send(u))
  }).catch(err => {
    console.log(err);
    res.status(500).send({message: "unknown error"});
  });
});

// I made a new choice GET request
router.get("/choice", auth.ensureLoggedIn, (req, res) => {
  User.findOne({_id: req.user._id}).then(user => {
    if (!user) {
      res.status(402).send({ message:"nope" });
      return;
    }
    res.send({choices: user.choices});
  }).catch(err => {
    console.log(err);
    res.status(500).send({message: "unknown error"});
  });
});
 

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});


module.exports = router;