import * as Map from './map.js';

const API_URL = 'https://api.metro.net/';
const VEHICLE_POSITIONS_ENDPOINT = API_URL + 'vehicle_positions/bus?output_format=json';
const TRIP_UPDATES_ENDPOINT = API_URL + 'trip_updates/bus?output_format=json';
const STOP_TIMES_ENDPOINT = API_URL + 'bus/stop_times/';
const STOPS_ENDPOINT = API_URL + 'bus/stops/';

const artBusIds = ['3944', '4111', '5621'];

let busMapData = {
    hasTrips: [],
    noTrips: []
};

function loadData(status = false, statusData = false) {

    let statusMessageSection;

    if (status) {
        statusMessageSection = document.querySelector('#status');
    } else if (!statusData) {
        Map.create('map');
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
                let statusMessageDiv = document.createElement('div');
                statusMessageDiv.innerText = 'Problem with VehiclePostions feed.';
                statusMessageSection.appendChild(statusMessageDiv);
            }
			throw new Error('VehiclePositions feed error');
		} else if (!tripUpdatesData.hasOwnProperty('entity') || tripUpdatesData.entity.length <=0) {
            if (status) {
                let statusMessageDiv = document.createElement('div');
                statusMessageDiv.innerText = 'Problem with TripUpdates feed.';
                statusMessageSection.appendChild(statusMessageDiv);
            }
			throw new Error('TripUpdates feed error');
		} else {

            /**********************/
            /*   FEEDS ARE OKAY   */
            /**********************/

            if (status) {
                let statusMessageDiv = document.createElement('div');
                statusMessageDiv.innerText = 'VehiclePostions feed and TripUpdates feed successfully loaded.';
                statusMessageSection.appendChild(statusMessageDiv);
            }
			console.log('VehiclePositions and TripUpdates feeds both returning data');

			/************************************/
            /*   MATCH VEHICLE POSITIONS DATA   */
            /************************************/

            let artBusPositions = getArtBusPositions(vehiclePositionsData);
			console.log(artBusPositions.length + ' vehicle positions found');

			/***************************/
            /*   SEPARATE INTO TYPES   */
            /***************************/

            artBusPositions.forEach(elem => {
                let wrappedElem = {
                    position: elem
                };

                if (!elem.vehicle.hasOwnProperty('trip')) {
                    busMapData.noTrips.push(wrappedElem);
                    console.log(elem.id + " has no trip");
                } else {
                    if (elem.vehicle.currentStatus == 'STOPPED_AT') {
                        wrappedElem.stopped = true;
                        busMapData.hasTrips.push(wrappedElem);
                        console.log(elem.id + " is stopped");
                    } else {
                        wrappedElem.stopped = false;
                        busMapData.hasTrips.push(wrappedElem);
                        console.log(elem.id + " is moving");
                    }
                }
            });

            /**************************/
            /*   CREATE STATUS DATA   */
            /**************************/

            if (statusData) {
                let body = document.querySelector('body');
                let content = "{hasTrips:[";
                
                busMapData.hasTrips.forEach(elem => {
                    content += "'" + elem.position.id + "',";
                });

                if (content[content.length-1] == ',') {
                    content = content.substring(0,content.length - 1);
                }

                content += "],noTrips:[";
                busMapData.noTrips.forEach(elem => {
                    content += "'" + elem.position.id + "',";
                });
                
                if (content[content.length-1] == ',') {
                    content = content.substring(0,content.length - 1);
                }

                content += "]}";

                body.innerText = content;
                return;
            }

            /**********************************/
            /*   CREATE STATUS PAGE CONTENT   */
            /**********************************/

            if (status) {
                let positionsStatusDiv = document.createElement('div');
				let tripStatusDiv = document.createElement('div');

                let totalBuses = busMapData.hasTrips.length + busMapData.noTrips.length;
                let busesWithTrips = busMapData.hasTrips.length;

                if (totalBuses == 0) {
                    positionsStatusDiv.innerText = "No buses running";
                } else if (totalBuses == 3) {
                    positionsStatusDiv.innerText = "All buses running";
                } else {
                    positionsStatusDiv.innerText = "Some buses running (" + totalBuses + ")";
                    
                    let list = document.createElement('ul');
                    busMapData.hasTrips.forEach(bus => {
                        let item = document.createElement('li');
                        item.classList.add('bus-running');
                        item.innerText += bus.position.id;
                        list.appendChild(item);
                    });
                    busMapData.noTrips.forEach(bus => {
                        let item = document.createElement('li');
                        item.classList.add('bus-running');
                        item.innerText += bus.position.id;
                        list.appendChild(item);
                    });
                    positionsStatusDiv.appendChild(list);
                }

				if (busesWithTrips == 0) {
					tripStatusDiv.innerText = "No buses have trips";
				} else if (busesWithTrips == 3) {
					tripStatusDiv.innerText = "All buses have trips";
				} else {
					tripStatusDiv.innerText = busesWithTrips + " buses with trips";

					let list = document.createElement('ul');
                    busMapData.hasTrips.forEach(bus => {
                        let item = document.createElement('li');
                        item.classList.add('bus-with-trip');
                        item.innerText += bus.position.id;
                        list.appendChild(item);
                    });
                    tripStatusDiv.appendChild(list);
				}

                statusMessageSection.append(positionsStatusDiv);
				statusMessageSection.append(tripStatusDiv);
            }

            // Only continue if there are buses that have trips
            if (!status || busMapData.hasTrips.length > 0) {

                /*******************************/
                /*   MATCH TRIP UPDATES DATA   */
                /*******************************/

                busMapData.hasTrips = busMapData.hasTrips.map(elem => {
                    if (!elem.stopped) {
                        let tripUpdate = tripUpdatesData.entity.filter(trip => trip.id.includes(elem.position.vehicle.trip.tripId));
                        let prediction = tripUpdate[0].tripUpdate.stopTimeUpdate.filter(stop => stop.stopSequence == elem.position.vehicle.currentStopSequence);
                        elem.prediction = prediction[0];
                    }
                    return elem;
                });
    
                /******************************************/
                /*   CREATE GTFS-STATIC DATA FETCH CALLS  */
                /******************************************/
    
                let stoppedFetchCalls = [];
                let movingFetchCalls = [];
    
                busMapData.hasTrips.forEach(elem => {
                    if (elem.stopped) {
                        stoppedFetchCalls.push(fetch(STOP_TIMES_ENDPOINT + elem.position.vehicle.trip.tripId));
                        stoppedFetchCalls.push(fetch(STOPS_ENDPOINT + elem.position.vehicle.stopId));
                    } else {
                        movingFetchCalls.push(fetch(STOP_TIMES_ENDPOINT + elem.position.vehicle.trip.tripId));
                        movingFetchCalls.push(fetch(STOPS_ENDPOINT + elem.prediction.stopId));
                    }                
                });
    
                /********************************************/
                /*   HANDLE FETCH CALLS FOR STOPPED BUSES   */
                /********************************************/
    
                if (stoppedFetchCalls.length > 0) {
                    Promise.all(stoppedFetchCalls)
                    .then(responses => Promise.all(responses.map(response => response.json())))
                    .then(data => {
                        data.forEach((dataItem, i) => {
                            if (i % 2 == 0) {
                                // STOP_TIMES - get route_code
                                let tripId = dataItem[0].trip_id;
        
                                busMapData.hasTrips = busMapData.hasTrips.map(elem => {
                                    if (elem.position.vehicle.trip.tripId == tripId) {
                                        let stopSequence = elem.position.vehicle.currentStopSequence;
                                        let matchingStopTime = dataItem.filter(elem2 => elem2.stop_sequence == stopSequence);
                                        elem.routeCode = matchingStopTime[0].route_code;
                                        elem.destinationCode = matchingStopTime[0].destination_code;
                                    }
                                    return elem;
                                });
                            } else {
                                // STOPS - get stop_name
                                let stopId = dataItem[0].stop_id;
                                let stopName = dataItem[0].stop_name;
        
                                busMapData.hasTrips = busMapData.hasTrips.map(elem => {
                                    if (elem.position.vehicle.stopId == stopId) {
                                        elem.stopName = stopName;
                                    }
                                    return elem;
                                });
                            }
                        });
        
                        /*******************************************/
                        /*   HANDLE FETCH CALLS FOR MOVING BUSES   */
                        /*******************************************/
        
                        Promise.all(movingFetchCalls)
                        .then(responses => Promise.all(responses.map(response => response.json())))
                        .then(data => {
                            data.forEach((dataItem, i) => {
                                if (i % 2 == 0) {
                                    // STOP_TIMES - get route_code
                                    let tripId = dataItem[0].trip_id;
        
                                    busMapData.hasTrips = busMapData.hasTrips.map(elem => {
                                        if (elem.position.vehicle.trip.tripId == tripId) {
                                            let stopSequence = elem.prediction.stopSequence;
                                            let matchingStopTime = dataItem.filter(elem2 => elem2.stop_sequence == stopSequence);
                                            elem.routeCode = matchingStopTime[0].route_code;
                                            elem.destinationCode = matchingStopTime[0].destination_code;
                                        }
                                        return elem;
                                    });
                                } else {
                                    // STOPS - get stop_name
                                    let stopId = dataItem[0].stop_id;
                                    let stopName = dataItem[0].stop_name;
        
                                    busMapData.hasTrips = busMapData.hasTrips.map(elem => {
                                        if (elem.hasOwnProperty('prediction') && elem.prediction.stopId == stopId) {
                                            elem.stopName = stopName;
                                        }
                                        return elem;
                                    });
                                }
                            });
                        }).then(data => {
                            /**************************/
                            /*   Add markers to map   */
                            /**************************/

                            busMapData.hasTrips.forEach(elem => {
                                Map.addMarker(elem);
                            });
                            console.log('Done loading');
                        });
                    });
                } else if (movingFetchCalls.length > 0) {
                    /*******************************************/
                    /*   HANDLE FETCH CALLS FOR MOVING BUSES   */
                    /*******************************************/
    
                    Promise.all(movingFetchCalls)
                    .then(responses => Promise.all(responses.map(response => response.json())))
                    .then(data => {
                        data.forEach((dataItem, i) => {
                            if (i % 2 == 0) {
                                // STOP_TIMES - get route_code, destination_code
                                let tripId = dataItem[0].trip_id;
    
                                busMapData.hasTrips = busMapData.hasTrips.map(elem => {
                                    if (elem.position.vehicle.trip.tripId == tripId) {
                                        let stopSequence = elem.prediction.stopSequence;
                                        let matchingStopTime = dataItem.filter(elem2 => elem2.stop_sequence == stopSequence);
                                        elem.routeCode = matchingStopTime[0].route_code;
                                        elem.destinationCode = matchingStopTime[0].destination_code;
                                    }
                                    return elem;
                                });
                            } else {
                                // STOPS - get stop_name
                                let stopId = dataItem[0].stop_id;
                                let stopName = dataItem[0].stop_name;
    
                                busMapData.hasTrips = busMapData.hasTrips.map(elem => {
                                    if (elem.hasOwnProperty('prediction') && elem.prediction.stopId == stopId) {
                                        elem.stopName = stopName;
                                    }
                                    return elem;
                                });
                            }
                        });
                    }).then(data => {
                        /**************************/
                        /*   Add markers to map   */
                        /**************************/

                        busMapData.hasTrips.forEach(elem => {
                            Map.addMarker(elem);
                        });
                        console.log('Done loading');
                    });
                } else {
                    console.log('Done loading (no buses with trips)');
                }
                    
            } else {
                console.log('No calls made because no buses with trips were found.');
            }
		}
	}).catch(error => {
        console.log(error);
        if (status) {
            statusMessageSection.innerText = 'Error: ' + error;
        }
    });
	//setTimeout(load_data, 60000);
}

function getArtBusPositions(positionsData) {
	let artBuses = positionsData.entity.filter(bus => artBusIds.includes(bus.id));
	return artBuses;
}

export { 
    loadData as load
};