const API_URL = 'https://api.metro.net/';
const VEHICLE_POSITIONS_ENDPOINT = API_URL + 'vehicle_positions/bus?output_format=json';
const TRIP_UPDATES_ENDPOINT = API_URL + 'trip_updates/bus?output_format=json';
const STOP_TIMES_ENDPOINT = API_URL + 'bus/stop_times/';
const STOPS_ENDPOINT = API_URL + 'bus/stops/';

const artBusIds = ['3944', '4111', '5621'];

function loadData(status = false) {
    let statusMsg;

    if (status) {
        statusMsg = document.querySelector('#status');
    }

	Promise.all([
		fetch(VEHICLE_POSITIONS_ENDPOINT, { method: "GET", headers: { 'Content-Type': 'application/json',}}),
		fetch(TRIP_UPDATES_ENDPOINT, { method: "GET", headers: { 'Content-Type': 'application/json',}})])
    .then(responses => Promise.all(responses.map(response => response.json())))
    .then(data => {
		let vehiclePositionsData = data[0];
		let tripUpdatesData = data[1];

		if (!vehiclePositionsData.hasOwnProperty('entity') || vehiclePositionsData.entity.length <= 0) {
            if (status) {
                let msg = document.createElement('div');
                msg.innerText = 'Problem with VehiclePostions feed.';
                statusMsg.appendChild(msg);
            }
			throw new Error('VehiclePositions feed error');
		} else if (!tripUpdatesData.hasOwnProperty('entity') || tripUpdatesData.entity.length <=0) {
            if (status) {
                let msg = document.createElemnt('div');
                msg.innerText = 'Problem with TripUpdates feed.';
                statusMsg.appendChild(msg);
            }
			throw new Error('TripUpdates feed error');
		} else {
            if (status) {
                let msg = document.createElement('div');
                msg.innerText = 'VehiclePostions feed and TripUpdates feed successfully loaded.';
                statusMsg.appendChild(msg);
            }
			console.log('VehiclePositions and TripUpdates feeds both returning data');

            let artBusPositions = getArtBusPositions(vehiclePositionsData);
			// remove buses where there is no trip data
			artBusPositions = artBusPositions.filter(bus => bus.vehicle.trip != null);

            if (status) {
                let msg = document.createElement('div');

                if (artBusPositions.length == 0) {
                    msg.innerText = "No buses running";
                } else if (artBusPositions.length == 3) {
                    msg.innerText = "All buses running";
                } else {
                    msg.innerText = "Some buses running";
                    
                    let list = document.createElement('ul');
                    artBusPositions.forEach(bus => {
                        let item = document.createElement('li');
                        item.innerText += bus.id;
                        list.appendChild(item);
                    });
                    msg.appendChild(list);
                }

                statusMsg.append(msg);
            }

            let busInfoArray = [];
            let moreBusData = [];
            
            // for each bus, get GTFS static data from stop_times.txt and stops.txt
            artBusPositions.forEach(bus => {
                let busInfo = {};
                
                busInfo.tripId = bus.vehicle.trip.tripId;
                busInfo.stopSequence = bus.vehicle.currentStopSequence;
                busInfo.stopId = bus.vehicle.stopId;
                busInfo.position = bus.vehicle.position;
                busInfo.vehicleId = bus.id;

                let tripUpdate = tripUpdatesData.entity.filter(trip => trip.id.includes(busInfo.tripId));
                let prediction = tripUpdate[0].tripUpdate.stopTimeUpdate.filter(stop => stop.stopSequence == busInfo.stopSequence);

                console.log(prediction);

                if (prediction[0].hasOwnProperty('arrival')) {
                    busInfo.arrivalTime = prediction[0].arrival.time;
                } else {
                    busInfo.departureTime = prediction[0].departure.time;
                }

                busInfoArray.push(busInfo);

                moreBusData.push(fetch(STOP_TIMES_ENDPOINT + busInfo.tripId));
                moreBusData.push(fetch(STOPS_ENDPOINT + busInfo.stopId));
            });

            Promise.all(moreBusData)
            .then(responses => Promise.all(responses.map(response => response.json())))
            .then(data => {

                data.forEach((dataItem, i) => {
                    if (i % 0 == 0) {
                        busInfoArray = busInfoArray.map(bus => {
                            dataItem.forEach(stop_time => {
                                if (stop_time.trip_id )
                            })
                        });
                        
                        let tripStop = dataItem.filter(stop_time => stop.stop_sequence == busInfo.stopSequence);
                        busInfoArray = busInfoArray.map(bus => {
                            if (bus.tripId == tripStop.tripId && bus.stopId == tripStop.stopId) {
                                bus.routeCode = tripStop.route_code;
                                bus.destinationCode = tripStop.destination_code;
                            }
                        })
                    }
                });
                
                busInfo.stopName = data[1][0].stop_name;
                busInfo.stopLat = data[1][0].stop_lat;
                busInfo.stopLon = data[1][0].stop_lon;
                busInfoArray.push(busInfo);
            });
		}
	}).catch(error => console.log(error));

	//setTimeout(load_data, 60000);
}

function getArtBusPositions(positionsData) {
	let artBuses = positionsData.entity.filter(bus => artBusIds.includes(bus.id));
	return artBuses;
}

export { 
    loadData as load
};