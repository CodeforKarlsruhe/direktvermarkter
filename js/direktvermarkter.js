console.log("        @ @ @\n       []___\n      /    /\\____\n(~)  /_/\\_//____/\\ \n |   | || |||__|||\n     farmshops.eu \n Interesse am Code, Bug gefunden oder eine Verbesserungsidee? Schau vorbei auf GitHub! \n https://github.com/CodeforKarlsruhe/direktvermarkter");
var mappos = L.Permalink.getMapLocation();
var map = L.map('map', {
    center: mappos.center,
    zoom: mappos.zoom,
    minZoom: 2,
    maxZoom: 18,
    zoomControl: false
});
L.Permalink.setup(map);

var tiles = L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: "&copy; <a target='_blank' href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
});
var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});



var greenMarker = L.ExtraMarkers.icon({
    icon: 'fa-number',
    markerColor: 'green-light',
    shape: 'square',
});

var blueMarker = L.ExtraMarkers.icon({
    icon: 'fa-number',
    markerColor: 'cyan',
    shape: 'square'
});

var yellowMarker = L.ExtraMarkers.icon({
    icon: 'fa-number',
    markerColor: 'yellow',
    shape: 'square'
});

var blackMarker = L.ExtraMarkers.icon({
    icon: 'fa-number',
    markerColor: 'black',
    shape: 'circle',
    number: '?'
});


//Darstellung

//Marker 

var geojson1 = L.geoJson(farmshopGeoJson, {
    pointToLayer: function pointToLayer(feature, latlng) {
        if (feature.properties.p === 'farm') {
            return L.marker(latlng, { icon: greenMarker });
        } else if (feature.properties.p === 'marketplace') {
            return L.marker(latlng, { icon: yellowMarker });
        } else if (feature.properties.p === 'vending_machine') {
            return L.marker(latlng, { icon: blueMarker });
        } else {
            console.log("nicht bekannte Daten verwendet");
            return L.marker(latlng, { icon: blackMarker });
        }
    },

    onEachFeature: function onEachFeature(feature, layer) {
        layer.once("click", function () {
            $.getJSON('data/' + feature.properties.id + '/details.json', function (data) {
                layer.bindPopup(popupcontent(data, layer)).openPopup();
            });
        });
    }
}).addLayer(tiles);

var GetClusterRadius = function (zoom) { 
    //do something with the passed zoom level, for example:
    if (zoom < 12){
        return 80;
    }
    else{
        return 30;
    }
}

var markers = L.markerClusterGroup({
    iconCreateFunction: function (cluster) {
        var markers = cluster.getAllChildMarkers();

        function markerTypen (markers){
            var returnWert;
            var farmsInCluster = false;
            var marketsInCluster = false;
            var machinesInCluster = false;

           
            for (var c = 0; c < markers.length; c++) {
                
                
                if (markers[c].feature.properties.p ==="farm"){

                    farmsInCluster = true;
                }
                else if (markers[c].feature.properties.p ==="marketplace"){

                    marketsInCluster = true;
                }
                else if (markers[c].feature.properties.p ==="vending_machine"){

                    machinesInCluster = true;
                }
                else {
                    console.log("else schleife")

                }

                //console.log("f " +farmsInCluster +" m " +marketsInCluster +" a " +machinesInCluster)
              
              }

              function farmsAreInCluster (farmsInCluster) {
                  if (farmsInCluster) {
                      return "<img src='img/h-pin2.png' style='width: 20px;'> "
                  }
                  else {
                      return ""
                  }
              }

              function marketsAreInCluster (marketsInCluster) {
                if (marketsInCluster) {
                    return "<img src='img/m-pin2.png' style='width: 20px;'> "
                }
                else {
                    return ""
                }
            }

            function machinesAreInCluster (machinesInCluster) {
                if (machinesInCluster) {
                    return "<img src='img/a-pin2.png' style='width: 20px;'> "
                }
                else {
                    return ""
                }
            }
            
            if (map.getZoom() >= 12){
                returnWert = markers.length +" " +farmsAreInCluster(farmsInCluster) +marketsAreInCluster(marketsInCluster) +machinesAreInCluster (machinesInCluster);
            }
            else{
                returnWert = markers.length;
            }
              
            return returnWert;
        }
        // console.log("markerS: " +markers)
        var html = '<div class="circle">' +markerTypen(markers) + '</div>';
        return L.divIcon({ html: html, className: 'test', iconSize: L.point(102, 72) });
    },
    spiderfyOnMaxZoom: true,
    maxClusterRadius: GetClusterRadius,
    showCoverageOnHover: true,
    zoomToBoundsOnClick: true,
    removeOutsideVisibleBounds: true,
});

markers.addLayer(geojson1);
map.addLayer(markers);
console.log(lastUpdate);

var sidebar = L.control.sidebar('sidebar').addTo(map);

var tilesAuswahl = {
    "Wikipedia Kartenstil": tiles,
    "Openstreetmap": OpenStreetMap_Mapnik,
    "Satelit": Esri_WorldImagery,
};

var overlays = {
    "Marker": markers,
};
L.control.scale({position: 'topright'}).addTo(map);

L.control.layers(tilesAuswahl,overlays).addTo(map);



L.control.zoom({
    position: 'bottomright'
}).addTo(map);


L.control.locate({
    position: 'bottomright',
    drawMarker: true,
    drawCircle: true,
    flyTo: true,
    keepCurrentZoomLevel: false,
    strings: {
        title: "Karte auf meine aktuelle Position zentrieren!"
    },
    locateOptions: {
        maxZoom: 12
    },
    clickBehavior: {
        inView: 'setView', 
        outOfView: 'setView'
    }
}
).addTo(map);
