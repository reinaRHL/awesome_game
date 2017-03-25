module.exports = function(sequelize, DataType) {
	var Session = sequelize.define('Session', {
		key: {
			type: DataType.STRING,
			field: 'key'
		}
	}, {
		classMethods: {
			associate: function (models) {
				Session.belongsTo(models.User, {
					foreignKey: 'user_id'
				});
			}
		}
	});

	return Session;
};
