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
app.get('/friends', function(req, res){
	res.sendFile(path.resolve('../../static/index.html'));
});

app.get('/js/chat.js', function(req, res){
	res.statusCode = 200;
    res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    res.setHeader('Cache-Control', 'max-age=1800');
    
	res.sendFile(path.resolve('../../static/js/chat.js'));
});

app.get('/js/template.js', function(req, res){
	res.statusCode = 200;
    res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    res.setHeader('Cache-Control', 'max-age=1800');
    
	res.sendFile(path.resolve('../../static/js/template.js'));
});

app.get('/css/bootswatch.css', function(req, res){
	res.statusCode = 200;
    res.setHeader('Content-Type', 'text/css');
    res.setHeader('Cache-Control', 'max-age=1800');
    res.sendFile(path.resolve('../../static/css/bootswatch.css'));
});

app.get('/css/index.css', function(req, res){
	res.statusCode = 200;
    res.setHeader('Content-Type', 'text/css');
    res.setHeader('Cache-Control', 'max-age=1800');
    res.sendFile(path.resolve('../../static/css/index.css'));
});

app.get('/img/avatar.png', function(req, res){
	res.statusCode = 200;
    res.setHeader('Content-Type', 'img/png');
    res.setHeader('Cache-Control', 'max-age=1800');
    res.sendFile(path.resolve('../../static/img/avatar.png'));
});


