var app = angular.module('indexApp', [])



app.factory('webServices', ['$http', function ($http) {
	return {
        getLoggedInUser: function(){
        return $http.get("/api/user").success(function (resp) {
				return resp;
        });
        },
		getUser: function () {
            var UN = window.location.pathname.split("/").pop();
            //for some reason this gives a 404
			return $http.get('/getuser/'+UN).success(function (resp) {
				return resp;
			});
		},
        getGames: function () {
			return $http.get("/api/games").success(function (resp) {
				return resp;
			})
		}
	}
}])
	.controller('indexCtrl', ['webServices', '$scope', '$compile', function (webServices, $scope, $compile) {
		webServices.getUser().then(function (user) {
			$scope.username = user.data.username;
			$scope.score = user.data.score;
			$scope.gamesPlayed = user.data.gamesPlayed;
			$scope.gamesWon = user.data.gamesWon;
            var a = new Date(user.data.lastLoggedIn); 
            var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            var year = a.getFullYear();
            var month = months[a.getMonth()];
            var day = a.getDate();
            if(year<2017){
                var time = "This user has never logged in!";
            }else{
            var time = "Last seen " + month + ' ' + day + ' ' + year + ' ';
            }
            $scope.lastSeen = time;
		});

            webServices.getLoggedInUser().then(function (current_user){
                // prevent the logged in user from adding themselves
                if(current_user.data.username === window.location.pathname.split("/").pop()){
                    $('#btn_addfriend').hide();
                }
            });
        /*
        // this won't actually show relevant user game history as of now,
        // it's written as global game history
        webServices.getGames().then(function (resp) {
			$scope.games = resp.data.games;
		});*/
        $scope.addFriend = function(){
            console.log('add');
            webServices.getLoggedInUser().then(function (current_user){
                if(current_user.data.username === undefined){
                    //the user is looking at profiles but isn't logged in
                    document.location.href = '/login';
                }else{
                //
                var toSend={};
                var UN = window.location.pathname.split("/").pop();
                toSend.srcUser = current_user.data.username;
                toSend.destUser = UN;
                //console.log(toSend);
                $.ajax({
                    type: "POST",
                    url: '/addfriend',
                    data: toSend,
                    success: function(data){
                        console.log('added friend to user');
                    }
                });
                }
            });
        }
    }]);

