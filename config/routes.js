var rooms	 = require('../app/controllers/rooms');
var messages = require('../app/controllers/messages');
var advertisements = require('../app/controllers/advertisements');

var middleAuth	 = require('./middlewares/authorization').hasAuthorization;
var middleAdvertisement = require('./middlewares/advertisement').pushAds;
var middlewares = [ middleAuth, middleAdvertisement ];

/**
 * Expose routes
 */
module.exports = function(app) {

	// 로그인.
	app.get('/', middleAuth, rooms.login);

	// 광고 클릭.
	app.post('/clickAd', advertisements.click);

	// 로비 입장.
	app.get('/lobby', middlewares, rooms.lobby);
	
	// 방 만들기 폼.
	app.get('/room/form', middlewares, rooms.form);

	// 방 생성, 입장, 수정, 삭제.
	app.post('/room', middlewares, rooms.create);
	app.get('/room/:id', middleAuth, rooms.room);
	app.put('/room/:id', middleAuth, rooms.update);
	app.delete('/room/:id', middleAuth, rooms.drop);

	// 방 비밀번호 체크.
	app.post('/secretRoom', middleAuth, rooms.secretRoom);
	
	// 그룹 내부 화면 렌더링.
	app.get('/room/:id/chat', middleAuth, rooms.chat);
	app.get('/room/:id/info', middleAuth, rooms.info);
	app.get('/room/:id/participants', middleAuth, rooms.participants);


	// 메세지 렌더링.
	app.post('/message', messages.message);

	// 파라미터 처리.
	app.param('id', rooms.load);
}