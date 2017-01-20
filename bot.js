var async = require('async');
var contains = require('underscore').contains;

var websocket = require('./lib/websocket');
var register = require('./lib/register');
var Storage = require('./lib/storage');
var Actions = require('./lib/actions');
var Events = require('./lib/events');
var Results = require('./lib/results');
var strategy = require('./lib/strategy');

/** a single poker player (at a single table) */
function Bot(config) {
    var self = this;
    this.config = config;
    this.events = new Events(this);
    this.results = new Results(this);
    this.actions = new Actions(this);
    this.hands = 0;

    this.run = function () {
        var self = this;
        self.tokens = new Storage('tokens.json');
        async.series([
            initAccount,
            connect
        ]);
    };

    /** create the account if we don't have it saved */
    function initAccount(next) {
        self.auth = self.tokens.get(self.config.username);
        if (self.auth) {
            console.log('using existing account ' + self.auth.userID);
            self.userID = self.auth.userID;
            return next();
        }

        console.error('account not found');
        register(self.config, function(err, auth) {
            if (err) {
                console.error(err.message);
                return next(err)
            }
            self.auth = auth;
            self.userID = self.auth.userID;
            self.tokens.set(self.config.username, auth);
            next();
        });
    }

    function connect(next) {
        websocket(self.config.gameService, self, function(err, connection) {
            if (err) return next(err);
            self.connection = connection;
            self.connection.sendUTF(self.actions.authenticate);
            next();
        });
    }

    this.onConnect = function(connection) {
        this.connection = connection;
        this.actions.authenticate(this.auth.userID, this.auth.sessionID);
    };

    this.send = function(message) {
        var json = JSON.stringify(message);
        console.log('SEND:' + json)
        self.connection.sendUTF(json);
    };

    this.quit = function(err) {
        this.status();
        if (err) consolg.error(err);
        process.exit();
    };

    this.onMessage = function(message) {
        var self = this;

        if ("event" in message) {
            dispatchEvent(message);
        } else if ("action" in message) {
            dispatchResult(message);
        } else {
            console.error("unknown message type: " + message);
        }

        function dispatchEvent(message) {
            var key = message.event;
            console.log('EVENT ' + key + ':' + JSON.stringify(message));

            if (self.tableID && message.ids && message.ids.tableID &&
               (message.ids.tableID != self.tableID) && message.event != 'tableStandUp')
            {
                console.error('got message for other table ' + message.ids.tableID);
                self.actions.tableStandUp(message.ids.tableID);
                return;
            }
            if (contains(self.events.eventsToIgnore, key)) return;
            if (key in self.events) {
                self.events[key](message);
            } else {
                console.error('missing dispatch function events.' + key);
            }
        }

        function dispatchResult(message) {
            var key = message.action;
            console.log('RESULT ' + key + ':' + JSON.stringify(message));
            if (key in self.results) {
                self.results[key](message);
            } else {
                console.error('missing dispatch function results.' + key);
            }
        }
    };

    this.bools = function (b) {
        this.canRaise = b.canRaise;
        this.canCall = b.canCall;
        this.canFold = b.canFold;
        this.canCheck = b.canCheck;
        this.canBet = b.canBet;
    };

    this.newHand = function () {
        this.raises = 0;
        this.hand = undefined;
        this.board = undefined;
    };

    this.act = function () {
        self.playStyle = strategy(self);
        self.status();

        if (self.playStyle == 'weak') playWeak();
        else if (self.playStyle == 'strong') playAggressive();
        else playPassive();

        function playWeak() {
            console.log('playWeak');
            if (self.canCheck) check();
            else fold();
        }

        function playPassive() {
            console.log('playPassive');
            if (self.canCheck) check();
            else if (self.canCall && self.callAmount <= (self.bigBlind * 3)) call();
            else fold();
        }

        // make up to two more raises, then call
        function playAggressive() {
            console.log('playAggressive');
            if (self.canRaise && self.raises++ < 3) bet();
            else if (self.canBet && self.raises++ < 3) bet();
            else if (self.canCall) call();
            else if (self.canCheck) check();
            else {
                console.error('wtf?');
                call(); // maybe we missed a bool
            }
        }

        function check() {
            console.log("CHECK");
            self.actions.handPostAction('check', 0);
        }

        function call() {
            console.log("CALL");
            self.actions.handPostAction('call', self.callAmount);
        }

        function fold() {
            console.log("FOLD");
            self.actions.handPostAction('fold', 0);
        }

        function bet() {
            console.log("BET");
            self.actions.handPostAction('bet', self.minRaiseBet);
        }
    };

    this.status = function () {
        console.log('>> seat: ' + this.seat);
        console.log('>> chip stack: ' + this.chipStack);
        console.log('>> hand: ' + this.hand);
        console.log('>> board: ' + this.board);
        console.log('>> hand count: ' + this.hands);
    };
}

var config = {
    username: 'tedbigham5',
    authService: 'http://candidate.hdpoker.com/register',
    gameService: 'ws://candidate.hdpoker.com:1234/connections/client',
    maxHands: -1
};

new Bot(config).run();
