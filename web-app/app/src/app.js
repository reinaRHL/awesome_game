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

// Middleware
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({   // to support URL-encoded bodies
	extended: true
}));
app.use(cookieParser());
app.use(morgan('dev'));

// Routes
app.get('/api/user', authentication.isAuthenticated, routes.api.getUser);
app.get('/api/user/friends', authentication.isAuthenticated, routes.api.getUserFriends);
app.get('/api/user/history', authentication.isAuthenticated, routes.api.getUserGameHistory);
app.get('/api/lobbyGame/:id',authentication.isAuthenticated, routes.api.getLobbyGame);
app.get('/api/questions/:id',authentication.isAuthenticated, routes.api.getThisQuestion);
app.get('/api/games', authentication.isAuthenticated, routes.api.getAllGames);
app.get('/api/game/current', authentication.isAuthenticated, routes.api.getCurrentGame);
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
app.get('/games', authentication.isAuthenticated, function (req, res) {
	res.sendFile(path.resolve('../static/game.html'));
});
app.get('/friends', authentication.isAuthenticated, function (req, res) {
	res.sendFile(path.resolve('../static/index.html'));
});

// Start server
var server = app.listen(PORT, function () {
	console.log('web-app started on port ' + PORT);
});

// Socket.IO
require('./routes/socketio')(server);