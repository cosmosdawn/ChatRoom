// 变量声明，使得我们可以使用socket.io,并初始化一些跟聊天相关的变量。
var socketio = require('socket.io');

var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};


// 连接处理逻辑
exports.listen = function(server) {
	io = socketio.listen(server);
	io.set('log level', 1);
	io.sockets.on('connection', function(socket) {
		guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
		joinRoom(socket, "VipRoom01");

		handleMessageBroadcasting(socket,nickNames);
		handleNameChangeAttempts(socket, nickNames, namesUsed);
		handleRoomJoining(socket);

		socket.on('rooms', function() {
			socket.emit('rooms', io.sockets.manager.rooms);
		});

		handleClientDisconnection(socket, nickNames, namesUsed);
	})
}

// 辅助函数

// 分配用户昵称
function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
	var name = 'Guest' + guestNumber;
	nickNames[socket.id] = name;
	socket.emit('nameResult', {
		success: true,
		name: name
	});
	namesUsed.push(name);
	return guestNumber + 1;
}

// 进入聊天室
function joinRoom(socket, room) {
    socket.join(room);
    currentRoom[socket.id] = room;
    socket.emit('joinResult', {room: room});
    socket.broadcast.to(room).emit('message', {
        text: nickNames[socket.id] + 'has joined' + room + '.'
    });

    var usersInRoom = io.sockets.clients(room);
    if (usersInRoom.length > 1) {
        var usersInRoomSummary = 'Users currently in' + room + ':';
        for (var index in usersInRoom) {
            var userSocketId = usersInRoom[index].id;
            if (userSocketId != socket.id) {
                if (index > 0) {
                    usersInRoomSummary += ', ';
                }
                usersInRoomSummary += nickNames[userSocketId];
            }
        }
        usersInRoomSummary += '.';
        socket.emit('message', {text: usersInRoomSummary});
    }
}

// 处理更名请求的逻辑
function handleNameChangeAttempts(socket, nickNames, namesUsed) {
	socket.on('nameAttempt', function(name) {
		if (name.indexOf('Guest') == 0) {
			socket.emit('nameResult', {
				success: false,
				message: 'Name cannot begin with "Guest" '
			});
		} else {
			if (namesUsed.indexOf(name) == -1) {
				var previousName = nickNames[socket.id];
				var previousNameIndex = namesUsed.indexOf(previousName);
				namesUsed.push(name);
				nickNames[socket.id] = name;
				delete namesUsed[previousNameIndex];
				socket.emit('nameResult', {
					success: true,
					name: name
				});
				socket.broadcast.to(currentRoom[socket.id]).emit('message', {
					text: previousName + 'is now known as' + name + '.'
				})
			} else {
				socket.emit('nameResult', {
					success: false,
					message: 'That name is already in use'
				})
			}
		}
	})
}

// 用来转发消息的
function handleMessageBroadcasting(socket) {
	socket.on('message', function(message) {
		socket.broadcast.to(message.room).emit('message', {
			text: nickNames[socket.id] + ':' + message.text
		});
	});
}

// 创建房间/进入新房间
function handleRoomJoining(socket) {
	socket.on('join', function(room) {
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket, room.newRoom);
	});
}

// 用户断开连接
function handleClientDisconnection(socket) {
	socket.on('disconnect', function() {
		var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
		delete namesUsed[nameIndex];
		delete nickNames[socket.id];
	})
}

// 以上服务端的逻辑已经写好了
