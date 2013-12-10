var mongoose = require('mongoose');
var Room = mongoose.model('Room');
var Favorite = mongoose.model('Favorite');

var logger   = require('../../libs/Logger');

////////////////////////////////////////////////////////////////////////////////////////
// 로비 페이지
////////////////////////////////////////////////////////////////////////////////////////
exports.login = function(req, res) {
	req.method = 'GET';
	res.redirect('/lobby');
}

exports.lobby = function(req, res) {
	var data = {
		page: 'lobby',
	};

	res.render('pages/lobby/lobby.jade', data);
}

exports.lobbyNormal = function(req, res) {
	Favorite.list(req.session.name, function(favs) {
		Room.recent(req.session.gid, 'normal', null, function(rooms) {
			var data = {
				rooms: rooms,
				favorites: favs
			};
			
			res.json(200, data);
		});
	});
}

exports.lobbySecret = function(req, res) {
	Favorite.list(req.session.name, function(favs) {
		Room.recent(req.session.gid, 'secret', null, function(rooms) {
			var data = {
				rooms: rooms,
				favorites: favs
			};
			
			res.json(200, data);
		});
	});
}

exports.lobbyFavorite = function(req, res) {
	Favorite.list(req.session.name, function(favs) {
		Room.recent(req.session.gid, 'favorite', favs, function(rooms) {
			var data = {
				rooms: rooms,
				favorites: favs
			};
			
			res.json(200, data);
		});
	});
}

exports.lobbySearch = function(req, res) {
	Favorite.list(req.session.name, function(favs) {
		Room.search(req.session.gid, req.query.searchKey, function(rooms) {
			var data = {
				rooms: rooms,
				favorites: favs
			};
			
			res.json(200, data);
		});
	});
}

////////////////////////////////////////////////////////////////////////////////////////
// 그룹 생성폼
////////////////////////////////////////////////////////////////////////////////////////
exports.form = function(req, res) {
	var data = {
		page: 'form',
		hdrTitle: '새 그룹 생성',
	};

	res.render('pages/form/form.jade', data);
}

////////////////////////////////////////////////////////////////////////////////////////
// 그룹 생성
////////////////////////////////////////////////////////////////////////////////////////
exports.create = function(req, res) {
	// Room 생성
	var room = new Room(req.body);
	
	var thumbList = req.session.cssDef.lobby.roomCell.roomThumb.thumbImgUrls;
	
	var thumbType = Math.floor( thumbList.length * Math.random() );
	room.thumbnail = thumbList[thumbType];
	room.owner = req.session.name;
	room.save();

	logger.debug(room);

	res.json(200, { rid: room._id });
}

////////////////////////////////////////////////////////////////////////////////////////
// 그룹 업데이트
////////////////////////////////////////////////////////////////////////////////////////
exports.update = function(req, res) {
	var rid = req.body.rid;
	delete req.body.rid;
	Room.findByIdAndUpdate(rid, req.body, function(err, room) {
		if(err) throw new Error(err.message);
		else {
			if(room)
				res.json(200, { success: true });
			else
				res.json(200, { success: false });
		}
	});
}

////////////////////////////////////////////////////////////////////////////////////////
// 그룹 삭제
////////////////////////////////////////////////////////////////////////////////////////
exports.drop = function(req, res) {
	Room.findOne({ _id: req.body.rid }, function(err, room) {
		room.remove(function(err) {
			if(err) throw new Error(err.message);
			else {
				res.json(200, { success: true });
			}
		});
	})
}

////////////////////////////////////////////////////////////////////////////////////////
// 그룹 비밀번호 확인
////////////////////////////////////////////////////////////////////////////////////////
exports.secretRoom = function(req, res) {
	var rid = req.body.rid;
	var secretKey = req.body.secretKey;

	Room.checkPassword(rid, secretKey, function(result) {
		if(result)
			res.json(200, { success: true });
		else
			res.json(200, { success: false });
	});
}

////////////////////////////////////////////////////////////////////////////////////////
// 대화방 레이아웃
////////////////////////////////////////////////////////////////////////////////////////
exports.room = function(req, res) {
	var data = {
		page: 'room',
		room: req.room
	}

	res.render('pages/room/index.jade', data);
}

////////////////////////////////////////////////////////////////////////////////////////
// 대화방(채팅창)
////////////////////////////////////////////////////////////////////////////////////////
exports.chat = function(req, res) {
	req.room.rid = req.room._id;
	res.render('pages/room/chat.jade', req.room);	
}

////////////////////////////////////////////////////////////////////////////////////////
// 대화방(그룹정보)
////////////////////////////////////////////////////////////////////////////////////////
exports.info = function(req, res) {
	var rid = req.room._id;
	var uid = req.session.name;
	Favorite.check(rid, uid, function(result) {
		req.room.rid = req.room._id;
		req.room.fav = result;
		res.render('pages/room/info.jade', req.room);
	})
}

////////////////////////////////////////////////////////////////////////////////////////
// 대화방(참여자 목록)
////////////////////////////////////////////////////////////////////////////////////////
exports.participants = function(req, res) {
	req.room.rid = req.room._id;
	res.render('pages/room/participants.jade', req.room);
}

////////////////////////////////////////////////////////////////////////////////////////
// 대화방 id 바인드
////////////////////////////////////////////////////////////////////////////////////////
exports.load = function(req, res, next, id) {
 	Room.findOne({ _id: id }, function(err, room) {
 		if( err )   return next(err);
 		if( !room ) return next(new Error('room not exist'));
 		
 		req.room = room;
 		next();
 	});
}