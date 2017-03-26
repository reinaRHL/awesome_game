var bodyParser = require('body-parser');
var express = require('express');
var morgan = require('morgan');
var path = require('path');
var cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
var models = require('./models');
var crypto = require('crypto');



var app = express();
var PORT = 3000;
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({   // to support URL-encoded bodies
  extended: true
}));
app.use(cookieParser());

// Middleware
app.use(morgan('dev'));

function isAuthenticated(req, res, next) {

    // do check for valid key
    var seshKey = req.cookies.key;

    models.Session.count({
            where: {
                key: seshKey
              }
        })
        .then(function(authenticated) {
          if(authenticated == 1){
            return next();
          }else{
    // IF A USER ISN'T LOGGED IN, THEN REDIRECT THEM LOGIN
    res.redirect('/login');
    }
  });
}

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

//signup
app.post('/signup', function(req,res){
  var uname = req.body['username'];
  var pass = req.body['password'];

  //create new user under form credentials
  models.User.count({
    where:{
      username: uname
    }
  }).then(function(found){
    if(found > 0){ // already exists
      res.status(401).end();
    }else{ // doesn't; create user
    models.User.create({
      username: uname,
      password: bcrypt.hashSync(pass, 10), //bcrypt hash password
      gamesWon: 0,
      gamesPlayed: 0,
      lastLoggedIn: null,
    }).then(function (new_user){
      //created new user
      res.setHeader("Content-Type", "application/json; charset=UTF-8");
      res.status(200);
      res.send(JSON.stringify('/login')); //redirect to 'login' so user
      // can now get a session cookie.

    });
    }
});
});


//login
app.post('/login', function(req, res){
  var uname = req.body['username'];
  var pass = req.body['password'];

// does user exist?
  models.User.count({
    where:{
      username: uname
    }
  }).then(function(found){
    if(found == 1){ //user exists in DB.
      models.User.findOne({
        where:{
          username: uname
        }
      }).then(function(nextstep){


      bcrypt.compare(pass, nextstep.password, function(err, res2){
        if(res2){
          // correct credentials
          var generateKey = function() {
          var sha = crypto.createHash('sha256');
          sha.update(Math.random().toString());
          return sha.digest('hex');
          };

          models.Session.create({ //generate session key
            key: generateKey()
          }).then(function (send_the_response){
            res.cookie('key', send_the_response.key);
            res.setHeader("Content-Type", "application/json; charset=UTF-8");
            res.status(200);
            res.send(JSON.stringify('/friends')); //redirect
            console.log("That user is in DB");
        });
      }else{ //bcrypt fails
        res.status(401);
        res.end();
      }
      }); // bcrypt
      });
    }
    else{ //not found
      res.status(401);
      res.end();
    }
  });

});

app.get('/', function(req,res){
  res.status(301);
  res.setHeader('Location', '/login');
  res.end();
})

app.get('/friends', isAuthenticated, function(req, res){
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

app.get('*', function(req, res){ // default redirect for anything else
  res.status(301);
  res.setHeader('Location', '/login');
  res.end();
});
