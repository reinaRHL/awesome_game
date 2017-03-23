var fs = require('fs');
var models = require('../models');

models.sequelize.sync({force: true}).then(function() {

    fs.readFile(FILENAME, function(err, data) {
        
    });
});