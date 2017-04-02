var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var models = require('./src/models');

if (!argv.q || !fs.existsSync(argv.q)) {
	console.log('Error: A questions JSON file is required to populate the database.');
	process.exit(1);
}

models.sequelize.sync({ force: true }).then(function () {
	var parsed = require(argv.q);

	parsed.questions.forEach(function (item) {
		models.Question.create({
			text: item.question,
			difficulty: item.difficulty
		}).then(function (question) {
			var createAnswer = function (correct) {
				return function (text) {
					models.Answer.create({
						text: text,
						isCorrect: correct
					}).then(function (answer) {
						answer.setQuestion(question);
					});
				};
			};

			item.incorrect_answers.forEach(createAnswer(false));
			createAnswer(true)(item.correct_answer);
		});
	});
});
