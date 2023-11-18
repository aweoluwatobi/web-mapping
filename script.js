// create global variables
let view;
let map;
let layer;
let basemaps = []; //create empty basemap array

// Connect to ESRI Javascript API and get necessary objects
require([
  "esri/Map",
  "esri/views/MapView",
  "esri/request",
  "esri/layers/MapImageLayer",
  "esri/widgets/Legend",
], function (Map, MapView, Request, MapImageLayer, Legend) {
  // create new map
  map = new Map({ basemap: "streets" });
  // create options for the map view
  let viewOptions = {
    container: "mapview",
    map: map,
    center: [-117.11091686122334, 32.70527463861],
    scale: 10000,
  };
  // create map view
  view = new MapView(viewOptions);
  // create legend after view loads
  view.when(() => {
    let legend = new Legend({ view: view });
    view.ui.add(legend, "bottom-left");
  });

  // Connect to ArcGIS Server sample URL
  // let url = 'https://server.arcgisonline.com/arcgis/rest/services/reference?f=json'

  let url =
    "https://sampleserver6.arcgisonline.com/arcgis/rest/services?f=json";

  // Set request option to indicate json as response type
  let options = { responseType: "json" };

  //Request json data specifying the url and options
  Request(url, options).then(addMapServices);

  function addMapServices(response) {
    generateBasemaps();
    let result = response.data;
    // Get services div created in HTML
    let lstServices = document.getElementById("lstServices");

    // Add services to a select dropdown list
    for (let i = 0; i < result.services.length; i++) {
      // Create options
      let option = document.createElement("option");
      // Set options text content to the name of services
      option.textContent = result.services[i].name;
      // add options created to the select services div
      lstServices.appendChild(option);
    }
  }

  // Select services from dropdown and access layer when you choose service
  lstServices.addEventListener("change", changeMapService);

  function changeMapService() {
    // Access services using the selectedIndex option of that service
    let selectedService = lstServices[lstServices.selectedIndex].textContent;
    // Create and access Map layer from services url using services name selected from dropdown
    layer = new MapImageLayer({
      url: `https://sampleserver6.arcgisonline.com/arcgis/rest/services/${selectedService}/MapServer`,
    });
    //Make sure any layer on map is removed to avoid multiple layers added from previous change event
    map.removeAll();
    // Add Layer to map
    map.add(layer);
    // When layer loads, go to full extent of the layer
    layer.when(() => {
      view.goTo(layer.fullExtent);

      // Get Table of Content Element
      let toc = document.getElementById("toc");
      toc.innerHTML = "";
      let layerList = document.createElement("ul");
      toc.append(layerList);

      addLayerToContent(layer, layerList);
    });
  }
});

// Generate list of buttons to show various basemaps
function generateBasemaps() {
  // Push basemaps to Array
  basemaps.push("satellite"); // Add satellite basemap
  basemaps.push("hybrid"); // Add hybrid basemap
  basemaps.push("topo"); // Add topo basemap
  basemaps.push("osm"); // Add osm basemap
  basemaps.push("streets"); // Add streets basemap
  basemaps.push("streets-night-vector"); // Add street-night-vector basemap
  basemaps.push("terrain"); // Add terrain basemap
  basemaps.push("gray"); // add gray basemap
  basemaps.push("dark-gray"); // Add dark-gray basemap
  basemaps.push("oceans"); // Add oceans basemap

  // set basemap to the text content of each target
  let setBasemap = (e) => (map.basemap = e.target.textContent);

  // create basemap buttons
  for (let i = 0; i < basemaps.length; i++) {
    //Get basemap buttons div created in HTML
    let basemapBtns = document.getElementById("basemap-btns");
    // Create basemap button
    let basemapBtn = document.createElement("button");
    // Set basemap button ID
    basemapBtn.id = basemaps[i];
    // Set basemap button text content
    basemapBtn.textContent = basemaps[i];
    // add event listener on click to set basemap
    basemapBtn.addEventListener("click", setBasemap);
    // add basemap buttons to basemap button div created in HTML
    basemapBtns.append(basemapBtn);
  }
}

function addLayerToContent(thisLayer, layerList) {
  let layerInput = document.createElement("input");
  layerInput.setAttribute("type", "checkbox");
  layerInput.setAttribute("id", thisLayer.title);
  layerInput.value = thisLayer.id;

  layerInput.addEventListener("change", (e) => {
    thisLayer.visible = e.target.checked;
  });

  let layerLabel = document.createElement("label");
  layerLabel.textContent = thisLayer.title;
  layerLabel.setAttribute("for", thisLayer.title);
  layerInput.checked = thisLayer.visible;

  let layerItem = document.createElement("li");
  layerItem.appendChild(layerInput);
  layerItem.appendChild(layerLabel);

  if (thisLayer.sublayers == null) {
    layerList.appendChild(layerItem);
  }

  if (thisLayer.sublayers != null && thisLayer.sublayers.items.length > 0) {
    let newList = document.createElement("ul");
    layerList.appendChild(newList);

    for (let i = 0; i < thisLayer.sublayers.length; i++) {
      addLayerToContent(thisLayer.sublayers.items[i], newList);
    }
  }
}
