var crypto	 = require('crypto');
var mongoose = require('mongoose');
var Game	 = mongoose.model('Game');
var logger	 = require('../../libs/Logger');

module.exports = {
	hasAuthorization: function(req, res, next) {
		// 처음 인증 시도
		if( req.query.gid && req.query.name && !req.session.gid && !req.session.name ) {
			req.session.gid = req.query.gid;
			req.session.name = req.query.name;
			req.session.profileImageUrl = req.query.profileImageUrl;
			
			Game.findOne({ gid: req.query.gid }, function(err, game) {
				if(err) throw new Error(err.message);
				else {
					if(game) {
						req.session.launchCode = game.launchCode;
						next();
					}
					else {
						logger.warn('hasAuthorization: game is null.');
						res.render('status/404.jade');
					}
				}
			});
		}

		// 새로운 유저로 인증 시도
		else if( req.query.gid && req.query.name 
					&& ( req.query.gid !== req.session.gid ||  req.query.name !== req.session.name) ) {
			
			req.session.gid = req.query.gid;
			req.session.name = req.query.name;
			req.session.profileImageUrl = req.query.profileImageUrl;
			
			Game.findOne({ gid: req.query.gid }, function(err, game) {
				if(err) throw new Error(err.message);
				else {
					if(game) {
						req.session.launchCode = game.launchCode;
						next();
					}
					else {
						logger.warn('hasAuthorization: game is null.');
						res.render('status/404.jade');
					}
				}
			});
		}

		// 서비스 이용 중
		else {
			if( req.session.gid && req.session.name ) {
				if( !req.session.launchCode ) {
					Game.findOne({ gid: req.session.gid }, function(err, game) {
						if(err) throw new Error(err.message);
						else {
							if(game) {
								req.session.launchCode = game.launchCode;
								next();
							}
							else {
								logger.warn('hasAuthorization: game is null.');
								res.render('status/404.jade');
							}
						}
					});
				}
				else {
					next();
				}
			}
			else {
				logger.debug('invalid authenticate parameter');
				logger.debug(req.session);

				res.status(401);
				res.render('status/401.jade');
			}
		}
	}
}

// function authenticate(gid, key, username, callback) {
// 	Game.findOne({ gid: gid }, function (err, game) {
// 		if( err )	throw new Error(err.message);
		
// 		if( !game ) {
// 			callback(false);
// 		}
// 		else {
// 			// username url decode
// 			username = decodeURIComponent(username);

// 			var iv =  new Buffer(game.iv, 'utf8'); 
// 			var key = new Buffer(32);
// 			key.fill(0);

// 			var cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

// 			var crypted = cipher.update(username, 'utf8', 'base64');
// 			crypted += cipher.final('base64');
			
// 			logger.debug('user name authenticate [name: '+username+', key: '+key+', crypted: '+crypted+']');

// 			//callback((key === crypted) ? true : false, game.launchCode);
// 			callback(true, username, game.launchCode);
// 		}
// 	});	
// }