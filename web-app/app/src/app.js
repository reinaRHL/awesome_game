var bodyParser = require('body-parser');
var express = require('express');
var morgan = require('morgan');
var path = require('path');
var cookieParser = require('cookie-parser');
var models = require('./models');
var authentication = require('./middleware/authentication');
var routes = {
	api: require('./routes/api'),
	user: require('./routes/user')
};

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
app.get('/api/user', routes.api.getUser);
app.get('/api/user/friends', routes.api.getUserFriends);
app.get('/api/games', routes.api.getAllGames);
app.post('/signup', routes.user.doSignup);
app.post('/login', routes.user.doLogin);
app.get('/login', routes.user.getLoginPage);
app.delete('/logout', routes.user.doLogout);
app.get('/', function (req,res) {
	res.status(301);
	res.setHeader('Location', '/login');
	res.end();
})

app.get('/profile', authentication.isAuthenticated, function (req, res) {
	res.sendFile(path.resolve('../static/index.html'));
});
app.get('/lobby', authentication.isAuthenticated, function (req, res) {
	res.sendFile(path.resolve('../static/index.html'));
});
app.get('/friends', authentication.isAuthenticated, function (req, res) {
	res.sendFile(path.resolve('../static/index.html'));
});

// TODO: these will be handled by NGINX later...
app.get('/js/login.js', function (req, res) {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
	res.setHeader('Cache-Control', 'max-age=1800');
	res.sendFile(path.resolve('../static/js/login.js'));
});
app.get('/js/logout.js', function (req, res) {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
	res.setHeader('Cache-Control', 'max-age=1800');
	res.sendFile(path.resolve('../static/js/logout.js'));
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

// default redirect for anything else
app.get('*', function (req, res) {
	res.status(301);
	res.setHeader('Location', '/login');
	res.end();
});

var server = app.listen(PORT, function () {
	console.log('web-app started on port ' + PORT);
});

// Socket.IO
require('./routes/socketio')(server);
