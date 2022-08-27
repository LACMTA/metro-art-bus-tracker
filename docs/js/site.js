import * as ArtBusData from './data.js';
import * as Map from './map.js';

ArtBusData.load();
// Map.create('map');

function temp() {
	let result = fetch(vehicle_positions_endpoint)
		.then(response => response.json())
		.then(data =>  {
			// for each active bus we have trip data for, gather all information needed for display
			active_art_buses.forEach(bus => {
				bus_data_array = [];

				// get route and destination from the GTFS stop_times
				bus_data_array.push(fetch(stop_times_endpoint + bus.vehicle.trip.tripId));

				Promise.all(art_buses_with_trips)
				.then(responses => {
					return Promise.all(responses.map(response => response.json()));
				})
				.then(data => {
					data.forEach(bus_trips => {
						bus_trips.filter(x => x.stop_id == bus.vehicle.trip.stopId);
					});
				})
				.catch(error => console.log(error));
			});

			// clear_markers();
			// active_art_buses.forEach(active_art_bus => { 
			// 	add_marker(active_art_bus); 
			// });

			// Fit map to bounds on first load
			// if (firstLoadFitBounds && layerGroup.getLayers().length > 0) {
			// 	map.fitBounds(layerGroup.getBounds());
			// 	firstLoadFitBounds = false;
			// }
		});
}

function get_route_code(trip_id, stop_id) {
	fetch(api_url + stop_times_endpoint + trip_id).then(response => {
		const jsonPromise = response.json();
		jsonPromise.then( stop_time => {
			let upcoming_stop = stop_time.filter(stop => stop.id == stop_id);
			return upcoming_stop.route_code;
		});
	});
}

