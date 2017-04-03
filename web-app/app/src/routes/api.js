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
    var nofg = 0
    models.Game.count().then(function(c) {
        nofg = c
    })
	models.Game.findAll({
		where: {
			state: 'hold'
		}
	}).then(function (games){
		console.log(games.length);
		var gamesArray = [];
		games.forEach(function(game) {
            var game_ins = models.Game.build({
                id: game.id,
                
            })
            var array = [] // put user ids in array
            game_ins.getUsers().then(function(users) {

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

}; // end getAllGames

api.getLobbyGame = function (req, res){
	models.Game.findOne({
		where: {
			id: req.params['id']
		}
	}).then(function (game){
		
		var game_ins = models.Game.build({
                id: game.id,
                
            })
            var userArray = [] // put user ids in array
            game_ins.getUsers().then(function(users) {

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

module.exports = api;