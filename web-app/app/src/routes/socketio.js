var models = require('../models');
var Sequelize = require('sequelize');
var moment = require('moment');
moment().format();

module.exports = function (server) {
	var io = require('socket.io')(server);
	var connections = [];
	var users =[]
	//A dicitonary of games indexed by gameID
    var games ={};



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

		socket.on('cancelNewGame', function(data){
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
				}).then(function(user) {
					current_username = user.username;
					current_userid = user.id;
				});
			
			models.Game.findOne({
				where: {
					title: data.title
				}
			}).then(function(game){

				if (current_username == game.createdBy){
					game.getUsers().then(function(users){
						users.forEach(function(user){	
							io.sockets.emit('backToLobby', {username:user.dataValues.username, title:game.title});
							counter++;
							if(counter == users.length){
								game.destroy();
								io.sockets.emit('removeGame', game.title);//users not in game see it removed in real time
							}
						});
					});
				} else {
					game.getUsers().then(function(users){
						users.forEach(function(user){
							usersInThisGame.push(user.id);
							
							if(usersInThisGame.length == users.length){
								if (usersInThisGame.indexOf(current_userid) != -1){
									usersInThisGame.splice(usersInThisGame.indexOf(current_userid), 1);
									game.setUsers(usersInThisGame).then(function(){
										game.getUsers().then(function(result){

										// update user list inside game
										io.sockets.emit('exitGame', { username: current_username} );

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

		socket.on('startGame', function (data) {
			//update round info
			var endTime = new Date();
				endTime.setSeconds(endTime.getSeconds() + 200);
				endTime = endTime.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1")
			var countdown = 200;  
			var round = 1;
			var counter = 0
			var countdownId = setInterval(function() {// add timer
				countdown--;
				if(countdown>=0){ // countdown greater than 0, start game
					io.sockets.emit('timer', { countdown: countdown }); 
				} else{
					clearInterval(countdownId);
				}
				
			}, 1000);
			//first round the start button is hit, send this question and update db
			var gameQuestions = {} 
				gameQuestions.question={}
				
				models.Game.findOne({
					where: {
						title: data.title
					}
				}).then(function (game) {
					game.update({
						state: 'in_progress',
						progress: round,
						startedAt: Date.now()
					})
					games[game.title]={} // initialize game.id info to be empty set
					games[game.title]["users"] = []

					gameQuestions.round = round
					gameQuestions.endTime = endTime
					game.getUsers().then(function(users){
						 
						users.forEach(function(user){//only send questions to users in the game 
							
							games[game.title]["users"].push(user.dataValues.username)//store users in memory 

						})
						models.Question.find({
						  order: [
						    Sequelize.fn( 'RAND' ),
						  ]
						}).then(function(question){//todo: send questions to client

							question.getAnswers().then(function(answers){
								gameQuestions.question.difficulty = question.difficulty
								gameQuestions.question.id = question.id
								gameQuestions.question.question = question.text
								gameQuestions.question.incorrect_answers=[]
								answers.forEach(function(answer){
									if (answer.isCorrect){
										gameQuestions.question.correct_answer = answer.text
									} else {
										gameQuestions.question.incorrect_answers.push(answer.text)
									}
								})
								
								// send questions when game begins
								io.sockets.emit('sendQuestions', { users:games[game.title]["users"] , question: gameQuestions});

							
							})
						});

					})

				})

			var sendQuestionsId = setInterval(function () { // refresh question every 20 secs
				
				round++;
				var counter = 0
				var gameQuestions = {}
				gameQuestions.question={}
				
				models.Game.findOne({
					where: {
						title: data.title
					}
				}).then(function (game) {
					game.update({
						progress: round,
					})
				
					gameQuestions.round = round
					gameQuestions.endTime = endTime
					models.Question.find({
					  order: [
					    Sequelize.fn( 'RAND' ),
					  ]
					}).then(function(question){//todo: send questions to client

						question.getAnswers().then(function(answers){
							gameQuestions.question.difficulty = question.difficulty
							gameQuestions.question.id = question.id
							gameQuestions.question.question = question.text
							gameQuestions.question.incorrect_answers=[]
							answers.forEach(function(answer){
								if (answer.isCorrect){
									gameQuestions.question.correct_answer = answer.text
								} else {
									gameQuestions.question.incorrect_answers.push(answer.text)
								}
							})
						
							if(round <=10){ // send questions if round is less than 10
								
								io.sockets.emit('sendQuestions', { users:games[game.title]["users"] , question: gameQuestions});

							} else{
								io.sockets.emit('endGame', {users:games[game.title]["users"] });
								clearInterval(sendQuestionsId); // break out interval
							}

						})
					});


				})
			}, 20000); 
			
			

		})

		socket.on('updateScore', function (data) {
			console.log(data.currentScore)
			var users = games[data.game]["users"]//find users in game
			models.User.findOne({
					where: {
						username: data.name
					}
				}).then(function (user){
					
			        	user.update({
						score: data.score,
					})
						io.sockets.emit('showScore', { users:users, user:data.name , score:user.score , currentScore: data.currentScore});//send the score of selected user to all users in game

					
				});
		})

		socket.on('gameEnded', function (data) {
			models.Game.findOne({
					where: {
						title: data.title
					}
				}).then(function (game){
					
			        	game.update({
						state: "done",
					})
			        	game.getUsers().then(function(users){

							users.forEach(function(user){//only send questions to users in the game 
								user.increment('games_played', {by: 1})//increment games_played by 1

							})
						})
					
				});
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
