var mongoose = require('mongoose');
var Schema	 = mongoose.Schema;

var logger	= require('../../libs/Logger');

/**
 * Advertisement Schema
 */
var AdvertisementSchema = new Schema({
	gid : { type: String, ref: 'Game' },
	imagePath: { type: String },
	link: { type: String },
	clickCount: { type: Number, default: 0 }
});


/**
 * Validation
 */
AdvertisementSchema.path('gid').validate(function(gid) {
	return ( gid !== null && gid.length > 0 );
}, 'Advertisement - gid cannot be null');

AdvertisementSchema.path('imagePath').validate(function(imagePath) {
	return ( imagePath !== null && imagePath.length > 0 );
}, 'Advertisement - imagePath cannot be null');

AdvertisementSchema.path('link').validate(function(link) {
	return ( link !== null && link.length > 0 );
}, 'Advertisement - link cannot be null');


/**
 * Statics
 */
AdvertisementSchema.statics = {
	loadAds: function(gid, callback) {
		this.find({ gid: gid }, function(err, ads) {
			if(err) throw new Error(err.messege);
			else {
				if(ads) {
					callback(ads);
				}
			}
		})
	}
};

mongoose.model('Advertisement', AdvertisementSchema);



/** Test Input */
var Advertisement = mongoose.model('Advertisement');
Advertisement.find({}, function(err, ads) {
	if(err) throw new Error(err.messege);
	
	// 광고 두개 추가.
	else if( ads.length === 0 ) {
		var ad_first = new Advertisement({
			gid: 'Guilty-Dragon',
			imagePath: 'http://adimg.daumcdn.net/www4/ADAM/52053/BMW_BPS.png',
			link: 'http://m.bps.co.kr/@page/phone/index.jsp'
		});

		ad_first.save();

		var ad_sec = new Advertisement({
			gid: 'Guilty-Dragon',
			imagePath: 'http://a.adroll.com/a/PQD/4W5/PQD4W5GPQVABJDOFUWTK3G.png',
			link: 'http://learnmore.insideview.com/Twitter-for-Social-Selling-Guide.html?utm_source=AdRoll&utm_medium=Banner&utm_campaign=Ultimate%2BGuide%2BTwitter'
		});

		ad_sec.save();

		var ad_third = new Advertisement({
			gid: 'Guilty-Dragon',
			imagePath: 'http://guardianlv.com/wp-content/uploads/2013/09/facebook1.jpg',
			link: 'https://www.facebook.com'
		});

		ad_third.save();
	}
	else {}
})