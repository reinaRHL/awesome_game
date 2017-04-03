var models = require('../models');

var authentication = {};

authentication.isAuthenticated = function (req, res, next) {
	// do check for valid key
	var seshKey = req.cookies.key;

	models.Session.findOne({ where: { key: seshKey } }).then(function (session) {
		if (session)
			return session.getUser();

		res.redirect('/login');
	}).then(function (user) {
		req.user = user;
		return next();
	});
};

module.exports = authentication;
