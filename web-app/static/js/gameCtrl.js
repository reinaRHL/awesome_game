(function(){
    //begin game
    var game = new Game();
    angular.module('inGameApp', [])
    .controller('inGameCtrl' , ['$scope',function($scope) {

    // This function will be called when user clicks 'create' button inside modal.
    // This function sends user input, title username and other player list.
  }]);
});
class Game {
    constructor(){
        this.round = 1;
        this.roundEnds = moment().add(1, 'minute'); //time when the round will be over
        this.id = 1;
        this.players = [];
    }
    newRound(){
        //update ui begin a new round
	var gameQuestions = 
	{
		'roundNumber':1,
		'endTime': 1491092481792,
		'question' :
			{
				"correct_answer": "Red Lion",
				"difficulty": 1,
				"incorrect_answers": [
					"Royal Oak",
					"White Hart",
					"King&#039;s Head"
				],
				"question": "According to the BBPA, what is the most common pub name in the UK?",
				"category": "General Knowledge"
			}
	}
    }
    
}



/// Sombody's template
function joinGame()
{
    $.ajax({url: "/api/game/"+id+"/notify", success:serverBeganRound
    });
}

function startGame()
{
    $.ajax({url: "/api/game/+"id+"/start", success:serverRequestedVotes
    });
}

function serverBeganRound(data)
{
//Display card and prompt input
//Reset gui timer
    $.ajax({url: "/api/game/+"id+"/notify", success:serverRequestedVotes
    });
}

function serverRequestedVotes(data)
{
//Display card and prompt input
//Reset gui timer
    $.ajax({url: "/api/game/"+id+"/notify", success:serverGaveResults
    });
}

function serverGaveResults(data)
{
    //get scores delta scores and who lied about what out of data
    if(endOFGame)
    {
        //things
    }
    else
    {
        $.ajax({url: "/api/game/"+id+"/notify", success:serverBeganRound
        });
    }

}