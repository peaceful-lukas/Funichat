var mongoose = require('mongoose');
var env		 = process.env.NODE_ENV || 'development';
var config	 = require('../../config/config')[env];
var Schema	 = mongoose.Schema;

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
    createdAt: { type: Date, default: Date.now }
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
 * Statics
 */
RoomSchema.statics = {
	// 대화방 정보를 가져온다.
	load: function(id, callback) {
		this.findOne({ _id: id }).exec(callback);
	},

	// gid 에 따라 개설된 채팅방을 로드하고 정렬기준에 따라 정렬한 후 리턴한다.
	loadRoomsWithGid: function(gid, callback) {
		this.find({ gid: gid }, function(err, rooms) {
			if(err) throw new Error(err.message);

			if(rooms) {

				// 정렬기준 1 - 최신 생선순으로 정렬.
				rooms.sort(function(x, y) {
					return x.createdAt < y.createdAt;
				});

				// 정렬기준 2 - 현재 참여인원 순으로 정렬.
				rooms.sort(function(x, y) {
					return x.createdAt < y.createdAt && x.participants.count < y.participants.count;
				});
				
				callback(rooms);
			}
		});
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