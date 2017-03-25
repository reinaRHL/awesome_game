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
		}
	}, {
		classMethods: {
			associate: function (models) {
				
			}
		}
	});

	return Game;
};
