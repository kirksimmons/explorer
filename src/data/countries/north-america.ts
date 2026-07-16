import type { Country } from '../types';

export const NORTH_AMERICA: Record<string, Country> = {
  AG: {
    iso2: 'AG',
    name: 'Antigua and Barbuda',
    capital: "Saint John's",
    languages: ['English'],
    dish: {
      name: 'Fungee and pepperpot',
      blurb: 'Soft cornmeal balls served with a warm vegetable stew. Families cook it together on weekends!',
    },
    funFacts: [
      'People say Antigua has 365 beaches — one for every day of the year.',
      'Thousands of frigate birds with puffy red throats nest on Barbuda.',
      'Every spring, sailboats from all over the world race around the island.',
    ],
    longAgo: {
      history: [
        'Long ago, island people paddled big canoes here to fish the warm sea.',
        'Later, sailing ships anchored in the bays and windmills dotted the hills.',
      ],
      dino: {
        name: 'Mosasaurus',
        note: 'A giant swimming reptile that hunted fish in the ancient sea covering this region.',
      },
    },
    famousFor: '365 beaches and sailboat races',
  },
  BS: {
    iso2: 'BS',
    name: 'The Bahamas',
    capital: 'Nassau',
    languages: ['English'],
    dish: {
      name: 'Conch fritters',
      blurb: 'Crispy fried bites made with meat from a big pink seashell. Kids dip them in tangy sauce!',
    },
    funFacts: [
      'The Bahamas is made of about 700 islands scattered across the sea.',
      'On one island, friendly pigs swim right up to boats to say hello.',
      "Dean's Blue Hole is one of the deepest underwater caves in the world.",
    ],
    longAgo: {
      history: [
        'The Lucayan people lived here first, fishing and diving in the clear water.',
        'Later, pirates like Blackbeard hid their ships in these islands.',
      ],
      dino: {
        name: 'Mosasaurus',
        note: 'A huge swimming reptile that glided through the ancient sea where these islands are now.',
      },
    },
    famousFor: 'swimming pigs and crystal-clear blue water',
  },
  BB: {
    iso2: 'BB',
    name: 'Barbados',
    capital: 'Bridgetown',
    languages: ['English'],
    dish: {
      name: 'Flying fish and cou-cou',
      blurb: 'Tender fish served with soft cornmeal and okra. It is the meal Barbadians love best!',
    },
    funFacts: [
      'Flying fish really do leap out of the sea and glide over the waves here.',
      'Many people say the grapefruit was first grown in Barbados.',
      'Green monkeys scamper through the treetops all over the island.',
    ],
    longAgo: {
      history: [
        'Long ago, Arawak people fished these shores from canoes carved out of trees.',
        'Later, windmills turned all over the island to crush sweet sugar cane.',
      ],
      dino: {
        name: 'Mosasaurus',
        note: 'A giant sea reptile with paddle flippers that swam this part of the ancient ocean.',
      },
    },
    famousFor: 'flying fish and the singer Rihanna',
  },
  BZ: {
    iso2: 'BZ',
    name: 'Belize',
    capital: 'Belmopan',
    languages: ['English', 'Spanish'],
    dish: {
      name: 'Rice and beans with stew chicken',
      blurb: 'Rice cooked in creamy coconut milk with beans and juicy chicken. It is the favorite Sunday lunch!',
    },
    funFacts: [
      'The Great Blue Hole is a giant round sea cave you can spot from the sky.',
      'A huge coral reef full of colorful fish runs along the whole coast.',
      'Belize made the first special forest in the world just for jaguars.',
    ],
    longAgo: {
      history: [
        'Long ago, the Maya built stone pyramids here that rose above the jungle.',
        'One pyramid at Caracol is still one of the tallest buildings in Belize!',
      ],
      dino: {
        name: 'Mosasaurus',
        note: 'A giant swimming reptile that hunted in the warm, shallow sea that once covered Belize.',
      },
    },
    famousFor: 'the Great Blue Hole and Maya pyramids',
  },
  CA: {
    iso2: 'CA',
    name: 'Canada',
    capital: 'Ottawa',
    languages: ['English', 'French'],
    dish: {
      name: 'Poutine',
      blurb: 'Crispy fries topped with squeaky cheese curds and hot gravy. It is warm, gooey, and super fun to eat!',
    },
    funFacts: [
      'Canada is the second-biggest country in the whole world.',
      'It has more lakes than any other country on Earth.',
      'Most of the world\'s maple syrup is made in Canada.',
    ],
    longAgo: {
      history: [
        'First Nations peoples carved tall totem poles and paddled birch-bark canoes.',
        'Vikings sailed all the way to Canada\'s coast about 1,000 years ago.',
      ],
      dino: {
        name: 'Albertosaurus',
        note: 'A fierce meat-eater like a smaller T. rex, found in the badlands of Alberta.',
      },
    },
    famousFor: 'maple syrup, moose, and ice hockey',
  },
  CR: {
    iso2: 'CR',
    name: 'Costa Rica',
    capital: 'San José',
    languages: ['Spanish'],
    dish: {
      name: 'Gallo pinto',
      blurb: 'Rice and black beans fried together until speckled. Costa Ricans eat it for breakfast with eggs!',
    },
    funFacts: [
      'Sloths hang upside down in the rainforest and move very, very slowly.',
      'About one in every twenty kinds of animal and plant on Earth lives here.',
      'People say "pura vida" — pure life — to mean hello, goodbye, and all is well.',
    ],
    longAgo: {
      history: [
        'Long ago, people here carved giant stone balls, some as tall as a kid.',
        'Nobody knows exactly why they made them — it is still a mystery!',
      ],
      dino: {
        name: 'Megalodon',
        note: 'A shark bigger than a school bus whose huge teeth are found in this part of the world.',
      },
    },
    famousFor: 'sloths, volcanoes, and rainforests',
  },
  CU: {
    iso2: 'CU',
    name: 'Cuba',
    capital: 'Havana',
    languages: ['Spanish'],
    dish: {
      name: 'Ropa vieja',
      blurb: 'Shredded beef in tomato sauce with rice. Its name means "old clothes" because the meat looks like torn ribbons!',
    },
    funFacts: [
      'The bee hummingbird, the smallest bird in the world, lives only in Cuba.',
      'Cuba is the biggest island in the whole Caribbean Sea.',
      'Shiny old cars from the 1950s still cruise the streets today.',
    ],
    longAgo: {
      history: [
        'The Taíno people lived here first, sleeping in comfy hammocks they invented.',
        'Later, treasure ships gathered in Havana while pirates prowled the sea.',
      ],
      dino: {
        name: 'Megalocnus',
        note: 'A giant sloth as big as a bear that lumbered around ancient Cuba.',
      },
    },
    famousFor: 'classic old cars and lively music',
  },
  DM: {
    iso2: 'DM',
    name: 'Dominica',
    capital: 'Roseau',
    languages: ['English', 'French Creole'],
    dish: {
      name: 'Callaloo soup',
      blurb: 'A creamy green soup made from leafy dasheen plants and coconut milk. It is like a warm island hug!',
    },
    funFacts: [
      'A lake in the mountains bubbles and steams like a giant pot of soup.',
      'The sisserou parrot on the flag lives nowhere else in the world.',
      'People say Dominica has 365 rivers — one for every day of the year.',
    ],
    longAgo: {
      history: [
        'The Kalinago people paddled big canoes between islands and still live here today.',
        'Sailors long ago called this the island of tall green mountains.',
      ],
      dino: {
        name: 'Mosasaurus',
        note: 'A giant swimming reptile that ruled the ancient sea around these islands.',
      },
    },
    famousFor: 'rainforests, rivers, and the sisserou parrot',
  },
  DO: {
    iso2: 'DO',
    name: 'Dominican Republic',
    capital: 'Santo Domingo',
    languages: ['Spanish'],
    dish: {
      name: 'Mangú',
      blurb: 'Warm mashed green plantains topped with crispy onions. Kids eat it for breakfast with cheese and eggs!',
    },
    funFacts: [
      'Pico Duarte is the tallest mountain in all the Caribbean islands.',
      'Every winter, humpback whales swim to Samaná Bay to play and splash.',
      'Baseball is the favorite game, and kids practice it on every street.',
    ],
    longAgo: {
      history: [
        'The Taíno people lived here first and drew pictures inside cool caves.',
        'Some of the oldest streets built by European sailors in the Americas are here.',
      ],
      dino: {
        name: 'Mosasaurus',
        note: 'A huge sea reptile that swam where the Caribbean islands now stand.',
      },
    },
    famousFor: 'baseball, beaches, and merengue music',
  },
  SV: {
    iso2: 'SV',
    name: 'El Salvador',
    capital: 'San Salvador',
    languages: ['Spanish'],
    dish: {
      name: 'Pupusas',
      blurb: 'Thick corn pancakes stuffed with melty cheese and beans. You eat them hot with crunchy pickled cabbage!',
    },
    funFacts: [
      'El Salvador is the smallest country in Central America.',
      'It is called the Land of Volcanoes because it has so many of them.',
      'Surfers travel from far away to ride its big Pacific waves.',
    ],
    longAgo: {
      history: [
        'Long ago, a volcano covered a Maya village in soft ash like a time capsule.',
        'Today you can see the ancient houses and gardens just as they were!',
      ],
      dino: {
        name: 'Eremotherium',
        note: 'A giant ground sloth as tall as an elephant whose bones were found near San Salvador.',
      },
    },
    famousFor: 'volcanoes and Pacific surfing waves',
  },
  GD: {
    iso2: 'GD',
    name: 'Grenada',
    capital: "Saint George's",
    languages: ['English'],
    dish: {
      name: 'Oil down',
      blurb: 'A one-pot stew of breadfruit, veggies, and coconut milk. Whole families cook it outside in a big pot!',
    },
    funFacts: [
      'Grenada grows so much nutmeg it is called the Island of Spice.',
      'Divers can visit an underwater park full of statues on the sea floor.',
      'Grand Anse beach has soft white sand that stretches for miles.',
    ],
    longAgo: {
      history: [
        'The Kalinago people fished these waters long before tall ships arrived.',
        'Later, sailing ships filled their holds with sweet-smelling spices here.',
      ],
      dino: {
        name: 'Mosasaurus',
        note: 'A giant swimming reptile that prowled the ancient sea in this part of the world.',
      },
    },
    famousFor: 'nutmeg and sweet-smelling spices',
  },
  GT: {
    iso2: 'GT',
    name: 'Guatemala',
    capital: 'Guatemala City',
    languages: ['Spanish', 'Mayan languages'],
    dish: {
      name: 'Chuchitos',
      blurb: 'Little corn dough bundles with meat and sauce, steamed inside corn husks. Unwrapping one is like opening a present!',
    },
    funFacts: [
      'The money is named after the quetzal, a bird with long emerald feathers.',
      'On a special day each year, people fly giant kites as big as houses.',
      'Lake Atitlán sparkles in the mountains with three volcanoes around it.',
    ],
    longAgo: {
      history: [
        'The Maya built the great city of Tikal, with pyramids taller than the jungle trees.',
        'From the top, ancient stargazers watched the planets and made calendars.',
      ],
      dino: {
        name: 'Quetzalcoatlus',
        note: 'A flying reptile as big as a small plane that soared over this part of the world.',
      },
    },
    famousFor: 'Maya pyramids and the quetzal bird',
  },
  HT: {
    iso2: 'HT',
    name: 'Haiti',
    capital: 'Port-au-Prince',
    languages: ['Haitian Creole', 'French'],
    dish: {
      name: 'Soup joumou',
      blurb: 'A golden pumpkin soup with pasta and veggies. Families share big bowls of it on New Year\'s Day!',
    },
    funFacts: [
      'The name Haiti means "land of mountains" in the old Taíno language.',
      'Haitian artists paint bright, joyful pictures famous all over the world.',
      'Bands called rara parade through towns playing drums and bamboo trumpets.',
    ],
    longAgo: {
      history: [
        'The Taíno people lived here first, in the land they called mountain country.',
        'Long ago, a king built the Citadelle, a giant fortress high in the clouds.',
      ],
      dino: {
        name: 'Mosasaurus',
        note: 'A giant swimming reptile that hunted in the ancient sea around these islands.',
      },
    },
    famousFor: 'mountains, drums, and colorful paintings',
  },
  HN: {
    iso2: 'HN',
    name: 'Honduras',
    capital: 'Tegucigalpa',
    languages: ['Spanish'],
    dish: {
      name: 'Baleadas',
      blurb: 'A warm folded tortilla filled with beans, cheese, and cream. Kids eat them for breakfast, lunch, or dinner!',
    },
    funFacts: [
      'Whale sharks, the biggest fish in the sea, swim near the Bay Islands.',
      'The scarlet macaw, a bright red parrot, is the national bird.',
      'The name Honduras means "deep waters" in Spanish.',
    ],
    longAgo: {
      history: [
        'The Maya built the city of Copán, covered in amazing stone carvings.',
        'One stairway there has more than 1,000 carved picture-symbols on it!',
      ],
      dino: {
        name: 'Mosasaurus',
        note: 'A huge sea reptile that swam in the ancient waters off this coast.',
      },
    },
    famousFor: 'scarlet macaws and Maya stone carvings',
  },
  JM: {
    iso2: 'JM',
    name: 'Jamaica',
    capital: 'Kingston',
    languages: ['English', 'Jamaican Patois'],
    dish: {
      name: 'Jerk chicken',
      blurb: 'Chicken rubbed with spicy-sweet seasoning and grilled over wood smoke. The smell makes everyone hungry!',
    },
    funFacts: [
      'Usain Bolt from Jamaica became the fastest runner in the world.',
      'Reggae music was invented here and is now loved everywhere.',
      'The doctor bird, a hummingbird with long tail feathers, lives only in Jamaica.',
    ],
    longAgo: {
      history: [
        'The Taíno people called this island Xaymaca, land of wood and water.',
        'Later, the town of Port Royal was a famous hangout for pirates.',
      ],
      dino: {
        name: 'Mosasaurus',
        note: 'A giant swimming reptile that ruled the ancient Caribbean sea.',
      },
    },
    famousFor: 'reggae music and super-fast runners',
  },
  MX: {
    iso2: 'MX',
    name: 'Mexico',
    capital: 'Mexico City',
    languages: ['Spanish'],
    dish: {
      name: 'Tacos',
      blurb: 'Soft corn tortillas folded around tasty fillings like meat, cheese, and salsa. You get to build your own!',
    },
    funFacts: [
      'Chocolate was first made here, long ago, as a special spicy drink.',
      'Every winter, millions of orange monarch butterflies fly to Mexico\'s forests.',
      'The axolotl, a smiling salamander, lives in canals near Mexico City.',
    ],
    longAgo: {
      history: [
        'The Aztecs built their capital on an island in a lake, with canals for streets.',
        'The Maya raised stone pyramids where a serpent shadow appears each spring.',
      ],
      dino: {
        name: 'Quetzalcoatlus',
        note: 'A flying reptile as tall as a giraffe, named after a feathered-serpent god.',
      },
    },
    famousFor: 'tacos, pyramids, and mariachi music',
  },
  NI: {
    iso2: 'NI',
    name: 'Nicaragua',
    capital: 'Managua',
    languages: ['Spanish'],
    dish: {
      name: 'Nacatamal',
      blurb: 'A big bundle of corn dough, meat, and veggies steamed in a banana leaf. Families share them on weekend mornings!',
    },
    funFacts: [
      'Daring visitors slide down a black volcano on boards, like snowboarding on ash.',
      'Sharks that can live in fresh water swim in giant Lake Nicaragua.',
      'Nicaragua is called the land of lakes and volcanoes.',
    ],
    longAgo: {
      history: [
        'About 2,000 years ago, people walked across soft mud near a lake here.',
        'Their footprints turned to stone, and you can still see them today!',
      ],
      dino: {
        name: 'Mosasaurus',
        note: 'A giant swimming reptile from the ancient seas around this part of the world.',
      },
    },
    famousFor: 'lakes, volcanoes, and volcano boarding',
  },
  PA: {
    iso2: 'PA',
    name: 'Panama',
    capital: 'Panama City',
    languages: ['Spanish'],
    dish: {
      name: 'Sancocho',
      blurb: 'A cozy chicken soup with corn and a root veggie called yuca. Panamanians say it can fix any bad day!',
    },
    funFacts: [
      'Panama is so narrow you can swim in two different oceans on the same day.',
      'Shiny golden frogs are a national treasure and a symbol of good luck.',
      'More than 900 kinds of birds live in Panama\'s forests.',
    ],
    longAgo: {
      history: [
        'Millions of years ago, Panama rose from the sea and joined two continents.',
        'Animals crossed this new land bridge in both directions, like a parade!',
      ],
      dino: {
        name: 'Megalodon',
        note: 'A giant shark whose hand-sized teeth were dug up when the Panama Canal was built.',
      },
    },
    famousFor: 'the Panama Canal linking two oceans',
  },
  KN: {
    iso2: 'KN',
    name: 'Saint Kitts and Nevis',
    capital: 'Basseterre',
    languages: ['English'],
    dish: {
      name: 'Stewed saltfish with dumplings',
      blurb: 'Tender fish stew served with soft dumplings and sweet plantains. It is the meal islanders love most!',
    },
    funFacts: [
      'This country is made of just two small islands, Saint Kitts and Nevis.',
      'An old sugar-cane train now takes visitors on a ride around the island.',
      'Playful green vervet monkeys swing through the trees everywhere.',
    ],
    longAgo: {
      history: [
        'The Kalinago people called Saint Kitts Liamuiga, meaning fertile land.',
        'Later, a huge stone fortress was built high on Brimstone Hill.',
      ],
      dino: {
        name: 'Mosasaurus',
        note: 'A giant swimming reptile that cruised the ancient sea in this region.',
      },
    },
    famousFor: 'twin islands and a scenic sugar train',
  },
  LC: {
    iso2: 'LC',
    name: 'Saint Lucia',
    capital: 'Castries',
    languages: ['English', 'French Creole'],
    dish: {
      name: 'Green figs and saltfish',
      blurb: 'Boiled green bananas with seasoned flaky fish. Here, green bananas are called figs — surprise!',
    },
    funFacts: [
      'Two pointy green mountains called the Pitons rise straight out of the sea.',
      'There is a steamy volcano area you can drive right up to and visit.',
      'Saint Lucia is one of the only countries named after a woman.',
    ],
    longAgo: {
      history: [
        'The Kalinago people called this island Iouanalao, land of the iguanas.',
        'Long ago, sailing ships raced each other to reach its sheltered bays.',
      ],
      dino: {
        name: 'Mosasaurus',
        note: 'A huge sea reptile that swam the ancient waters of this region.',
      },
    },
    famousFor: 'the twin Piton mountains',
  },
  VC: {
    iso2: 'VC',
    name: 'Saint Vincent and the Grenadines',
    capital: 'Kingstown',
    languages: ['English'],
    dish: {
      name: 'Roasted breadfruit and fried jackfish',
      blurb: 'Breadfruit roasted until smoky and soft, served with crispy fish. It is the national favorite!',
    },
    funFacts: [
      'This country is a chain of 32 islands and tiny cays to hop between.',
      'Famous pirate movies were filmed in its beautiful bays.',
      'Some beaches have soft black sand made by a volcano.',
    ],
    longAgo: {
      history: [
        'The Kalinago paddled canoes between these islands like a watery highway.',
        'Ancient people carved mysterious pictures into the rocks here.',
      ],
      dino: {
        name: 'Mosasaurus',
        note: 'A giant swimming reptile from the ancient sea that covered this region.',
      },
    },
    famousFor: 'island-hopping sailboats and pirate-movie beaches',
  },
  TT: {
    iso2: 'TT',
    name: 'Trinidad and Tobago',
    capital: 'Port of Spain',
    languages: ['English'],
    dish: {
      name: 'Doubles',
      blurb: 'Two soft fried flatbreads filled with curried chickpeas. People line up for them at street stands!',
    },
    funFacts: [
      'The steelpan drum, played in bands worldwide, was invented here.',
      'Pitch Lake is one of the biggest natural pools of sticky tar on Earth.',
      'Leatherback turtles, the biggest turtles alive, lay eggs on its beaches.',
    ],
    longAgo: {
      history: [
        'People have lived on Trinidad for about 7,000 years, longer than almost any Caribbean island.',
        'They paddled here from South America, which is just a short sail away.',
      ],
      dino: {
        name: 'Mosasaurus',
        note: 'A giant sea reptile that hunted in the ancient waters off these shores.',
      },
    },
    famousFor: 'Carnival and steelpan drums',
  },
  US: {
    iso2: 'US',
    name: 'United States',
    capital: 'Washington, D.C.',
    languages: ['English', 'Spanish'],
    dish: {
      name: 'Hamburger',
      blurb: 'A juicy beef patty in a soft bun with cheese and pickles. Cookouts with burgers are a summer tradition!',
    },
    funFacts: [
      'The Grand Canyon is so huge it can be seen from space.',
      'American astronauts were the first people to walk on the Moon.',
      'Yellowstone was the first national park in the world.',
    ],
    longAgo: {
      history: [
        'Long ago, Native Americans built giant earth mounds bigger than football fields.',
        'Ice age hunters here tracked woolly mammoths across the plains.',
      ],
      dino: {
        name: 'Tyrannosaurus rex',
        note: 'The king of the dinosaurs, with banana-sized teeth, found in the American West.',
      },
    },
    famousFor: 'the Statue of Liberty, Hollywood, and the Grand Canyon',
  },
};
