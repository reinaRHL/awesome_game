var api = {};

api.getUser = function (req, res) {
	// dummy data for now
	res.setHeader('Content-Type', 'text/json');
	res.send({
		username: 'hello',
		score: 300,
		gamesWon: 1,
		gamesPlayed: 1,
		lastLoggedIn: null
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
