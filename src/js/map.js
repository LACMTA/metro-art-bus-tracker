const rasterBaseMap = 'https://tiles.arcgis.com/tiles/TNoJFjk1LsD45Juj/arcgis/rest/services/Map4_NoTransit/MapServer';
const art_bus_icon = 'bus.png';

let firstLoad = true;
let layerGroup;
let map;

// Art Bus iconSize: [72, 20]
const icon = L.icon({
    iconUrl: "images/" + art_bus_icon,
    iconSize: [50, 50]
    });

function createMap(id) {
    map = L.map(id, {
        maxZoom: 16,
        minZoom: 10
    }).setView([33.97, -118.365], 11);

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
        statusMessage = ' is arriving at ' + stop + ' at ' + timestamp.toLocaleTimeString([], {hour12: true, hour: 'numeric', minute: '2-digit'});;
    } else if (bus.hasOwnProperty('prediction') && bus.prediction.hasOwnProperty('departure')) {
        let timestamp = new Date(bus.prediction.departure.time * 1000);
        statusMessage = ' is departing ' + stop + ' at ' + timestamp.toLocaleTimeString([], {hour12: true, hour: 'numeric', minute: '2-digit'});;
    } else {
        let timestamp = new Date(bus.position.vehicle.timestamp * 1000);
        statusMessage = ' is stopped at ' + stop + ' at ' + timestamp.toLocaleTimeString([], {hour12: true, hour: 'numeric', minute: '2-digit'});;
    }

    message = "Line " + route + statusMessage;

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