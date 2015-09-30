'use strict';

var app = angular.module('myApp.calibration.directives', []);

app.directive('calibrator', ['Calibrator', '$routeParams', '$pusher', '$location', function(Calibrator, $routeParams, $pusher, $location) {

  var link = function(scope) {

    scope.query = $routeParams.q;
    if ( $routeParams.all === undefined ) {
      scope.distance = $routeParams.distance || 5;
    }
    scope.last_seen = $routeParams.last_seen || true;

    function getData() {

      var params = {
        client_mac: $routeParams.client_mac,
        ap_mac: $routeParams.ap_mac,
        distance: scope.distance,
        last_seen: scope.last_seen
      };
      Calibrator.get(params).$promise.then(function(res) {
        scope.clients = res;
        scope.predicate = ['-last_seen', 'ap_mac'];
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

    scope.selectClientMac = function(val) {
      scope.client_mac = val;  
      var s = $location.search()
      s.client_mac = val;
      $location.search(s);
    };

    scope.selectApMac = function(val) {
      scope.ap_mac = val;  
      var s = $location.search()
      s.ap_mac = val;
      $location.search(s);
    };

    scope.clear = function() {
      $location.search({});
      scope.query = undefined;
    };

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

