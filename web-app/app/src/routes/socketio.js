var models = require('../models');
var Sequelize = require('sequelize');
var moment = require('moment');
moment().format();
var schedule = require('node-schedule');
module.exports = function (server) {
	var io = require('socket.io')(server);
	var connections = [];
	var users = [] //NOT SURE WHAT THIS IS USED FOR SINCE USERS VARIABLE IS USED QUITE A BIT IN SEQUELIZE
	var GAMES = []; //holds all games that are in progress
	var USERS = []; //holds all users that are connected to game and their session info
	var JOBS = []; //scheduled jobs, timeout events that should occur
				   // using this plugin for jobs https://www.npmjs.com/package/node-schedule
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

	io.use(function (socket, next) {
		var seshKey = getCookie(socket.request.headers.cookie, "key");
		console.log("io")
		models.Session.count({
			where: {
				key: seshKey
			}
		}).then(function (session) {
			if (session === 1) {
				models.Session.findOne({
					where: {
						key: seshKey
					}
				}).then(function (session) {
					models.User.findOne({
						where: {
							id: session.user_id
						}
					}).then(function (user) {


						socket.username = user.username
						if (!users.includes(socket.username)) {
							users.push(socket.username)
						}


						io.sockets.emit('getUsers', users)

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
		//socket.id = Math.floor(Math.random() * 1000);
		socket.id = getCookie(socket.request.headers.cookie, "key");
		connections.push(socket);
		console.log("Connected: %s sockets connected", connections.length);

		socket.on('disconnect', function (data) {

			connections.splice(connections.indexOf(socket), 1);
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
				}).then(function (user) {
					io.sockets.emit('newMessage', { msg: data, name: user.username });
				});
			});
		});

		//refresh onlineusers when logged out
		socket.on('logOutUser', function (data) {
			users.splice(users.indexOf(data), 1)
			io.sockets.emit('getUsers', users)


		})

		socket.on('joinGame', function (data) {
			console.log("------ JOIN GAME -------");						
			console.log("--------- GAMES --------" + JSON.stringify(GAMES));
			console.log("--------- USERS --------" + JSON.stringify(USERS));
			console.log(JSON.stringify(data));
			var seshKey = getCookie(socket.request.headers.cookie, "key");
			var global_users = {};
			models.Session.findOne({
				where: {
					key: seshKey
				}
			}).then(function (session) {
				models.User.findOne({
					where: {
						id: session.user_id
					}
				}).then(function (user) {
					models.Game.findOne({
						where: {
							title: data.game
						}
					}).then(function (game) {
						var game_ins = models.Game.build({ ///omg is he creating one every time??
							id: game.id,
							title: data.game,

						})
						// console.log(game_ins)
						// console.log("game_ins")
						//get the users in the game and emit game title and numofusers
						global_users.id = user.id;
						global_users.username = user.username;
						global_users.seshKey = seshKey;
						global_users.game = game.id;
						global_users.score = 0;
						USERS.push(global_users);
						var socketRoom = "GAME".concat(game.id);
						socket.join(socketRoom);
						console.log("--------- GAMES --------" + JSON.stringify(GAMES));
						console.log("--------- USERS --------" + JSON.stringify(USERS));
						game_ins.addUser(user.id, { updatedAt: Date.now() }).then(function (user_ins) {
							game_ins.getUsers().then(function (users) {
								io.sockets.emit('gameJoined', { user: user.username, title: data.game, numPlayers: users.length });
							})
						})
					})
				});
			});
		});

		// TO DO: DELETE GAME FROM LIST OF GAMES
		socket.on('cancelNewGame', function (data) {
			var counter = 0;
			var current_userid;
			var current_username;
			var usersInThisGame = [];
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
				}).then(function (user) {
					current_username = user.username;
					current_userid = user.id;
				});

				models.Game.findOne({
					where: {
						title: data.title
					}
				}).then(function (game) {

					if (current_username == game.createdBy) {
						game.getUsers().then(function (users) {
							users.forEach(function (user) {
								io.sockets.emit('backToLobby', { username: user.dataValues.username, title: game.title });
								counter++;
								if (counter == users.length) {
									game.destroy();
									io.sockets.emit('removeGame', game.title);//users not in game see it removed in real time
								}
							});
						});
					} else {
						game.getUsers().then(function (users) {
							users.forEach(function (user) {
								usersInThisGame.push(user.id);

								if (usersInThisGame.length == users.length) {
									if (usersInThisGame.indexOf(current_userid) != -1) {
										usersInThisGame.splice(usersInThisGame.indexOf(current_userid), 1);
										game.setUsers(usersInThisGame).then(function () {
											game.getUsers().then(function (result) {

												// update user list inside game
												io.sockets.emit('exitGame', { username: current_username });
												var socketRoom = "GAME".concat(game.id); // remove user from game
												socket.leave(socketRoom);
												// return this user to lobby
												socket.emit('returnLobby');
											});
										});
									}
								}
							})
						});
					}
				});
			});
		});
		var endTime;
		function sendQuestion(round, data, game, socket){
			var gameQuestions = {};
			gameQuestions.question = {};
			gameQuestions.question.incorrect_answers = [];
			var roundInfo = {};
			gameQuestions.round = round;
			endTime = moment().add(1, 'minutes');
			gameQuestions.endTime = endTime.toString();
			// for (var i = 0; i < USERS.length; i++){
			// 	if(USERS[i].game == game.id){
					models.Question.find({
						order: [
							Sequelize.fn('RAND'),
						]
					}).then(function (question) {
						gameQuestions.question.difficulty = question.difficulty
						gameQuestions.question.id = question.id
						gameQuestions.question.question = question.text
						question.getAnswers().then(function (answers) {
							answers.forEach(function (answer) {
								if (answer.isCorrect) {
									gameQuestions.question.correct_answer = answer.text
								} else {
									gameQuestions.question.incorrect_answers.push(answer.text)
								}
							});
							for (var i=0; i < GAMES.length; i++) {
								var serverGame = GAMES[i];
								if (serverGame.id == game.id) {
									var roundQuestion = {};
									//add information on what questions were used for the round
									roundQuestion.id = question.id;
									roundQuestion.answers = []; //answers are user emited, since it's a new round it should be blank
									var systemAnswers = {};
									systemAnswers.correct_answer = gameQuestions.question.correct_answer;
									systemAnswers.incorrect_answers = gameQuestions.question.incorrect_answers;
									roundQuestion.systemAnswers = systemAnswers;
									serverGame.gameQuestions.push(roundQuestion);
									console.log("----- INSERTING QUESTION i: ----- " + i);
									GAMES[i] = serverGame;
									break;
								}
							}
							for(var i = 0; i < USERS.length; i ++){
								if(USERS[i].game == game.id){
									console.log(" ---- SENDING QUESTION TO USER ----- " + JSON.stringify(USERS[i]));
									var socketRoom = "GAME".concat(game.id);
									console.log(socketRoom);
									console.log(JSON.stringify(socket.rooms));
									console.log(JSON.stringify(socket.id));
									io.sockets.emit('sendQuestions', { user: USERS[i].username, question: gameQuestions });
									// TO DO: SOCKETS NEED TO SENT INDIVIDUALLY NOT TO EVERYONE CONNECTED!!!
									// io.to(socketRoom).emit('sendQuestions', { user: USERS[i].username, question: gameQuestions });
									// socket.broadcast.to(USERS[i].seshKey).emit('sendQuestions', { user: USERS[i].username, question: gameQuestions });
									// io.to(USERS[i].seshKey).emit('sendQuestions', { user: USERS[i].username, question: gameQuestions });
									// if (io.sockets.connected[USERS[i].seshKey]) {
									// 	io.sockets.connected[USERS[i].seshKey].emit('sendQuestions', { user: USERS[i].username, question: gameQuestions });
									// }
								}
							}
							//io.sockets.emit('sendQuestions', { user: USERS[i].username, question: gameQuestions });
							var j = schedule.scheduleJob(endTime.toDate(), function(){
								//executes job scheduled for end time; ie when the timer goes off
								endRoundVoting(game.id);
							});
							JOBS.push[j];
						});
					});
				//}
			//}
		}

		function sendQuestionOLD(round, data, game) {
			//update round info
			var gameQuestions = {};
			gameQuestions.question = {};
			gameQuestions.question.incorrect_answers = [];
			var roundInfo = {};
			gameQuestions.round = round;
			endTime = moment().add(1, 'minutes');
			gameQuestions.endTime = endTime.toString();
			game.getUsers().then(function (users) {
				users.forEach(function (user) {//only send questions to users in the game 
					models.Question.find({
						order: [
							Sequelize.fn('RAND'),
						]
					}).then(function (question) {//todo: send questions to client
						for (var i=0; i < GAMES.length; i++) {
							var serverGame = GAMES[i];
							if (serverGame.id == game.id) {
								var roundQuestion = {};
								id = question.id;
								roundQuestion.answers = [];
								serverGame.gameQuestions.push(roundQuestion);
								GAMES[i] = serverGame;
								break;
							}
						}
						gameQuestions.question.difficulty = question.difficulty
						gameQuestions.question.id = question.id
						gameQuestions.question.question = question.text
						question.getAnswers().then(function (answers) {
							answers.forEach(function (answer) {
								if (answer.isCorrect) {
									gameQuestions.question.correct_answer = answer.text
								} else {
									gameQuestions.question.incorrect_answers.push(answer.text)
								}
							})
							io.sockets.emit('sendQuestions', { user: user.dataValues.username, question: gameQuestions });
							var j = schedule.scheduleJob(endTime.toDate(), function(){
								//executes job scheduled for end time; ie when the timer goes off
								endRoundVoting(game.id);
							});
							JOBS.push[j];
						})
					});



				})

			})
		};
		function endRoundVoting(game_id){
			console.log(game_id);
			var toSend;
			for (var i=0; i < GAMES.length; i++) {
				var serverGame = GAMES[i];
				if (serverGame.id == game_id) {
					var round = parseInt(serverGame.round);
					// TO DO: set up answers so that everyone sees the same answers
					toSend = serverGame.gameQuestions[round-1].answers;//get the submitted answers for that round
				}
			}
			io.sockets.emit('endRound', toSend);
		}
		function endRoundScoring(){

		}
		socket.on('startGame', function (data) {
			console.log("---- START GAME ------");
			console.log(JSON.stringify(data));
			models.Game.findOne({
				where: {
					title: data.title //what happends when the game has the same titles??
				}
			}).then(function (game) {
				game.update({
					state: 'in_progress',
					progress: 1,
					startedAt: Date.now()
				});
				game.getUsers().then(function (users) {
					for (var i=0; i < GAMES.length; i++) {
						var serverGame = GAMES[i];
						if (serverGame.id == game.id) {
							GAMES[i].round = 1;
						}
					}
					sendQuestion(1, data, game, socket);
					console.log("--------- GAMES --------" + JSON.stringify(GAMES));
					console.log("--------- USERS --------" + JSON.stringify(USERS));
				});
			});
		});
		socket.on('sendAnswer', function (data) {
			//user sends answer to question
			console.log("--- RECEIVED ANSWER ---")
			console.log('DATA: ' + JSON.stringify(data));
			var seshKey = getCookie(socket.request.headers.cookie, "key");
			var curUser;
			for (var i =0; i < USERS.length; i++) {
				var user = USERS[i];
				if (user.seshKey === seshKey) {
					curUser = user;
				}
			}
			for (var i=0; i < GAMES.length; i++) {
				//confusing as hell, input the users answer into the game object
				var serverGame = GAMES[i];
				console.log("---- GAME ----" + JSON.stringify(serverGame));
				if (serverGame.id == curUser.game) {
					for (var m = 0; m < serverGame.gameQuestions.length; m++) {
						question = serverGame.gameQuestions[m];
						console.log("---- QUESTION ----" + JSON.stringify(question));
						if (question.id == data.questionID) {
							var userAnswer = {};
							userAnswer.userSesh = seshKey;
							userAnswer.userId = curUser.id;
							userAnswer.username = curUser.username;
							userAnswer.answer = data.answer;
							question.answers.push(userAnswer);
							GAMES[i].gameQuestions[m] = question;
						}
					}
				}
			}
			console.log("--------- GAMES --------" + JSON.stringify(GAMES));
			console.log("--------- USERS --------" + JSON.stringify(USERS));
			console.log(data);
		});


		// Gets called when user clicks 'create' button inside modal.
		// To do: Need to update db as well
		socket.on('createNewGame', function (data) {
			var seshKey = getCookie(socket.request.headers.cookie, "key");
			var global_game = {};
			var global_users = {};
			models.Session.findOne({
				where: {
					key: seshKey
				}
			}).then(function (session) {
				models.User.findOne({
					where: {
						id: session.user_id
					}
				}).then(function (user) {

					// Store the newly created game in the DB
					models.Game.create({
						title: data.title,
						createdBy: user.username,
						//createdAt auto generated
						state: 'hold',
						startedAt: null,
						progress: null
					}).then(function (game) {
						game.addUser(user.id);
						//emit only after successfully creating game
						global_game.id = game.id;
						global_game.title = game.title;
						global_game.round = 0;
						global_game.gameQuestions = [];
						GAMES.push(global_game);
						global_users.id = user.id;
						global_users.username = user.username;
						global_users.seshKey = seshKey;
						global_users.game = game.id;
						global_users.score = 0;
						USERS.push(global_users);
						console.log("--------- GAMES --------" + JSON.stringify(GAMES));
						console.log("--------- USERS --------" + JSON.stringify(USERS));
						io.sockets.emit('gameCreated', { gameId: game.id, title: data.title, createdBy: user.username, numPlayers: data.friend.length + 1 });
						var socketRoom = "GAME".concat(game.id);
						socket.join(socketRoom);
						// var destination = '/games';
						// io.sockets.emit('redirect', destination);
						//shouldn't use socket for redirection because socket redirects every logged in user to the page regardless of whether they joined
					}).catch(function (err) {
						//creating new game by same user with same title.
						console.log("Game with these values in User_Game exists already.")

					}); // end Game Create
				});
			});
		});
	});
};