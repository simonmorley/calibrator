'use strict';

var app = angular.module('calibratorApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'myApp.directives',
  'myApp.services',
  'ngRoute'
]);

app.config(function ($routeProvider, $locationProvider, $httpProvider) {

    // $httpProvider.interceptors.push('myHttpInterceptor');

    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
    $httpProvider.defaults.headers.common['Content-Type'] = 'application/json';
    $httpProvider.defaults.headers.patch['Accept'] = 'application/json';
    $httpProvider.defaults.headers.patch['Content-Type'] = 'text/plain';

    $routeProvider
      .when('/', {
        templateUrl: 'components/calibration/main.html',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });

    $locationProvider.html5Mode(true);
  });
