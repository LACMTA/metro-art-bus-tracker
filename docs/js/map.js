const rasterBaseMap = 'https://tiles.arcgis.com/tiles/TNoJFjk1LsD45Juj/arcgis/rest/services/Map4_NoTransit/MapServer';
const art_bus_icon = 'metro_art_bus_icon.png';

let firstLoad = true;
let layerGroup;
let map;

// Art Bus iconSize: [72, 20]
const icon = L.icon({
    iconUrl: "images/" + art_bus_icon,
    iconSize: [200, 200]
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
    // GET ROUTE
    let route = get_route_code(bus.vehicle.trip.tripId, bus.vehicle.stopId);

    // GET ARRIVAL TIME
    let marker_text = get_bus_predictions(bus);

    // GET STOP NAME

    let bus_marker = L.marker(L.latLng(position.latitude, position.longitude), {icon: icon});
    let bus_marker_popup = L.popup().setContent(marker_text);

    bus_marker.bindPopup(bus_marker_popup);
    layerGroup.addLayer(bus_marker);
}

function clearMarkers(map) {
	map.eachLayer(layer => {
		if (layer.options.icon != null) {
			map.removeLayer(layer);
		}
	});
}

export {
    createMap as create
};