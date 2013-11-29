var express = require('express');

module.exports = function(app, config) {
	app.use(express.favicon());
	app.use(express.static(config.root + '/public'));

	app.set('views', config.root + '/app/views');
	app.set('view engine', 'jade');

	app.use(express.cookieParser());

    app.use(express.bodyParser());
    app.use(express.methodOverride());

	app.use(express.session({
		secret: 'funichat-lukas'
	}));

	app.use(function(req, res, next) {
		var userAgent = req.headers['user-agent'];

		var iOS = false;
		
		if( -1 != userAgent.indexOf('iPhone') ||
			-1 != userAgent.indexOf('iPad')   ||
			-1 != userAgent.indexOf('iPod') ) {
			iOS = true;
		}

		res.locals.user = {
			gid: req.session.gid,
			name: req.session.name,
			launchCode: req.session.launchCode,
			iOS: iOS,
			profileImageUrl: req.session.profileImageUrl || '/images/profile-default-img.png'
		};
		
		next();
	});

	app.use(app.router);

	if( 'development' == app.get('env') ) {
		app.use(express.errorHandler());
	}
}