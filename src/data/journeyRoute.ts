// Actual GPS waypoints from the 48-state journey
// Extracted from TeslaFi drive data - June 3 to August 2025

export interface JourneyWaypoint {
  lat: number;
  lng: number;
  name: string;
  date: string;
  state: string;
  type: 'start' | 'stop' | 'highlight' | 'charging' | 'waypoint';
  description: string;
  miles?: number; // Miles from previous stop
  elevation?: number; // Elevation in feet
}

// Key waypoints from the journey with actual GPS coordinates
export const journeyWaypoints: JourneyWaypoint[] = [
  // === TEXAS START ===
  { 
    lat: 27.741570, lng: -97.388860, 
    name: "Corpus Christi", 
    date: "Jun 3-5", 
    state: "TX", 
    type: "start", 
    description: "Journey begins in the Sparkling City by the Sea. My buddy Matt Lujan, experienced overlander, helped get Shadowfax road-ready with final checks, cargo organization, and packing strategies. Three days of prep before the adventure of a lifetime.",
    elevation: 7
  },
  { 
    lat: 30.256390, lng: -97.796510, 
    name: "Austin", 
    date: "Jun 6", 
    state: "TX", 
    type: "highlight", 
    description: "Texas capital and tech hub. Grabbed breakfast tacos on South Congress before heading west into Hill Country. Keep Austin Weird!",
    miles: 213,
    elevation: 489
  },
  { 
    lat: 30.509314, lng: -99.774650, 
    name: "Junction", 
    date: "Jun 6", 
    state: "TX", 
    type: "charging", 
    description: "Supercharger stop at the confluence of the North and South Llano Rivers. Heart of Texas Hill Country with stunning limestone canyons.",
    miles: 132,
    elevation: 1749
  },
  { 
    lat: 30.881956, lng: -102.301636, 
    name: "Fort Stockton", 
    date: "Jun 7-8", 
    state: "TX", 
    type: "highlight", 
    description: "The breakdown. 30 miles east of town, alignment issue forced a tow into Fort Stockton. Spent the night troubleshooting. Home to Paisano Pete, the world's largest roadrunner - an ironic mascot when your car won't move.",
    miles: 168,
    elevation: 3012
  },
  { 
    lat: 31.044340, lng: -104.831610, 
    name: "Van Horn", 
    date: "Jun 8-9", 
    state: "TX", 
    type: "waypoint", 
    description: "Tried pushing through the alignment issue - didn't work. Second tow from Fort Stockton to Van Horn. Another night in the desert, but the stars out here are incredible. Blue Origin's launch site is nearby.",
    miles: 75,
    elevation: 4010
  },
  { 
    lat: 31.761878, lng: -106.485022, 
    name: "El Paso", 
    date: "Jun 9-10", 
    state: "TX", 
    type: "highlight", 
    description: "Long tow from Van Horn to El Paso - finally found a Tesla service center. Sun City at the western tip of Texas, overlooking Juarez. Got Shadowfax fixed and back on the road. The journey continues.",
    miles: 120,
    elevation: 3740
  },

  // === NEW MEXICO ===
  { 
    lat: 32.346810, lng: -106.764740, 
    name: "Las Cruces", 
    date: "Jun 7", 
    state: "NM", 
    type: "highlight", 
    description: "City of Crosses nestled between the Organ Mountains and Rio Grande. Beautiful desert sunset over the Mesilla Valley.",
    miles: 246,
    elevation: 3908
  },

  // === ARIZONA ===
  { 
    lat: 32.221740, lng: -110.926480, 
    name: "Tucson", 
    date: "Jun 8", 
    state: "AZ", 
    type: "highlight", 
    description: "Surrounded by five mountain ranges and saguaro cacti. Visited Saguaro National Park and sampled Sonoran hot dogs.",
    miles: 276,
    elevation: 2389
  },
  { 
    lat: 33.448376, lng: -112.074036, 
    name: "Phoenix", 
    date: "Jun 9", 
    state: "AZ", 
    type: "highlight", 
    description: "Valley of the Sun living up to its name at 108°F. Quick stop before heading to cooler elevations. Desert Botanical Garden was incredible.",
    miles: 116,
    elevation: 1086
  },

  // === GRAND CANYON ===
  { 
    lat: 36.056198, lng: -112.125198, 
    name: "Grand Canyon", 
    date: "Jun 10", 
    state: "AZ", 
    type: "highlight", 
    description: "One of the Seven Natural Wonders. South Rim views are absolutely humbling. No photo does it justice - the scale is incomprehensible. Watched sunset paint the canyon walls.",
    miles: 230,
    elevation: 6860
  },

  // === NEVADA ===
  { 
    lat: 36.169941, lng: -115.139832, 
    name: "Las Vegas", 
    date: "Jun 11-12", 
    state: "NV", 
    type: "highlight", 
    description: "Sin City sparkles in the desert. Walked the Strip, saw the fountains at Bellagio, and charged up at the Luxor. What happens in Vegas...",
    miles: 280,
    elevation: 2001
  },

  // === JOSHUA TREE ===
  { 
    lat: 33.873415, lng: -115.900992, 
    name: "Joshua Tree", 
    date: "Jun 12", 
    state: "CA", 
    type: "highlight", 
    description: "Otherworldly desert landscape. Those twisted Joshua trees are unlike anything else. Stars at night were incredible. U2 was onto something.",
    miles: 180,
    elevation: 2700
  },

  // === CALIFORNIA - SOUTHERN ===
  { 
    lat: 34.081276, lng: -118.372505, 
    name: "Los Angeles", 
    date: "Jun 13-16", 
    state: "CA", 
    type: "highlight", 
    description: "Four days exploring the City of Angels. Hollywood, Griffith Observatory, Santa Monica Pier, and the best tacos outside Texas.",
    miles: 135,
    elevation: 285
  },
  { 
    lat: 34.014736, lng: -118.493730, 
    name: "Santa Monica", 
    date: "Jun 15", 
    state: "CA", 
    type: "waypoint", 
    description: "End of Route 66 at the iconic pier. Toes in the Pacific Ocean for the first time on this trip. Watched surfers catch waves at sunset.",
    miles: 16,
    elevation: 105
  },

  // === CALIFORNIA - COAST ===
  { 
    lat: 36.555237, lng: -121.923325, 
    name: "Monterey", 
    date: "Jun 17", 
    state: "CA", 
    type: "waypoint", 
    description: "Cannery Row and world-famous aquarium. Spotted sea otters in the bay. PCH driving was absolutely breathtaking.",
    miles: 339,
    elevation: 26
  },
  { 
    lat: 37.774929, lng: -122.419418, 
    name: "San Francisco", 
    date: "Jun 18", 
    state: "CA", 
    type: "highlight", 
    description: "Golden Gate in the fog, Alcatraz in the distance. Cable cars, Fisherman's Wharf, and the steepest streets Shadowfax has climbed.",
    miles: 116,
    elevation: 52
  },

  // === OREGON ===
  { 
    lat: 42.326520, lng: -122.875690, 
    name: "Medford", 
    date: "Jun 19", 
    state: "OR", 
    type: "charging", 
    description: "Rogue Valley wine country at the Oregon-California border. Near Crater Lake but saving that for another trip.",
    miles: 356,
    elevation: 1382
  },
  { 
    lat: 45.512230, lng: -122.658722, 
    name: "Portland", 
    date: "Jun 20-21", 
    state: "OR", 
    type: "highlight", 
    description: "Keep Portland Weird! Food carts, Powell's Books (the world's largest), and stunning views of Mt. Hood. Voodoo Doughnut was worth the hype.",
    miles: 274,
    elevation: 50
  },
  { 
    lat: 45.889764, lng: -123.961525, 
    name: "Cannon Beach", 
    date: "Jun 21", 
    state: "OR", 
    type: "highlight", 
    description: "Iconic Haystack Rock rising from the Pacific. Stayed the night listening to waves crash. The Oregon coast is pure magic - mist, sea stacks, and endless beaches.",
    miles: 79,
    elevation: 20
  },

  // === WASHINGTON ===
  { 
    lat: 48.088890, lng: -121.774722, 
    name: "Verlot", 
    date: "Jun 22", 
    state: "WA", 
    type: "highlight", 
    description: "Drove all the way from Cannon Beach to see Troy and his wife. Camped the night in the Mt. Baker-Snoqualmie National Forest. Old growth forest, rushing rivers, and great company.",
    miles: 235,
    elevation: 900
  },
  { 
    lat: 47.606209, lng: -122.332069, 
    name: "Seattle", 
    date: "Jun 23", 
    state: "WA", 
    type: "highlight", 
    description: "Emerald City living up to its name. Pike Place Market, Space Needle, and the best coffee culture in America. Go Seahawks!",
    miles: 65,
    elevation: 175
  },
  { 
    lat: 47.980239, lng: -123.499748, 
    name: "Olympic NP - Hoh Rain Forest", 
    date: "Jun 23-24", 
    state: "WA", 
    type: "highlight", 
    description: "The Hoh Rain Forest is otherworldly. Moss drapes everything, ancient trees tower overhead. One of the quietest places on Earth. Hall of Mosses trail was spiritual.",
    miles: 140,
    elevation: 578
  },
  { 
    lat: 47.996944, lng: -123.428056, 
    name: "Lake Angeles Campground", 
    date: "Jun 24", 
    state: "WA", 
    type: "waypoint", 
    description: "Camped at Lake Angeles after exploring the Hoh. Peaceful night under the stars in Olympic National Park. The Pacific Northwest is something else.",
    miles: 25,
    elevation: 4196
  },
  { 
    lat: 48.079510, lng: -123.126490, 
    name: "Sequim", 
    date: "Jun 24", 
    state: "WA", 
    type: "waypoint", 
    description: "Dinner with Brian Williamson, my former Director. Great catching up and getting his perspective on life and career. The lavender fields here are famous.",
    miles: 35,
    elevation: 183
  },

  // === IDAHO ===
  { 
    lat: 43.615017, lng: -116.202316, 
    name: "Boise", 
    date: "Jun 25", 
    state: "ID", 
    type: "highlight", 
    description: "City of Trees along the Boise River. Surprising vibrant downtown and the famous blue turf of Boise State. Idaho potatoes are real!",
    miles: 504,
    elevation: 2730
  },

  // === MONTANA ===
  { 
    lat: 46.871870, lng: -113.993040, 
    name: "Missoula", 
    date: "Jun 27", 
    state: "MT", 
    type: "highlight", 
    description: "Big Sky Country begins. A River Runs Through It was filmed here. University town with incredible mountain backdrop.",
    miles: 391,
    elevation: 3209
  },
  { 
    lat: 45.676998, lng: -111.042930, 
    name: "Bozeman", 
    date: "Jun 28", 
    state: "MT", 
    type: "waypoint", 
    description: "Gateway to Yellowstone from the north. Stunning Gallatin Valley views. Museum of the Rockies has amazing dinosaur exhibits.",
    miles: 201,
    elevation: 4820
  },

  // === WYOMING ===
  { 
    lat: 44.427963, lng: -110.588455, 
    name: "Yellowstone", 
    date: "Jun 29", 
    state: "WY", 
    type: "highlight", 
    description: "America's first national park did not disappoint. Old Faithful, Grand Prismatic Spring, and more wildlife than expected. Bucket list checked!",
    miles: 89,
    elevation: 7733
  },
  { 
    lat: 43.479946, lng: -110.762478, 
    name: "Jackson Hole", 
    date: "Jun 30", 
    state: "WY", 
    type: "highlight", 
    description: "Grand Teton views around every corner. The most dramatic mountain scenery of the entire trip. Million Dollar Cowboy Bar was a must.",
    miles: 57,
    elevation: 6237
  },

  // === UTAH - NATIONAL PARKS ===
  { 
    lat: 37.297817, lng: -113.026185, 
    name: "Zion National Park", 
    date: "Jun 28", 
    state: "UT", 
    type: "highlight", 
    description: "Angels Landing was intense but worth every step. The Narrows, massive sandstone cliffs, and the Virgin River cutting through. Utah's crown jewel.",
    miles: 160,
    elevation: 4000
  },
  { 
    lat: 38.573936, lng: -109.549632, 
    name: "Moab", 
    date: "Jun 29", 
    state: "UT", 
    type: "highlight", 
    description: "Adventure capital of Utah. Arches National Park, Canyonlands, and the Colorado River. Delicate Arch at sunset was bucket list perfection.",
    miles: 310,
    elevation: 4026
  },
  { 
    lat: 40.760780, lng: -111.891045, 
    name: "Salt Lake City", 
    date: "Jun 30", 
    state: "UT", 
    type: "highlight", 
    description: "Temple Square, Great Salt Lake, and the Bonneville Salt Flats nearby. Mountains rise dramatically right from the city streets.",
    miles: 235,
    elevation: 4226
  },
  { 
    lat: 40.233844, lng: -111.658534, 
    name: "Provo", 
    date: "Jul 1", 
    state: "UT", 
    type: "waypoint", 
    description: "BYU campus and stunning Utah Lake views. Gateway to Provo Canyon and the Alpine Loop. Mountains everywhere you look.",
    miles: 45,
    elevation: 4549
  },

  // === COLORADO ===
  { 
    lat: 39.063077, lng: -108.550649, 
    name: "Grand Mesa", 
    date: "Jul 1", 
    state: "CO", 
    type: "highlight", 
    description: "World's largest flat-topped mountain. Grand Mesa Scenic Byway with 300+ lakes and breathtaking overlooks. Shadowfax handled the elevation like a champ.",
    miles: 203,
    elevation: 10839
  },
  { 
    lat: 39.858105, lng: -104.983710, 
    name: "Denver", 
    date: "Jul 2", 
    state: "CO", 
    type: "highlight", 
    description: "Mile High City! Red Rocks Amphitheatre, craft beer scene, and Rocky Mountain views. Standing exactly 5,280 feet at the Capitol steps.",
    miles: 245,
    elevation: 5280
  },
  { 
    lat: 40.501390, lng: -105.083340, 
    name: "Fort Collins", 
    date: "Jul 2", 
    state: "CO", 
    type: "waypoint", 
    description: "New Belgium Brewing birthplace and charming Old Town. Colorado State University campus is beautiful. Gateway to Rocky Mountain NP.",
    miles: 65,
    elevation: 5003
  },

  // === NEBRASKA ===
  { 
    lat: 40.829690, lng: -98.379770, 
    name: "Grand Island", 
    date: "Jul 3", 
    state: "NE", 
    type: "charging", 
    description: "Heart of Nebraska along the Platte River. Famous for sandhill crane migrations. The Great Plains stretch endlessly in every direction.",
    miles: 296,
    elevation: 1864
  },
  { 
    lat: 40.786070, lng: -96.629654, 
    name: "Lincoln", 
    date: "Jul 3-7", 
    state: "NE", 
    type: "highlight", 
    description: "State capital and home to the Cornhuskers. Four wonderful days with family. Haymarket District, Memorial Stadium, and Nebraska hospitality.",
    miles: 98,
    elevation: 1176
  },

  // === IOWA - QUICK STOP ===
  { 
    lat: 40.796100, lng: -95.857720, 
    name: "Iowa Border", 
    date: "Jul 7", 
    state: "IA", 
    type: "waypoint", 
    description: "Quick stop just across the Nebraska-Iowa border. Put a foot down in the Hawkeye State. Cornfields as far as the eye can see - classic Midwest.",
    miles: 52,
    elevation: 1010
  },

  // === NORTH DAKOTA - FARGO ===
  { 
    lat: 46.877186, lng: -96.789803, 
    name: "Fargo", 
    date: "Jul 7-8", 
    state: "ND", 
    type: "highlight", 
    description: "Ya, you betcha! Drove straight north from the Iowa border to the Jasper Hotel downtown. Famous Fargo wood chipper, friendly Midwest vibes, and surprisingly vibrant downtown scene. Great night in a classy hotel.",
    miles: 380,
    elevation: 902
  },

  // === MINNESOTA ===
  { 
    lat: 44.977753, lng: -93.265015, 
    name: "Minneapolis", 
    date: "Jul 9", 
    state: "MN", 
    type: "highlight", 
    description: "Twin Cities deliver! Stunning skyways, lakes everywhere, and Prince's Paisley Park nearby. Land of 10,000 Lakes indeed.",
    miles: 239,
    elevation: 830
  },

  // === IOWA ===
  { 
    lat: 41.590939, lng: -93.620866, 
    name: "Des Moines", 
    date: "Jul 8", 
    state: "IA", 
    type: "waypoint", 
    description: "Iowa's capital with a gorgeous golden-domed capitol building. Bridges of Madison County country. Surprisingly great food scene.",
    miles: 244,
    elevation: 955
  },

  // === MISSOURI ===
  { 
    lat: 38.627003, lng: -90.199402, 
    name: "St. Louis", 
    date: "Jul 10", 
    state: "MO", 
    type: "highlight", 
    description: "Gateway to the West! The Arch is incredible up close. Took the tram to the top for views of both Illinois and Missouri.",
    miles: 350,
    elevation: 466
  },

  // === ILLINOIS - MIDWEST LOOP ===
  { 
    lat: 41.878113, lng: -87.629799, 
    name: "Chicago", 
    date: "Jul 10", 
    state: "IL", 
    type: "highlight", 
    description: "Windy City! Deep dish pizza, Lake Michigan skyline, and the Bean. Starting point for the Midwest friend tour. The energy here is electric.",
    miles: 92,
    elevation: 594
  },

  // === INDIANA ===
  { 
    lat: 39.466702, lng: -87.413909, 
    name: "Terre Haute", 
    date: "Jul 10-11", 
    state: "IN", 
    type: "highlight", 
    description: "Stayed with my buddy Jack Lavey. Great catching up over beers and stories. Indiana hospitality at its finest. Jack's been a solid friend - good to see him thriving.",
    miles: 178,
    elevation: 499
  },

  // === MICHIGAN ===
  { 
    lat: 43.234206, lng: -86.248394, 
    name: "Muskegon", 
    date: "Jul 12", 
    state: "MI", 
    type: "highlight", 
    description: "Drove north along Lake Michigan. Met Alyssa here - spent the day exploring the dunes and lakeshore. Beautiful Michigan summer vibes.",
    miles: 220,
    elevation: 620
  },
  { 
    lat: 41.886742, lng: -86.614445, 
    name: "Warren Dunes", 
    date: "Jul 12-13", 
    state: "MI", 
    type: "highlight", 
    description: "Warren Dunes State Park with Alyssa. Shrooms under the stars until 6AM watching the sunrise over Lake Michigan. One of those magical, unforgettable nights. The dunes were alive.",
    miles: 90,
    elevation: 650
  },

  // === OHIO ===
  { 
    lat: 39.634760, lng: -84.651280, 
    name: "Quiet Creek Valley", 
    date: "Jul 13", 
    state: "OH", 
    type: "waypoint", 
    description: "Peaceful overnight stop just south of Camden, Ohio. Needed to decompress after the Warren Dunes adventure. Rural Ohio calm before Cincinnati.",
    miles: 210,
    elevation: 980
  },
  { 
    lat: 39.177100, lng: -84.429360, 
    name: "Cincinnati", 
    date: "Jul 14-15", 
    state: "OH", 
    type: "highlight", 
    description: "Queen City on the Ohio River. Saw my Cousin Danny and his family - great to reconnect with family on the road. Skyline Chili is definitely unique. Over-the-Rhine neighborhood is incredible.",
    miles: 35,
    elevation: 483
  },

  // === KENTUCKY ===
  { 
    lat: 38.040584, lng: -84.503716, 
    name: "Lexington", 
    date: "Jul 15", 
    state: "KY", 
    type: "waypoint", 
    description: "Horse Capital of the World. Quick jaunt south from Cincinnati. Beautiful rolling bluegrass country. Bourbon trail temptations everywhere.",
    miles: 83,
    elevation: 978
  },

  // === OHIO - DIAGONAL ROUTE ===
  { 
    lat: 39.961178, lng: -82.998795, 
    name: "Columbus", 
    date: "Jul 16", 
    state: "OH", 
    type: "waypoint", 
    description: "Ohio's capital. Short Stack donuts were incredible. OSU campus is massive. Starting the diagonal drive through Ohio.",
    miles: 107,
    elevation: 902
  },
  { 
    lat: 41.499320, lng: -81.694359, 
    name: "Cleveland", 
    date: "Jul 16", 
    state: "OH", 
    type: "highlight", 
    description: "Rock and Roll Hall of Fame is a must for music lovers. Cleveland rocks! Great Lake Erie waterfront. The diagonal through Ohio complete.",
    miles: 143,
    elevation: 653
  },

  // === PENNSYLVANIA ===
  { 
    lat: 42.129224, lng: -80.085059, 
    name: "Erie", 
    date: "Jul 17", 
    state: "PA", 
    type: "waypoint", 
    description: "Presque Isle State Park on Lake Erie. Pennsylvania's lake gem. Beautiful beaches and trails. Charging up for the push east.",
    miles: 100,
    elevation: 728
  },

  // === NEW YORK ===
  { 
    lat: 42.886447, lng: -78.878369, 
    name: "Buffalo", 
    date: "Jul 16", 
    state: "NY", 
    type: "waypoint", 
    description: "Niagara Falls was absolutely thundering. Original Buffalo wings at Anchor Bar - they're legit. City has so much character.",
    miles: 192,
    elevation: 600
  },

  // === PENNSYLVANIA ===
  { 
    lat: 40.440624, lng: -79.995888, 
    name: "Pittsburgh", 
    date: "Jul 18", 
    state: "PA", 
    type: "highlight", 
    description: "Steel City with stunning bridges and three rivers. Inclines up Mt. Washington for the best city views anywhere. Go Steelers!",
    miles: 219,
    elevation: 1230
  },
  { 
    lat: 39.952583, lng: -75.165222, 
    name: "Philadelphia", 
    date: "Jul 20", 
    state: "PA", 
    type: "highlight", 
    description: "Birthplace of America! Independence Hall, Liberty Bell, and yes - a Philly cheesesteak (Pat's). Rocky steps were mandatory.",
    miles: 305,
    elevation: 39
  },

  // === WEST VIRGINIA ===
  { 
    lat: 38.349819, lng: -81.632622, 
    name: "Charleston", 
    date: "Jul 19", 
    state: "WV", 
    type: "waypoint", 
    description: "Almost heaven, West Virginia. Gold-domed capitol along the Kanawha River. New River Gorge is stunning.",
    miles: 258,
    elevation: 601
  },

  // === NEW JERSEY ===
  { 
    lat: 40.735657, lng: -74.172367, 
    name: "Newark", 
    date: "Jul 21", 
    state: "NJ", 
    type: "waypoint", 
    description: "Gateway to NYC with its own character. Branch Brook Park, historic Ironbound district with amazing Portuguese food.",
    miles: 95,
    elevation: 43
  },

  // === NEW YORK CITY ===
  { 
    lat: 40.712776, lng: -74.005974, 
    name: "New York City", 
    date: "Jul 22", 
    state: "NY", 
    type: "highlight", 
    description: "The Big Apple! Times Square, Central Park, Statue of Liberty, and the best pizza. City that never sleeps didn't let us either.",
    miles: 9,
    elevation: 33
  },

  // === CONNECTICUT ===
  { 
    lat: 41.308273, lng: -72.927884, 
    name: "New Haven", 
    date: "Jul 23", 
    state: "CT", 
    type: "waypoint", 
    description: "Yale's beautiful campus and birthplace of the hamburger (allegedly). Frank Pepe's pizza rivals New York's best.",
    miles: 80,
    elevation: 59
  },

  // === MASSACHUSETTS ===
  { 
    lat: 42.360081, lng: -71.058884, 
    name: "Boston", 
    date: "Jul 23-24", 
    state: "MA", 
    type: "highlight", 
    description: "Historic Freedom Trail, Fenway Park, and legendary seafood. Harvard and MIT nearby. So much American history in one city!",
    miles: 137,
    elevation: 43
  },

  // === RHODE ISLAND ===
  { 
    lat: 41.824009, lng: -71.412834, 
    name: "Providence", 
    date: "Jul 24", 
    state: "RI", 
    type: "waypoint", 
    description: "RISD campus is gorgeous. WaterFire festival is magical. Smallest state packed with charm. Del's Lemonade!",
    miles: 50,
    elevation: 75
  },

  // === NEW HAMPSHIRE ===
  { 
    lat: 43.207106, lng: -71.537992, 
    name: "Concord", 
    date: "Jul 25", 
    state: "NH", 
    type: "waypoint", 
    description: "Live Free or Die! State house with golden dome. White Mountains visible in the distance. Quintessential New England.",
    miles: 70,
    elevation: 288
  },

  // === VERMONT ===
  { 
    lat: 44.475883, lng: -73.212074, 
    name: "Burlington", 
    date: "Jul 26", 
    state: "VT", 
    type: "highlight", 
    description: "Lake Champlain views and Church Street marketplace. Ben & Jerry's factory tour was delicious. Fall would be incredible here.",
    miles: 153,
    elevation: 200
  },

  // === MAINE ===
  { 
    lat: 43.661471, lng: -70.255326, 
    name: "Portland", 
    date: "Jul 27", 
    state: "ME", 
    type: "highlight", 
    description: "Lighthouse spotting, lobster rolls, and Old Port charm. Best seafood of the trip. Acadia was calling but time said no.",
    miles: 218,
    elevation: 56
  },

  // === DELAWARE ===
  { 
    lat: 39.739071, lng: -75.539787, 
    name: "Wilmington", 
    date: "Jul 28", 
    state: "DE", 
    type: "waypoint", 
    description: "First state energy! Riverfront development is impressive. Tax-free shopping is real. DuPont legacy everywhere.",
    miles: 382,
    elevation: 92
  },

  // === MARYLAND ===
  { 
    lat: 39.290386, lng: -76.612189, 
    name: "Baltimore", 
    date: "Jul 28", 
    state: "MD", 
    type: "highlight", 
    description: "Inner Harbor charm, amazing crab cakes, and Edgar Allan Poe's grave. National Aquarium is world-class.",
    miles: 32,
    elevation: 33
  },

  // === WASHINGTON DC ===
  { 
    lat: 38.900154, lng: -77.034096, 
    name: "Washington D.C.", 
    date: "Jul 29", 
    state: "DC", 
    type: "highlight", 
    description: "Nation's Capital at its finest. Lincoln Memorial at night is breathtaking. Smithsonian could take weeks. History everywhere.",
    miles: 39,
    elevation: 72
  },

  // === VIRGINIA ===
  { 
    lat: 37.540726, lng: -77.436047, 
    name: "Richmond", 
    date: "Jul 29", 
    state: "VA", 
    type: "waypoint", 
    description: "Former Confederate capital with complicated history. James River views, great food scene, and Monument Avenue.",
    miles: 109,
    elevation: 166
  },

  // === NORTH CAROLINA ===
  { 
    lat: 35.056390, lng: -80.596550, 
    name: "Charlotte", 
    date: "Jul 30 - Aug 8", 
    state: "NC", 
    type: "highlight", 
    description: "Week-long stay in the Queen City. NASCAR Hall of Fame, banking capital, and amazing BBQ. Southern hospitality at its finest.",
    miles: 292,
    elevation: 761
  },

  // === SOUTH CAROLINA ===
  { 
    lat: 32.776474, lng: -79.931051, 
    name: "Charleston", 
    date: "Aug 9", 
    state: "SC", 
    type: "highlight", 
    description: "Most beautiful city in America? Historic Battery, Rainbow Row, and Lowcountry cuisine. Magnolias everywhere.",
    miles: 209,
    elevation: 20
  },

  // === GEORGIA ===
  { 
    lat: 32.080853, lng: -81.091203, 
    name: "Savannah", 
    date: "Aug 10", 
    state: "GA", 
    type: "highlight", 
    description: "Spanish moss, historic squares, and Southern charm overload. Midnight in the Garden vibes. River Street was buzzing.",
    miles: 108,
    elevation: 42
  },
  { 
    lat: 33.748997, lng: -84.387985, 
    name: "Atlanta", 
    date: "Aug 11", 
    state: "GA", 
    type: "highlight", 
    description: "Capital of the New South. World of Coca-Cola, MLK historic site, and incredible food scene. Traffic is legendary.",
    miles: 248,
    elevation: 1050
  },

  // === ALABAMA ===
  { 
    lat: 32.361538, lng: -86.279118, 
    name: "Montgomery", 
    date: "Aug 12", 
    state: "AL", 
    type: "highlight", 
    description: "Civil Rights history comes alive. Rosa Parks museum, Dexter Avenue Baptist Church. Important and moving.",
    miles: 162,
    elevation: 221
  },

  // === MISSISSIPPI ===
  { 
    lat: 32.298757, lng: -90.184810, 
    name: "Jackson", 
    date: "Aug 13", 
    state: "MS", 
    type: "waypoint", 
    description: "State capital with rich blues heritage. Civil Rights Museum is essential. Southern food game is strong.",
    miles: 190,
    elevation: 298
  },

  // === LOUISIANA ===
  { 
    lat: 29.951065, lng: -90.071533, 
    name: "New Orleans", 
    date: "Aug 14-15", 
    state: "LA", 
    type: "highlight", 
    description: "Big Easy magic! French Quarter jazz, beignets at Café Du Monde, and crawfish everything. Laissez les bons temps rouler!",
    miles: 181,
    elevation: 3
  },

  // === ARKANSAS ===
  { 
    lat: 34.746483, lng: -92.289597, 
    name: "Little Rock", 
    date: "Aug 16", 
    state: "AR", 
    type: "waypoint", 
    description: "Central High School history and Big Dam Bridge. Clinton Presidential Library. Natural State living up to its name.",
    miles: 350,
    elevation: 335
  },

  // === KANSAS ===
  { 
    lat: 37.687176, lng: -97.330055, 
    name: "Wichita", 
    date: "Aug 17", 
    state: "KS", 
    type: "waypoint", 
    description: "Air Capital of the World. Old Town district surprises with charm. Flat? Yes. Beautiful sunsets? Also yes.",
    miles: 248,
    elevation: 1299
  },

  // === OKLAHOMA ===
  { 
    lat: 35.467560, lng: -97.516426, 
    name: "Oklahoma City", 
    date: "Aug 18", 
    state: "OK", 
    type: "highlight", 
    description: "OKC Memorial is profoundly moving. Bricktown revival, Route 66 heritage, and Thunder basketball culture everywhere.",
    miles: 158,
    elevation: 1201
  },

  // === TEXAS - RETURN ===
  { 
    lat: 32.735687, lng: -97.108066, 
    name: "Dallas-Fort Worth", 
    date: "Aug 19", 
    state: "TX", 
    type: "waypoint", 
    description: "Back in Texas! Stockyards, BBQ, and Big Tex vibes. Everything really is bigger. Almost home now.",
    miles: 206,
    elevation: 430
  },
  { 
    lat: 30.267153, lng: -97.743057, 
    name: "Austin", 
    date: "Aug 19", 
    state: "TX", 
    type: "waypoint", 
    description: "Quick stop in the capital on the way south. Grabbed tacos on South Congress one last time.",
    miles: 195,
    elevation: 489
  },
  { 
    lat: 29.424122, lng: -98.493629, 
    name: "San Antonio", 
    date: "Aug 20", 
    state: "TX", 
    type: "waypoint", 
    description: "Remember the Alamo! River Walk at night is magical. Last Texas city before heading to Florida.",
    miles: 80,
    elevation: 650
  },
  { 
    lat: 30.332184, lng: -81.655651, 
    name: "Jacksonville", 
    date: "Aug 22", 
    state: "FL", 
    type: "waypoint", 
    description: "Gateway to Florida via I-10 across the Gulf coast. Largest city by area in the US. Beach vibes begin.",
    miles: 850,
    elevation: 12
  },

  // === FLORIDA - END ===
  { 
    lat: 27.848516, lng: -82.815530, 
    name: "St. Petersburg", 
    date: "Aug 23-24", 
    state: "FL", 
    type: "stop", 
    description: "Journey's end in the Sunshine City! Beautiful beaches, Dalí Museum, and time to reflect on 48 states, 15,847 miles, and one incredible summer.",
    miles: 200,
    elevation: 7
  }
];

// Generate route line coordinates (simplified for map display)
export const generateRouteCoordinates = (): [number, number][] => {
  return journeyWaypoints.map(wp => [wp.lng, wp.lat]);
};

// Get waypoints filtered by type
export const getHighlights = () => journeyWaypoints.filter(wp => wp.type === 'highlight' || wp.type === 'start' || wp.type === 'stop');
export const getChargingStops = () => journeyWaypoints.filter(wp => wp.type === 'charging');
export const getAllWaypoints = () => journeyWaypoints;

// Total stats
export const journeyStats = {
  totalWaypoints: journeyWaypoints.length,
  states: [...new Set(journeyWaypoints.map(wp => wp.state))].length,
  highlights: getHighlights().length,
  chargingStops: getChargingStops().length,
};
