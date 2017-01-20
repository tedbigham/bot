/** server commands */

function Actions(bot) {

    this.casinoGetTable = function (tableID) {
        bot.send({
            "action": "casinoGetTable",
            "argument": {
                "tableID": tableID
            }
        });
    };

    this.tableRequestSeat = function(tableID, seat) {
        bot.send({
            "action": "tableRequestSeat",
            "argument": {
                tableID: tableID,
                seat: seat
            }
        });
    };

    this.tableBuyIn = function(tableID, chips) {
        bot.send({
            action: "tableBuyIn",
            argument: {
                tableID: tableID,
                chips: chips,
                autoTopUp: false
            }
        })
    };

    this.handPostAction = function (action, chips) {
        bot.send({
            action: "handPostAction",
            argument: {
                "handAction": {
                    "actionType": action,
                    "chips": chips
                },
                "tableID": bot.tableID
            }
        });
    };

    this.authenticate = function (userID, sessionID) {
        bot.send({
            action: "authenticate",
            argument: {
                userID: userID,
                sessionID: sessionID
            }
        });
    };

    this.casinoSubscribe = function() {
        bot.send({
            action: "casinoSubscribe"
        });
    };

    this.tableSubscribeImmediate = function () {
        bot.send({
            action: "tableSubscribeImmediate",
            argument: {
                type: "normal",
                limit: "no-limit"
            }
        });
    };

    this.acceptFriendInvite = function(userID) {
        bot.send({
            action: "playerAcceptFriendInvite",
            argument: {
                playerID: userID
            }
        });
    };

    this.pong = function() {
        bot.send({
            action: "systemPong"
        });
    };

    this.tableUnsubscribe = function(tableID) {
        bot.send({
            action: "tableUnsubscribe",
            argument: {
                tableID: tableID
            }
        });
    }

    this.tableStandUp = function(tableID) {
        bot.send({
            action: "tableStandUp",
            argument: {
                tableID: tableID
            }
        });
    }
}

module.exports = Actions;
