//Popups
function popupcontent(feature, layer) {

  feature["opening_state"] = "unknown";

  if (feature.opening_hours !== "Unbekannt") {

    // Input node/123457890
    // Capitalize first letter and concat digits
    // Result osm_type+osm_id = N12345789
    var osm_ids = feature.id.split('/');
    var osm_type = osm_ids[0][0].toUpperCase();
    var osm_id = osm_ids[1];

    $.ajax({
        url: `https://nominatim.openstreetmap.org/lookup?format=json&osm_ids=${osm_type}${osm_id}`,
        dataType: 'json',
        async: false,
        success: function(data) {
            var oh = new opening_hours(feature.opening_hours, data[0]);
            console.log("oh = " + oh.getState());

            try {

              if ( oh.getState() ) {
                feature["opening_state"] = "open";
              } else {
                feature["opening_state"] = "closed";
              }

            } catch (err) {
              console.log("Fehler beim Öffnungsstatus von " + err.message);
            }
        }
    });

  }

  var popupcontenttmpl = $.templates("#popupcontenttmpl");
  return popupcontenttmpl.render(feature);
};
