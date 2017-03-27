var bodyParser = require('body-parser');
var express = require('express');
var morgan = require('morgan');
var path = require('path');
var cookieParser = require('cookie-parser');
var bcrypt = require('bcrypt');
var models = require('./models');
var crypto = require('crypto');
var authentication = require('./middleware/authentication');

var app = express();
var PORT = 3000;

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({   // to support URL-encoded bodies
	extended: true
}));
app.use(cookieParser());

// Middleware
app.use(morgan('dev'));

// Routes
app.post('/signup', function (req,res) {
	var uname = req.body['username'];
	var pass = req.body['password'];

	//create new user under form credentials
	models.User.count({
		where: {
			username: uname
		}
	}).then(function (found) {
		if (found > 0) { // already exists
			res.status(401).end();
		} else { // doesn't; create user
			models.User.create({
				username: uname,
				password: bcrypt.hashSync(pass, 10), //bcrypt hash password
				gamesWon: 0,
				gamesPlayed: 0,
				lastLoggedIn: null,
			}).then(function (new_user) {
				//created new user
				res.setHeader("Content-Type", "application/json; charset=UTF-8");
				res.status(200);
				res.send(JSON.stringify('/login')); //redirect to 'login' so user
				// can now get a session cookie.
			});
		}
	});
});

app.post('/login', function(req, res){
	var uname = req.body['username'];
	var pass = req.body['password'];

	// does user exist?
	models.User.count({
		where: {
			username: uname
		}
	}).then(function(found){
		if (found === 1) { //user exists in DB.
			models.User.findOne({
				where: {
					username: uname
				}
			}).then(function (nextstep) {
				bcrypt.compare(pass, nextstep.password, function (err, res2) {
					if (res2) {
						// correct credentials
						var generateKey = function() {
							var sha = crypto.createHash('sha256');
							sha.update(Math.random().toString());
							return sha.digest('hex');
						};

						models.Session.create({ //generate session key
							key: generateKey()
						}).then(function (send_the_response) {
							send_the_response.setUser(nextstep.id);
							res.cookie('key', send_the_response.key);
							res.setHeader("Content-Type", "application/json; charset=UTF-8");
							res.status(200);
							res.send(JSON.stringify('/home')); //redirect
							console.log("That user is in DB");
						});
					} else { //bcrypt fails
						res.status(401);
						res.end();
					}
				}); // bcrypt
			});
		} else { //not found
			res.status(401);
			res.end();
		}
	});
});

app.get('/', function (req,res) {
	res.status(301);
	res.setHeader('Location', '/login');
	res.end();
})

app.get('/home', authentication.isAuthenticated, function (req, res) {
	res.sendFile(path.resolve('../static/index.html'));
});

app.get('/login', function (req, res) {
	res.sendFile(path.resolve('../static/login.html'));
});

app.get('/js/login.js', function (req, res) {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
	res.setHeader('Cache-Control', 'max-age=1800');
	res.sendFile(path.resolve('../static/js/login.js'));
});

app.get('/js/chat.js', function (req, res) {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
	res.setHeader('Cache-Control', 'max-age=1800');
	res.sendFile(path.resolve('../static/js/chat.js'));
});

app.get('/js/share.js', function (req, res) {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
	res.setHeader('Cache-Control', 'max-age=1800');
	res.sendFile(path.resolve('../static/js/share.js'));
});

app.get('/js/template.js', function (req, res) {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
	res.setHeader('Cache-Control', 'max-age=1800');
	res.sendFile(path.resolve('../static/js/template.js'));
});

app.get('/css/bootswatch.css', function (req, res) {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/css');
	res.setHeader('Cache-Control', 'max-age=1800');
	res.sendFile(path.resolve('../static/css/bootswatch.css'));
});

app.get('/css/index.css', function (req, res) {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/css');
	res.setHeader('Cache-Control', 'max-age=1800');
	res.sendFile(path.resolve('../static/css/index.css'));
});

app.get('/css/custom.css', function (req, res) {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/css');
	res.setHeader('Cache-Control', 'max-age=1800');
	res.sendFile(path.resolve('../static/css/custom.css'));
});


app.get('/img/avatar.png', function (req, res) {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'img/png');
	res.setHeader('Cache-Control', 'max-age=1800');
	res.sendFile(path.resolve('../static/img/avatar.png'));
});

app.get('/index', function (req, res) {
	res.sendFile(path.resolve('../static/index.html'));
});

app.get('/api/user', function (req, res) {
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

app.get('/api/user/friends', function (req, res) {
	// TODO
});

app.get('*', function (req, res) { // default redirect for anything else
	res.status(301);
	res.setHeader('Location', '/login');
	res.end();
});

app.get('/api/games', function (req, res) {
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

var server = app.listen(PORT, function () {
	console.log('web-app started on port ' + PORT);
});

// Socket.IO
require('./routes/socketio')(server);
