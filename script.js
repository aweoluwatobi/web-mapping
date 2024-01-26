// create global variables
let view;
let map;
let layer;
let basemaps = []; //create empty basemap array
let request;
let selectedService;
const DEFAULT_BASEMAP = "streets";
const DEFAULT_MAP_SERVICE = "Water_Network";
const DEFAULT_PAGE_SIZE = 5;

// Connect to ESRI Javascript API and get necessary objects
require([
  "esri/Map",
  "esri/views/MapView",
  "esri/request",
  "esri/layers/MapImageLayer",
  "esri/widgets/Legend",
  "esri/widgets/Search",
], function (Map, MapView, esriRequest, MapImageLayer, Legend, Search) {
  // create new map
  Request = esriRequest;
  map = new Map({ basemap: DEFAULT_BASEMAP });
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
    const legend = new Legend({ view: view });
    view.ui.add(legend, "bottom-left");

    const searchWidget = new Search({ view: view });
    view.ui.add(searchWidget, "top-right");
  });

  // Connect to ArcGIS Server sample URL
  // let url = 'https://server.arcgisonline.com/arcgis/rest/services/reference?f=json'
  addMapServices();

  function addMapServices() {
    generateBasemaps();

    let url =
      "https://sampleserver6.arcgisonline.com/arcgis/rest/services?f=json";

    // Set request option to indicate json as response type
    let options = { responseType: "json" };

    //Request json data specifying the url and options
    Request(url, options).then((response) => {
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

        if (DEFAULT_MAP_SERVICE == option.textContent) {
          option.selected = true;
        }
      }
      selectMapService();

      // Select services from dropdown and access layer when you choose service
      lstServices.addEventListener("change", selectMapService);
    });
  }

  function selectMapService() {
    //Access services using the selectedIndex option of that service
    selectedService = lstServices[lstServices.selectedIndex].textContent;

    // Create and access Map layer from services url using services name selected from dropdown
    layer = new MapImageLayer({
      url: `https://sampleserver6.arcgisonline.com/arcgis/rest/services/${selectedService}/MapServer`,
    });
    //Make sure any layer on map is removed to avoid multiple layers added from previous change event
    map.removeAll();
    // Add Layer to map
    map.add(layer);
    // When layer loads, go to full extent of the layer
    layer.when(createToc);
  }
});

function createToc() {
  view.goTo(layer.fullExtent);

  // Get Table of Content Element
  let toc = document.getElementById("toc");
  toc.innerHTML = "";
  let layerList = document.createElement("ul");
  toc.append(layerList);

  addLayerToToc(layer, layerList);
}

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
  let setBasemap = (e) =>
    (map.basemap = e.target[e.target.selectedIndex].textContent);

  //Get basemap buttons div created in HTML
  let basemapLists = document.getElementById("basemap-list");

  // add event listener on click to set basemap
  basemapLists.addEventListener("change", setBasemap);

  // create basemap buttons
  for (let i = 0; i < basemaps.length; i++) {
    // Create basemap button
    let basemap = document.createElement("option");
    // Set basemap button ID
    basemap.id = basemaps[i];

    // Set basemap button text content
    basemap.textContent = basemaps[i];

    if (basemaps[i] == DEFAULT_BASEMAP) {
      basemap.selected = true;
    }

    // add basemap buttons to basemap button div created in HTML
    basemapLists.append(basemap);
  }
}

function getFeatureCount(layerid, featureCount) {
  let queryUrl = `https://sampleserver6.arcgisonline.com/arcgis/rest/services/${selectedService}/MapServer/${layerid}/query`;

  let queryOptions = {
    responseType: "json",
    query: {
      where: "1=1",
      returnCountOnly: true,
      f: "json",
    },
  };
  Request(queryUrl, queryOptions).then(
    (response) => featureCount(response.data.count),
    (response) => featureCount(0)
  );
}

function addLayerToToc(thisLayer, layerList) {
  let layerInput = document.createElement("input");
  layerInput.setAttribute("type", "checkbox");
  layerInput.setAttribute("id", thisLayer.title);
  layerInput.value = thisLayer.id;

  layerInput.addEventListener("change", (e) => {
    thisLayer.visible = e.target.checked;
  });

  let layerLabel = document.createElement("label");
  layerLabel.textContent = thisLayer.title + " ";
  layerLabel.setAttribute("for", thisLayer.title);
  layerInput.checked = thisLayer.visible;

  let countBtn = document.createElement("button");
  countBtn.setAttribute("id", thisLayer.id);
  countBtn.textContent = "view";
  // getFeatureCount(thisLayer.id, countBtn);

  // on click, open the attribute table
  countBtn.layerid = thisLayer.id;
  countBtn.addEventListener("click", openAttrTable);

  let layerItem = document.createElement("li");
  layerItem.appendChild(layerInput);
  layerItem.appendChild(layerLabel);
  layerItem.appendChild(countBtn);

  layerList.appendChild(layerItem);

  // if (thisLayer.sublayers.null) {
  //   layerList.appendChild(layerItem);
  // }

  if (thisLayer.sublayers != null && thisLayer.sublayers.items.length > 0) {
    let newList = document.createElement("ul");
    layerList.appendChild(newList);

    for (let i = 0; i < thisLayer.sublayers.length; i++) {
      addLayerToToc(thisLayer.sublayers.items[i], newList);
    }
  }
}

function openAttrTable(e) {
  let layerid = e.target.layerid;

  let featureCount = 0;

  getFeatureCount(layerid, (count) => {
    featureCount = count;
    populateAttrsTable(layerid, featureCount);
  });
}

function pageNumbering(featureCount) {
  pageCount = featureCount / DEFAULT_PAGE_SIZE;
  let attrTablePages = document.getElementById("attr-pages");
  attrTablePages.innerHTML = "";

  for (let i = 0; i < pageCount; i++) {
    let pageBtn = document.createElement("button");
    pageBtn.textContent = i + 1;

    attrTablePages.appendChild(pageBtn);
  }

  // alert(`page count: ${Math.ceil(pageCount)}`);
}

// Show table showing information of features in a  particular layer
function populateAttrsTable(layerid, featureCount) {
  pageNumbering(featureCount);
  alert(featureCount);
  //fetch Attribute table HTML Element
  const ATTR_TABLE = document.getElementById("attribute-table");

  // ATTR_TABLE.toggleAttribute("hidden");

  // Show attribute table
  ATTR_TABLE.style.display = "block";

  // rest innerHTML when function is called
  ATTR_TABLE.innerHTML = "";

  //access query url
  let queryUrl = `https://sampleserver6.arcgisonline.com/arcgis/rest/services/${selectedService}/MapServer/${layerid}/query`;

  //set query options
  let queryOptions = {
    responseType: "json",
    query: {
      where: "1=1",
      returnCountOnly: false,
      f: "json",
      outFields: "*",
      resultRecordCount: DEFAULT_PAGE_SIZE,
    },
  };

  // request esri map service and get response
  Request(queryUrl, queryOptions).then((response) => {
    // alert(response.data.fields.length);

    // create table elements
    let table = document.createElement("table");
    let tableHeader = document.createElement("tr");

    // append header to table
    table.appendChild(tableHeader);

    // fetch response to populate table header
    for (let i = 0; i < response.data.fields.length; i++) {
      // create table header and add text content
      let fieldName = document.createElement("th");
      fieldName.textContent = response.data.fields[i].alias;

      //append to table header
      tableHeader.appendChild(fieldName);
    }

    // fetch response to populate field values
    for (let i = 0; i < response.data.features.length; i++) {
      let feature = response.data.features[i];
      // create new table rows
      let tableBody = document.createElement("tr");

      // Loop through each feature to get the attributes
      for (let j = 0; j < response.data.fields.length; j++) {
        let field = response.data.fields[j];
        let features = document.createElement("td");
        features.textContent = feature.attributes[field.name];

        // change epoch date to normal date
        if (field.type == "esriFieldTypeDate") {
          features.textContent = new Date(feature.attributes[field.name]);
        }

        // append table data to table row
        tableBody.appendChild(features);

        // append each table row (tr) to the table
        table.appendChild(tableBody);
      }
    }

    // Add table to HTML Attribute table element
    ATTR_TABLE.appendChild(table);
  });
}
