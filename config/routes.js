var rooms	 = require('../app/controllers/rooms');
var messages = require('../app/controllers/messages');
var advertisements = require('../app/controllers/advertisements');
var imager = require('../app/controllers/imager');
var favorites = require('../app/controllers/favorites');

var middleDecipher = require('./middlewares/decipher').execute;
var middleAuth	 = require('./middlewares/authorization').hasAuthorization;
var middleAdvertisement = require('./middlewares/advertisement').pushAds;
var middleSkin = require('./middlewares/appSkin').apply;
var middlewares = [ middleDecipher, middleAuth, middleAdvertisement, middleSkin ];

/**
 * Expose routes
 */
module.exports = function(app) {

	// 로그인.
	app.get('/', middlewares, rooms.login);

	// 광고 클릭.
	app.post('/clickAd', advertisements.click);

	// 로비 입장.
	app.get('/lobby', middlewares, rooms.lobby);
	app.get('/lobby/tabs/normal', middleAuth, rooms.lobbyNormal);
	app.get('/lobby/tabs/secret', middleAuth, rooms.lobbySecret);
	app.get('/lobby/tabs/favorite', middleAuth, rooms.lobbyFavorite);
	app.get('/lobby/search', middleAuth, rooms.lobbySearch);
	
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
	
	// 즐겨찾기
	app.put('/favorites/add', middleAuth, favorites.addFavorite);
	app.put('/favorites/remove', middleAuth, favorites.removeFavorite);
	
	// 메세지 렌더링.
	app.post('/message', messages.message);
	
	// 이미지 업로드 처리.
	app.post('/imager/upload', imager.upload);

	// 파라미터 처리.
	app.param('id', rooms.load);
	
}