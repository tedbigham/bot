/** responses from actions */

find = require('underscore').find;

function Results(bot) {
    this.authenticate = function() {
        bot.actions.casinoSubscribe();
    };

    this.casinoGetTable = function(message) {
        var tableID = message.result.table.tableID;
        bot.minBuyIn = message.result.table.handConfiguration.minBuyIn;
        console.log('TABLE: '+ message.result.table.name);

        // are we already sitting?
        var mySeat = find(message.result.table.seats, function(seat) { return seat.playerID == bot.userID });
        if (mySeat) {
            console.log('already sitting at seat ' + mySeat.seat);
            bot.actions.tableRequestSeat(tableID, mySeat.seat);
            return;
        }

        // take an empty seat
        var emptySeat = find(message.result.table.seats, function(seat) { return !seat.sitting });
        if (emptySeat) {
            console.log('requesting seat ' + emptySeat.seat);
            bot.actions.tableRequestSeat(tableID, emptySeat.seat);
        } else {
            console.log('table is full');
            bot.actions.tableUnsubscribe(tableID);
            bot.actions.tableSubscribeImmediate();
        }
    };

    this.casinoSubscribe = function(message) {
        // clean up old table subscriptions except for one
        while(message.result.tableSubscriptions.length > 1) {
            var id = message.result.tableSubscriptions.pop();
            bot.actions.tableStandUp

            bot.actions.tableUnsubscribe(message.result.tableSubscriptions.pop())
            bot.actions.tableUnsubscribe(message.result.tableSubscriptions.pop())
        }
        if (message.result.tableSubscriptions.length > 0) {
            // rejoin current table
            bot.tableID = message.result.tableSubscriptions[0];
            console.log('rejoin table ' + bot.tableID);
            bot.actions.casinoGetTable(bot.tableID);
        } else {
            // join a new table
            console.log('join new table');
            bot.actions.tableSubscribeImmediate();
        }

    };

    this.tableRequestSeat = function(message) {
        if (message.status == 'ok') {
            bot.tableID = message.result.tableID;
            bot.actions.tableBuyIn(bot.tableID, bot.minBuyIn);
        } else {
            bot.actions.tableUnsubscribe(message.result.tableID);
            bot.actions.casinoSubscribe();
        }
    };

    this.tableSubscribe = function(message) {
        bot.tableID = message.result.tableData.tableDescription.tableID;
        bot.bigBlind = message.result.tableData.tableDescription.handConfiguration.startingBB;
    };

    this.tableStandUp = function(message) {
        bot.actions.tableUnsubscribe(message.result.tableID);
    };

    this.tableUnsubscribe = function(message) { };
    this.tableBuyIn = function(message) { };
    this.handPostAction = function(message) { };
    this.tableSubscribeImmediate = function(message) { };
}

module.exports= Results;
