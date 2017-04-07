var app = angular.module('indexApp', [])
var socket = io.connect();

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



app.factory('webServices', ['$http', function ($http) {
	return {
		getUser: function () {
			return $http.get("/api/user").success(function (resp) {
				return resp;
			});
		},
		getGames: function () {
			return $http.get("/api/games").success(function (resp) {
				return resp;
			})
		},
		getLobbyGame: function (id) {
			return $http.get('/api/lobbyGame/' + id + '').success(function (resp) {
				return resp;
			})
		},

		getThisQuestion: function (id) {
			return $http.get('/api/questions/' + id).success(function (resp) {
				return resp;
			})
		},

		getThisGame: function () {
			return $http.get("/api/game/current").success(function (resp) {
				return resp;
			})
		}
	}
}])
	.controller('indexCtrl', ['webServices', '$scope', '$compile', function (webServices, $scope, $compile) {
		var $compile;
		webServices.getUser().then(function (user) {
			document.user = user.data.username;
			$scope.username = user.data.username;
			$scope.score = user.data.score;
			$scope.gamesPlayed = user.data.gamesPlayed;
			$scope.gamesWon = user.data.gamesWon;
			popScore($scope.score);
		});

		webServices.getGames().then(function (resp) {
			$scope.games = resp.data.games;
		});



		webServices.getThisGame().then(function (current_game) {
			$scope.currentgame_title = current_game.data.title;
			webServices.getLobbyGame(current_game.data.id).then(function (resp) {
				// need a few more fields to template the # of users in the
				// game, but this is the gist of it
				console.log(resp.data)
				$scope.host = resp.data.createdBy;
				$scope.lobbyTitle = resp.data.title;
				$scope.users = resp.data.users;
			})
		});

		// This function will be called when user clicks 'create' button inside modal.
		// This function sends user input, title username and other player list.
		$scope.createGame = function () {
			socket.emit('createNewGame', { title: $('#inputGame').val(), friend: $('#inputPlayers').val() });
			document.location.href = "/games";
		};

		$scope.cancelGame = function () {
			socket.emit('cancelNewGame', { title: $("#inLobby > h1").text() });
		};

		$scope.startGame = function () {
			socket.emit('startGame', { title: $("#inLobby > h1").text() });
		};
		$scope.sendAnswer = function () {
			var toSend = {};
			toSend.questionID = localStorage.getItem('currentQuestion');
			answer = $("#inputAnswer").val();
			if (roundQuestion.question.correct_answer === answer) {
				console.log("CAN'T SUBMIT CORRECT ANSWER"); //TO DO: add user feedback
			}
			else {
				toSend.answer = answer;
				socket.emit('sendAnswer', toSend);
				$("#inputAnswer").attr('disabled', 'disabled');
				$("#inputAnswerButton").addClass("disabled");
			}
		}
		$scope.gameInfo = function (game_id) {
			$('#gameInfo').modal();
			webServices.getLobbyGame(game_id).then(function (resp) {
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
				} else {
					$('#joinBtn').prop("disabled", true);
				}
			});
		};

		$scope.joinGame = function () {
			//TODO: need logic here => add user to game, redirect...
			socket.emit('joinGame', { game: this.lobbyTitle, username: $("#profile > div.panel-body > h1").text().split('  ')[1] });
			document.location.href = "/games";
			console.log('join the game');
			console.log(this)
		}

		$scope.closeGame = function () {
			$('#gameInfo').modal('hide');

		}


		socket.on('backToLobby', function (data) {
			console.log(document.user)

			if (document.user == data.username) {
				alert("Game \"" + data.title + "\" is deleted!");
				document.location.href = "/lobby"
			}
		});

		webServices.getThisQuestion(localStorage.getItem("currentQuestion")).then(function (resp) {//question stay on page on refresh
			$scope.question = resp.data.text;
			$scope.difficulty = resp.data.difficulty;
			$scope.correctAnswer = resp.data.correctAnswer;
			$scope.falseAnswer = resp.data.falseAnswer;
		});

		socket.on('sendQuestions', function (data) {
			if (document.user == data.user) {
				$("#question").text(data.question.question.question);
				timerUpdate(data.question.endTime);
				localStorage.setItem("currentQuestion", data.question.question.id);//store question in local storage
				roundQuestion = data.question;
				$("#inputAnswer").removeAttr("disabled");
				$("#inputAnswerButton").removeClass("disabled");
			}
		});

		socket.on('gameJoined', function (data) {

			$('.gameTitle').filter(function () {
				return $(this).text() == data.title;
			}).prev().html("players: " + data.numPlayers)

			//show users names in game in real time
			// If statement will prevent the host appearing on the accepted user list.
			if (($scope.host != data.user)) {
				$('#inGameUser').append('<a href="#" class="list-group-item text-center clearfix"><span class= "userInGame">'
					+ data.user + '</span><span class="label label-success pull-left">Accepted</span><span class="pull-right"><button class="list-group-item-text btn-danger btn btn-sm disabled pull-right">Revoke Invite</button></span></a>');

				$('#startGameUsers').append('<h4 ng-repeat="user in users"><span class= "userInStartGame">' + data.user + '</span><span class="label label-default pull-right">200</span></h4>');
			}
		});

		socket.on('removeGame', function (data) {
			$('.gameTitle').filter(function () {
				return $(this).text() == data;
			}).parent().remove();
		});

		// When someone exits the game, update the user list (UI)
		socket.on('exitGame', function (data) {
			$('.userInGame').filter(function () {
				return $(this).text() == data.username;
			}).parent().remove()
			$('.userInStartGame').filter(function () {
				return $(this).text() == data.username;
			}).parent().remove()
		});

		// When someone exits the game, redirect this user to the lobby
		socket.on('returnLobby', function () {
			document.location.href = "/lobby";
		});
		socket.on('endRound', function () {
			console.log("Round End");
		});
		// When game is created, append it to the gamelist
		socket.on('gameCreated', function (data) {
			var button = $compile("<a id='test' class=\"list-group-item\" ng-click='gameInfo(" + data.gameId + ")'><span class=\"badge\">players: "
				+ data.numPlayers
				+ "</span><span class='gameTitle'>"
				+ data.title
				+ "</span><p class=\"text-primary\">Created By "
				+ data.createdBy
				+ "</p></a>")($scope);
			$('#gameDisplay').append(button);
		});
	}]);


var popScore = function (initScore) {
	// Animate the element's value from 0 to to current user's score:
	var $el = $("#playerScore");
	console.log($el.text());
	var score = parseInt(initScore);
	$({ someValue: 0 }).animate({ someValue: score }, { // from 0 to users score
		duration: 2000, // 2 sec
		easing: 'swing', // smooth transitioning
		step: function () { // called on every step
			// update the element's text with rounded-up value:
			$el.text(commaSeparateNumber(Math.round(this.someValue)));
		}
	});

	function commaSeparateNumber(val) {
		while (/(\d+)(\d{3})/.test(val.toString())) {
			val = val.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
		}
		return val;
	}
};
