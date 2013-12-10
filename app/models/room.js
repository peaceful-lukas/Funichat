var mongoose = require('mongoose');
var env		 = process.env.NODE_ENV || 'development';
var config	 = require('../../config/config')[env];
var Schema	 = mongoose.Schema;

var Chat = mongoose.model('Chat');
var Favorite = mongoose.model('Favorite');

var logger	= require('../../libs/Logger');

/**
 * Room Schema
 */
var RoomSchema = new Schema({
	gid : { type: String, ref: 'Game' },
	title: { type: String },
	capacity: { type: Number, default: 20 },
	participants: [{
		name: { type: String, default: '' },
		profileImageUrl: { type: String, default: '' }
	}],
	secret: { type: Boolean, default: false },
	secretKey: { type: String, default: '' },
	thumbnail: { type: String, default: '', trim: true },
	owner: { type: String, required: true },
	createdAt: { type: Date, default: Date.now },
	lastRecordTime: { type: Date, default: new Date(2000, 1, 1) }
});


/**
 * Validation
 */
RoomSchema.path('gid').validate(function(gid) {
	return gid.length > 0;
}, 'Room - gid cannot be null');

RoomSchema.path('title').validate(function(title) {
	return title.length > 0;
}, 'Room - title cannot be null');

RoomSchema.path('capacity').validate(function(capacity) {
	return ( capacity >= 2 && capacity <= 50 );
}, 'Room - capacity should be between 2 to 50');


/**
 * Pre
 */
RoomSchema.pre('remove', function(next) {
	Chat.remove({ rid: this._id }).exec();
	Favorite.remove({ rid: this._id }).exec();
	next();
});

/**
 * Index
 */
RoomSchema.index({ gid: 1 });


/**
 * Statics
 */
RoomSchema.statics = {
	// type: normal | secret
	// uid: favorite(즐겨찾기) 타입일 경우 필요
	// description: 가장 최근 대화기록이 남아있는 30개의 채팅방 가져오기.
	recent: function(gid, type, favs, callback) {
		if( type === 'normal' ) {
			this.find({ gid: gid, secret: false }).sort({ lastRecordTime: -1 }).limit(30).exec(function(err, rooms) {
				if(err) throw new Error(err.message);
				else {
					rooms = rooms ? rooms : [];
					callback(rooms);
				}
			});
		}
		else if( type === 'secret' ) {
			this.find({ gid: gid, secret: true }).sort({ lastRecordTime: -1 }).limit(30).exec(function(err, rooms) {
				if(err) throw new Error(err.message);
				else {
					rooms = rooms ? rooms : [];
					callback(rooms);
				}
			});
		}
		else if( type === 'favorite' ) {
			var favRids = [];
			for(var i=0; i<favs.length; i++) {
				favRids.push(favs[i].rid);
			}
			
			this.find({ gid: gid, _id: {$in : favRids} }).sort({ lastRecordTime: -1 }).limit(30).exec(function(err, rooms) {
				if(err) throw new Error(err.message);
				else {
					rooms = rooms ? rooms : [];
					callback(rooms);
				}
			});
		}
	},
	
	// key: 검색키워드
	// description: 검색키워드와 매칭되는 모든 방 가져오기.
	search: function(gid, key, callback) {
		var keyRegex = new RegExp(key, 'g');
		
		this.find({ gid: gid, title: { $regex: keyRegex } }).sort({ lastRecordTime: -1 }).exec(function(err, rooms) {
			if(err) throw new Error(err.message);
			else {
				rooms = rooms ? rooms : [];
				callback(rooms);
			}
		})
	},


	// 대화방의 참가자 카운트를 1 증가하고 유저를 그룹참여인원 리스트에 추가한다.
	joinRoom: function(rid, user, callback) {
		var userdata = {
			name: user.name,
			profileImageUrl: user.profileImageUrl
		};
		
		this.findOneAndUpdate({ _id: rid }, {$push: {'participants': userdata }}, function(err, room) {
			if( err ) throw new Error(err.message);
			else {
				if(room) {
					callback(room);
				}
				else {
					logger.warn('Mongoose - join room failed!');
				}
			}
		});
	},

	// 대화방의 참가자 카운트를 1 감소시키고 유저를 그룹참여인원 리스트에서 삭제한다.
	exitRoom: function(rid, name, callback) {
		this.findOneAndUpdate({ _id: rid }, {$pull: {participants: {name : {$in: [name] }}}}, function(err, room) {
			if( err ) throw new Error(err.message);
			else {
				if( room ) {
					callback(room);
				}
				else {
					logger.warn('Mongoose - exit room failed!');
				}
			}
		});
	},

	// 비밀방의 비밀번호가 맞는지 검사한다.
	checkPassword: function(rid, secretKey, callback) {
		logger.debug(secretKey);
		this.findOne({ _id: rid, secretKey: secretKey }, function(err, room) {
			if( err ) throw new Error(err.message);
			else {
				if(room)
					callback(true);
				else
					callback(false);
			}
		});
	}
};

mongoose.model('Room', RoomSchema);