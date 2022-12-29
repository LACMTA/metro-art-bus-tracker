import * as Map from './map.js';

const API_URL = 'https://api.metro.net/';
const AGENCY_ID = 'LACMTA';
const STOP_TIMES_ENDPOINT = API_URL + AGENCY_ID + '/stop_times/';
const STOPS_ENDPOINT = API_URL + AGENCY_ID + '/stops/';
const VEHICLE_POSITIONS_BY_VEHICLE_ID = API_URL + AGENCY_ID + '/vehicle_positions/';
const TRIP_UPDATES_BY_TRIP_ID = API_URL + AGENCY_ID + '/trip_updates/';

const TRIP_DETAIL_ENDPOINT = API_URL + AGENCY_ID + '/trip_detail/';

const artBusIds = ['3944', '4111', '5621'];

let busMapData = {
    hasTrips: [],
    noTrips: []
};
 
let busData = {
    '3944': {
        vehicle_position: null,
        trip_update: null
    },
    '4111': {
        vehicle_position: null,
        trip_update: null
    },
    '5621': {
        vehicle_position: null,
        trip_update: null
    }
};

const busDataKeys = Object.keys(busData);

function loadData(status = false, statusData = false) {

    let statusMessageSection;

    if (status) {
        statusMessageSection = document.querySelector('#status');
    } else if (!statusData) {
        Map.create('map');
    }

/************************************/
/*      Fetch VehiclePositions      */
/************************************/

    let fetch_positions = [
        fetch(TRIP_DETAIL_ENDPOINT + artBusIds[0], { method: "GET", headers: { 'Content-Type': 'application/json', 'mode': 'no-cors'}}),
        fetch(TRIP_DETAIL_ENDPOINT + artBusIds[1], { method: "GET", headers: { 'Content-Type': 'application/json', 'mode': 'no-cors'}}),
        fetch(TRIP_DETAIL_ENDPOINT + artBusIds[2], { method: "GET", headers: { 'Content-Type': 'application/json', 'mode': 'no-cors'}})
    ];

    // let fetch_positions = [
    //     fetch(VEHICLE_POSITIONS_BY_VEHICLE_ID + 'vehicle_id/' + artBusIds[0], { method: "GET", headers: { 'Content-Type': 'application/json', 'mode': 'no-cors'}}),
    //     fetch(VEHICLE_POSITIONS_BY_VEHICLE_ID + 'vehicle_id/' + artBusIds[1], { method: "GET", headers: { 'Content-Type': 'application/json', 'mode': 'no-cors'}}),
    //     fetch(VEHICLE_POSITIONS_BY_VEHICLE_ID + 'vehicle_id/' + artBusIds[2], { method: "GET", headers: { 'Content-Type': 'application/json', 'mode': 'no-cors'}})
    // ];

	Promise.all(fetch_positions)
    .then(responses => Promise.all(responses.map(response => response.json())))
    .then(vehicle_data => {

        let fetch_trips = [];
        vehicle_data.forEach(elem => {
            if (elem.length > 0) {
                let vehicle_position = elem[0];

                if (vehicle_position.hasOwnProperty('vehicle')) {
                    if (vehicle_position.vehicle.hasOwnProperty('vehicle_id')) {
                        console.log('VehiclePosition matched for bus ' + vehicle_position.vehicle.vehicle_id)
                        busData[vehicle_position.vehicle.vehicle_id].vehicle_position = vehicle_position;
                    }
                }
                if (vehicle_position.hasOwnProperty('trip')) {
                    if (vehicle_position.trip.hasOwnProperty('trip_id')) {
                        let fetch_url = TRIP_UPDATES_BY_TRIP_ID + 'trip_id/' + vehicle_position.trip.trip_id;
                        fetch_trips.push(fetch(fetch_url, { method: "GET", headers: { 'Content-Type': 'application/json', 'mode': 'no-cors'}}));
                    }       
                }
            }
        });

/************************************/
/*         Fetch TripUpdates        */
/************************************/

        Promise.all(fetch_trips)
        .then(responses => Promise.all(responses.map(response => response.json())))
        .then(trip_data => {
            trip_data.forEach(elem => {
                if (elem.length > 0) {
                    let trip_update = elem[0];

                    busDataKeys.forEach((key) => {
                        if (busData[key].vehicle_position != null) {
                            if (busData[key].vehicle_position.trip.trip_id == trip_update.id) {
                                busData[key].trip_update = trip_update;
                                console.log('tripUpdate matched for bus ' + key);
                            }
                        }
                    }, this);
                }
            }, this);

/************************************/
/*         Fetch Static Data        */
/************************************/

            let fetchStaticData = [];
            let fetchStoppedVehicleData = [];
            let fetchMovingVehicleData = [];

            console.log('busDataKeys: ' + busDataKeys);
            busDataKeys.forEach((key) => {
                if (busData[key].vehicle_position != null) {
                    let stop_endpoint = STOPS_ENDPOINT + busData[key].vehicle_position.stop_id;
                    let stop_time_endpoint = STOP_TIMES_ENDPOINT + busData[key].vehicle_position.trip.trip_id;

                    if (busData[key].vehicle_position.current_status == "STOPPED_AT") { /* Vehicle is stopped */
                        console.log(key + ' is stopped at ' + busData[key].vehicle_position.stop_id);
                        fetchStaticData.push(fetch(stop_time_endpoint));
                        fetchStaticData.push(fetch(stop_endpoint));
                    } else { /* moving */
                        console.log(key + ' is moving towards ' + busData[key].vehicle_position.stop_id);

                        if (busData[key].vehicle_position.trip != null) {
                            fetchStaticData.push(fetch(stop_time_endpoint));
                        } else {
                            console.log(key + ' has no trip assigned');
                        }

                        if (busData[key].vehicle_position.stop_id != null) {
                            fetchStaticData.push(fetch(stop_endpoint));
                        } else {
                            console.log(key + ' has no upcoming stop assigned')
                        }
                    }
                } else {
                    console.log(key + ' has no vehicle_position');
                }
            }, this);

            Promise.all(fetchStaticData)
            .then(responses => Promise.all(responses.map(response => response.json())))
            .then(static_data => {
                console.log(static_data);
            }, this);

/*             busMapData.hasTrips.forEach(elem => {
                if (elem.stopped) {
                    fetchStoppedVehicles.push(fetch(STOP_TIMES_ENDPOINT + elem.position.vehicle.trip.tripId));
                    fetchStoppedVehicles.push(fetch(STOPS_ENDPOINT + elem.position.vehicle.stopId));
                } else {
                    fetchMovingVehicles.push(fetch(STOP_TIMES_ENDPOINT + elem.position.vehicle.trip.tripId));
                    fetchMovingVehicles.push(fetch(STOPS_ENDPOINT + elem.prediction.stopId));
                }                
            }); */

        });
    
        /*
        *   How to check for feed issues?
        */
        /*****************************/
        /*   CHECK FOR FEED ISSUES   */
        /*****************************/

/* 		if (!vehiclePositionsData.hasOwnProperty('entity') || vehiclePositionsData.entity.length <= 0) {
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
		} else { */

            /**********************/
            /*   FEEDS ARE OKAY   */
            /**********************/

/*             if (status) {
                let statusMessageDiv = document.createElement('div');
                statusMessageDiv.innerText = 'VehiclePostions feed and TripUpdates feed successfully loaded.';
                statusMessageSection.appendChild(statusMessageDiv);
            }
			console.log('VehiclePositions and TripUpdates feeds both returning data'); */

			/************************************/
            /*   MATCH VEHICLE POSITIONS DATA   */
            /************************************/

/*             let artBusPositions = getArtBusPositions(vehiclePositionsData);
			console.log(artBusPositions.length + ' vehicle positions found'); */

			/***************************/
            /*   SEPARATE INTO TYPES   */
            /***************************/

/*             vehiclePositions.forEach(elem => {
                let wrappedElem = {
                    position: elem
                };

                if (!elem.vehicle.hasOwnProperty('trip_id')) {
                    busMapData.noTrips.push(wrappedElem);
                    console.log(elem.vehicle_id + " has no trip");
                } else {
                    if (elem.vehicle.current_status == 'STOPPED_AT') {
                        wrappedElem.stopped = true;
                        busMapData.hasTrips.push(wrappedElem);
                        console.log(elem.id + " is stopped");
                    } else {
                        wrappedElem.stopped = false;
                        busMapData.hasTrips.push(wrappedElem);
                        console.log(elem.id + " is moving");
                    }
                }
            }); */

            /**************************/
            /*   CREATE STATUS DATA   */
            /**************************/

/*             if (statusData) {
                let body = document.querySelector('body');
                let content = '{';

                content += '"summary":{"status":';

                if (busMapData.hasTrips.length == 3) {
                    content += '"all buses running"';
                } else if (busMapData.hasTrips.length == 0) {
                    content += '"no buses running"';
                } else {
                    content += '"some buses running"';
                }

                content += '},"details":{';
                
                busMapData.hasTrips.forEach(elem => {
                    content += '"' + elem.position.id + '":{"status":"trips"},';
                });

                busMapData.noTrips.forEach(elem => {
                    content += '"' + elem.position.id + '":{"status":"no trips"},';
                });

                if (content[content.length-1] == ',') {
                    content = content.substring(0,content.length - 1);
                }


                content += '}}';

                body.innerText = content;
                return;
            } */

            /**********************************/
            /*   CREATE STATUS PAGE CONTENT   */
            /**********************************/

/*             if (status) {
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
            } */

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
                        stoppedFetchCalls.push(fetch(STOP_TIMES_ENDPOINT + 'trip_id/' + elem.position.vehicle.trip.tripId));
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
		// }
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