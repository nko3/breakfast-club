/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , connect = require('connect')
  , user = require('./routes/user')
  , http = require('http')
  , util = require('util')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , path = require('path');

var app = express();
var io = require('socket.io');

var mongoose = require('mongoose');
mongoose.connect('mongodb://nodejitsu_nko3-breakfast-club:c5hnji4ar2keqh9eahr962v0r@ds039277.mongolab.com:39277/nodejitsu_nko3-breakfast-club_nodejitsudb4733696326');

var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

var nextID = 1;

var users = [];

function findById(id, fn) {
  var idx = id - 1;
  if (users[idx]) {
    fn(null, users[idx]);
  } else {
    fn(new Error('User ' + id + ' does not exist'));
  }
}

function findByUsername(username, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.username === username) {
      return fn(null, user);
    }
  }
  return fn(null, null);
}

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/users');
}

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  findById(id, function (err, user) {
    done(err, user);
  });
});


// Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
passport.use(new LocalStrategy(
  function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      findByUsername(username, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
        return done(null, user);
      });
    });
  }
));

app.configure(function(){
  app.set('port', 8000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat' }));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

var serverCrosswords = [];
var clientCrosswords = [];

////////// Server only logic //////////
var buildGrid = function(obj, gameID) {
    var grid = [];
    // Create empty array for guessed words
    var gridGuessed = [];
    for (i=0; i < 225; i++){
      gridGuessed.push('');
    }

    // initialize acrossWordGrid with array of 255 empty strings.
    var acrossWordGrid = [];

    for (i=0; i < 225; i++){
      acrossWordGrid.push('');
    }

    // for each word, find gridnum
    for (i=0; i < obj.answers.across.length; i++) {
      word = obj.answers.across[i];
      questionNum = Number(obj.clues.across[i].split('.')[0]);
      start = obj.gridnums.indexOf(questionNum);

      // add wordnum to all letters of word
      for (x=start; x < start + obj.answers.across[i].length; x++) {
        acrossWordGrid[x] = i;
      }
    }

    // initialize downWordGrid with array of 255 empty strings.
    var downWordGrid = [];

    for (i=0; i < 225; i++){
      downWordGrid.push('');
    }

    // for each word, find gridnum
    for (i=0; i < obj.answers.down.length; i++) {
      word = obj.answers.down[i];
      questionNum = Number(obj.clues.down[i].split('.')[0]);
      start = obj.gridnums.indexOf(questionNum);
      end = start + (word.length * 15);

      // add wordnum to all letters of word
      for (x=start; x < end + obj.answers.down[i].length; x += 15) {
        downWordGrid[x] = i;
      }
    }

  // Loop through and process square objects
  for (i=0; i < 225; i++){
    // initialize attributes of square
    var letter =obj.grid[i];
    var num = obj.gridnums[i];
    var active = 'active';
    var wordAcross = '';
    var wordDown = '';

    // disable it is an empty square
    if (letter === ".") {
      letter = '';
      active = 'disabled';
    }
    // otherwise add words letter belongs to
    else {
      if (acrossWordGrid[i] !== '') {
        wordAcross = acrossWordGrid[i];
      }
      if (downWordGrid[i] !== '') {
        wordDown = downWordGrid[i];
      }
    }

    if (num === 0) {
      num = '';
    }

    item = {letter: '', num: num, active: active, index:i, wordAcross:wordAcross, wordDown: wordDown};

    grid.push(item);
  }

  console.log('Game loaded for: ' + gameID);

  clientCrossword = {
    gameID: gameID,
    grid: grid,
    guessed: gridGuessed,
    gridnums: obj.gridnums,
    across: obj.clues.across,
    down: obj.clues.down,
    date: obj.date
  };

  serverCrossword = {
    gameID: gameID,
    answers: obj.answers,
    grid: grid,
    guessed: gridGuessed,
    gridnums: obj.gridnums,
    across: obj.clues.across,
    down: obj.clues.down
  };

  clientCrosswords.push(clientCrossword);
  serverCrosswords.push(serverCrossword);
};

var usedPuzzles = [];

// Get a random crossword from xwordinfo
var getPuzzle = function(gameID, usedPuzzles) {
  http.get("http://www.xwordinfo.com/JSON/Data.aspx?date=random", function(res) {
    console.log("Got response: " + res.statusCode);
    var data = '';

    res.on('data', function (chunk){
        data += chunk;
    });

    res.on('end',function(){
        var obj = JSON.parse(data);
        //console.log(obj);
        if (obj.size.rows === 15 
          && usedPuzzles['front'] != obj.date
          && usedPuzzles['back'] != obj.date
          && usedPuzzles['left'] != obj.date
          && usedPuzzles['right'] != obj.date
          && usedPuzzles['top'] != obj.date
          && usedPuzzles['bottom'] != obj.date ) {
            console.log('its good');
            buildGrid(obj, gameID);
            usedPuzzles[gameID] = obj.date;
            console.log('face ' + gameID + ' is using puzzle ' + usedPuzzles[gameID]);
        }
        else {
          console.log('no good');
          getPuzzle(gameID, usedPuzzles);
        }
    });
  });
};

var findSideByID = function(id) {
  for (var i = 0; i < serverCrosswords.length; i++) {
    if (serverCrosswords[i].gameID === id) {
      return serverCrosswords[i];
    }
  }
};

getPuzzle('front', usedPuzzles);
getPuzzle('back', usedPuzzles);
getPuzzle('left', usedPuzzles);
getPuzzle('right', usedPuzzles);
getPuzzle('top', usedPuzzles);
getPuzzle('bottom', usedPuzzles);

app.get('/', routes.index);
app.get('/users', user.list);

app.post('/login',
  passport.authenticate('local'),
  function(req, res) {
    // If this function gets called, authentication was successful.
    // `req.user` property contains the authenticated user.
    console.log('logged in');
    res.redirect('/');
  });

app.post('/register', function(req, resp){
    // user is the user instance you just registered and created
    var username = req.body.username;
    var password = req.body.password;

    var user = {id: nextID, username: username, password: password};
    users.push(user);
    nextID++;

    // user is the user instance you just registered and created
    req.logIn(user, function(err) {
      if (err) {
        return err;
      }
      // login success!
      resp.redirect('/');
  });
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findOne(id, function (err, user) {
    done(err, user);
  });
});

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

io = io.listen(server);

// usernames which are currently connected to the chat
var usernames = {};

io.sockets.on('connection', function (socket) {
  // when the client emits 'sendchat', this listens and executes
  socket.on('sendchat', function (data) {
    // we tell the client to execute 'updatechat' with 2 parameters
    io.sockets.emit('updatechat', socket.username, data);
  });

  // when the client emits 'adduser', this listens and executes
  socket.on('adduser', function(username){
    // we store the username in the socket session for this client
    socket.username = username;
    // add the client's username to the global list
    usernames[username] = username;
    // echo to client they've connected
    // socket.emit('updatechat', 'SERVER', 'you have connected');
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');
    // update the list of users in chat, client-side
    io.sockets.emit('updateusers', usernames);

    for (i=0; i < clientCrosswords.length; i++) {
      socket.emit('updategrid', clientCrosswords[i]);
    }
  });

  socket.on('checkword', function (data) {
    console.log(data);
    var crossword = findSideByID(data.side);
    var result = '';
    if (data.direction === 'horizontal') {
      if (data.guess.toUpperCase() === crossword.answers.across[data.index]) {
        result = 'correct';
      }
      else {
        result = 'incorrect';
      }
    }
    else if (data.direction === 'vertical') {
      if (data.guess.toUpperCase() === crossword.answers.down[data.index]) {
        result = 'correct';
      }
      else {
        result = 'incorrect';
      }
    }
    io.sockets.emit('guessresults', {data: data, result: result});
  });

  socket.on('sendletter', function (data) {
    console.log('letter sent: '+data.letter);
    if (!data.letter){
      return;
    }
    var crossword;
    for(var i in clientCrosswords){
      if (clientCrosswords[i].gameID == data.side){
        crossword = clientCrosswords[i];
        break;
      }
    }
    if (!crossword){
      return;
    }
    crossword.guessed[data.index] = data.letter;
    socket.broadcast.emit('updateletter', data);
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function(){
    // remove the username from global usernames list
    delete usernames[socket.username];
    // update list of users in chat, client-side
    io.sockets.emit('updateusers', usernames);
    // echo globally that this client has left
    socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
  });
});