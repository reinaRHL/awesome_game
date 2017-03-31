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

api.getUserFriends = function (req, res) {
	// TODO
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

module.exports = api;
