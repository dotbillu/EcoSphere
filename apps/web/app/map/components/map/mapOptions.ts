export const mapOptions: google.maps.MapOptions = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  zoomControl: false,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#1e1e2e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#181825" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#cdd6f4" }] },

    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#b4befe" }],
    },

    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "poi.business", stylers: [{ visibility: "off" }] },
    { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
    { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },

    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#181825" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#a6e3a1" }],
    },

    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#313244" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#181825" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#7f849c" }],
    },

    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#585b70" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#181825" }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#f5c2e7" }],
    },

    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#181825" }],
    },
    {
      featureType: "transit.station",
      elementType: "labels.text.fill",
      stylers: [{ color: "#b4befe" }],
    },

    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#11111b" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#7f849c" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#11111b" }],
    },
  ],
};

