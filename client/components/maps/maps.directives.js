'use strict';

var app = angular.module('myApp.maps.directives', []);

app.directive('googleMaps', ['Calibrator', '$routeParams', '$pusher', '$timeout', function(Calibrator, $routeParams, $pusher, $timeout) {

  // var _map;

  var link = function(scope, element, attrs) {

    var el = document.createElement('div');
    var lat = attrs.lat || 51.50889335149151;
    var lng = attrs.lng || -0.12989097040133;
    // scope.aps = [];

    var zoom = 12;

    el.style.width = '100%';
    el.style.height = '100%';
    element.prepend(el);

    var myLatlng = new window.google.maps.LatLng(lat,lng);

    var createMap = function() {

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
      scope.map = new window.google.maps.Map(el, mapOptions);

      // var infoWindow = new google.maps.InfoWindow({map: scope.map});

      // _map.resolve(scope.map);
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
            title: 'Hello World!'
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
              console.log(scope.pos);
              scope.$apply();
              pusherConn();
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
      // zoomListener();
    };

    var zoomListener = function() {
      window.google.maps.event.addListener(scope.map, 'zoom_changed', function() {
      });
    };

    scope.client_mac = $routeParams.id;

    function getData() {

      var params = {
        client_mac: scope.client_mac,
        distance: 1,
      };
      Calibrator.get(params).$promise.then(function(res) {
        scope.error = undefined;
        scope.data = res;
        pushAps(scope.data);
        // scope.predicate = ['-last_seen', 'ap_mac'];
      }, function(err) {
        scope.error = true;
        console.log(err);
      });
    }

    var channel;
    var pusher;

    var pusherConn = function() {
      pusher = $pusher(client);
      channel = pusher.subscribe('calibrator');
      channel.bind('general', function(data) {
        console.log(data)
        getData();
      });
    };

    var ap_macs = {};

    var pushAps = function(data) {
      for (var i = 0; i < data.length; i++) {
        var client = data[i]
        if ( ap_macs[client.ap_mac] ) {
          var old_rssi_max = ap_macs[client.ap_mac].rssi_max;
          var old_rssi_min = ap_macs[client.ap_mac].rssi_min;

          if ( old_rssi_max < client.rssi ) {
            ap_macs[client.ap_mac].rssi_max = client.rssi;
          } else if ( old_rssi_min > client.rssi ) {
            ap_macs[client.ap_mac].rssi_min = client.rssi;
          }

        } else {
          ap_macs[client.ap_mac] = { rssi_max: client.rssi, rssi_min: client.rssi };
        }
        console.log(ap_macs);
      }
      scope.data = ap_macs
    };

    var init = function() {
      createMap();
    };

    scope.$watch('pos',function(val){
      if (val !== "") {
        console.log(scope.pos)
        init();
      }
    });

  };

  return {
    link: link,
    scope: {
      pos: '=',
      data: '='
    },
    transclude: true,
    replace: true,
    template: '<div ng-transclude></div>',
  }

}]);

