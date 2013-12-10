var amqp	 = require('amqp');
var io		 = require('socket.io');
var os		 = require('os');
var async  = require('async');
var mongoose = require('mongoose');
var Room	 = mongoose.model('Room');
var Chat     = mongoose.model('Chat');

var usersockets = require('./usersockets');
var logger		= require('../../libs/Logger');


module.exports = function (server, config) {
	////////////////////////////////////////////////////////////////////////////////////////
	// RabbitMQ Setup
	////////////////////////////////////////////////////////////////////////////////////////
	var rabbitMQ = amqp.createConnection(config.rabbitMQ);

	var enterExchange   = {};
	var updateExchange  = {};
	var messageExchange = {};
    
	rabbitMQ.on('ready', function () {
		////////////////////////////////////////////////////////////////////////////////////////
		// 사용자의 대화방 출입/퇴장 관련 브로드캐스트 처리
		// usersockets.register(unregister) 참조
		////////////////////////////////////////////////////////////////////////////////////////
		rabbitMQ.exchange('exchange-entrance', { type: 'fanout', autoDelete: true }, function (_exchange) {
			enterExchange = _exchange;
		});
				
		var ENTER_QUEUE = 'queue-enter-' + new Date().getTime() + '-' + os.hostname();
				
		rabbitMQ.queue(ENTER_QUEUE, { exclusive: true }, function (queue) {
			queue.bind('exchange-entrance', '');
			
			queue.subscribe(function (data) {
				if( data && data.data.length > 0 ) {
					try {
						var entrance = data.data.toString('utf-8');
						entrance = JSON.parse(entrance);
						
						var users = usersockets.getUsers(entrance.rid);
						users.forEach(function (usersock) {
							usersock.emit('entrance', JSON.stringify(entrance));
						});	
					} catch (e) {
						logger.error(e);
					}
				}
			});
		});



		////////////////////////////////////////////////////////////////////////////////////////
		// 방 정보 수정 브로드캐스트 처리
		////////////////////////////////////////////////////////////////////////////////////////
		rabbitMQ.exchange('exchange-update', { type: 'fanout', autoDelete: true }, function(_exchange) {
			updateExchange = _exchange;
		});

		var UPDATE_QUEUE = 'queue-update-' + new Date().getTime() + '-' + os.hostname();

		rabbitMQ.queue(UPDATE_QUEUE, { exclusive: true }, function(queue) {
			queue.bind('exchange-update', '');

			queue.subscribe(function(data) {
				if( data && data.data.length > 0 ) {
					try {
						var update = data.data.toString('utf-8');
						update = JSON.parse(update);

						var users = usersockets.getUsers(update.rid);
						users.forEach(function(userSock) {
							userSock.emit('updateRoom', JSON.stringify(update));
						});
					} catch(e) {
						logger.error(e);
					}
				}
			})
		})


		////////////////////////////////////////////////////////////////////////////////////////
		// 채팅 메세지 브로드캐스트 처리
		////////////////////////////////////////////////////////////////////////////////////////
		rabbitMQ.exchange('exchange-message', { type: 'fanout', autoDelete: true }, function (_exchange) {
			messageExchange = _exchange;
		});
				
		var MESSAGE_QUEUE = 'queue-message-' + new Date().getTime() + '-' + os.hostname();

		rabbitMQ.queue(MESSAGE_QUEUE, { exclusive: true }, function (queue) {
			queue.bind('exchange-message', '');

			queue.subscribe(function (data) {
				logger.debug('message recv event.');

				if( data && data.data.length > 0 ) {
					try {
						var message = data.data.toString('utf-8');
						message = JSON.parse(message);
						
						var users = usersockets.getUsers(message.rid);
						users.forEach(function (usersock) {
							usersock.emit('message', JSON.stringify(message));
						});
					} catch (e) {
						logger.error(e);
					}
				}
			});	
		});
	});

	////////////////////////////////////////////////////////////////////////////////////////
	// Socket.io
	////////////////////////////////////////////////////////////////////////////////////////
	var socketServer = io.listen(server, {log: false});
		
	socketServer.sockets.on('connection', function (socket) {
		////////////////////////////////////////////////////////////////////////////////////////
		// 채팅 메세지 처리
		////////////////////////////////////////////////////////////////////////////////////////
		socket.on('message', function (data) {
			logger.debug('message send event.');

			if( data && data.length > 0 ) {

				if( socket.rid ) {
					var msg = JSON.parse(data);
					
					async.waterfall([
						// save into Rooms
						function(cb) {
							Room.update({ _id: socket.rid }, {$set: { lastRecordTime: new Date() }}, function(err) {
								if(err) throw new Error(err.message);
								else {
									cb(null);
								}
							});
						},
						
						// save into Chats
						function(cb) {
							var chat = new Chat(msg);
							chat.rid = socket.rid;
							chat.save(function(err) {
								if(err) throw new Error(err.message);
								else {
									cb(null, chat);
								}
							});
						},
						
						// send message to RabbitMQ server.
						function(chat, cb) {
							messageExchange.publish('', JSON.stringify(chat));
						}
					]);
				}
				else {
					logger.warn('[ app/chat/chat.js ] - DB.insert failed! socket.rid is null.');
				}
			}
			else {
				logger.warn('[ app/chat/chat.js ] - invalid message data format!');
			}
		});
		
		////////////////////////////////////////////////////////////////////////////////////////
		// 대화방 참가 처리
		////////////////////////////////////////////////////////////////////////////////////////
		socket.on('join', function (data) {
			logger.debug('join event occur.');
			
			if( data && data.length > 0 ) {
				try {
					data = JSON.parse(data);

					logger.debug(' join - user name : ' + data.name);
			
					socket.rid = data.rid;
					socket.gid = data.gid;
					socket.name = data.name;
					socket.profileImageUrl = data.profileImageUrl;

					usersockets.register(socket, enterExchange, data);
				} catch (e) {
					logger.error(e);
				}
			}
			else {
				logger.warn('[ app/chat/chat.js ] - invalid join data format!');
			}
		});

		////////////////////////////////////////////////////////////////////////////////////////
		// 대화방 퇴장 처리
		////////////////////////////////////////////////////////////////////////////////////////
		socket.on('disconnect', function () {
			logger.debug('disconnect event occur.');

			usersockets.unregister(socket, enterExchange);

			// 새방장 지정.
			if(socket.owner) {
				var users = usersockets.getUsers(socket.rid);
				if(users.length > 0) {
					
					/* 랜덤 방장 뽑기 - deprecated */
					// var who = Math.floor( Math.random() * users.length );
					// var newOwner = users[who].name;


					// 들어온 순으로 방장 되는 알고리즘
					// usersockets.unregister() 처리된 직후이므로 인덱스 0이 방장이 된다.
					var newOwner = users[0].name;

					Room.findByIdAndUpdate(socket.rid, { owner: newOwner }, function(err, room) {
						if(err) throw new Error(err.message);
						else {
							if(room) {
								users[0].owner = true;

								var updateInfo = {
									rid: socket.rid,
									owner: newOwner
								};

								updateExchange.publish('', JSON.stringify(updateInfo));
							}
							else {
								logger.warn('방장 갱신 실패.');
							}
						}
					});
				}
			}
		});


		////////////////////////////////////////////////////////////////////////////////////////
		// 이전 대화 기록
		////////////////////////////////////////////////////////////////////////////////////////
		socket.on('prevMessages', function(data) {
			logger.debug('prevMessages event occur.');

			if( data && data.length > 0 ) {
				data = JSON.parse(data);

				var rid = socket.rid;
				var target = data.target || new Date();
				var amount = 20;

				Chat.previous(rid, target, amount, function(messages) {
					socket.emit('prevMessages', JSON.stringify(messages));
				});
			}
			else {
				logger.warn('[ app/chat/chat.js ] - invalid prevMessages data format!');
			}
		});

		////////////////////////////////////////////////////////////////////////////////////////
		// 방 정보 업데이트
		////////////////////////////////////////////////////////////////////////////////////////
		socket.on('updateRoom', function(data) {
			logger.debug('updateRoom event occur.');

			data = JSON.parse(data);
			logger.debug(data);

			updateExchange.publish('', JSON.stringify(data));
		});
	});
}