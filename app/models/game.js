var mongoose = require('mongoose');
var env		 = process.env.NODE_ENV || 'development';
var config	 = require('../../config/config')[env];
var Schema	 = mongoose.Schema;

/**
 * Game Schema
 */
var GameSchema = new Schema({
	gid: { type: String },
	iv: { type: String },
	launchCode: {
		iOS: { type: String },
		android: { type: String }
	}
});

mongoose.model('Game', GameSchema);