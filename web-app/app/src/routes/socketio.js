var models = require('../models');

module.exports = function (server) {
	var io = require('socket.io')(server);
	var connections = [];

	//io user Authentication
	function getCookie(cookie, cname) {
		var name = cname + "=";
		var ca = cookie.split(';');
		for (var i = 0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			}
		}
		return "";
	}

	io.use(function(socket, next) {
		var seshKey = getCookie(socket.request.headers.cookie, "key");

		models.Session.count({
			where: {
				key: seshKey
			}
		}).then(function(session) {
			if (session === 1) {
				models.Session.findOne({
					where: {
						key: seshKey
					}
				}).then(function(session) {
					models.User.findOne({
						where: {
							id: session.user_id
						}
					}).then(function(user) {
						io.sockets.emit('onlineUser', {name:user.username});
					});
				})
				next();
			} else {
				// IF A USER ISN'T LOGGED IN, THEN REDIRECT THEM LOGIN
				next(new Error('Authentication error'));
			}
		});
	});

	io.on('connection', function (socket) {
		connections.push(socket);
		console.log("Connected: %s sockets connected", connections.length);

		socket.on('disconnect', function (data) {
			connections.splice(connections.indexOf(socket),1);
			console.log("Disconnected: %s sockets connected", connections.length);
		});

		// send message in Chatroom
		// need to fix this to pass the real username
		socket.on('sendMessage', function (data) {
		console.log(socket.request.headers.cookie + "cookie is")
		var seshKey = getCookie(socket.request.headers.cookie, "key");
			models.Session.findOne({
				where: {
					key: seshKey
				}
			}).then(function (session) {
				models.User.findOne({
					where: {
						id: session.user_id
					}
				}).then(function(user) {
					io.sockets.emit('newMessage', {msg:data, name:user.username});
				});
			});
		});

		// Gets called when user clicks 'create' button inside modal.
		// To do: Need to update db as well
		socket.on('createNewGame', function (data) {
			var seshKey = getCookie(socket.request.headers.cookie, "key");
			models.Session.findOne({
				where: {
					key: seshKey
				}
			}).then(function (session) {
				models.User.findOne({
					where: {
						id: session.user_id
					}
				}).then(function(user) {
					io.sockets.emit('gameCreated', {title: data.title, createdBy: user.username, numPlayers: data.friend.length + 1});

					// Store the newly created game in the DB
					models.Game.create({
						title: data.title,
						createdBy: user.username,
						//createdAt auto generated
						state: 'hold',
						startedAt: null,
						progress: null
					}).then(function(add_host_to_game){
						add_host_to_game.addUser(user.id);
					}); // end Game Create
				});
			});
		});
	});
};
