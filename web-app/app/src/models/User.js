module.exports = function(sequelize, DataType) {
	var User = sequelize.define('User', {
		username: {
			type: DataType.STRING,
			field: 'username',
			unqiue: true
		},
		password: {
			type: DataType.STRING,
			field: 'password'
		},
		gamesWon: {
			type: DataType.INTEGER,
			field: 'games_won'
		},
		gamesPlayed: {
			type: DataType.INTEGER,
			field: 'games_played'
		},
		lastLoggedIn: {
			type: DataType.DATE,
			field: 'last_logged_in'
		},
		score: {
			type: DataType.INTEGER,
			field: 'score'
		}
	}, {
		classMethods: {
			associate: function (models) {
				User.hasMany(models.Session, {
					foreignKey: 'user_id'
				});
				User.belongsToMany(models.Game, {
					through: 'User_Game',
					onDelete: 'NO ACTION',
					foreignKey: 'user_id'
				});
				User.belongsToMany(models.User, {as: 'friend',
                    through: 'UserFriend'
                });
			}	
		}
	});

	return User;
};
