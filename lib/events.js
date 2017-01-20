/** unsolicited messages from the server */
require('string-format').extend(String.prototype);

function Events(bot) {

    this.tableSitIn = function(event) {
        bot.tableID = event.ids.tableID;
        bot.seat = tableID = event.nums.seat;
        console.log('sitting at table {} seat {}'.format(bot.tableID, bot.seat));
    };

    this.tableSeated = function(event) {
        bot.chipStack = event.chips.chipStack;
        bot.betStack = event.chips.betStack;
        bot.hand = event.cards;
        bot.state = event.state;
        bot.seat = event.nums.seat;
        bot.status();
    };

    // {"eventID":2,"chips":{"chipStack":60000},"texts":{"name":"Ted B."},"ids":{"userID":"c50dc5a0-dd38-11e6-8b52-56847afe9799","tableID":"a888fa10-dde4-11e6-bc2b-56847afe9799"},"nums":{"seat":8},"eventName":"tableBuyIn","event":"tableBuyIn"}
    this.tableBuyIn = function(event) {
        bot.seat = event.nums.seat;
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

    // {"nums":{"seats":[8],"pot":0},"eventID":1,"eventName":"handPotAwarded","texts":{"bestHand":[[]],"highlight":[[]],"bestHandDescription":""},"chips":{"chipStacks":[74900],"chips":[900]},"event":"handPotAwarded","ids":{"tableID":"66ed64c2-dd43-11e6-8b52-56847afe9799"}}
    this.handPotAwarded = function(event) {
        if (event.nums.seats[0] == bot.seat) {
            console.log('we won the hand');
            bot.chipStack = event.chips.chipStack;
        } else {
            console.log('seat ' + event.nums.seats + ' won the hand');
        }
        bot.status();
        if(bot.config.maxHands > 0 && bot.hands > bot.config.maxHands) {
            console.log('quitting');
            bot.actions.tableStandUp(bot.tableID);
        }
    };

    // {"chips":{"sliderPot":70200,"chipStack":74900,"call":23000,"minRaiseBet":46000,"maxRaiseBet":74900},"eventID":1,"eventName":"handSeatChoices","bools":{"canRaise":false,"canCall":true,"canFold":true,"canCheck":false,"canBet":false},"event":"handSeatChoices","ids":{"tableID":"66ed64c2-dd43-11e6-8b52-56847afe9799"}}
    this.handSeatChoices = function(event) {
        bot.chipStack = event.chips.chipStack;
        bot.callAmount = event.chips.call;
        bot.minRaiseBet = event.chips.minRaiseBet;
        bot.maxRaiseBet = event.chips.maxRaiseBet;
        bot.bools(event.bools);
        bot.act();
    };

    // {"nums":{"seat":7},"eventID":1,"eventName":"handSeatPostedEntryBet","chips":{"chips":600,"chipStack":59400,"betStack":600},"event":"handSeatPostedEntryBet","ids":{"tableID":"66ed64c2-dd43-11e6-8b52-56847afe9799"}}
    this.handSeatPostedEntryBet = function(event) {
        bot.pot = event.chips.betStack;
    };

    // {"eventID":1,"eventName":"handStarted","event":"handStarted","ids":{"tableID":"66ed64c2-dd43-11e6-8b52-56847afe9799","handID":"1c70a4c0-dda7-11e6-8b52-56847afe9799"}}
    this.handStarted = function(event) {
        bot.newHand(event.ids.handID);
    };

    // {"ids":{"userID":"c50dc5a0-dd38-11e6-8b52-56847afe9799","tableID":"66ed64c2-dd43-11e6-8b52-56847afe9799"},"eventID":1,"eventName":"handCardsDealtToPlayer","event":"handCardsDealtToPlayer","cards":["3d","8s"]}
    this.handCardsDealtToPlayer = function(event) {
        bot.hand = event.cards;
        console.log('our cards ' + bot.hand);
    };

    // playerFriendInvite :: {"eventID":3,"eventName":"playerFriendInvite","event":"playerFriendInvite","texts":{"name":"Eric C."},"ids":{"userID":"c4763d90-34e4-11e6-a5bc-8a8c9f9ebf3f","avatarCatalogID":"ninja","avatarID":"c4763d90-34e4-11e6-a5bc-8a8c9f9ebf3f"}}
    this.playerFriendInvite = function(event) {
        bot.actions.acceptFriendInvite(event.ids.userID);
    };

    // {"nums":{"numPots":1},"eventID":1,"eventName":"handPotUpdated","chips":{"chips":[1200]},"event":"handPotUpdated","ids":{"tableID":"66ed64c2-dd43-11e6-8b52-56847afe9799"}}
    this.handPotUpdated = function(event) {
        // naively only look at the main pot, but we don't use this field anyway
        bot.pot = event.chips.chips[0];
    };

    // {"eventID":1,"eventName":"handFlopDealt","event":"handFlopDealt","texts":{"cards":["4h","8h","Jh"]},"ids":{"tableID":"66ed64c2-dd43-11e6-8b52-56847afe9799"}}
    this.handFlopDealt= function(event) {
        console.log("flop cards:" + event.texts.cards);
        bot.board = event.texts.cards;
    };

    // {"eventID":1,"eventName":"handTurnDealt","event":"handTurnDealt","texts":{"card":"2h"},"ids":{"tableID":"66ed64c2-dd43-11e6-8b52-56847afe9799"}}
    this.handTurnDealt = function(event) {
        console.log("turn cards:" + event.texts.card);
        if (bot.board) {
            bot.board.push(event.texts.card);
        }
    };

    // {"eventID":1,"eventName":"handRiverDealt","event":"handRiverDealt","texts":{"card":"9c"},"ids":{"tableID":"66ed64c2-dd43-11e6-8b52-56847afe9799"}}
    this.handRiverDealt = function(event) {
        console.log("river card:" + event.texts.card);
        if (bot.board) {
            bot.board.push(event.texts.card);
        }
    };

    // {"chips":{"call":0},"eventID":1,"eventName":"handPreSelect","bools":{"canCall":false,"canFold":false,"canCheck":true,"canCallAny":true},"event":"handPreSelect","ids":{"tableID":"66ed64c2-dd43-11e6-8b52-56847afe9799"}}
    this.handPreSelect = function(event) {
        //"bools":{"canCall":false,"canFold":false,"canCheck":true,"canCallAny":true}
        bot.bools(event.bools);
    };

    //{"ids":{"tableID":"a2542a30-d3f2-11e6-8a5c-56847afe9799"},"event":"handCardsShown","texts":{"cards":["Ts","5s"]},"nums":{"seat":7}}
    this.handCardsShown = function(event) {
        console.log('seat ' + event.nums.seat + ' shows ' + event.texts.cards);
    };

    this.systemPing = function(event) {
        bot.actions.pong();
    };

    this.tableInsufficientChips = function(event) {
        // probably should rebuy here, but it seems to trigger, even when we do have enough chips.
        console.error(event);
    };

    this.playerLevelChange = function(event) {
        console.log('LEVEL UP -> ' + event.nums.level);
    }

    this.systemNotification = function(event) {
        console.error(event.texts.message);
    }

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
        'handHandDescription',
        'handSeatPostedDeadBlind',
        'handSeatStartedTimeout',
        'handSeatActive',
        'tableResume',
        'tableThemeVoted',
        'handAllCardsRemoved',
        'handChipsReturned', // is this when no one calls the bet?
        'handDealerButton',
        'handCardsDealt'
    ];

}

module.exports= Events;
