# metro-art-bus-tracker

This website was built using our [11ty-web-template](https://github.com/LACMTA/11ty-web-template) repo and it shows the locations of the 3 [Metro Art Buses](https://art.metro.net/artworks/metroartbus/) in real time.

Icons will appear on the map if the `vehicle_id` appears in the VehiclePositions feed AND it has a `trip_id` assigned to it. Clicking the icon will show a popup with additional information about the trip that vehicle is running.

Buses that satisfy this condition will be in one of two states: stopped (`current_status` is `STOPPED_AT`) or moving (`current_status` is `INCOMING_AT` or `IN_TRANSIT_TO`). See the [GTFS Realtime Reference](https://gtfs.org/realtime/reference/) for more information.

If the vehicle is stopped, the popup will show the stop name and the timestamp.

If the vehicle is moving, the popup will show the bus' next stop and the predicted arrival time (or departure time if the arrival time is not available).

Technology:

- 11ty
- Leaflet
- Metro basemap via ESRI

Data:

- GTFS-realtime APIs from Swiftly via [api.metro.net](https://api.metro.net)
  - VehiclePositions endpoint
  - TripUpdates endpoint
- GTFS-static APIs from Metro's [gtfs_bus GitLab repo](https://gitlab.com/LACMTA/gtfs_bus) via [api.metro.net](https://api.metro.net)
  - stop_times endpoint
  - stops endpoint

## Quickstart

Use `node --version` to verify you're running Node 12 or newer.

Download this repository.

Use `npm run start` to build & serve the site.

❗❗❗ If this is your first time running 11ty, the `@11ty/eleventy` package will be installed. Type `y` when prompted to proceed. You might need to run `npm install`.

View the site locally at `http://localhost:8080/`.

### Config for GitHub Pages

If you plan to run a live version of this site on GitHub Pages:

- Update `pathPrefix` in `.eleventy.js` to your repo name.
- Make sure GitHub Pages is set to publish the `docs/` folder.
