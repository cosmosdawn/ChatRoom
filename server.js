// 创建静态文件服务器

var http = require('http');

var fs = require('fs');

var path = require('path');

var mime = require('mime');

var cache = {};


// 错误响应辅助函数
function send404(response) {
	response.writeHead(404, {'Content-Type': 'text/plain'});
	response.write('Error 404: resource not found');
	response.end();
}

// 提供文件数据服务
function sendFile(response, filePath, fileContents) {
	response.writeHead(
		200, 
		{"content-type": mime.lookup(path.basename(filePath))}
		);
	response.end(fileContents)
}

// 判断文件是否缓存了的辅助函数
function serverStatic(response, cache, absPath) {
	if (cache[absPath]) {
		sendFile(response, absPath, cache[absPath]);
	} else {
		fs.exists(absPath, function(exists) {
			if (exists) {
				fs.readFile(absPath, function(err, data) {
					if (err) {
						send404(response);
					} else {
						cache[absPath] = data;
						sendFile(response, absPath, data);
					}
				});
			} else {
				send404(response);
			}
		})
	}
}

// 创建HTTP服务器
var server = http.createServer(function(request, response) {
    var filePath = false;

    if (request.url == '/') {
        filePath = 'public/index.html';
    } else {
        filePath = 'public' + request.url;
    }
    var absPath = './' + filePath;
    serverStatic(response, cache, absPath)
});

// 启动服务器的代码
server.listen(3000, function() {
    console.log('server listening on port 3000');
});






 var chatServer = require('./lib/chat_server'); // 加载一个定制的node模块
 chatServer.listen(server);       // 启动Socket.io服务器，提供一个已经定义好的http服务器，共享端口。






