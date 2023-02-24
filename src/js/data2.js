import * as Map from './map.js';

const API_URL = 'https://api.metro.net/';
const AGENCY_ID = 'LACMTA';
const TRIP_DETAIL_ENDPOINT = API_URL + AGENCY_ID + '/trip_detail/';

const artBusIds = ['3944', '4111', '5621'];

function loadData() {
    let fetch_positions = [
        fetch(TRIP_DETAIL_ENDPOINT + artBusIds[0] + '?geojson=false', { method: "GET", headers: { 'Content-Type': 'application/json', 'mode': 'cors'}}),
        fetch(TRIP_DETAIL_ENDPOINT + artBusIds[1] + '?geojson=false', { method: "GET", headers: { 'Content-Type': 'application/json', 'mode': 'cors'}}),
        fetch(TRIP_DETAIL_ENDPOINT + artBusIds[2] + '?geojson=false', { method: "GET", headers: { 'Content-Type': 'application/json', 'mode': 'cors'}})
    ];

    Map.create('map');

    Promise.all(fetch_positions)
    .then(responses => Promise.all(responses.map(response => response.json())))
    .then(trip_details => {
        trip_details.forEach(elem => {
            Map.addBusMarker(elem[0]);
        });
    });
}

export {
    loadData as loadData
};
