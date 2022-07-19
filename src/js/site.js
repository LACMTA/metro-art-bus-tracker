const rasterBaseMap = 'https://tiles.arcgis.com/tiles/TNoJFjk1LsD45Juj/arcgis/rest/services/Map4_NoTransit/MapServer';

const map = L.map("map", {
    maxZoom: 16,
	minZoom: 10
}).setView([33.97, -118.365], 11);

// Art Bus iconSize: [72, 20]
const icon = L.icon({
    iconUrl: "images/bus.png",
    iconSize: [36, 36]
    });

L.esri.tiledMapLayer({url: rasterBaseMap}).addTo(map);


const url = 'https://api.metro.net/vehicle_positions/bus?output_format=json';
const art_bus_ids = ['3944', '4111', '5621'];

let firstLoad = true;

function load_buses() {
	fetch(url).then(response => {
		const jsonPromise = response.json();
		jsonPromise.then( data => { 
			let art_buses = identify_art_buses(data);
			clear_markers();
			art_buses.forEach(bus => { display_art_bus_markers(bus); });

			// Fit map to bounds on first load
			if (firstLoad) {
				map.fitBounds(layerGroup.getBounds());
				firstLoad = false;
			}
		});
	});

	setTimeout(load_buses, 5000);
}

function clear_markers() {
	map.eachLayer(function(layer) {
		if (layer.options.icon != null) {
			map.removeLayer(layer);
		}
	});
}

function identify_art_buses(data) {
	let art_buses = data.entity.filter(bus => art_bus_ids.includes(bus.id));
	return art_buses;
}

let layerGroup = L.featureGroup().addTo(map);

function display_art_bus_markers(bus) {
	if (bus.vehicle.trip != null) {
		let bus_marker = L.marker(L.latLng(bus.vehicle.position.latitude, bus.vehicle.position.longitude), {icon: icon});
		
		// Currently a hack because the routeId is not necessarily the actual route number the vehicle is running.
		// To get the actual route number we'd have to use the tripId and reference the GTFS.
		let bus_marker_popup = L.popup().setContent('Line ' + bus.vehicle.trip.routeId.split('-')[0]);

		bus_marker.bindPopup(bus_marker_popup);
		layerGroup.addLayer(bus_marker);
	}
}

load_buses();