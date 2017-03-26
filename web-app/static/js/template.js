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

$(document).ready(function (){

  // Animate the element's value from 0 to to current user's score:
    var $el = $("#playerScore");
    console.log($el.text());
    var score = parseInt($el.text());
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

});
