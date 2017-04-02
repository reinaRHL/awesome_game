(function() {
var socket = io.connect();

socket.on('redirect', function(dest){
  console.log(dest);
  // after a host creates a game they will be 'forced/pushed' into their newly created game
  window.location.href = dest;
});
angular.module('indexApp', [])
  .factory('webServices', ['$http', function($http){
    return {
      getUser : function(){
        return $http.get( "/api/user").success(function( resp ) {
			return resp;
		});
      },
	  getGames : function(){
		  return $http.get("/api/games").success(function (resp){
			  return resp;
		  })
	  },
    getLobbyGame : function(id){
      return $http.get('/api/lobbyGame/'+id+'').success(function (resp){
        return resp;
      })
    }
    }
  }])
  .controller('indexCtrl' , ['webServices', '$scope', function(webServices, $scope) {
	  webServices.getUser().then(function(user){
          $scope.username = user.data.username;
          $scope.score = user.data.score;
          $scope.gamesPlayed = user.data.gamesPlayed;
          $scope.gamesWon = user.data.gamesWon;
          popScore($scope.score);

	  });
	  webServices.getGames().then(function (resp){
		  $scope.games = resp.data.games;
      
      console.log("db")
      // ARRAY OF GAMES IN LOBBY/DB ON HOLD
      console.log(resp.data.games);
	  });


    // This function will be called when user clicks 'create' button inside modal.
    // This function sends user input, title username and other player list.
    $scope.createGame = function() {
      socket.emit('createNewGame', {title: $('#inputGame').val(), friend: $('#inputPlayers').val()});
    };
    $scope.gameInfo = function(game_id) {
      $('#gameInfo').modal();
      //console.log(game_id);
      webServices.getLobbyGame(game_id).then(function(resp){
// need a few more fields to template the # of users in the
// game, but this is the gist of it
        console.log(resp.data)
        $scope.host = resp.data.createdBy;
        $scope.lobbyTitle = resp.data.title;
        $scope.users = resp.data.users
      })

    };

    $scope.joinGame = function (){
      //TODO: need logic here => add user to game, redirect...
      socket.emit('joinGame', {game: this.lobbyTitle, username: $("#profile > div.panel-body > h1").text().split('  ')[1]});
      console.log('join the game');
      console.log(this)
    }

    $scope.closeGame = function(){
      $('#gameInfo').modal('hide');

    }
    socket.on('gameJoined', function(data){
    
      $('.gameTitle').filter(function(){
          return $(this).text() == data.title;
        }).prev().html("players: "+ data.numPlayers) 

    });

    // When game is created, append it to the gamelist
    socket.on('gameCreated', function(data){
      $('#gameDisplay').append("<button class=\"list-group-item\"><span class=\"badge\">players: "
                                + data.numPlayers
                                + "</span>"
                                + data.title
                                + "<p class=\"text-primary\">Created By "
                                + data.createdBy
                                +  "</p></button>");

      /*var button = $compile("<button ng-click='gameInfo()' class=\"list-group-item\"><span class=\"badge\">players: "
                                + data.numPlayers
                                + "</span>"
                                + data.title
                                + "<p class=\"text-primary\">Created By "
                                + data.createdBy
                                +  "</p></button>")($scope);
      $('#gameDisplay').append(button);*/
    });
  }]);
})();


var popScore = function(initScore){
  // Animate the element's value from 0 to to current user's score:
    var $el = $("#playerScore");
    console.log($el.text());
    var score = parseInt(initScore);
    $({someValue: 0}).animate({someValue: score}, { // from 0 to users score
        duration: 2000, // 2 sec
        easing:'swing', // smooth transitioning
        step: function() { // called on every step
            // update the element's text with rounded-up value:
            $el.text(commaSeparateNumber(Math.round(this.someValue)));
        }
    });

   function commaSeparateNumber(val){
      while (/(\d+)(\d{3})/.test(val.toString())){
        val = val.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
      }
      return val;
    }
};
