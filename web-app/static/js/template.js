(function(angular) {
  'use strict';
angular.module('indexApp', [])
  .controller('indexCtrl', ['$scope', function($scope) {
    $scope.username = 'FakeUser';
    $scope.score = '200';
    $scope.gamesPlayed = '12';
    $scope.gamesWon = '2';
  }]);
})(window.angular);