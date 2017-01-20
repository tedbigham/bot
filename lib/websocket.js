var WebSocketClient = require('websocket').client;
var client = new WebSocketClient();

function connect(url, bot) {
    client.connect(url);
    client.on('connectFailed', onConnectFailed);
    client.on('connect', onConnect);

    function onConnectFailed(err) {
        console.log(err);
    }

    function onConnect(connection) {
        connection.on('error', onError);
        connection.on('close', onClose);
        connection.on('message', onMessage);
        bot.onConnect(connection);
    }

    function onError(error) {
        console.log("websocket Error: " + error.toString());
    }

    function onClose() {
        console.log('websocket closed');
    }

    function onMessage(data) {
        if (data.type === 'utf8') {
            var message = JSON.parse(data.utf8Data);
            // this one is so noisy we don't even want to log it
            if (message.event == 'playerAvatarChange') return;
            bot.onMessage(message);
        } else {
            console.error('unexpected message encoding: ' + message.type);
        }
    }
}

module.exports = connect;