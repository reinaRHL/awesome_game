(function() {

  var app = angular.bootstrap('indexApp', []);



app.factory('socket', function ($rootScope) {
  var socket = io.connect();
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
});

app.controller('indexCtrl', function($scope, socket) {
  // When game is created, append it to the gamelist
    socket.on('gameCreated', function(data){
      $scope.gameInfo = function() {
      $('#gameInfo').modal();
      console.log('im clicked');
    };
      $('#gameDisplay').append("<button ng-click='gameInfo()' class=\"list-group-item ng-binding ng-scope\"><span class=\"badge\">players: "
                                + data.numPlayers
                                + "</span>"
                                + data.title
                                + "<p class=\"text-primary\">Created By "
                                + data.createdBy
                                +  "</p></button>");
    });
});

})();
