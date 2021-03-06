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
  name: { type: String },
  hidden: { type: String },
  themeSource: {
    name: { type: String },
    definition: { type: String },
    css: { type: String }
  },
	launchCode: {
		iOS: { type: String },
		android: { type: String }
	}
});

/**
 * Index
 */
GameSchema.index({ gid: 1 });

mongoose.model('Game', GameSchema);