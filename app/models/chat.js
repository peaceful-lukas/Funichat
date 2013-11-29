var mongoose = require('mongoose');
var Schema	 = mongoose.Schema;

var logger	= require('../../libs/Logger');

/**
 * Chat Schema
 */
var ChatSchema = new Schema({
	rid: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
	content: { type: String },
	from: { type: String },
	profileImg: { type: String },
	recordedAt: { type: Date, default: Date.now }
});


/**
 * Statics
 */
ChatSchema.statics = {
	previous: function(rid, target, amount, callback) {
		if( rid && target && amount && callback ) {
			var query = { rid: rid, recordedAt: {$lt: target} };
		
			this.find(query).sort({recordedAt: -1}).limit(amount).exec(function(err, messages) {
				if(err) throw new Error(err.message);
				else {
					if(messages) {
						logger.debug(messages);
						callback(messages);
					}
				}
			});
		}
		else {
			logger.warn('app/models/chat.js - previous() invalid parameters. socket might be disconnected at a moment.');
		}
	}
};

mongoose.model('Chat', ChatSchema);