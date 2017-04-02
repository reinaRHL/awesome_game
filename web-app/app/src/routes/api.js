var api = {};
var models = require('../models');


api.getUser = function (req, res) {

	models.Session.findOne({ // find current users session
		where: {
			key: req.cookies.key
		}
	}).then(function(session_instance){
		models.User.findOne({
			where: {
				id: session_instance.user_id
			}
		}).then(function (current_user){
			// populate the data for response
			res.setHeader('Content-Type', 'text/json');
			res.send({
				username: current_user.username,
				score: current_user.score,
				gamesWon: current_user.gamesWon,
				gamesPlayed: current_user.gamesPlayed,
				lastLoggedIn: current_user.lastLoggedIn
			});
		});
	});

}; //end getUser



// Returns a list of friend objects(containing id & username) of the current user.

api.getUserFriends = function (req, res) {

	models.Session.findOne({ // find current users session
		where: {
			key: req.cookies.key
		}
	}).then(function(session_instance){
		models.User.findOne({
			where: {
				id: session_instance.user_id
			}
		}).then(function (current_user){
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
		});
	});

}; //end getUserFriends

api.getAllGames = function (req, res) {
	//should return all games that are on hold
	models.Game.findAll({
		where: {
			state: 'hold'
		}
	}).then(function (games){
		console.log(games.length);
		var gamesArray = [];
		for (var i = 0; i < games.length; i++) {
			var z = {
				id: games[i].id,
				title: games[i].title,
				createdBy: games[i].createdBy,
				createdAt: games[i].createdAt,

				//TODO: update this for when users can join games -- should have list
				// of usernames in the current game.
				playersUsername: ['test']
			};
			gamesArray.push(z);
		};
		res.send(gamesArray);
	});

}; // end getAllGames

api.getLobbyGame = function (req, res){
	models.Game.findOne({
		where: {
			id: req.params['id']
		}
	}).then(function (game_instance){
		var game = [];
		var z = {title: game_instance.title,
		createdBy: game_instance.createdBy};
		game.push(z);
		res.send(game);
	});
}

module.exports = api;
