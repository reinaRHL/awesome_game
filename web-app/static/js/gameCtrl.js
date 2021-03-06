var roundQuestion;
(function(){
    //begin game
    var game = new Game();
});
class Game {
    constructor(){
        this.round = 1;
        this.roundEnds;
        this.id;
        this.players = [];
        this.questions = [];
    }
    newRound(){
        //update ui begin a new round

    }
    
}
function timerUpdate(endTime) {
    var end = moment(endTime);
    (function timer(){
        $("#countdown").text(countdown(end).toString());
        if( moment().isBefore(end)){
            requestAnimationFrame(timer);
        }
    })();
}

// function submitAnswer(){
//     var toSend = {};
//     toSend.questionID = roundQuestion.question.id;
//     answer = $("#inputAnswer").val();
//     if(roundQuestion.question.correct_answer === answer){
//         console.log("CAN'T SUBMIT CORRECT ANSWER"); //TO DO: add user feedback
//     }
//     else{
//         toSend.answer = answer;
//         sockets.emit('sendAnswer',toSend);
//     }

// }
$(document).ready(function() {
    // This will fire when document is ready:
    $(window).resize(function() {
        // This will fire each time the window is resized:
        if($(window).width() < 400) {
            // if larger or equal
            $('#inputAnswerButton').addClass("btn-sm");
            $('#inputAnswer').addClass("input-sm");
            $('#votingStateDiv button').each(function(){
                $(this).addClass("input-sm");
            });
        } else {
            // if smaller
            $('#inputAnswerButton').removeClass("btn-sm");
            $('#inputAnswer').removeClass("input-sm");
            $('#votingStateDiv button').each(function(){
                $(this).removeClass("input-sm");
            });
        }
    }).resize(); // This will simulate a resize to trigger the initial run.
});

