const query_overpass = require("query-overpass");
const fs = require("fs")
const bbox = "46.51351558059737,4.2626953125,55.26659815231191,17.7978515625";

function mkdirSyncRecursive(directory) {
  var path = directory.replace(/\/$/, '').split('/');

  for (var i = 1; i <= path.length; i++) {
    var segment = path.slice(0, i).join('/');
    !fs.existsSync(segment) ? fs.mkdirSync(segment) : null;
  }
}

function writeFileSync(path, data) {
  var filename=`${path}/details.json`
  fs.existsSync(filename) ? fs.appendFileSync(filename, data) : fs.writeFileSync(filename, data)
}

function removeDataDir(path) {
  if (!path || path === "/")
      return
  console.log(`Removing ${path}`)

  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        removeDataDir(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

function translatePropertiesToGerman(data) {
  var properties = {}
  for (key in data) {
    if (key.match(/addr:|opening_hours|name|website|id/))
         continue;

    replacedKey = key.replace("name", "Name")
                    .replace("opening_hours", "Öffnungszeiten")
                    .replace(/addr:/g, "")
                    .replace("city", "Stadt")
                    .replace("housenumber", "Hausnummer")
                    .replace("phone", "Telefon")
                    .replace("operator", "Betreiber")
                    .replace("postcode", "Postleitzahl")
                    .replace("street", "Straße")
                    .replace("organic", "Biologisch")
                    .replace("produce", "Produzieren")
                    .replace("product", "Produkt(e)")
                    .replace("suburb", "Bezirk")
                    .replace("description", "Beschreibung")
                    .replace("building", "Gebäude")
                    .replace("wheelchair", "Rollstuhlgerecht")
                    .replace("payment coins", "Nimmt Münzen")
                    .replace("payment notes", "Nimmt Scheine")
                    .replace("payment cash", "Nimmt Bargeld")
                    .replace("vending", "Verkauft")
                    .replace("amenity", "Einrichtung ")
                    .replace("country", "Land")
                    .replace("houseName", "Hausname")
                    .replace("milk", "Milch")
                    .replace("covered", "Überdacht")
                    .replace("lastcheck", "Letze Überprüfung")
                    .replace("source", "Quelle")
     replacedValue = data[key].replace(";", ", ")
                    .replace("yes", "ja")
                    .replace("only", "nur")
                    .replace("vending_machine", "Verkaufsautomat")
                    .replace(/contact:/g, "")

    properties[replacedKey] = replacedValue
  }
  return properties
}

function address(data) {
    var address = {}

    if (data["addr:street"]) 
        address["street"] = data["addr:street"]
    
    if (data["addr:housenumber"])
        address["housenumber"] = data["addr:housenumber"]

    if (data["addr:postcode"])
        address["postcode"] = data["addr:postcode"]

    if (data["addr:city"])
        address["city"] = data["addr:city"]

    if (data["addr:place"])
        address["place"] = data["addr:place"]

    if (data["addr:suburb"])
        address["suburb"] = data["addr:suburb"]

    if (Object.keys(address) == 0)
        address["city"] = "Unbekannt"

  return address;
}

function getProperty(data) {
  var property = "unkown"

  if ( data.properties )
    if (data.properties.shop === 'farm' && data.properties.amenity != 'vending_machine')
      property = "farm"
    else if (data.properties.amenity === 'marketplace' && data.properties.shop != 'farm' && data.properties.amenity != 'vending_machine')
      property = "marketplace"
    else if (data.properties.amenity === 'vending_machine'&& data.properties.shop != 'farm' && data.properties.amenity != 'marketplace')
      property = "vending_machine"
    else if (data.properties.amenity === 'vending_machine')
      property = "vending_machine"

  return property
}

function opening_hours(data) {
  if (data)
      return data
  else 
      return "Unbekannt"
}


function getDetailNode(data) {
  var geometry = data.geometry

  var properties = null
  if ( node.properties )
    properties = translatePropertiesToGerman(data.properties)

  if (geometry && properties)
    return {
        "type": "Feature",
        properties,
        "name": data.properties.name,
        "address": address(data.properties),
        "opening_hours":  opening_hours(data.properties.opening_hours),
        "website":  data.properties.website,
        "property": getProperty(data),
        "id": data.properties.id,
        geometry
    }
  else
    return null
}

function getMinimizedNode(data) {
  var property = null

  if (data.properties)
     property = getProperty(data)

  var geometry = data.geometry

  if (geometry && property )
    return simpleNode = {
        "type": "Feature",
        "properties": {
            "p": property,
            "id": node.id
        }, geometry
    }
  else
    return null
}


// __MAIN__
var today = new Date();
var hh = today.getHours();
var dd = today.getDate();
var mm = today.getMonth()+1; //January is 0!
var yyyy = today.getFullYear();

if(dd<10) {
    dd = '0' + dd
} 
if(mm<10) {
    mm = '0' + mm
} 

removeDataDir("data/")

lastUpdate ='Letzter Datenabgleich: ' + dd + '.' + mm + '.' + yyyy +' ungefähr um ' + hh +' Uhr.';

console.log(lastUpdate)
console.log('bbox: ' + bbox)

let query = ` 
  [out:json][timeout:742];
  // gather results
  area["name"="Deutschland"]->.de;
  (
    node["vending"~"milk|eggs|food"](area.de);
    way["vending"~"milk|eggs|food"](area.de);
    relation["vending"~"milk|eggs|food"](area.de);
    // query part for: “amenity=marketplace”
    node["amenity"="marketplace"](area.de);
    way["amenity"="marketplace"](area.de);
    relation["amenity"="marketplace"](area.de);
    // query part for: “shop=farm”
    node["shop"="farm"](area.de);
    way["shop"="farm"](area.de);
    relation["shop"="farm"](area.de);

  );
  out center;
`;
console.log(query)

// query overpass, write to folders by id
query_overpass(query, (error, data)  => {
  farmshopGeoJsonFeatures = []

  console.log("Download done, Preparing data ...");
  mkdirSyncRecursive("data")

  for (Item in data) {
    for (subItem in data[Item]) {
      node = data[Item][subItem]
      mkdirSyncRecursive(`data/${node.id}`)
      writeFileSync(`data/${node.id}`, JSON.stringify(getDetailNode(node), null, 0))
      simpleNode = getMinimizedNode(node)
      simpleNode ? farmshopGeoJsonFeatures.push(simpleNode) : null
    }
  }

  farmshopGeo = JSON.stringify({"type": "FeatureCollection","features": farmshopGeoJsonFeatures}, null, 0)
  fs.writeFileSync('data/farmshopGeoJson.js',  `var lastUpdate = "${lastUpdate}"; var farmshopGeoJson = ${farmshopGeo};`)

}, {flatProperties: true});
