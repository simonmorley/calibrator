'use strict';

var app = angular.module('myApp.calibration.directives', []);

app.directive('calibrator', ['Calibrator', '$routeParams', function(Calibrator, $routeParams) {

  var link = function(scope) {

    scope.query = $routeParams.q;

    function getData() {
      Calibrator.get().$promise.then(function(res) {
        console.log(res);
        scope.clients = res;
      }, function(err) {
        console.log(err);
      });
    }

    getData();


  };

  return {
    link: link,
    templateUrl: 'components/calibration/_table.html'
  }
}]);
