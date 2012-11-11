/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , connect = require('connect')
  , user = require('./routes/user')
  , http = require('http')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , path = require('path');

var app = express();
var io = require('socket.io');

var mongoose = require('mongoose');
mongoose.connect('mongodb://nodejitsu_nko3-breakfast-club:c5hnji4ar2keqh9eahr962v0r@ds039277.mongolab.com:39277/nodejitsu_nko3-breakfast-club_nodejitsudb4733696326');

var nextID = 1;

var users = [];

// usernames which are currently connected to the chat
var usernames = {};

function findById(id, fn) {
  var idx = id - 1;
  if (users[idx]) {
    fn(null, users[idx]);
  } else {
    fn(new Error('User ' + id + ' does not exist'));
  }
}

function findUserIndexByID(id) {
  for (var i = 0; i < users.length; i++) {
    if (Number(users[i].id) === Number(id)) {
      return i;
    }
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
  function(username, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      findByUsername(username, function(err, user) {
        if (err) { return done(err); }
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
    var gridCorrect = [];
    for (i=0; i < 225; i++){
      gridGuessed.push('');
      gridCorrect.push(0);
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
      gridCorrect[i] = 1; // the blank ones are already what they need to be
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
    answers: obj.answers,
    guessed: gridGuessed,
    correct: gridCorrect,
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
    correct: gridCorrect,
    gridnums: obj.gridnums,
    across: obj.clues.across,
    down: obj.clues.down
  };

  replace = -1;

  for(i=0; i<clientCrosswords.length; i++) {
    if (clientCrosswords[i].gameID === gameID) {
      replace = i;
    }
  }

  if (replace >= 0 ) {
    clientCrosswords[replace] = clientCrossword;
    serverCrosswords[replace] = serverCrossword;
    io.sockets.emit('updategrid', clientCrosswords[replace]);
  }
  else {
    clientCrosswords.push(clientCrossword);
    serverCrosswords.push(serverCrossword);
  }
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

function findIndexByClue(crossword, clue){
  var clueid = parseInt(clue.split('.')[0]);
  return crossword.gridnums.indexOf(clueid);
}

function getWordFromIndex(crossword, direction, index){
  var word = {
    complete: false,
    letters : '',
    index   : null,
    first   : null
  };
  console.log(index);
  if (direction == 'vertical'){
    while (index >= 15){
      if (crossword.grid[index-15].active == 'disabled'){
        break;
      }else {
        index-=15;
      }
    }
    var start = index;
    while (index < crossword.grid.length){
      word.letters += crossword.guessed[index] || ' ';
      if (crossword.grid[index+15].active == 'disabled'){
        break;
      }else {
        index+=15;
      }
    }
    console.log(start);
    word.index = crossword.gridnums[start]-1;
  }else {
    var place = index % 15;
    var min = index - place;
    var max = index + (15-place);
    while (index > min){
      if (crossword.grid[index-1].active == 'disabled'){
        break;
      }else {
        index--;
      }
    }

    var start = index;
    console.log(start);
    while (index < crossword.grid.length){
      word.letters += crossword.guessed[index] || ' ';
      if (crossword.grid[index+1].active == 'disabled'){
        break;
      }else {
        index++;
      }
    }
    word.index = crossword.gridnums[start]-1;
  }
  if (word.letters.indexOf(' ') == -1){
    word.complete = true;
  }
  word.first = start;
  return word;
}
function checkWord(data){
  var crossword = findSideByID(data.side);
  var result = '';
  var intersections = [];
  var intersection = data.direction == 'horizontal' ? 'vertical' : 'horizontal';
  if (data.direction === 'horizontal') {
    if (data.guess.toUpperCase() === crossword.answers.across[data.index]) {
      var userDidFinish = false;
      var i = findIndexByClue(crossword, crossword.across[parseInt(data.index)]);
      for (var l = data.guess.length+i; i < l; i++){
        if (crossword.correct[i] == 0){
          crossword.correct[i] = 1;
          intersections.push(getWordFromIndex(crossword, intersection, i));
          userDidFinish = true;
        }
      }
      if (userDidFinish){
        result = 'correct';
      }else {
        result = 'cheating';
      }
    }
    else {
      result = 'incorrect';
      var i = findIndexByClue(crossword, crossword.across[data.index]);
      for (var l = data.guess.length+i; i < l; i++){
        if (crossword.correct[i] !== 1){
          crossword.guessed[i] = '';
        }
      }
    }
  }
  else if (data.direction === 'vertical') {
    if (data.guess.toUpperCase() === crossword.answers.down[data.index]) {
      var userDidFinish = false;
      var i = findIndexByClue(crossword, crossword.down[data.index]);
      for (var l = data.guess.length*15+i; i < l; i+=15){
        if (crossword.correct[i] == 0){
          crossword.correct[i] = 1;
          intersections.push(getWordFromIndex(crossword, intersection, i));
          userDidFinish = true;
        }
      }
      if (userDidFinish){
        result = 'correct';
      }else {
        result = 'cheating';
      }
    }
    else {
      result = 'incorrect';
      var i = findIndexByClue(crossword, crossword.down[data.index]);
      for (var l = data.guess.length*15+i; i < l; i+=15){
        if (crossword.correct[i] !== 1){
          crossword.guessed[i] = '';
        }
      }
    }
  }

  if (result === 'correct') {
    findById(data.user, function(err, user) {
      if (user) {
        var newScore = user.score + data.guess.length;
        user.score = newScore;
        usernames[user.id].score = newScore;
        io.sockets.emit('updateusers', usernames);

        if (crossword.correct.indexOf(0) === -1) {
          console.log('side complete');
          getPuzzle(data.side, usedPuzzles);
        }
      }
    });
  }
  io.sockets.emit('guessresults', {data: data, result: result});
  data.direction = intersection;
  for(var i in intersections){
    console.log(intersections[i]);
    if (!intersections[i].complete){
      continue;
    }
    data.firstSquare = intersections[i].first+"";
    data.guess = intersections[i].letters+"";
    data.index = intersections[i].index+"";
    checkWord(data);
  }
}
getPuzzle('front', usedPuzzles);
getPuzzle('back', usedPuzzles);
getPuzzle('left', usedPuzzles);
getPuzzle('right', usedPuzzles);
getPuzzle('top', usedPuzzles);
getPuzzle('bottom', usedPuzzles);

app.get('/', routes.index);
app.get('/users', user.list);

app.post('/register', function(req, resp){
    var username = req.body.username.replace(/(<([^>]+)>)/ig,"");

    var user = {id: nextID, score: 0, username: username};
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

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

io = io.listen(server);

io.sockets.on('connection', function (socket) {
  // when the client emits 'sendchat', this listens and executes
  socket.on('sendchat', function (data) {
    // we tell the client to execute 'updatechat' with 2 parameters
    io.sockets.emit('updatechat', socket.username, data);
  });

  // when the client emits 'adduser', this listens and executes
  socket.on('adduser', function(data){
    // we store the username in the socket session for this client
    socket.username = data.username;
    socket.userID = data.id;
    socket.userColor = data.color;

    findById(socket.userID, function(err, user) {
        if (user) {
            usernames[socket.userID] = {id: socket.userID, username: socket.username, score: user.score, color: socket.userColor};
            // echo globally (all clients) that a person has connected
            socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has connected');
            // update the list of users in chat, client-side
            io.sockets.emit('updateusers', usernames);

            for (i=0; i < clientCrosswords.length; i++) {
              socket.emit('updategrid', clientCrosswords[i]);
            }
        }
    });
  });

  socket.on('updateSelection', function(data) {
    console.log('user #' + data.user + ' has selected a word');

    io.sockets.emit('updateSelections', data);

  });

  socket.on('checkword', checkWord);

  socket.on('sendletter', function (data) {
    console.log('letter sent: '+data.letter);
    if (!data.letter){
      return;
    }
    var crossword = findSideByID(data.side);
    if (!crossword){
      return;
    }
    crossword.guessed[data.index] = data.letter;
    socket.broadcast.emit('updateletter', data);
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function(){
    // remove the username from global usernames list
    delete usernames[socket.userID];
    //var userIndex = findUserIndexByID(socket.userID);
    //users.splice(userIndex,1);
    // update list of users in chat, client-side
    io.sockets.emit('updateusers', usernames);
    // echo globally that this client has left
    socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
  });
});