'use strict';

var app = angular.module('myApp.calibration.directives', []);

app.directive('calibrator', ['Calibrator', '$routeParams', '$pusher', function(Calibrator, $routeParams, $pusher) {

  var link = function(scope) {

    scope.query = $routeParams.q;

    function getData() {
      Calibrator.get().$promise.then(function(res) {
        scope.clients = res;
        scope.predicate = '-last_seen';
      }, function(err) {
        console.log(err);
      });
    }

    var channel;
    var pusher = $pusher(client);
    channel = pusher.subscribe('calibrator');
    channel.bind('general', function(data) {
      getData();
    });

    getData();


  };

  return {
    link: link,
    templateUrl: 'components/calibration/_table.html'
  }
}]);

app.filter('humanTime', ['$window', function(window) {
  return function(input) {
    if ( input === undefined || input === null || input === 0) {
      return 'N/A';
    } else {
      return window.moment.unix(input).format('MMMM Do YYYY, h:mm:ss a');
    }
  };
}]);

