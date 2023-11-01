const map = new maplibregl.Map({
  container: 'map',
  style: 'https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json',
  center: [137.111900, 35.183600],
  zoom: 12
});
const centreMarker = new maplibregl.Marker();
const areaWidth = document.getElementById('area-width');
const areaHeight = document.getElementById('area-height');
const searchbox = document.querySelector('.search input');
const searchButton = document.querySelector('.search button');
const downloadButton = document.querySelector('.download');

map.on('load', () => {
  map.addSource('download-area', {
    type: 'geojson',
    data: null
  });
  map.addLayer({
    id: 'download-area-fill-layer',
    source: 'download-area',
    type: 'fill',
    paint: {
      'fill-color': '#98bef7',
      'fill-opacity': 0.6,
      'fill-outline-color': '#98bef7'
    }
  });
  map.addLayer({
    id: 'download-area-line-layer',
    source: 'download-area',
    type: 'line',
    paint: {
      'line-color': '#98bef7',
      'line-width': 2
    }
  });
  map.on('click', (e) => updateCenterMarker(e.lngLat));
});

areaWidth.addEventListener('input', updateDownloadArea);
areaHeight.addEventListener('input', updateDownloadArea);
searchbox.onsearch = () => searchArea();
searchButton.addEventListener('click', searchArea);
downloadButton.addEventListener('click', downloadOsmData);

// Update the center point
function updateCenterMarker(lngLat) {
  // Show a marker at the clicked point.
  centreMarker
    .remove()
    .setLngLat(lngLat)
    .addTo(map);

  // Draw a download area of the specified size centered on the marker position.
  updateDownloadArea();

  // Move the camera to the clicked point
  map.flyTo({ center: lngLat });
}

// Draw a download area
function updateDownloadArea() {
  // Longitude and latitude of clicked point.
  const centerLngLat = centreMarker.getLngLat();
  if (centerLngLat == undefined) return;
  
  // Specified width and height of download area.
  const width = areaWidth.value;
  const height = areaHeight.value;

  // Geometry(Point) at center of download area.
  const center = turf.point(Object.values(centerLngLat));
  
  // Calculate endpoints in four directions.
  const north = turf.destination(center, width / 1000 / 2, 0, {units: 'kilometers'});
  const east = turf.destination(center, height / 1000 / 2, 90, {units: 'kilometers'});
  const south = turf.destination(center, width / 1000 / 2, 180, {units: 'kilometers'});
  const west = turf.destination(center, height / 1000 / 2, 270, {units: 'kilometers'});
  
  // Create the rectangle(download area) from these endpoints.
  const points = turf.featureCollection([ north, east, south, west ]);
  const area = turf.envelope(points);

  // Draw the download area.
  map.getSource('download-area').setData(area);

  return area;
}

// Search area by name
async function searchArea() {
  const query = searchbox.value;
  if (query == '') return;
  const url = `http://nominatim.openstreetmap.org/?format=json&addressdetails=1&q=${query}&limit=1`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Could not get data using nominatim API.');
  const json = await response.json();
  updateCenterMarker([json[0].lon, json[0].lat]);
}

// Download osm data
async function downloadOsmData() {
  // Get bounding box of the download area
  const data = map.getSource('download-area')._data;
  if (data == null) return;
  const bbox = data.bbox;

  // Download osm xml data.
  const type = 'xml';
  const response = await fetch(
    'https://overpass-api.de/api/interpreter',
    {
      method: 'POST',
      body: 'data=' + encodeURIComponent(createOverpassQuery(bbox, type))
    });
  if (!response.ok) throw new Error('Could not get data using overpass API.');
  const osm = await response.text();

  // Create blob data.
  const blob = new Blob([osm], { type: 'application/osm' });
  const url = URL.createObjectURL(blob);

  // Create link to download.
  const a = document.createElement('a');
  a.href = url;
  a.download = createFileName();


  // Click on the link to trigger the download.
  document.body.appendChild(a);
  a.click();

  // Remove node and url for the download.
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Create overpass query to download osm data within bounding box
function createOverpassQuery(bbox, type) {
  return `
    [bbox:${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]}]
    [out:${type}]
    [timeout:90];
    (
      way ["building"];
      relation ["building"];
      way ["highway"];
      relation ["highway"];
    );
    (._;>;);
    out;
  `;
}

// Create file name with the current date
function createFileName() {
  const date = new Date();
  const year = date.getFullYear().toString();
  const month = date.getMonth().toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  const second = date.getSeconds().toString().padStart(2, '0');
  const filename = `osmdata-${year}${month}${day}${hour}${minute}${second}.osm`;
  return filename;
}
