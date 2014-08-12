// ------- Require dependencies --------
var express = require('express')
	, http = require('http')
	, path = require('path')
	, mongoskin = require('mongoskin')
	, dbUrl = process.env.MONGOHQ_URL || 'mongodb://@localhost:27017/blog'
	, db = mongoskin.db(dbUrl, {safe: true})
	, collections = {
			articles: db.collection('articles'),
			users: db.collection('users')
		}
	, session = require('express-session')
	, logger = require('morgan')
	, errorHandler = require('errorHandler')
	, cookieParser = require('cookie-parser')
	, bodyParser = require('body-parser')
	, methodOverride = require('method-override');

var app = express();
app.locals.appTitle = 'blog-express';

// ------- Configure settings --------
// configure port
app.set('port', process.env.PORT || 3000);
// configure views location
app.set('views', path.join(__dirname, 'views'));
// configure view engine
app.set('view engine', 'jade');

// ------- Define middleware --------
// expose collections in each express route via the req object


// ------- Define routes --------
app.all('*', function(req, res) {
	// Render a view: res.render(viewName, <data>, <callback(error, html)>)
	res.render('index', { msg: 'Welcome' });
});

// ------- Start the server --------
// pass the express app to the core node http.createServer
var server = http.createServer(app);
var startup = function() {
	server.listen(app.get('port'), function() {
		console.info('Express server listening on port ' + app.get('port'));
	});
};

var shutdown = function() {
	server.close();
};

if(require.main === module) {
	startup();
} else {
	console.info('Running app as a module');
}

exports.startup = startup;
exports.shutdown = shutdown;
exports.port = app.get('port');