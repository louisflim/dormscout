// Full university data with coordinates (for Map.jsx)
export const UNIVERSITIES = [
  { name: 'Cebu Institute of Technology - University',    abbr: 'CIT',        coords: [10.29457049495325,  123.8810696234642]  },
  { name: 'University of San Carlos - Downtown',          abbr: 'USC-DC',     coords: [10.299533411273078, 123.89894228028311] },
  { name: 'University of the Visayas',                    abbr: 'UV',         coords: [10.298701521575332, 123.90136409833146] },
  { name: 'University of Cebu - Main',                    abbr: 'UC Main',    coords: [10.29859134168097,  123.89769041976133] },
  { name: 'University of San Carlos - Talamban',          abbr: 'USC-TC',     coords: [10.352530648303398, 123.91257785415208] },
  { name: 'University of Cebu - Banilad',                 abbr: 'UC Banilad', coords: [10.338903100091237, 123.91192294436264] },
  { name: 'University of Cebu - METC',                    abbr: 'UC METC',    coords: [10.287151042846553, 123.87788175785442] },
  { name: 'University of San Jose-Recoletos - Main',      abbr: 'USJR Main',  coords: [10.294176444197102, 123.89750739647967] },
  { name: 'University of San Jose-Recoletos - Basak',     abbr: 'USJR Basak', coords: [10.290123577674795, 123.8624596247838]  },
  { name: 'Cebu Normal University',                       abbr: 'CNU',        coords: [10.301911563323149, 123.8962597988632]  },
  { name: 'University of the Philippines Cebu',            abbr: 'UP',         coords: [10.32250556542723,  123.89824335176846] },
  { name: 'Southwestern University PHINMA',                abbr: 'SWU',        coords: [10.303344727301218, 123.89140215600317] },
  { name: 'Cebu Technological University',                 abbr: 'CTU',        coords: [10.297444457685753, 123.90659062522744] },
  { name: "Saint Theresa's College",                      abbr: 'STC',        coords: [10.3127944559912,   123.89601129648001] },
  { name: 'Asian College of Technology',                  abbr: 'ACT',        coords: [10.298830349299022, 123.89590624741045] },
];

// Array of just names (for Settings.jsx dropdown)
export const UNIVERSITY_NAMES = UNIVERSITIES.map(u => u.name);

// Function to get university by name
export const getUniversityByName = (name) => {
  return UNIVERSITIES.find(u => u.name === name);
};

// Function to get university by abbreviation
export const getUniversityByAbbr = (abbr) => {
  return UNIVERSITIES.find(u => u.abbr === abbr);
};

// Function to get university coordinates
export const getUniversityCoords = (name) => {
  const uni = UNIVERSITIES.find(u => u.name === name);
  return uni ? uni.coords : null;
};

// Get all abbreviations
export const UNIVERSITY_ABBREVIATIONS = UNIVERSITIES.map(u => u.abbr);

// Calculate distance between two coordinates
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a    =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Find nearest university to a location
export const findNearestUniversity = (lat, lng) => {
  if (!lat || !lng) return null;
  let nearest = null;
  let minDistance = Infinity;

  UNIVERSITIES.forEach((uni) => {
    const distance = calculateDistance(lat, lng, uni.coords[0], uni.coords[1]);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = { ...uni, distance };
    }
  });

  return nearest;
};

// Get distance from user's university
export const getDistanceFromUniversity = (lat, lng, userUniversity) => {
  if (!lat || !lng || !userUniversity) return null;
  const userUni = UNIVERSITIES.find(uni => uni.name === userUniversity || uni.abbr === userUniversity);
  if (!userUni) return null;
  const distance = calculateDistance(lat, lng, userUni.coords[0], userUni.coords[1]);
  return { ...userUni, distance };
};