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
			console.log(current_user);
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

};

api.getUserFriends = function (req, res) {
	// TODO
};

api.getAllGames = function (req, res) {
	//should return all games that are on hold
	res.send({
		games:[{
			id: 1,
			title: 'first game',
			createdBy: 'David',
			createdAt: '2013-12-08T17:55:38.130Z', //iso string
			state: 'hold', //hold for when they've just been created?'
			playersUsername: ['David', 'MikeIsAwesome', 'Fabian99xx']
		},
		{
			id: 2,
			title: 'second game',
			createdBy: 'Paul',
			createdAt: '2013-12-08T17:55:38.130Z', //iso string
			state: 'hold', //hold for when they've just been created?'
			playersUsername: ['Paul', 'user123', 'fix34']
		},
		{
			id: 3,
			title: 'other game',
			createdBy: 'Dom',
			createdAt: '2013-12-08T17:55:38.130Z', //iso string
			state: 'hold', //hold for when they've just been created?'
			playersUsername: ['Ummy', 'HiMarry', 'Dom', 'Cafelire', 'More People']
		}]
	});
};

module.exports = api;
