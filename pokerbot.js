var Bot = require('./lib/bot');

var config = {
    username: 'tedbigham5',
    authService: 'http://candidate.hdpoker.com/register',
    gameService: 'ws://candidate.hdpoker.com:1234/connections/client',
    maxHands: -1
};

new Bot(config).run();
