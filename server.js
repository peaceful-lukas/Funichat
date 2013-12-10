var https	 = require('https');
var http = require('http');
var express  = require('express');
var fs		 = require('fs');
var logger	 = require('./libs/Logger');
var env		 = process.env.NODE_ENV || 'development';
var config	 = require('./config/config')[env];
var mongoose = require('mongoose');

////////////////////////////////////////////////////////////////////////////////////////
// Bootstrap db connection
////////////////////////////////////////////////////////////////////////////////////////
var db = mongoose.connection;
db.on('connected', function() {
	logger.info('MongoDB connected!');
});
db.on('disconnected', function() {
	logger.info('MongoDB disconnected!');
});
db.on('reconnected', function() {
	logger.info('MongoDB reconnected!');
});
mongoose.connect(config.db.host, config.db.option);

////////////////////////////////////////////////////////////////////////////////////////
// Botstrap models
////////////////////////////////////////////////////////////////////////////////////////
var MODEL_PATH = __dirname + '/app/models';
fs.readdirSync(MODEL_PATH).forEach(function (file) {
    if( ~file.indexOf('.js') ) require(MODEL_PATH + '/' + file);
});

////////////////////////////////////////////////////////////////////////////////////////
// Bootstrap express
////////////////////////////////////////////////////////////////////////////////////////
var app = express();
require('./config/express')(app, config);

////////////////////////////////////////////////////////////////////////////////////////
// Bootstrap routes
////////////////////////////////////////////////////////////////////////////////////////
require('./config/routes')(app);

////////////////////////////////////////////////////////////////////////////////////////
// Start the app by listening on <port>
////////////////////////////////////////////////////////////////////////////////////////

if( env === 'development' ) {
	var port = process.env.PORT || 3000;
	var server = http.createServer(app).listen(port);
}

else if( env === 'production' ) {

	////////////////////////////////////////////////////////////////////////////////////////
	// TLS/SSL Configu
	////////////////////////////////////////////////////////////////////////////////////////
	var files = [
	  '/etc/CA/PositiveSSLCA2.crt',
	  '/etc/CA/AddTrustExternalCARoot.crt'
	]

	var ca = (function() {
	  var i, length, result;

	  result = [];
	  for(i=0, length=files.length; i<length; i++) {
	    file = files[i];
	    result.push(fs.readFileSync(file));
	  }
	  return result;
	})();

	var options = {
		ca:		ca,
	    key:    fs.readFileSync('/etc/CA/server.key'),
	    cert:   fs.readFileSync('/etc/CA/www_funichat_com.crt')
	};

	// var port = process.env.PORT || 443;
	// var server = https.createServer(options, app).listen(port);
	var port = process.env.PORT || 80;
	var server = http.createServer(app).listen(port);
}
// app.listen(port);
logger.info('Funichat Express server['+env+'] started on port ' + port);

////////////////////////////////////////////////////////////////////////////////////////
// Bootstrap RabbitMQ server & websocket server
////////////////////////////////////////////////////////////////////////////////////////
require('./app/chat/chat')(server, config);

////////////////////////////////////////////////////////////////////////////////////////
// expose app
////////////////////////////////////////////////////////////////////////////////////////
exports = app;

////////////////////////////////////////////////////////////////////////////////////////
// expose app
////////////////////////////////////////////////////////////////////////////////////////
process.on('uncaughtException', function(err) {
  logger.error('Unexpected exception: ' + err.message);
  logger.error(err.stack);
});