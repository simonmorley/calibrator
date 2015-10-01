'use strict';

var app = angular.module('myApp.maps.directives', []);

app.directive('calibrate', ['Calibrator', '$routeParams', '$pusher', '$timeout', function(Calibrator, $routeParams, $pusher, $timeout) {

  // var _map;

  var link = function(scope, element, attrs) {

    var el = document.createElement('div');
    var lat = attrs.lat || 51.50889335149151;
    var lng = attrs.lng || -0.12989097040133;
    var channel;
    var pusher;

    scope.client_mac = $routeParams.id;
    scope.position_test = true;
    scope.loading = true;
    scope.pos = {};

    var zoom = 12;

    el.style.width = '100%';
    el.style.height = '100%';
    element.prepend(el);

    var myLatlng = new window.google.maps.LatLng(lat,lng);

    var init = function() {

      var mapOptions = {
        center: myLatlng,
        zoom: zoom,
        panControl: false,
        zoomControl: true,
        streetViewControl: false,
        zoomControlOptions: {
          style: google.maps.ZoomControlStyle.SMALL,
          position: google.maps.ControlPosition.LEFT_TOP
        }
      };
      scope.map = new window.google.maps.Map(document.getElementById('map_canvas'), mapOptions);

      window.google.maps.event.trigger(scope.map, 'resize');

      var marker;
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {

          scope.pos.lat = position.coords.latitude;
          scope.pos.lng = position.coords.longitude;

          console.log(scope.pos)

          marker = new google.maps.Marker({
            draggable: true,
            position: scope.pos,
            map: scope.map,
            title: 'This is me!'
          });

          scope.map.setCenter(scope.pos);

          scope.$apply();
          pusherConn();

          window.google.maps.event.addListener(marker, 'dragend', function(event) {
            window.setTimeout(function() {
              var p = marker.getPosition();
              scope.map.panTo(p);
              scope.pos.lat = p.H;
              scope.pos.lng = p.L;
              scope.data = {};
              scope.$apply();
            }, 10);
          });

        }, function() {
          handleLocationError(true, infoWindow, map.getCenter());
        });
      } else {
        handleLocationError(false, infoWindow, map.getCenter());
      }

      function handleLocationError(browserHasGeolocation, infoWindow, pos) {
        infoWindow.setPosition(pos);
        infoWindow.setContent(browserHasGeolocation ?
                              'Error: The Geolocation service failed.' :
                              'Error: Your browser doesn\'t support geolocation.');
      }
    };

    function positionTest() {
      var params = {
        client_mac: scope.client_mac,
        distance: 1,
      };
      Calibrator.get(params).$promise.then(function(res) {
        scope.data = res;
        pushAps(scope.data);
        addApToMap(scope.data);
        scope.loading = undefined;
      }, function(err) {
        scope.error = true;
        console.log(err);
      });
    }

    scope.distance_aps = [];
    function standardTest() {
      var params = {
        client_mac: scope.client_mac,
        distance: 1,
      };
      params.ap_mac = scope.selected_ap;

      Calibrator.get(params).$promise.then(function(res) {
        addToDistanceAps(res);
        scope.data = res;

        if (scope.measurement === undefined) {
          scope.measurement = {};
        }
        if (scope.type) {
          console.log(res[0].rssi)
          scope.measurement[scope.type] = getMaxRssi(res[0].rssi);
        }
        // for (var i = 0; i < data.length; i++) {
          // addToSet(data[i])
        // }
      }, function(err) {
        // scope.error = true;
        console.log(err);
      });
    }

    scope.setTest = function(val) {
      console.log(val)
      switch (val) {
        case 'near':
          scope.type    = 'near';
          break;
        case 'far':
          scope.type    = 'far';
          break;
        case 'outside':
          scope.type    = 'outside';
          break;
      }
    }

    var getMaxRssi = function(rssi) {
      if (scope.measurement[scope.type] === undefined || (scope.measurement[scope.type] < rssi)) {
        return rssi;
      } else {
        return scope.measurement[scope.type];
      }
    }
    
    var addToDistanceAps = function(data) {
      for (var i = 0; i < data.length; i++) {
        if (scope.distance_aps.indexOf(data[i].ap_mac) === -1) {
          scope.distance_aps.push(data[i].ap_mac);
        }
      }
    };

    scope.measureSignal = function(ap) {
      scope.selected_ap = ap;
    };

    var added;
    var addApToMap = function(data) {
      if (added === undefined) {
        added = true;
        for (var i = 0; i < data.length; i++) {
          var myLatLng = new window.google.maps.LatLng(data[i].lat,data[i].lng);
          var marker = new window.google.maps.Marker({
            position: myLatLng,
            map: scope.map,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 0.06 * Math.pow(1.4, scope.map.getZoom()),
              fillOpacity: .6,
              strokeColor: 'white',
              strokeWeight: 0.5,
            },
          });
        }
      }
    };

    var pusherConn = function() {
      pusher = $pusher(client);
      channel = pusher.subscribe('calibrator');
      channel.bind('general', function(data) {
        if (scope.position_test) {
          positionTest();
        } else if ( scope.distance_test ) { 
          standardTest();
        }
      });
    };

    var ap_macs = {};

    var pushAps = function(data) {
      for (var i = 0; i < data.length; i++) {
        addToSet(data[i])
      }
      scope.data.ap_macs = ap_macs
    };

    var addToSet = function(client) {
      if ( ap_macs[client.ap_mac] ) {
        var old_rssi_max = ap_macs[client.ap_mac].rssi_max;
        var old_rssi_min = ap_macs[client.ap_mac].rssi_min;
        if ( old_rssi_max < client.rssi ) {
          ap_macs[client.ap_mac].rssi_max = client.rssi;
        } else if ( old_rssi_min > client.rssi ) {
          ap_macs[client.ap_mac].rssi_min = client.rssi;
        }
        if ( ap_macs[client.ap_mac].count >= 3 ) {
          scope.data.cb = true;  
        } else {
          ap_macs[client.ap_mac].count++;
        }
      } else {
        ap_macs[client.ap_mac] = { rssi_max: client.rssi, rssi_min: client.rssi, count: 1 };
      }
    }

    scope.runPosTest = function() {
      scope.distance_test = undefined;
      scope.position_test = true;
    };

    scope.runDistTest = function() {
      scope.distance_test = true;
      scope.position_test = undefined;
    };

    //scope.$watch('pos',function(val){
      // if (val !== "") {
        init();
      // }
    // });

  };

  return {
    link: link,
    // scope: {
    //   pos: '=',
    //   data: '=',
    //   loading: '='
    // },
    templateUrl: 'components/calibration/_calibrate.html'
    // transclude: true,
    // replace: true,
    // template: '<div ng-transclude></div>',
  }

}]);

