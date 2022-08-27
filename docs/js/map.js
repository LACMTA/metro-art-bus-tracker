const rasterBaseMap = 'https://tiles.arcgis.com/tiles/TNoJFjk1LsD45Juj/arcgis/rest/services/Map4_NoTransit/MapServer';
const art_bus_icon = 'bus-icon-m-a-b.png';

let firstLoad = true;
let layerGroup;
let map;

// Art Bus iconSize: [72, 20]
// 8 / 5  *25
const icon = L.icon({
    iconUrl: "images/" + art_bus_icon,
    iconSize: [200, 90]
    });

function createMap(id) {
    let viewCoords = [33.97, -118.365];
    let maxBounds = L.latLngBounds(
        L.latLng(34.9815, -117.1395), //northeast map corner
        L.latLng(33.638, -119.1851) //southwest map corner
    );

    map = L.map(id, {
        maxBounds: maxBounds,
        maxZoom: 16,
        minZoom: 10
    }).setView(viewCoords, 11);

    L.esri.tiledMapLayer({url: rasterBaseMap}).addTo(map);
    layerGroup = L.featureGroup().addTo(map);
}

function addBusMarker(bus) {
    console.log("Adding marker for:");
    console.log(bus);
    
    let route = bus.routeCode;
    let stop = bus.stopName;
    let position = bus.position.vehicle.position;
    let statusMessage = '';

    let message = '';

    if (bus.hasOwnProperty('prediction') && bus.prediction.hasOwnProperty('arrival')) {
        let timestamp = new Date(bus.prediction.arrival.time * 1000);
        statusMessage = ' is arriving at ' + stop + ' at ' + timestamp.toLocaleTimeString([], {hour12: true, hour: 'numeric', minute: '2-digit'});
    } else if (bus.hasOwnProperty('prediction') && bus.prediction.hasOwnProperty('departure')) {
        let timestamp = new Date(bus.prediction.departure.time * 1000);
        statusMessage = ' is departing ' + stop + ' at ' + timestamp.toLocaleTimeString([], {hour12: true, hour: 'numeric', minute: '2-digit'});
    } else {
        let timestamp = new Date(bus.position.vehicle.timestamp * 1000);
        statusMessage = ' is stopped at ' + stop + ' (' + timestamp.toLocaleTimeString([], {hour12: true, hour: 'numeric', minute: '2-digit'}) + ')';
    }

    message = "Line " + route + " headed towards <span class='destination'>" + bus.destinationCode + "</span> " + statusMessage;

    let marker = L.marker(L.latLng(position.latitude, position.longitude), {icon: icon});
    let marker_popup = L.popup().setContent(message);

    marker.bindPopup(marker_popup);
    layerGroup.addLayer(marker);

    if (layerGroup.getLayers().length > 0) {
       	map.fitBounds(layerGroup.getBounds());
        // let zoom = map.getZoom();
        // console.log(zoom);
        // map.setZoom(zoom - 1);
    }
}

function clearMarkers(map) {
	map.eachLayer(layer => {
		if (layer.options.icon != null) {
			map.removeLayer(layer);
		}
	});
}

export {
    createMap as create,
    addBusMarker as addMarker
};