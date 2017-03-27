var bodyParser = require('body-parser');
var express = require('express');
var morgan = require('morgan');
var path = require('path');
var app = express();
var PORT = 3000;
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({   // to support URL-encoded bodies
  extended: true
}));

// Middleware
app.use(morgan('dev'));

// Routes

const server = app.listen(PORT, function () {
	console.log('web-app started on port ' + PORT);
});

const io = require('socket.io')(server);

var connections =[];

io.on('connection', function (socket) {
	connections.push(socket);
	console.log("Connected: %s sockets connected", connections.length);

  	socket.on('disconnect', function (data) {
		connections.splice(connections.indexOf(socket),1);
		console.log("Disconnected: %s sockets connected", connections.length);
  	});

  	// send message in Chatroom
  	// need to fix this to pass the real username
  	socket.on('sendMessage', function(data){
  		io.sockets.emit('newMessage', {msg:data, name:"Username"});
  	})
});


/// This is for chatting feature 
/// there's separate chat.html but it can be incoporated into lobby later

app.get('/', function(req,res){
  res.status(301);
  res.setHeader('Location', '/login');
  res.end();
})

app.get('/friends', function(req, res){
	res.sendFile(path.resolve('../static/index.html'));
});

app.get('/login', function(req, res){
  res.sendFile(path.resolve('../static/login.html'));
});

app.get('/js/login.js', function(req, res){
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
  res.setHeader('Cache-Control', 'max-age=1800');
    
  res.sendFile(path.resolve('../static/js/login.js'));
});

app.get('/js/chat.js', function(req, res){
	res.statusCode = 200;
  res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
  res.setHeader('Cache-Control', 'max-age=1800');
    
	res.sendFile(path.resolve('../static/js/chat.js'));
});

app.get('/js/share.js', function(req, res){
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
  res.setHeader('Cache-Control', 'max-age=1800');
    
  res.sendFile(path.resolve('../static/js/share.js'));
});

app.get('/js/template.js', function(req, res){
	res.statusCode = 200;
    res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    res.setHeader('Cache-Control', 'max-age=1800');
    
	res.sendFile(path.resolve('../static/js/template.js'));
});

app.get('/css/bootswatch.css', function(req, res){
	res.statusCode = 200;
  res.setHeader('Content-Type', 'text/css');
  res.setHeader('Cache-Control', 'max-age=1800');
  res.sendFile(path.resolve('../static/css/bootswatch.css'));
});

app.get('/css/index.css', function(req, res){
	res.statusCode = 200;
  res.setHeader('Content-Type', 'text/css');
  res.setHeader('Cache-Control', 'max-age=1800');
  res.sendFile(path.resolve('../static/css/index.css'));
});

app.get('/css/custom.css', function(req, res){
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/css');
  res.setHeader('Cache-Control', 'max-age=1800');
  res.sendFile(path.resolve('../static/css/custom.css'));
});
   

app.get('/img/avatar.png', function(req, res){
	res.statusCode = 200;
    res.setHeader('Content-Type', 'img/png');
    res.setHeader('Cache-Control', 'max-age=1800');
    res.sendFile(path.resolve('../static/img/avatar.png'));
});
app.get('/index', function(req, res){
    res.sendFile(path.resolve('../static/index.html'));
});
app.get('/api/user', function(req, res){
  // dummy data for now
  res.setHeader('Content-Type', 'text/json');
  res.send({
    username: 'hello',
    score: 300,
    gamesWon: 1,
    gamesPlayed: 1,
    lastLoggedIn: null
  });
});
app.get('/api/user/friends', function(req, res){

});
app.get('/api/games', function(req, res){
  //should return all games that are on hold
    res.send({
      games:[{
        id: 1,
        title: 'first game',
        createdBy: 'David',
        createdAt: '2013-12-08T17:55:38.130Z', //iso string
        state: 'hold', //hold for when they've just been created?'
        playersUsername: ['David', 'MikeIsAwesome', 'Fabian99xx']
      },
      {
        id: 2,
        title: 'second game',
        createdBy: 'Paul',
        createdAt: '2013-12-08T17:55:38.130Z', //iso string
        state: 'hold', //hold for when they've just been created?'
        playersUsername: ['Paul', 'user123', 'fix34']
      },
      {
        id: 3,
        title: 'other game',
        createdBy: 'Dom',
        createdAt: '2013-12-08T17:55:38.130Z', //iso string
        state: 'hold', //hold for when they've just been created?'
        playersUsername: ['Ummy', 'HiMarry', 'Dom', 'Cafelire', 'More People']
      }]
  });

});
