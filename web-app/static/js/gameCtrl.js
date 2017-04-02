(function(){
    //begin game
angular.module('indexApp', [])
  .factory('webServices', ['$http', function($http){
    return {
      getUser : function(){
        return $http.get( "/api/user").success(function( resp ) {
			return resp;
		});
      },
      getGame : function(){
        //   return $http.get("/api/game/current") need current user's game'
      }
    }
  }])
  .controller('indexCtrl' , ['webServices', '$scope',function(webServices, $scope, $timeout) {
	  webServices.getUser().then(function(user){
          $scope.userPlayer = new Player(user.data.username, true);
          $scope.game = new Game();
	  });
}]);


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
}); //end of self-contained function


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