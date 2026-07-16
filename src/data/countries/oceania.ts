import type { Country } from '../types';

export const OCEANIA: Record<string, Country> = {
  AU: {
    iso2: 'AU',
    name: 'Australia',
    capital: 'Canberra',
    languages: ['English'],
    dish: {
      name: 'Meat pie',
      blurb: 'A little hot pie filled with minced beef and gravy, eaten right out of your hand. Aussies love them at football games!',
    },
    funFacts: [
      'Australia has more kangaroos than people.',
      'The Great Barrier Reef is the biggest living structure on Earth — you can see it from space.',
      'The platypus looks like a duck-beaver mash-up and is one of the only mammals that lays eggs.',
    ],
    longAgo: {
      history: [
        'Aboriginal Australians have lived here for more than 50,000 years — the world\'s oldest living culture.',
        'Their rock paintings and Dreamtime stories are still shared today.',
      ],
      dino: {
        name: 'Muttaburrasaurus',
        note: 'A big plant-eating dinosaur with a bump on its nose, discovered in Australia.',
      },
    },
    famousFor: 'kangaroos, koalas, and the Great Barrier Reef',
  },
  FJ: {
    iso2: 'FJ',
    name: 'Fiji',
    capital: 'Suva',
    languages: ['Fijian', 'English', 'Fiji Hindi'],
    dish: {
      name: 'Lovo',
      blurb: 'A feast of chicken, fish, and veggies wrapped in leaves and cooked underground on hot stones. Dinner from an earth oven!',
    },
    funFacts: [
      'Fiji is made up of more than 300 islands.',
      'Divers call Fiji the soft coral capital of the world.',
      'When Fiji won its first Olympic gold medal in rugby, the whole country got a holiday to celebrate.',
    ],
    longAgo: {
      history: [
        'About 3,000 years ago, brave voyagers crossed the open ocean in canoes to make these islands home.',
      ],
      dino: {
        name: 'Mosasaur',
        note: 'Giant swimming reptiles called mosasaurs once hunted in the seas of this part of the world.',
      },
    },
    famousFor: 'coral reefs, rugby, and friendly "Bula!" hellos',
  },
  KI: {
    iso2: 'KI',
    name: 'Kiribati',
    capital: 'Tarawa',
    languages: ['Gilbertese', 'English'],
    dish: {
      name: 'Coconut fish',
      blurb: 'Fresh tuna mixed with creamy coconut and a squeeze of lime. On islands surrounded by ocean, fish is always on the menu!',
    },
    funFacts: [
      'Kiribati is the only country whose islands sit in all four halves of the world — north, south, east, and west.',
      'Kiribati is one of the very first countries on Earth to welcome each new day.',
      'Its islands are tiny, but they are sprinkled across a truly enormous stretch of ocean.',
    ],
    longAgo: {
      history: [
        'Long ago, master navigators sailed between these islands guided only by stars, waves, and seabirds.',
      ],
      dino: {
        name: 'Megalodon',
        note: 'The biggest shark of all time, with teeth as big as your hand, swam in the seas of this part of the world.',
      },
    },
    famousFor: 'islands scattered across a giant stretch of ocean',
  },
  MH: {
    iso2: 'MH',
    name: 'Marshall Islands',
    capital: 'Majuro',
    languages: ['Marshallese', 'English'],
    dish: {
      name: 'Chukuchuk',
      blurb: 'Sticky rice balls rolled in fresh shredded coconut. A sweet island snack you can make in minutes!',
    },
    funFacts: [
      'The Marshall Islands are made of more than 1,000 little islands grouped into ring-shaped coral atolls.',
      'Sailors here invented stick charts — maps made of sticks and shells that show how ocean waves move.',
      'There is far more sea than land here, so the ocean is like the country\'s big blue backyard.',
    ],
    longAgo: {
      history: [
        'For 2,000 years, Marshallese navigators read the ocean\'s waves to sail canoes between faraway atolls.',
      ],
      dino: {
        name: 'Mosasaur',
        note: 'Giant swimming reptiles called mosasaurs once cruised the seas of this part of the world.',
      },
    },
    famousFor: 'ring-shaped coral atolls and wave-reading sailors',
  },
  FM: {
    iso2: 'FM',
    name: 'Micronesia',
    capital: 'Palikir',
    languages: ['English', 'Chuukese', 'Pohnpeian'],
    dish: {
      name: 'Breadfruit',
      blurb: 'A big green fruit that gets roasted or fried and tastes like fresh bread. One tree can feed a whole family!',
    },
    funFacts: [
      'Micronesia is made up of about 600 islands spread across the western Pacific.',
      'On the island of Yap, people once used giant round stone coins bigger than a kid.',
      'Giant manta rays with wings wider than a car glide through the lagoons.',
    ],
    longAgo: {
      history: [
        'Long ago, people built Nan Madol, a mysterious city of stone resting on almost 100 tiny islands.',
      ],
      dino: {
        name: 'Megalodon',
        note: 'The biggest shark that ever lived swam in the deep seas of this part of the world.',
      },
    },
    famousFor: 'giant stone money and beautiful lagoons',
  },
  NR: {
    iso2: 'NR',
    name: 'Nauru',
    capital: 'Yaren',
    languages: ['Nauruan', 'English'],
    dish: {
      name: 'Fried fish and rice',
      blurb: 'Crispy reef fish straight from the sea, served with rice. Island dinners don\'t get fresher than this!',
    },
    funFacts: [
      'Nauru is the smallest island country in the world.',
      'Nauruans traditionally catch and train frigatebirds, seabirds with huge black wings.',
      'Weightlifting is one of Nauru\'s favorite sports, and its athletes have won big international medals.',
    ],
    longAgo: {
      history: [
        'Sailors long ago called Nauru "Pleasant Island" because it looked so green and friendly from their ships.',
      ],
      dino: {
        name: 'Ancient sea turtles',
        note: 'Long before this island rose from the sea, giant sea turtles paddled through the waters of this part of the world.',
      },
    },
    famousFor: 'being a tiny island nation of strong weightlifters',
  },
  NZ: {
    iso2: 'NZ',
    name: 'New Zealand',
    capital: 'Wellington',
    languages: ['English', 'Māori'],
    dish: {
      name: 'Pavlova',
      blurb: 'A meringue cake that is crunchy outside and marshmallowy inside, topped with cream and kiwifruit. A party favorite!',
    },
    funFacts: [
      'Sheep outnumber people in New Zealand by about five to one.',
      'The kiwi is a fuzzy bird that cannot fly and only comes out at night.',
      'Modern bungee jumping got its start in New Zealand.',
    ],
    longAgo: {
      history: [
        'Māori voyagers crossed the vast Pacific in great canoes, steering by stars, and named this land Aotearoa.',
      ],
      dino: {
        name: 'Giant moa',
        note: 'A flightless bird taller than a door that was hunted by Haast\'s eagle, the biggest eagle ever known.',
      },
    },
    famousFor: 'kiwi birds, sheep, and hobbit movie scenery',
  },
  PW: {
    iso2: 'PW',
    name: 'Palau',
    capital: 'Ngerulmud',
    languages: ['Palauan', 'English'],
    dish: {
      name: 'Taro and grilled fish',
      blurb: 'Fresh fish from the reef served with taro, a root veggie islanders have grown for ages. Simple, fresh, and tasty!',
    },
    funFacts: [
      'In Jellyfish Lake, you can swim with millions of golden jellyfish that don\'t sting people.',
      'Palau created one of the world\'s first shark sanctuaries to keep its sharks safe.',
      'The Rock Islands look like green mushrooms popping out of turquoise water.',
    ],
    longAgo: {
      history: [
        'People have lived on Palau for over 3,000 years, carving their legends onto wooden storyboards.',
      ],
      dino: {
        name: 'Mosasaur',
        note: 'Giant swimming reptiles called mosasaurs once hunted in the seas of this part of the world.',
      },
    },
    famousFor: 'swimming with millions of friendly jellyfish',
  },
  PG: {
    iso2: 'PG',
    name: 'Papua New Guinea',
    capital: 'Port Moresby',
    languages: ['Tok Pisin', 'English', 'Hiri Motu'],
    dish: {
      name: 'Mumu',
      blurb: 'A feast of pork, sweet potato, and greens slow-cooked in a pit of hot stones. The whole village shares it!',
    },
    funFacts: [
      'More than 800 different languages are spoken here — more than anywhere else on Earth.',
      'Birds-of-paradise with dazzling feathers perform dances in the treetops.',
      'Tree kangaroos — kangaroos that climb trees — live in its mountain forests.',
    ],
    longAgo: {
      history: [
        'People here were some of the first farmers on Earth, growing gardens in mountain valleys about 9,000 years ago.',
      ],
      dino: {
        name: 'Mosasaur',
        note: 'Giant swimming reptiles called mosasaurs once prowled the seas of this part of the world.',
      },
    },
    famousFor: 'birds-of-paradise and hundreds of languages',
  },
  WS: {
    iso2: 'WS',
    name: 'Samoa',
    capital: 'Apia',
    languages: ['Samoan', 'English'],
    dish: {
      name: 'Panipopo',
      blurb: 'Soft, sweet buns baked in rich coconut cream sauce. Warm, sticky, and impossible to eat just one!',
    },
    funFacts: [
      'The To Sua Ocean Trench is a giant natural swimming hole you climb into by ladder.',
      'In 2011, Samoa skipped a whole day — it jumped straight from Thursday to Saturday to change time zones.',
      'Samoans love kirikiti, a colorful island version of cricket that whole villages play together.',
    ],
    longAgo: {
      history: [
        'People have lived in Samoa for about 3,000 years, and some call it the cradle of Polynesia.',
      ],
      dino: {
        name: 'Megalodon',
        note: 'The biggest shark of all time swam in the warm seas of this part of the world.',
      },
    },
    famousFor: 'island feasts and a giant natural swimming hole',
  },
  SB: {
    iso2: 'SB',
    name: 'Solomon Islands',
    capital: 'Honiara',
    languages: ['Solomon Islands Pijin', 'English'],
    dish: {
      name: 'Cassava pudding',
      blurb: 'A sweet, sticky pudding made from cassava and coconut, wrapped in leaves and baked. A treat at island feasts!',
    },
    funFacts: [
      'The Solomon Islands are made up of nearly 1,000 islands.',
      'Coconut crabs, the biggest land crabs in the world, can crack open coconuts with their claws.',
      'People across these islands speak more than 60 different local languages.',
    ],
    longAgo: {
      history: [
        'Long ago, islanders crossed the sea in canoes and used strings of polished shells as money — some still do today.',
      ],
      dino: {
        name: 'Mosasaur',
        note: 'Giant swimming reptiles called mosasaurs once hunted in the seas of this part of the world.',
      },
    },
    famousFor: 'shell money and giant coconut crabs',
  },
  TO: {
    iso2: 'TO',
    name: 'Tonga',
    capital: "Nuku'alofa",
    languages: ['Tongan', 'English'],
    dish: {
      name: 'Lū pulu',
      blurb: 'Meat and coconut cream wrapped in taro leaves and baked until soft and savory. A Sunday feast favorite!',
    },
    funFacts: [
      'Tonga is the only kingdom in the Pacific — it still has a king.',
      'Humpback whales swim to Tonga\'s warm waters every year to raise their babies.',
      'Tonga is nicknamed the Friendly Islands because visitors long ago got such a warm welcome.',
    ],
    longAgo: {
      history: [
        'Tongan kings once sailed enormous double-hulled canoes to visit islands far across the sea.',
      ],
      dino: {
        name: 'Mosasaur',
        note: 'Giant swimming reptiles called mosasaurs once cruised the seas of this part of the world.',
      },
    },
    famousFor: 'humpback whales and its friendly island kingdom',
  },
  TV: {
    iso2: 'TV',
    name: 'Tuvalu',
    capital: 'Funafuti',
    languages: ['Tuvaluan', 'English'],
    dish: {
      name: 'Pulaka',
      blurb: 'A root vegetable grown in special island pits, baked and served with coconut cream. Tuvalu\'s homegrown favorite!',
    },
    funFacts: [
      'Tuvalu is one of the smallest countries in the whole world.',
      'Tuvalu earns money from its internet address ".tv", which television websites love to use.',
      'When no planes are due, kids play games right on the airport runway.',
    ],
    longAgo: {
      history: [
        'About 3,000 years ago, voyagers found these nine little islands by reading the stars and the waves.',
      ],
      dino: {
        name: 'Megalodon',
        note: 'The biggest shark that ever lived swam in the seas of this part of the world.',
      },
    },
    famousFor: 'nine tiny islands and the ".tv" internet address',
  },
  VU: {
    iso2: 'VU',
    name: 'Vanuatu',
    capital: 'Port Vila',
    languages: ['Bislama', 'English', 'French'],
    dish: {
      name: 'Laplap',
      blurb: 'Grated root veggies and coconut cream baked in banana leaves in an earth oven. Vanuatu\'s favorite dish!',
    },
    funFacts: [
      'On Pentecost Island, land divers leap from tall wooden towers with only vines tied to their ankles.',
      'Mount Yasur is one of the easiest volcanoes on Earth to visit — it glows and rumbles almost every day.',
      'Sand drawing is a special Vanuatu art — one finger draws a whole story in a single flowing line.',
    ],
    longAgo: {
      history: [
        'Voyagers arrived here in canoes about 3,000 years ago, leaving behind beautiful patterned pottery.',
      ],
      dino: {
        name: 'Mosasaur',
        note: 'Giant swimming reptiles called mosasaurs once hunted in the seas of this part of the world.',
      },
    },
    famousFor: 'land diving and glowing volcanoes',
  },
};
