var bcrypt = require('bcrypt');
var crypto = require('crypto');
var models = require('../models');
var path = require('path');

var user = {};

user.doSignup = function (req,res) {
	var uname = req.body['username'];
	var pass = req.body['password'];

	//create new user under form credentials
	models.User.count({
		where: {
			username: uname
		}
	}).then(function (found) {
		if (found > 0) { // already exists
			res.status(401).end();
		} else { // doesn't; create user
			models.User.create({
				username: uname,
				password: bcrypt.hashSync(pass, 10), //bcrypt hash password
				gamesWon: 0,
				gamesPlayed: 0,
				lastLoggedIn: null,
				score: 0,
			}).then(function (new_user) {
				//created new user
				res.setHeader("Content-Type", "application/json; charset=UTF-8");
				res.status(200);
				res.send(JSON.stringify('/login')); //redirect to 'login' so user
				// can now get a session cookie.
			});
		}
	});
};

user.doLogin = function(req, res){
	var uname = req.body['username'];
	var pass = req.body['password'];

	// does user exist?
	models.User.count({
		where: {
			username: uname
		}
	}).then(function(found){
		if (found === 1) { //user exists in DB.
			models.User.findOne({
				where: {
					username: uname
				}
			}).then(function (nextstep) {
				bcrypt.compare(pass, nextstep.password, function (err, res2) {
					if (res2) {
						// correct credentials
						var generateKey = function() {
							var sha = crypto.createHash('sha256');
							sha.update(Math.random().toString());
							return sha.digest('hex');
						};

						models.Session.create({ //generate session key
							key: generateKey()
						}).then(function (send_the_response) {
							send_the_response.setUser(nextstep.id);
							nextstep.update({
								lastLoggedIn: send_the_response.createdAt
							})
							res.cookie('key', send_the_response.key);
							res.setHeader("Content-Type", "application/json; charset=UTF-8");
							res.status(200);
							res.send(JSON.stringify('/home')); //redirect
							console.log("That user is in DB");
						});
					} else { //bcrypt fails
						res.status(401);
						res.end();
					}
				}); // bcrypt
			});
		} else { //not found
			res.status(401);
			res.end();
		}
	});
};

user.doLogout = function (req,res) {
	var sessionKey= req.body['key'];
	models.Session.count({
		where: {
			key: sessionKey
		}
	}).then(function(found){
		if (found === 1) { //session exists in DB.
			console.log(req.body)
			//find session and delete it
			models.Session.findOne({
				where: {
					key: sessionKey
				}
			}).then(function (session) {
				session.destroy()

			});
		}else { //session key not found
			res.status(401);
			res.end();
		}
	})
};

user.getLoginPage = function (req, res) {
	res.sendFile(path.resolve('../static/login.html'));
};

module.exports = user;
