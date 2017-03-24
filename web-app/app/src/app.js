var bodyParser = require('body-parser');
var express = require('express');
var morgan = require('morgan');

var app = express();
var PORT = 3000;

// Middleware
app.use(morgan('dev'));

// Routes



app.listen(PORT, function () {
	console.log('web-app started on port ' + PORT);
});
