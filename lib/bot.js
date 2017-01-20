var async = require('async');
var contains = require('underscore').contains;

var websocket = require('./websocket');
var register = require('./register');
var Storage = require('./storage');
var Actions = require('./actions');
var Events = require('./events');
var Results = require('./results');
var strategy = require('./strategy');

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
            var ignore = contains(self.events.eventsToIgnore, key);
            ignore = ignore || !isOurEvent(message);

            console.log((ignore ? '-':'+') + ' EVENT ' + key + ':' + JSON.stringify(message));
            if (ignore) return;

            if (key in self.events) {
                self.events[key](message);
            } else {
                console.error('missing dispatch function events.' + key);
            }
        }

        function isOurEvent(event) {
            // direct messages are always for for us
            if (event.event == 'playerFriendInvite') return true;
            if (event.event == 'playerBalance') return true;

            // message for a specific player.  make sure it's us
            if (event.ids && event.ids.userID) {
                // invites have the other person's id

                return message.ids.userID == self.auth.userID;
            }

            // message for a specific table. make sure it's ours
            if (message.ids && message.ids.tableID) {
                // tableSiIn is the only time we don't filter on table id (because it tells us our table id)
                if (event.event == 'tableSeated') return true;

                if (message.ids.tableID == self.tableID) return true;

                console.error('got message for other table ' + message.ids.tableID);
                self.actions.tableStandUp(message.ids.tableID);
                return false
            }
        }

        function dispatchResult(message) {
            var key = message.action;
            console.log('+ RESULT ' + key + ':' + JSON.stringify(message));
            if(message.status != 'ok') {
                console.error(message.message);
                if (message.action != 'tableRequestSeat') return;
            }
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

    this.newHand = function (handID) {
        this.hands++;
        this.handID = handID;
        this.raises = 0;
        this.hand = undefined;
        this.board = undefined;
        this.handDescription = undefined;
        this.strength = undefined;
        this.bools({});
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
            self.actions.handPostAction('bet', Math.max(self.minRaiseBet, self.bigBlind * 3));
        }
    };

    this.status = function () {
        console.log('----------------------');
        console.log('>> seat: ' + this.seat);
        console.log('>> chip stack: ' + this.chipStack);
        console.log('>> hand: ' + this.hand);
        console.log('>> handDescription: ' + this.handDescription);
        console.log('>> strength:' + this.strength);
        console.log('>> board: ' + this.board);
        console.log('>> hand count: ' + this.hands);
        console.log('>> bank: ' + this.bank);
        console.log('----------------------');
    };
}

module.exports = Bot;