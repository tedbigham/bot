/**
 * Sample AI routines.
 * This just looks at the cards and picks one of three styles. not very smart
 */

pokerEvaluator = require("poker-evaluator");

var WEAK = 'weak';
var STRONG = 'strong';
var NEUTRAL = 'neutral';

module.exports = function getPlayStyle(bot) {
    var hand = bot.hand;
    if (!hand || hand.length != 2) {
        console.error('hand=' + hand);
        return NEUTRAL;
    }

    var board = bot.board;
    if (!board) return preFlop(hand);

    if (board.length < 3 || board.length > 5) {
        console.error('board=' + board);
        return NEUTRAL;
    }
    return postFlop(hand, board);
};

function preFlop(hand) {
    var a = hand[0].charAt(0);
    var b = hand[1].charAt(0);
    var suitType = a == b ? '' : hand[0].charAt(1) == hand[1].charAt(1) ? 's' : 'o';
    var sortOrder = 'AKQJT98765432';
    var cards = (sortOrder.indexOf(a) < sortOrder.indexOf(b) ? a+b : b+a) + suitType;
    console.log(cards);
    var rank = preflopRanks.indexOf(cards);
    console.log('hand rank is ' + rank);
    if (rank == -1) return WEAK;
    if (rank <= 20) return STRONG;
    return NEUTRAL;
}

function postFlop(hand, board) {
    // bug in pokerEvaluator doesn't work with 6 cards
    if (board.length != 3 && board.length != 5) return NEUTRAL;

    var strength = pokerEvaluator.evalHand(hand.concat(board)).value;
    console.log('hand strength is ' + strength);
    return strength < 9000 ? WEAK : strength > 11000 ? STRONG : NEUTRAL;
}

// http://holdemtight.com/pgs/od/oddpgs/3-169holdemhands.htm
// the 80 hands rated 10% or higher
var preflopRanks = [
    'AA',  'KK',  'QQ',  'AKs', 'JJ',  'AQs', 'KQs', 'AJs', 'KJs', 'TT',  'AKo', 'ATs', 'QJs', 'KTs', 'QTs', 'JTs',
    '99',  'AQo', 'A9s', 'KQo', '88',  'K9s', 'T9s', 'A8s', 'Q9s', 'J9s', 'AJo', 'A5s', '77',  'A7s', 'KJo', 'A4s',
    'A3s', 'A6s', 'QJo', '66',  'K8s', 'T8s', 'A2s', '98s', 'J8s', 'ATo', 'Q8s', 'K7s', 'KTo', '55',  'JTo', '87s',
    'QTo', '44',  '22',  '33',  'K6s', '97s', 'K5s', '76s', 'T7s', 'K4s', 'K2s', 'K3s', 'Q7s', '86s', '65s', 'J7s',
    '54s', 'Q6s', '75s', '96s', 'Q5s', '64s', 'Q4s', 'Q3s', 'T9o', 'T6s', 'Q2s', 'A9o', '53s', '85s', 'J6s', 'J9o'

];
