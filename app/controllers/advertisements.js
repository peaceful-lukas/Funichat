var mongoose = require('mongoose');
var Advertisement = mongoose.model('Advertisement');

var logger   = require('../../libs/Logger');

exports.click = function(req, res) {
	var ad = req.body;

	Advertisement.update({ _id: ad.aid }, {$inc: { clickCount: 1 }}, function(err, numAffected) {
		if(err) throw new Error(err.message);
		else {
			if(numAffected == 1) {
				// 광고 페이지로 이동.
				logger.debug('ad count increased.');
				res.json(200, { success: true, link: ad.link });
			}
			else {
				logger.error('ad count increase failed.');
				res.json(200, { success: false, link: ad.link });
			}
		}
	});
}