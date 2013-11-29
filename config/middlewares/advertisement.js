var mongoose = require('mongoose');
var Game	 = mongoose.model('Game');
var Advertisement = mongoose.model('Advertisement');


module.exports = {
	pushAds: function(req, res, next) {
		var gid = req.session.gid;

		Advertisement.loadAds(gid, function(ads) {
			var numOfAds = ads.length;
			var index = Math.floor( numOfAds * Math.random() );
			
			res.locals.ad = ads[index];

			next();
		});
	}	
}