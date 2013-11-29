var mongoose = require('mongoose');

var Room	 = mongoose.model('Room');
var logger	 = require('../../libs/Logger');



var hashmap = new Array();

var UserSockets = module.exports = {
	////////////////////////////////////////////////////////////////////////////////////////
	// 대화방의 참여자 목록을 가져온다. 참여자가 없는 경우 빈 목록을 출력한다.
	////////////////////////////////////////////////////////////////////////////////////////
    getUsers: function (rid) {
        if( !rid ) throw new Error('invalid parameter. rid: '+rid);
        return hashmap[rid] || [];
    },
	
	////////////////////////////////////////////////////////////////////////////////////////
	// 대화방에 사용자가 참가했을 경우, 사용자를 대화방에 추가한다.
	////////////////////////////////////////////////////////////////////////////////////////
	register: function (usersock, exchange, userdata) {
		if( !usersock )		 throw new Error('invalid parameter. usersock: '+usersock);
		if( !userdata )		 throw new Error('invalid parameter. userdata: '+userdata);
		if( !userdata.rid )	 throw new Error('invalid parameter. userdata.rid: '+userdata.rid);
		if( !userdata.gid )	 throw new Error('invalid parameter. userdata.gid: '+userdata.gid);
		if( !userdata.name ) throw new Error('invalid parameter. userdata.name: '+userdata.name);
		
		logger.info('register [rid: '+userdata.rid+', gid: '+userdata.gid+', name: '+userdata.name+']');

	    var rid		= userdata.rid;
	    var gid		= userdata.gid;
	    var name	= userdata.name;
	    var profileImageUrl = userdata.profileImageUrl;

	    if( hashmap[rid] == null ) {
	        hashmap[rid] = new Array();
	    }
		
	    hashmap[rid].push(usersock);
		
		// 대화방의 참가자 카운트를 1 증가하고 참여인원 리스트에 추가한다.
	    Room.joinRoom(rid, userdata, function (room) {
			if( room ) {
				// 대화방 참가자 정보 변동을 브로드캐스트한다.
				var notify = {
					type: 'join',
					rid: rid,
					gid: gid,
					name: name,
					profileImageUrl: profileImageUrl, 
					count: room.participants.length,
					capacity: room.capacity
				}
					
				exchange.publish('', JSON.stringify(notify));

				logger.debug('register notification ok. name: '+name);

				// 첫 사용자일 경우 방장 지정.
				if(room.participants.length === 1) {
					Room.findByIdAndUpdate(rid, { owner: name }, function(err, room) {
						if(err) throw new Error(err);
						else {
							if(room) {
								usersock.owner = true;
								logger.debug('방장 지정 되었습니다: ' + name);
							}
							else {
								logger.warn('방장 지정 실패.');
							}
						}
					})
				}
			}
	        
	    });
	},
	
	////////////////////////////////////////////////////////////////////////////////////////
	// 대화방에서 사용자가 나갔을 경우, 사용자를 대화방에서 제거한다.
	////////////////////////////////////////////////////////////////////////////////////////
	unregister: function (usersock, exchange) {
		if( !usersock ) throw new Error('invalid parameter. usersock: '+usersock);
		
		logger.info('unregister [rid: '+usersock.rid+', gid: '+usersock.gid+', name: '+usersock.name+']');

	    var rid	 = usersock.rid;
	    var gid	 = usersock.gid;
	    var name = usersock.name;
		
		// 대화방의 참여자 목록
		var users = hashmap[rid];
		
		if( users != null ) {
			// 참여자 목록중 현재(대화방을 나가는) 사용자를 찾는다.
			var index = users.indexOf(usersock);
			
			if( index > -1 ) {
				users.splice(index, 1);

				// 대화방의 참가자 카운트를 1 감소시키고 참여인원 리스트에서 삭제한다.
				Room.exitRoom(rid, name, function (room) {
					// 대화방 참가자 정보 변동을 브로드캐스트한다.
					if( room ) {
						var notify = {
							type: 'exit'
							, rid: rid
							, gid: gid
							, name: name
							, count: room.participants.length
							, capacity: room.capacity
						}

						exchange.publish('', JSON.stringify(notify));

						logger.debug('unregister notification ok. name: '+name);
					}
				});
			}
		}
	}
}