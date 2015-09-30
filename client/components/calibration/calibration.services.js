'use strict';

var app = angular.module('myApp.calibration.services', ['ngResource',]);

app.factory('Calibrator', ['$resource',
  function($resource){
    return $resource('http://127.0.0.1:3000/api/v1/calibrator',
      {
        q: '@q',
        id: '@id',
        action: '@action'
      },
      {
      get: {
        method: 'GET',
        isArray: true,
        dataType: 'json',
        params: {
          q: '@q',
          client_mac: '@client_mac',
          ap_mac: '@ap_mac',
          distance: '@distance'
        }
      }
      });
  }
]);

