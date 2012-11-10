/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

  var app = express();
  var server = require('http').createServer(app);
  var io = require('socket.io').listen(server);

// Setup db connection
var mongoose = require('mongoose');
mongoose.connect('mongodb://nodejitsu_nko3-breakfast-club:c5hnji4ar2keqh9eahr962v0r@ds039277.mongolab.com:39277/nodejitsu_nko3-breakfast-club_nodejitsudb4733696326');

app.configure(function(){
  app.set('port', process.env.PORT || 8000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

server.listen(3001);

app.configure('development', function(){
  app.use(express.errorHandler());
});

var grids = [];

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

  grid = {
    gameID: gameID,
    answers: obj.answers,
    grid: grid,
    guessed: gridGuessed,
    gridnums: obj.gridnums,
    across: obj.clues.across,
    down: obj.clues.down
  };

  grids.push(grid);
};

// Get a random crossword from xwordinfo
var getPuzzle = function(gameID) {
  http.get("http://www.xwordinfo.com/JSON/Data.aspx?date=random", function(res) {
    console.log("Got response: " + res.statusCode);
    var data = '';

    res.on('data', function (chunk){
        data += chunk;
    });

    res.on('end',function(){
        var obj = JSON.parse(data);
        //console.log(obj);
        if (obj.size.rows === 15) {
          console.log('its good');
          buildGrid(obj, gameID);
        }
        else {
          console.log('no good');
          getPuzzle(gameID);
        }
    });
  });
};

getPuzzle('front');
getPuzzle('back');
getPuzzle('left');
getPuzzle('right');
getPuzzle('top');
getPuzzle('bottom');

app.get('/', routes.index);
app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

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

    for (i=0; i < grids.length; i++) {
      io.sockets.emit('updategrid', grids[i]);
    }
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