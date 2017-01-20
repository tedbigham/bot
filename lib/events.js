/** unsolicited messages from the server */
require('string-format').extend(String.prototype);

function Events(bot) {

    this.tableBuyIn = function(event) {
        //bot.seat = event.nums.seat;
        bot.chipStack = event.chips.chipStack;
        bot.status();
    };

    this.systemDeviceDisconnect = function(event) {
        console.error('server quit');
        process.exit(-1);
    };

    // {"chips":0,"eventID":3,"eventName":"playerBalance","event":"playerBalance","gems":350}
    this.playerBalance = function(event) {
        bot.bank = event.chips;  // is this different than chipStack?
        bot.status();
    };

    this.handPotAwarded = function(event) {
        if (event.nums.seats[0] == bot.seat) {
            console.log('we won the hand');
            bot.chipStack = event.chips.chipStacks[0];
        } else {
            console.log('seat ' + event.nums.seats + ' won the hand');
        }
        bot.status();
        if(bot.config.maxHands > 0 && bot.hands > bot.config.maxHands) {
            console.log('quitting');
            bot.actions.tableStandUp(bot.tableID);
        }
    };

    this.handSeatChoices = function(event) {
        bot.chipStack = event.chips.chipStack;
        bot.callAmount = event.chips.call;
        bot.minRaiseBet = event.chips.minRaiseBet;
        bot.maxRaiseBet = event.chips.maxRaiseBet;
        bot.bools(event.bools);
        bot.act();
    };

    this.handSeatPostedEntryBet = function(event) {
        bot.pot = event.chips.betStack;
    };

    this.handStarted = function(event) {
        bot.newHand(event.ids.handID);
    };

    this.handCardsDealtToPlayer = function(event) {
        bot.hand = event.cards;
        console.log('our cards ' + bot.hand);
    };

    this.playerFriendInvite = function(event) {
        bot.actions.acceptFriendInvite(event.ids.userID);
    };

    this.handPotUpdated = function(event) {
        // naively only look at the main pot, but we don't use this field anyway
        bot.pot = event.chips.chips[0];
    };

    this.handFlopDealt= function(event) {
        console.log("flop cards:" + event.texts.cards);
        bot.board = event.texts.cards;
    };

    this.handTurnDealt = function(event) {
        console.log("turn cards:" + event.texts.card);
        if (bot.board) {
            bot.board.push(event.texts.card);
        }
    };

    this.handRiverDealt = function(event) {
        console.log("river card:" + event.texts.card);
        if (bot.board) {
            bot.board.push(event.texts.card);
        }
    };

    this.handPreSelect = function(event) {
        //"bools":{"canCall":false,"canFold":false,"canCheck":true,"canCallAny":true}
        bot.bools(event.bools);
    };

    this.handCardsShown = function(event) {
        console.log('seat ' + event.nums.seat + ' shows ' + event.texts.cards);
    };

    this.systemPing = function(event) {
        bot.actions.pong();
    };

    this.tableInsufficientChips = function(event) {
        // probably should rebuy here, but it seems to trigger even when we do have enough chips.
        console.error(event);
    };

    this.playerLevelChange = function(event) {
        console.log('LEVEL UP -> ' + event.nums.level);
    };

    this.systemNotification = function(event) {
        console.error(event.texts.message);
    };

    this.handHandDescription = function(event) {
        bot.handDescription = event.texts.description;
        bot.strength = event.nums.strength;
        console.log('HAND: {}, strength: {}'.format(bot.handDescription, bot.strength));
    };

    this.eventsToIgnore = [
        'tableSpectatorLeft',
        'tableSitOut',
        'playerSentGift',
        'playerRemoveGift',
        'tableStood',
        'playerRewardCountdown',
        'tableSpectatorJoined',
        'tableThemeChange',
        'handSeatPosted',
        'playerJackpotWon',
        'tableThemeVotingPeriod',
        'playerXPChange',
        'handShowOrMuck',
        'playerEloChange',
        'handSeatPostedDeadBlind',
        'handSeatStartedTimeout',
        'handSeatActive',
        'tableResume',
        'tableThemeVoted',
        'handAllCardsRemoved',
        'handChipsReturned', // is this when no one calls the bet?
        'handDealerButton',
        'handCardsDealt',
        'tableSitIn'
    ];

}

module.exports= Events;
