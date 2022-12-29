const rasterBaseMap = 'https://tiles.arcgis.com/tiles/TNoJFjk1LsD45Juj/arcgis/rest/services/Map4_NoTransit/MapServer';
const artBusIcon = 'bus-icon-m-a-b.png';
const artBusIconSize = [200, 90];

let firstLoad = true;
let layerGroup;
let map;

// Art Bus iconSize: [72, 20]
// 8 / 5  *25

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

function addBusMarker(busData) {
    let icon = L.icon({
        iconUrl: "images/" + artBusIcon,
        iconSize: artBusIconSize
        });

    if (busData.hasOwnProperty('message')) {
        console.log(busData.message);
        return;
    } else if (busData.upcoming_stop_time_update == null) {
        console.log('vehicle_id ' + busData.vehicle_label + ' has no upcoming predictions.');
        return;
    } else {
        console.log("Adding marker for: " + busData.vehicle_label);

        let route = busData.route_code;
        let stop = busData.stop_name;
        let position = busData.position;
        
        let predictionTime = '';
        let timestamp = '';
        let statusMessage = '';

        if (busData.upcoming_stop_time_update.departure != null) {
            predictionTime = busData.upcoming_stop_time_update.departure;

            timestamp = new Date(predictionTime * 1000);

            statusMessage = ' is departing ' + stop + ' at ' + timestamp.toLocaleTimeString([], {hour12: true, hour: 'numeric', minute: '2-digit'});
        } else if (busData.upcoming_stop_time_update.arrival != null) {
            predictionTime = busData.upcoming_stop_time_update.arrival;

            timestamp = new Date(predictionTime * 1000);

            statusMessage = ' is arriving at ' + stop + ' at ' + timestamp.toLocaleTimeString([], {hour12: true, hour: 'numeric', minute: '2-digit'});
        } else {
            return;
        }

        // let fullMessage = "Line " + route + " headed towards <span class='destination'>" + busData.destinationCode + "</span> " + statusMessage;

        let fullMessage = "Line " + route + statusMessage;
        
        let marker = L.marker(L.latLng(position.latitude, position.longitude), {icon: icon});
        let marker_popup = L.popup().setContent(fullMessage);

        marker.bindPopup(marker_popup);
        layerGroup.addLayer(marker);

        if (layerGroup.getLayers().length > 0) {
            map.fitBounds(layerGroup.getBounds());
        }
        return;
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
    addBusMarker as addBusMarker
};