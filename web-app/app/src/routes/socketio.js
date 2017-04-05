var models = require('../models');
var Sequelize = require('sequelize');


module.exports = function (server) {
	var io = require('socket.io')(server);
	var connections = [];
	var users =[]

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
		console.log("io")
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
						

						socket.username = user.username
						if (!users.includes(socket.username)){
							users.push(socket.username)
						}

					
						io.sockets.emit('getUsers',users)

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
		socket.id = Math.floor(Math.random() * 1000);
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

		//refresh onlineusers when logged out
		socket.on('logOutUser',function (data){
			users.splice(users.indexOf(data),1 )
			io.sockets.emit('getUsers',users)


		})

		socket.on('joinGame', function (data) {

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
					models.Game.findOne({
						where: {
							title: data.game
						}
					}).then(function(game){
						var game_ins = models.Game.build({
								id: game.id,
                                title: data.game,

                            })
						// console.log(game_ins)
						// console.log("game_ins")
						//get the users in the game and emit game title and numofusers
						game_ins.addUser(user.id, {updatedAt: Date.now()}).then(function(user_ins){
							game_ins.getUsers().then(function(users){
								io.sockets.emit('gameJoined', {user: user.username, title: data.game, numPlayers: users.length});
							})
						})						
					})
				});
			});
		});

		socket.on('cancelNewGame', function (data) {
			var counter = 0
			models.Game.findOne({
				where: {
					title: data.title
				}
			}).then(function (game) {
				game.getUsers().then(function(users){
					users.forEach(function(user){//only redirect users in the game 
						io.sockets.emit('backToLobby', user.dataValues.username);
						counter++
						if(counter == users.length){//when all users are read, delete the game from db
							game.destroy()
							io.sockets.emit('removeGame', game.title);//users not in game see it removed in real time
						}
						
					})
					
				})

			})

		})

		socket.on('startGame', function (data) {
			var counter = 0
			models.Game.findOne({
				where: {
					title: data.title
				}
			}).then(function (game) {
				game.update({
					state: 'in_progress',
					progress: 1,
					startedAt: Date.now()
				})

				models.Question.find({
				  order: [
				    Sequelize.fn( 'RAND' ),
				  ]
				}).then(function(question){//todo: send questions to client
					console.log(question.text)
				});

				// game.getUsers().then(function(users){
				// 	users.forEach(function(user){
				// 		user.getSessions().then(function(session){//only redirect users in the game based on session
				// 			io.sockets.emit('backToLobby', session[0].dataValues.key);
				// 			counter++
				// 			if(counter == users.length){//when all users are read, delete the game from db
				// 				game.destroy()
				// 				io.sockets.emit('removeGame', game.title);//users not in game see it removed in real time
				// 			}
				// 		})
				// 	})
					
				// })

			})

		})



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

					// Store the newly created game in the DB
					models.Game.create({
						title: data.title,
						createdBy: user.username,
						//createdAt auto generated
						state: 'hold',
						startedAt: null,
						progress: null
					}).then(function(game){
						game.addUser(user.id);
						//emit only after successfully creating game
						io.sockets.emit('gameCreated', {gameId: game.id, title: data.title, createdBy: user.username, numPlayers: data.friend.length + 1});

						// var destination = '/games';
						// io.sockets.emit('redirect', destination);
						//shouldn't use socket for redirection because socket redirects every logged in user to the page regardless of whether they joined
					}).catch(function(err){
						//creating new game by same user with same title.
						console.log("Game with these values in User_Game exists already.")

					}); // end Game Create
				});
			});
		});
// TO DO IS START A CONNECTION FOR A GAME:
// ROUND INFO SHOULD BE SENT TO USERS
// api.newRound = function (req, res){
// 	//update round info
// 	var gameQuestions = 
// 	{
// 		'roundNumber':1,
//		'endTime': 1491092481792,
// 		'question' :
// 			{
// 				"correct_answer": "Red Lion",
// 				"difficulty": 1,
// 				"incorrect_answers": [
// 					"Royal Oak",
// 					"White Hart",
// 					"King&#039;s Head"
// 				],
// 				"question": "According to the BBPA, what is the most common pub name in the UK?",
// 				"category": "General Knowledge"
// 			}
// 	}
// }



	});
};
