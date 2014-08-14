var TWITTER_CONSUMER_KEY = 'spNdzIhIe0dDdZUUbv4oKmdHF';
var TWITTER_CONSUMER_SECRET = 'AEyH6eXYZGchRdJRCg2Kwgeu6TymJnVqQ2t82mbT8p9NlBfXSv';

// ------- Require dependencies --------
var express = require('express')
	, routes = require('./routes')
	, http = require('http')
	, path = require('path')
	, mongoose = require('mongoose')
	, models = require('./models')
	, dbUrl = process.env.MONGOHQ_URL || 'mongodb://@localhost:27017/blog'
	, db = mongoose.connect(dbUrl, { safe: true })
  , everyauth = require('everyauth');

// express.js middleware
var session = require('express-session')
, logger = require('morgan')
, errorHandler = require('errorHandler')
, cookieParser = require('cookie-parser')
, bodyParser = require('body-parser')
, methodOverride = require('method-override');
// configure everyauth
everyauth.debug = true;
everyauth.twitter
.consumerKey(TWITTER_CONSUMER_KEY)
.consumerSecret(TWITTER_CONSUMER_SECRET)
.findOrCreateUser(function(session, accessToken, accessTokenSecret, twitterUserMetadata) {
  var promise = this.Promise();
  process.nextTick(function() {
    if(twitterUserMetadata.screen_name === 'jsbalrog') {
      session.user = twitterUserMetadata;
      session.admin = true;
    }
    promise.fulfill(twitterUserMetadata);
  });
  return promise;
  // return twitterUserMetadata
})
.redirectPath('/admin');

everyauth.everymodule.handleLogout(routes.user.logout);
everyauth.everymodule.findUserById(function(user, callback) {
  callback(user);
});

var app = express();
app.locals.appTitle = 'BrightSpace';

// set up models
app.use(function(req, res, next) {
  if(!models.Article || !models.User) return next(new Error('No models.'));
  req.models = models;
  return next();
});

// express.js configurations
// configure port
app.set('port', process.env.PORT || 3000);
// configure views location
app.set('views', path.join(__dirname, 'views'));
// configure view engine
app.set('view engine', 'jade');

// express.js middleware configuration
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
// session-based authentication (don't use cookie-sesson--stores entire session!)
app.use(cookieParser('hiawatha'));
app.use(session({ secret: '2333DDEEE-D443' }));
app.use(everyauth.middleware());
app.use(methodOverride());
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

// authentication middleware
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

// dev only
if('development' == app.get('env')) {
	app.use(errorHandler());
}

// pages and routes
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
