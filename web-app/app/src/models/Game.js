module.exports = function(sequelize, DataType) {
	var Game = sequelize.define('Game', {
		title: {
			type: DataType.STRING,
			field: 'title',
			unique: true
		},
		startedAt: {
			type: DataType.DATE,
			field: 'started_at'
		},
		state: {
			type: DataType.ENUM('in_progress', 'hold', 'done'),
			field: 'state'
		},
		progress: {
			type: DataType.INTEGER,
			field: 'progress'
		},
		createdBy: {
			type: DataType.STRING,
			field: 'created_by',
		},
	}, {
		classMethods: {
			associate: function (models) {
				Game.belongsToMany(models.User, {
					through: 'User_Game',
					onDelete: 'CASCADE',
					foreignKey: 'game_id'
				});
			}
		}
	});

	return Game;
};
