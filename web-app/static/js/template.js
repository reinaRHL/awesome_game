(function() { //self-invoking function, do not delete

var app = angular.module('indexApp', [])
var socket = io.connect();
var games = {}



function getCookie(cookie, cname) {
    var name = cname + "=";
    var ca = cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

  function random(array) { //randomize answers
      return array.sort(function() {
        return .5 - Math.random();
      });
    }



app.factory('webServices', ['$http', function($http){
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
    },

    getThisQuestion : function(id){
      return $http.get('/api/questions/'+id).success(function (resp){
        return resp;
      })
    },

    getThisGame : function(){
      return $http.get("/api/game/current").success(function (resp){
        return resp;
      })
    }
    }
  }])
  .controller('indexCtrl' , ['webServices', '$scope','$compile', function(webServices, $scope,$compile) {
    var $compile;
	  webServices.getUser().then(function(user){
          document.user=user.data.username;
          $scope.username = user.data.username;
          $scope.score = user.data.score;
          $scope.gamesPlayed = user.data.gamesPlayed;
          $scope.gamesWon = user.data.gamesWon;
          popScore($scope.score);
	  });

	  webServices.getGames().then(function (resp){
		  $scope.games = resp.data.games;
    
      $scope.lobbyGames = []
      resp.data.games.forEach(function (game) {
        console.log(game)
        if(game.state != "done"){
            $scope.lobbyGames.push(game)
        }
        
      });
      console.log($scope.lobbyGames)
	  });

   

    webServices.getThisGame().then(function(current_game){
        $scope.currentgame_title = current_game.data.title;
        games[$scope.currentgame_title]={}
        
        webServices.getLobbyGame(current_game.data.id).then(function(resp){
// need a few more fields to template the # of users in the
// game, but this is the gist of it
          console.log(resp.data )
          $scope.host = {}
          $scope.host.name = resp.data.createdBy;
          if(resp.data.createdBy ==document.user){//if host is current user update score
            $scope.host.score = localStorage.getItem("currentScore")
          }

          $scope.lobbyTitle = resp.data.title;
          $scope.users = {}
          resp.data.users.forEach(function(user){
            $scope.users[user]={}
            $scope.users[user]['name'] = user
            if(user == document.user){//if their name match
              $scope.users[user]['score'] = localStorage.getItem("currentScore")
            } else {
              $scope.users[user]['score'] = localStorage.getItem(user) // get locally stored score
            }
            
          });
          console.log($scope.users )
        })
    });

    webServices.getThisQuestion(localStorage.getItem("currentQuestion")).then(function (resp){//question stay on page on refresh
        $scope.question = resp.data.text;
        $scope.difficulty = resp.data.difficulty;
        $scope.correctAnswer = resp.data.correctAnswer;
        $scope.falseAnswer = resp.data.falseAnswer;
        var answerArray = resp.data.falseAnswer
        answerArray.push(resp.data.correctAnswer)
        $scope.allAnswers = random(answerArray)
        console.log(resp)
    });
     
    $scope.currentScore = localStorage.getItem("currentScore")

    // This function will be called when user clicks 'create' button inside modal.
    // This function sends user input, title username and other player list.
    $scope.createGame = function() {
      localStorage.setItem("currentScore",0)//current score is set to 0 when start
      localStorage.setItem("inGame", 0)//show and hide properly
    
      socket.emit('createNewGame', {title: $('#inputGame').val(), friend: $('#inputPlayers').val()});
      document.location.href="/games";
    };

    $scope.cancelGame = function() {
      socket.emit('cancelNewGame', {title: $("#inLobby > h1").text()});
    };

    $scope.startGame = function() {
      $("#inGame").removeClass("hide")
      $("#inGame").addClass("show")
      $("#inLobby").removeClass("show")
      $("#inLobby").addClass("hide")

       
      socket.emit('startGame', {title: $("#inLobby > h1").text()});
    };

    $scope.keepScore = function(answer) {
      console.log(answer)
      if(answer == $scope.correctAnswer && games[$("#inLobby > h1").text()][$("#roundNumber").html().substring(7)] == false) {//if get the correct answer update their score
        console.log($scope.score)
        $scope.score++
        $scope.currentScore++
        localStorage.setItem("currentScore",$scope.currentScore)  // record score in local memory
        socket.emit('updateScore', {name: document.user, game: $("#inLobby > h1").text(), score: $scope.score, currentScore:$scope.currentScore})
        alert("Correct Answer")
      }else if(answer != $scope.correctAnswer){
        alert("Wrong Answer")
      }else{
        alert("You only have one shot")
      }
      games[$("#inLobby > h1").text()][$("#roundNumber").html().substring(7)] = true
    };

    $scope.gameInfo = function(game_id) {
      $('#gameInfo').modal();
      webServices.getLobbyGame(game_id).then(function(resp){
// need a few more fields to template the # of users in the
// game, but this is the gist of it
        
        $scope.host = resp.data.createdBy;
        $scope.lobbyTitle = resp.data.title;
        $scope.users = resp.data.users;
        $scope.state = resp.data.state;

        // Show join button to everyone if game is not started.
        // Show join button to creator only if game is started.
        if (resp.data.createdBy == $scope.username || resp.data.state == 'hold') {
          $('#joinBtn').prop("disabled", false);
        } else{
          $('#joinBtn').prop("disabled", true);
        }
      });
    };

    $scope.joinGame = function (){
      //TODO: need logic here => add user to game, redirect...
      localStorage.setItem("inGame", 0)//show and hide properly
      localStorage.setItem("currentScore",0)//current score is set to 0 when start
      socket.emit('joinGame', {game: this.lobbyTitle, username: $("#profile > div.panel-body > h1").text().split('  ')[1]});
      document.location.href="/games";
      console.log('join the game');
      console.log(this)
    }

    $scope.closeGame = function(){
      $('#gameInfo').modal('hide');

    }

    $("#answers").on('click',".realtimeAnswer",function() {//handle realtime answers
      var clickedAnswer = $( this ).text() 
      webServices.getThisQuestion(localStorage.getItem("currentQuestion")).then(function (resp){//question stay on page on refresh
        $scope.realtimequestion = resp.data.text;
        $scope.realtimedifficulty = resp.data.difficulty;
        $scope.realtimecorrectAnswer = resp.data.correctAnswer;
        $scope.realtimefalseAnswer = resp.data.falseAnswer;
        var answerArray = resp.data.falseAnswer
        answerArray.push(resp.data.correctAnswer)
        $scope.realtimeallAnswers = random(answerArray)
        console.log($scope.realtimeallAnswers)
        if(clickedAnswer == $scope.realtimecorrectAnswer && games[$scope.currentgame_title][$("#roundNumber").html().substring(7)] == false) {//if get the correct answer update their score
          console.log($scope.score)
          $scope.score++
          $scope.currentScore++
          localStorage.setItem("currentScore",$scope.currentScore)  // record score in local memory
          socket.emit('updateScore', {name: document.user, game: $("#inLobby > h1").text(), score: $scope.score, currentScore:$scope.currentScore})
          alert("Correct Answer")
        } else if(clickedAnswer != $scope.realtimecorrectAnswer){
          alert("Wrong Answer")
        } else{
          alert("You only have one shot")
        }
        games[$("#inLobby > h1").text()][$("#roundNumber").html().substring(7)] = true//this round already voted 
    });
      
    });


    socket.on('timer', function (data) {  
        $('#countdown').html(data.countdown);
    });

    socket.on('showScore', function(data){
      console.log(data.currentScore)
      
      if (data.users.includes(document.user)) {
        if(data.user == document.user){// if user is the client update the main score
          $("#playerScore").html(data.score)
        }
        $('.scoreList>span.ng-binding').filter(function(){//update socreboard accordingly
          return $(this).text() == data.user;
        }).next().html(data.currentScore)
      }
      localStorage.setItem(data.user,data.currentScore)//map user and score in memory
    });

    
    socket.on('backToLobby', function(data){
      console.log(document.user)
      
      if (document.user == data.username) {
        alert("Game \"" + data.title + "\" is deleted!");
        document.location.href="/lobby"
      }
    });

    socket.on('endGame', function(data){
      data.users.forEach(function(user){
        localStorage.setItem(user, 0);//when game ends set local storage scores to 0
      })
      if (data.users.includes(document.user)) {
        $("#countdown").text("Game Over")
        setTimeout(function() { document.location.href="/lobby" }, 3000);
        socket.emit('gameEnded', {title: $("#inLobby > h1").text()});
        
      }
    });

    if(localStorage.getItem("inGame") == 1){
      $("#inGame").removeClass("hide")
      $("#inGame").addClass("show")
      $("#inLobby").removeClass("show")
      $("#inLobby").addClass("hide")
    } else{
      $("#inGame").removeClass("show")
      $("#inGame").addClass("hide")
      $("#inLobby").removeClass("hide")
      $("#inLobby").addClass("show")
    }


    socket.on('sendQuestions', function(data){
      data.users.forEach(function(user){
        localStorage.setItem(user, 0);//when game starts set local storage scores to 0
      })
      $("#inGame").removeClass("hide")
      $("#inGame").addClass("show")
      $("#inLobby").removeClass("show")
      $("#inLobby").addClass("hide")
      localStorage.setItem("inGame", 1)
     
      if (data.users.includes(document.user)) {
        var html = ''
        var answerArray = data.question.question.incorrect_answers
        answerArray.push(data.question.question.correct_answer)
        console.log("here")
        $("#question").text(data.question.question.question);//show question in real time
        random(answerArray).forEach(function(element){
          html+=('<h4 class="realtimeAnswer" >'+element+'</h4>')
        })
        $("#answers").html($compile(html)($scope))//show answers in real time
        localStorage.setItem("currentQuestion", data.question.question.id);//store question in local storage
        console.log(data.question.round)
        $("#roundNumber").text("Round: "+data.question.round)
        
        games[$scope.currentgame_title][data.question.round] = false// this round inilialize to have not voted
      }
    });
    
    socket.on('gameJoined', function(data){
    
      $('.gameTitle').filter(function(){
          return $(this).text() == data.title;
        }).prev().html("players: "+ data.numPlayers) 

      //show users names in game in real time
      // If statement will prevent the host appearing on the accepted user list.
      if (($scope.host != data.user)) {
        $('#inGameUser').append('<a href="#" class="list-group-item text-center clearfix"><span class= "userInGame">'
        +data.user+'</span><span class="label label-success pull-left">Accepted</span><span class="pull-right"><button class="list-group-item-text btn-danger btn btn-sm disabled pull-right">Revoke Invite</button></span></a>');
        
        $('#startGameUsers').append('<h4 ng-repeat="user in users" class="scoreList"><span class= "userInStartGame">'+data.user+'</span><span class="label label-default pull-right"></span></h4>');
      }
    });
    
    socket.on('removeGame', function(data){
      $('.gameTitle').filter(function(){
          return $(this).text() == data;
        }).parent().remove();
    });

    // When someone exits the game, update the user list (UI)
    socket.on('exitGame', function(data){
      $('.userInGame').filter(function(){
          return $(this).text() == data.username;
        }).parent().remove()
      $('.userInStartGame').filter(function(){
          return $(this).text() == data.username;
        }).parent().remove()
    });

    // When someone exits the game, redirect this user to the lobby
    socket.on('returnLobby', function(){
      document.location.href="/lobby";
    });

    // When game is created, append it to the gamelist
    socket.on('gameCreated', function(data){
      var button = $compile("<a id='test' class=\"list-group-item\" ng-click='gameInfo("+data.gameId+")'><span class=\"badge\">players: "
                                + data.numPlayers
                                + "</span><span class='gameTitle'>"
                                + data.title
                                + "</span><p class=\"text-primary\">Created By "
                                + data.createdBy
                                +  "</p></a>")($scope);
      $('#gameDisplay').append(button);
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


