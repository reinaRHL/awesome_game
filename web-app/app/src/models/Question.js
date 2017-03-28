module.exports = function(sequelize, DataType) {
	var Question = sequelize.define('Question', {
		text: {
			type: DataType.STRING,
			field: 'text'
		},
		difficulty: {
			type: DataType.INTEGER,
			field: 'difficulty'
		}
	}, {
		classMethods: {
			associate: function (models) {
				Question.hasMany(models.Answer, {
					foreignKey: 'answer_id'
				});
			}	
		}
	});

	return Question;
};
