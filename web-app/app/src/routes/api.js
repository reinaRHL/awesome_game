var api = {};
var models = require('../models');

api.getUser = function (req, res) {
	current_user = req.user;
	// populate the data for response
	res.setHeader('Content-Type', 'text/json');
	res.send({
		username: current_user.username,
		score: current_user.score,
		gamesWon: current_user.gamesWon,
		gamesPlayed: current_user.gamesPlayed,
		lastLoggedIn: current_user.lastLoggedIn
	});
};

// Returns a list of friend objects(containing id & username) of the current user.
api.getUserFriends = function (req, res) {
	current_user = req.user;
	// Find all, where status is 1 and either (UserId or FriendId) is equal to the current user id.
	models.UserFriend.findAll({where: {status: 1, $or: [{UserId: current_user.id}, {FriendId: current_user.id}]}})
	.then(function(friends){

		var friendIds = []
		if (friends.length == 0){
			res.send([]);
		}
		for (var i = 0; i< friends.length; i++) {
			var friendId = [];
			var friendsArray = [];
			// Find out which one (FriendId or UserId) is friend id
			if (friends[i].UserId === current_user.id){
				friendId = friends[i].friendId;
			} else{
				friendId = friends[i].UserId;
			}
			friendIds.push(friendId);

			if (friendIds.length === friends.length){
				for (var i = 0; i < friendIds.length; i++) {
					models.User.findOne({where: {id: friendIds[i]}})
					.then(function(user){
						var z = {
							id: user.id,
							name: user.username
						};
						friendsArray.push(z);
						if (friendsArray.length === friendIds.length){
							res.send(friendsArray);
						}
					});
				}
			}
		}
	});
};

api.getAllGames = function (req, res) {
	//should return all games that are on hold
	var counter = 0
    
    models.Game.count().then(function(nofg) {//show games if games are more than 0 to prevent 504
    	if (nofg > 0){
    		models.Game.findAll()
			.then(function (games){
				console.log(games.length);
				var gamesArray = [];
				games.forEach(function(game) {
		            var array = [] // put user ids in array
		            game.getUsers().then(function(users) {
		            	console.log("users" + users)
		                users.forEach(function(user) {
		                    array.push(user.username)
		                })
		                game.dataValues.users = array



		                counter++ // respond the game array when every game is processed
		                if (counter === nofg) {
		                    var saved = '{ "games": ' + JSON.stringify(games) + '}'
		                  	console.log(saved)
		                    res.end(saved);
		                }

		            })
		        })
		    })
    	} else{
    		res.end()
    	}
        
    })
	

}; // end getAllGames

api.getLobbyGame = function (req, res){
	models.Game.count(//get lobby game if it exits to prevent 504
		{
			where: {
				id: req.params['id']
			}
		}).then(function(nofg) {
			if (nofg > 0){
				models.Game.findOne({
					where: {
						id: req.params['id']
					}
				}).then(function (game){
					
			            var userArray = [] // put user ids in array
			            game.getUsers().then(function(users) {

			                users.forEach(function(user) {
			                	//put players other than creator in array
			                	if(user.username != game.createdBy){
			                		userArray.push(user.username)
			                	}
			                    
			                })
			                game.dataValues.users = userArray
			                
							console.log(JSON.stringify(game) + "game")
							res.send(JSON.stringify(game));

			            })
					
				});
			} else{
				res.end()
			}
		
	})
	
}

api.getThisQuestion = function (req, res){ //get question and its answers by id
	models.Question.count(
		{
			where: {
				id: req.params['id']
			}
		}).then(function(nofq) {
			if (nofq > 0){
				models.Question.findOne({
					where: {
						id: req.params['id']
					}
				}).then(function (question){
					
			            var questionArray =  
							{
								difficulty: question.difficulty,
								text: question.text,
								correctAnswer: null,
								falseAnswer: []
							};
			            question.getAnswers().then(function(answers) {

			                answers.forEach(function(answer) {
			                	
			                	if(answer.isCorrect){
			                		questionArray.correctAnswer = answer.text
			                	}else{
			                		questionArray.falseAnswer.push(answer.text)
			                	}
			                    
			                })
			  
							res.send(questionArray);

			            })
					
				});
			} else{
				res.end()
			}
		
	})
	
}

api.getUserGameHistory = function (req, res) {
	req.user.getGames().then(function (games) {
		var gameArray = games.map(function (game) {
			return {
				id: game.id,
				title: game.title,
				createdBy: game.createdBy,
				createdAt: game.createdAt
			};
		});
		res.send(gameArray);
	});
};

// Returns current game (= returns the most recent game that the current user joined)
api.getCurrentGame = function(req, res){
	
	req.user.getGames()
	.then(function(games){
		games.sort(function(a,b){
			return b.User_Game.updatedAt - a.User_Game.updatedAt;
		});

		res.send(games[0]);
	})
	
	
};

module.exports = api;