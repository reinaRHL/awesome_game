module.exports = function(sequelize, DataType) {
	var Answer = sequelize.define('Answer', {
		text: {
			type: DataType.STRING,
			field: 'text'
		},
		isCorrect: {
			type: DataType.BOOLEAN,
			field: 'is_correct'
		}
	}, {
		classMethods: {
			associate: function (models) {
				Answer.belongsTo(models.Question, {
					foreignKey: 'answer_id'
				});
			}
		}
	});

	return Answer;
};
