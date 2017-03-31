var models = require('../models');

var authentication = {};

authentication.isAuthenticated = function (req, res, next) {
	// do check for valid key
	var seshKey = req.cookies.key;

	models.Session.count({ where: { key: seshKey } }).then(function (authenticated) {
		if (authenticated === 1){
			return next();
		}

		res.redirect('/login');
	});
};

module.exports = authentication;
