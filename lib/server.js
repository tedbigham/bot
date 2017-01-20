var express = require('express')
var json = require('express-json');
var bodyParser = require('body-parser')
var http = require('http');
require('string-format').extend(String.prototype);

var app = express();

app.use(bodyParser.json());

app.post('/register', function (req, res) {
    console.log(req);
    response = {
        "status":"ok",
        "result":{
            "sessionID":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJjNTBkYzVhMC1kZDM4LTExZTYtOGI1Mi01Njg0N2FmZTk3OTkiLCJuYW1lIjoiVGVkIEIuIiwiYm90IjpmYWxzZSwicm9sZSI6MCwidmVyIjoiMS5iOGZkMDJkLW9yaWdpbi9kZXZlbG9wbWVudCIsImlhdCI6MTQ4NDcxNDY1N30=.oeALCFvbxPHMqTLHj8CvGQ7pIXuMcnps-UR6ddUDAJc=",
            "role":0,
            "userID":"c50dc5a0-dd38-11e6-8b52-56847afe9799"
        },
        "action":"authenticate"
    };
    res.send(response);
});

app.listen(8080, function () {
    console.log('express listening on port 8080')
})

var WebSocketServer = require('websocket').server;
var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

server.listen(1234, function() {
    console.log('websocket listening on port 1234');
});

wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

wsServer.on('request', function(request) {
    var connection = request.accept(null, request.origin);
    console.log('new connection');
    connection.on('message', onMessage);
    connection.on('close', onClose);

    function onMessage(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            connection.sendUTF("echo: " + message.utf8Data);
        } else {
            console.error('unexpected message type: '  + message.type);
        }
    }

    function onClose(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        console.log('reasonCode: {}, description: {}'.format(reasonCode, description));
    }
});
