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
	console.log("connected: %s sockets connected", connections.length);

  	socket.on('disconnect', function (data) {
		connections.splice(connections.indexOf(socket),1);
		console.log("disconnected: %s sockets connected", connections.length);
  	});

  	// send message in Chatroom
  	socket.on('send message', function(data){
  		io.sockets.emit('new message', {msg:data});
  	})
});


/// This is for chatting feature 
/// there's separate chat.html but it can be incoporated into lobby later
app.get('/chat', function(req, res){
	res.sendFile(path.resolve('../static/chat.html'));
});
