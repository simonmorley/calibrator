'use strict';

angular.module('calibratorApp').controller('MainCtrl', ['$scope', '$http', '$rootScope', '$pusher', function ($scope, $http, $rootScope, $pusher) {

  $scope.$on('$routeChangeSuccess', function () {
    window.client = new Pusher('f5c774e098156e548079');
  });

}]);
