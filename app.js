// ------- Require dependencies --------
var express = require('express')
	, routes = require('./routes')
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
app.locals.appTitle = 'BrightSpace';

// ------- Configure settings --------
// configure port
app.set('port', process.env.PORT || 3000);
// configure views location
app.set('views', path.join(__dirname, 'views'));
// configure view engine
app.set('view engine', 'jade');

// ------- Define middleware --------
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(methodOverride());
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

if('development' == app.get('env')) {
	app.use(errorHandler());
}

// expose collections in each express route via the req object
app.use(function(req, res, next) {
	if(!collections.articles || !collections.users) return next(new Error('No collections.'));
	req.collections = collections;
	return next();
});

// session-based authentication (don't use cookie-sesson--stores entire session!)
app.use(cookieParser('hiawatha'));
app.use(session({ secret: '2333DDEEE-D443' }));

// check request if this is an admin session and store in locals (for templates)
app.use(function(req, res, next) {
	if(req.session && req.session.admin) res.locals.admin = true;
	next();
});

// define a function for authorization
var authorize = function(req, res, next) {
	if(req.session && req.session.admin) {
		return next();
	} else {
		return res.send(401);
	}
};

// ------- Define routes --------
app.get('/', routes.index);
app.get('/login', routes.user.login);
app.post('/login', routes.user.authenticate);
app.get('/logout', routes.user.logout);
app.get('/admin', authorize, routes.article.admin);
app.get('/post', authorize, routes.article.post);
app.post('/post', authorize, routes.article.postArticle);
app.get('/articles/:slug', routes.article.show);

// REST API routes
app.all('/api', authorize);
app.get('/api/articles', routes.article.list);
app.post('/api/articles', routes.article.add);
app.put('/api/articles/:id', routes.article.edit);
app.del('/api/articles/:id', routes.article.del);


// Catch-all
app.all('*', function(req, res) {
	res.send(404);
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
