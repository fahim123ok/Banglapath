// scripts/cleanup_dataset.js
const fs = require('fs');
const path = require('path');

const placesPath = path.join(__dirname, '..', 'banglapath-home', 'places.json');
const currentData = JSON.parse(fs.readFileSync(placesPath, 'utf8'));

const divisionMap = {
  sonargaon: 'Dhaka',
  sajek: 'Chattogram',
  bagerhat: 'Khulna',
  sundarbans: 'Khulna',
  coxsbazar: 'Chattogram',
  srimangal: 'Sylhet',
  ratargul: 'Sylhet',
  tanguarhaor: 'Sylhet',
  jaflong: 'Sylhet',
  kaptai: 'Chattogram',
  paharpur: 'Rajshahi',
  lalbagh: 'Dhaka',
  saintmartin: 'Chattogram',
  ahsanmanzil: 'Dhaka',
  mustardfields: 'Dhaka',
  himchari: 'Chattogram',
  inani: 'Chattogram'
};

const seenIds = new Set();
const cleanPlaces = [];

for (const p of currentData.places) {
  if (seenIds.has(p.id)) {
    continue; // deduplicate
  }
  seenIds.add(p.id);

  if (!p.division && divisionMap[p.id]) {
    p.division = divisionMap[p.id];
  } else if (!p.division) {
    p.division = 'Dhaka';
  }

  // Ensure gallery has at least 3 images
  if (!p.gallery || p.gallery.length < 3) {
    p.gallery = [p.image, ...(p.gallery || [])];
    while (p.gallery.length < 3) {
      p.gallery.push(p.image);
    }
  }

  cleanPlaces.push(p);
}

currentData.places = cleanPlaces;

// Update pins to have high coverage across all 8 divisions
currentData.pins = [
  { id: "sajek", name: "Sajek Valley", lat: 23.3833, lon: 92.2933 },
  { id: "nilgiri", name: "Nilgiri Peak", lat: 22.0422, lon: 92.3355 },
  { id: "coxsbazar", name: "Cox's Bazar", lat: 21.4272, lon: 92.0058 },
  { id: "saintmartin", name: "Saint Martin's Island", lat: 20.6274, lon: 92.3225 },
  { id: "srimangal", name: "Srimangal Tea Valleys", lat: 24.3065, lon: 91.7296 },
  { id: "ratargul", name: "Ratargul Swamp Forest", lat: 25.0039, lon: 91.9304 },
  { id: "tanguarhaor", name: "Tanguar Haor", lat: 25.1206, lon: 91.0718 },
  { id: "bholaganj", name: "Bholaganj Sada Pathor", lat: 25.1500, lon: 91.7500 },
  { id: "sundarbans", name: "Sundarbans National Park", lat: 21.9497, lon: 89.1833 },
  { id: "bagerhat", name: "Sixty Dome Mosque", lat: 22.6744, lon: 89.7417 },
  { id: "kuakata", name: "Kuakata Sea Beach", lat: 21.8167, lon: 90.1167 },
  { id: "guava_market", name: "Floating Guava Market", lat: 22.6400, lon: 90.2000 },
  { id: "paharpur", name: "Paharpur Buddhist Vihara", lat: 25.0315, lon: 88.977 },
  { id: "kantajew", name: "Kantajew Temple", lat: 25.7900, lon: 88.6600 },
  { id: "banglabandha", name: "Banglabandha Zero Point", lat: 26.6300, lon: 88.3500 },
  { id: "birishiri", name: "Birishiri Ceramic Hills", lat: 25.1200, lon: 90.6700 },
  { id: "lalbagh", name: "Lalbagh Fort", lat: 23.7198, lon: 90.3881 },
  { id: "sonargaon", name: "Sonargaon Panam City", lat: 23.6492, lon: 90.6033 }
];

fs.writeFileSync(placesPath, JSON.stringify(currentData, null, 2), 'utf8');
console.log(`Cleaned dataset now has ${cleanPlaces.length} unique places!`);
