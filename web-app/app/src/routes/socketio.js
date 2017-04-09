var models = require('../models');
var Sequelize = require('sequelize');
var moment = require('moment');
moment().format();
var schedule = require('node-schedule');
module.exports = function (server) {
	var io = require('socket.io')(server);

	// In-Memory-Maps
	var userMap = {
		sessionToUser: {},
		socketIDToUser: {},
		mapOfUsers: {},
		add: function (sessionKey, socketID, user) {
			userMap.sessionToUser[sessionKey] = user.id;
			userMap.socketIDToUser[socketID] = user.id;
			userMap.mapOfUsers[user.id] = user;
			user.memory = {};
		},
		get: function (sessionKey, socketID) {
			if (sessionKey) {
				return userMap.mapOfUsers[userMap.sessionToUser[sessionKey]];
			}
			if (socketID) {
				return userMap.mapOfUsers[userMap.socketIDToUser[socketID]];
			}
			return null;
		},
		delete: function (sessionKey, socketID) {
			delete userMap.mapOfUsers[userMap.sessionToUser[sessionKey]];
			delete userMap.socketIDToUser[socketID];
			delete userMap.sessionToUser[sessionKey];
		}
	};
	var gameMap = {};

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

		models.Session.findOne({
			where: {
				key: seshKey
			}
		}).then(function (session) {
			if (!session)
				return next(new Error('Authentication error'));
			return session.getUser();
		}).then(function (user) {
			var userInMap = userMap.get(seshKey);
			if (!userInMap) {
				userMap.add(seshKey, socket.id, user);
			} else {
				userMap.socketIDToUser[socket.id] = user.id;
				var game = gameMap[userInMap.memory.currentGame];
				if (game) {
					var roomID = 'GAME'.concat(game.id);
					console.log('GAMEEEE', roomID);
					socket.join(roomID);
				}
			}
			
			return next();
		});
	});

	io.on('connection', function (socket) {
		socket.on('sendMessage', function (data) {
			var user = userMap.get(null, socket.id);
			io.sockets.emit('newMessage', { msg: data, name: user.username });
		});

		socket.on('joinGame', function (data) {
			console.log('------- JOIN GAME -------');
			var user = userMap.get(null, socket.id);

			models.Game.findOne({
				where: {
					title: data.game
				}
			}).then(function (game) {
				game.addUser(user.id);
				user.memory.currentGame = game.id;
				gameMap[game.id] = game;

				var roomId = 'GAME'.concat(game.id);
				console.log(socket.id, 'CREATING!!!!', roomId);
				socket.join(roomId);
				io.in(roomId).clients(function (err, clients) {
					console.log('################ IN HERE #################');
					console.log(clients);
					console.log('################ IN HERE #################');
					io.in(roomId).emit('gameJoined', { user: user.username, title: data.game, numPlayers: clients.length });
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

		function findRandomQuestion(game) {
			console.log('----- FIND RANDOM QUESTION -----');
			return models.Question.findOne({
				order: [
					Sequelize.fn('RAND'),
				]
			}).then(function (question) {
				var roundIndex = gameMap[game.id].rounds.findIndex(function (round) {
					return round.question.id === question.id;
				});
				
				if (roundIndex === -1) {
					console.log('----- FOUND QUESTION -----');
					return question;
				}
				return findRandomQuestion(game);
			});
		}

		function sendQuestion(game, socket) {
			console.log('----- SEND QUESTION -----');
			findRandomQuestion(game).then(function (question) {
				var round = {
					question: null,
					answers: [],
					choices: []
				};

				var endTime = moment().add(30, 'seconds');
				var gameQuestion = {
					question: {
						incorrect_answers: [],
						difficulty: question.difficulty,
						id: question.id,
						question: question.text
					},
					endTime: endTime.toString(),
					scores: gameMap[game.id].scores
				};
				
				return question.getAnswers().then(function (answers) {
					answers.forEach(function (answer) {
						if (answer.isCorrect) {
							gameQuestion.question.correct_answer = answer.text
						} else {
							gameQuestion.question.incorrect_answers.push(answer.text)
						}
					});

					round.question = gameQuestion;
					gameMap[game.id].rounds.push(round);
					var roomId = "GAME".concat(game.id);
					io.in(roomId).emit('sendQuestions', { question: gameQuestion });

					var j = schedule.scheduleJob(endTime.toDate(), function(){
						endRoundVoting(game.id, socket);
					});
				});
			});
		}

		function endRoundVoting(game_id, socket) {
			console.log('----- END ROUND VOTING -----');
			var rounds = gameMap[game_id].rounds;
			var round = rounds[rounds.length - 1];
			var endTime = moment().add(30, 'seconds');
			var answers = [{ userId: -1, answer: round.question.question.correct_answer }];

			for (var i = 0; i < (3 - Object.keys(round.answers).length); i++) {
				answers.push({ userId: -2, answer: round.question.question.incorrect_answers[i] });
			}
			round.answers.forEach(function (answer) {
				answers.push(answer);
			});

			var data = {
				answers: answers,
				endTime: endTime.toString()
			}

			var roomId = "GAME".concat(game_id);
			io.in(roomId).emit('endRound', data);

			var j = schedule.scheduleJob(endTime.toDate(), function(){
				endRoundScoring(game_id, socket);
			});
		}

		function endGame(game, socket) {
			
		}

		function endRoundScoring(game_id, socket) {
			console.log('----- END ROUND SCORING -----');
			var rounds = gameMap[game_id].rounds;
			var round = rounds[rounds.length - 1];
			round.choices.forEach(function (choice) {
				var choseMine = 0;
				round.choices.forEach(function (otherChoice) {
					if (otherChoice.choice === choice.userId && otherChoice.userId !== choice.userId)
						choseMine++;
				});
				
				var score = gameMap[game_id].scores.find(function (score) {
					return score.userId === choice.userId;
				});
				score.score += (choice.choice === -1 ? 1 : 0) * 100 + choseMine * 50;
			});

			if (rounds.length < 6) {
				sendQuestion(gameMap[game_id], socket);
			} else {
				endGame(gameMap[game_id], socket);
			}
		}

		socket.on('sendChoice', function (data) {
			console.log('----- SEND CHOICE -----');
			var user = userMap.get(null, socket.id);
			var rounds = gameMap[user.memory.currentGame].rounds;
			var round = rounds[rounds.length - 1];
			round.choices.push({
				userId: user.id,
				choice: parseInt(data)
			});
		});

		socket.on('startGame', function (data) {
			console.log('----- START GAME -----');
			var gameId = userMap.get(null, socket.id).memory.currentGame;
			var game = gameMap[gameId];
			
			game.update({
				state: 'in_progress',
				progress: 1,
				startedAt: Date.now()
			});
			game.getUsers().then(function (users) {
				gameMap[game.id].rounds = [];
				gameMap[game.id].scores = [];

				users.forEach(function (user) {
					gameMap[game.id].scores.push({
						userId: user.id,
						username: user.username,
						score: 0
					});
				});

				sendQuestion(game, socket);
			});
		});

		socket.on('sendAnswer', function (data) {
			console.log('----- SEND ANSWER -----');
			var user = userMap.get(null, socket.id);
			var rounds = gameMap[user.memory.currentGame].rounds;
			var round = rounds[rounds.length - 1];
			round.answers.push({ userId: user.id, answer: data.answer });
		});

		// Gets called when user clicks 'create' button inside modal.
		// To do: Need to update db as well
		socket.on('createNewGame', function (data) {
			console.log('------- CREATE GAME -------');
			var user = userMap.get(null, socket.id);

			models.Game.create({
				title: data.title,
				createdBy: user.username,
				//createdAt auto generated
				state: 'hold',
				startedAt: null,
				progress: null
			}).then(function (game) {
				game.addUser(user.id);
				user.memory.currentGame = game.id;
				gameMap[game.id] = game;

				var roomId = 'GAME'.concat(game.id);
				socket.join(roomId);
				console.log(socket.id, 'CREATING!!!!', roomId);
				io.in(roomId).clients(function (err, clients) {
					io.sockets.emit('gameCreated', { gameId: game.id, title: data.title, createdBy: user.username, numPlayers: data.friend.length + 1 });
				});
			});
		});
	});
};