import type { Country } from '../types';

export const SOUTH_AMERICA: Record<string, Country> = {
  AR: {
    iso2: 'AR',
    name: 'Argentina',
    capital: 'Buenos Aires',
    languages: ['Spanish'],
    dish: {
      name: 'Empanadas',
      blurb: 'Little baked pastry pockets stuffed with beef, chicken, or cheese. Every family folds the edges its own special way!',
    },
    funFacts: [
      'People here invented the tango, a dramatic dance now loved all over the world.',
      'Thousands of penguins waddle along Argentina\'s chilly southern coast every year.',
      'Aconcagua is the tallest mountain in all of the Americas.',
    ],
    longAgo: {
      history: [
        'Long ago, cave artists left hundreds of colorful handprints on a rock wall in Patagonia.',
        'Gauchos, the cowboys of Argentina, rode horses across the wide grassy pampas.',
      ],
      dino: {
        name: 'Argentinosaurus',
        note: 'A plant-eater as long as four buses — maybe the biggest land animal that ever lived!',
      },
    },
    famousFor: 'tango dancing, soccer stars, and giant dinosaurs',
  },
  BO: {
    iso2: 'BO',
    name: 'Bolivia',
    capital: 'Sucre',
    languages: ['Spanish', 'Quechua', 'Aymara'],
    dish: {
      name: 'Salteñas',
      blurb: 'Juicy baked pastries filled with meat, potatoes, and a little sweet sauce. Bolivians love them as a morning snack!',
    },
    funFacts: [
      'The Salar de Uyuni is the biggest salt flat on Earth, and after rain it turns into a giant mirror.',
      'In the city of La Paz, people ride cable cars through the sky instead of buses.',
      'Lake Titicaca, high in the mountains, is one of the highest big lakes in the world.',
    ],
    longAgo: {
      history: [
        'Long before the Inca, people built a great stone city called Tiwanaku near Lake Titicaca.',
      ],
      dino: {
        name: 'Titanosaur',
        note: 'Near Sucre, a huge rock wall is covered with thousands of real dinosaur footprints, many left by giant titanosaurs.',
      },
    },
    famousFor: 'the giant mirror-like salt flat of Uyuni',
  },
  BR: {
    iso2: 'BR',
    name: 'Brazil',
    capital: 'Brasília',
    languages: ['Portuguese'],
    dish: {
      name: 'Brigadeiro',
      blurb: 'Chocolate fudge balls rolled in sprinkles, made for every birthday party in Brazil. Sweet, sticky, and gone in one bite!',
    },
    funFacts: [
      'The Amazon rainforest, the biggest on Earth, is home to pink river dolphins and sleepy sloths.',
      'Brazil has won soccer\'s World Cup five times, more than any other country.',
      'At Carnival, dancers in sparkling costumes parade to drum music all night long.',
    ],
    longAgo: {
      history: [
        'People have lived by the Amazon for thousands of years, painting animals on rock walls.',
        'They knew secret river paths through the world\'s biggest forest.',
      ],
      dino: {
        name: 'Austroposeidon',
        note: 'Brazil\'s biggest dinosaur — a gentle long-necked giant about as long as two buses.',
      },
    },
    famousFor: 'the Amazon rainforest, Carnival, and soccer',
  },
  CL: {
    iso2: 'CL',
    name: 'Chile',
    capital: 'Santiago',
    languages: ['Spanish'],
    dish: {
      name: 'Completo',
      blurb: 'A hot dog piled sky-high with mashed avocado, tomato, and mayo. Bigger and messier than a regular hot dog!',
    },
    funFacts: [
      'Chile is so long and skinny that it has deserts in the north and glaciers in the south.',
      'The Atacama Desert is the driest place on Earth, perfect for giant telescopes that watch the stars.',
      'Condors with wings wider than a bed soar over the Andes mountains.',
    ],
    longAgo: {
      history: [
        'Long ago on Easter Island, people carved almost 900 giant stone statues called moai.',
        'They moved these stone giants across the island without trucks or cranes.',
      ],
      dino: {
        name: 'Chilesaurus',
        note: 'A puzzling dinosaur found in Chile — it looked like a meat-eater but only munched plants!',
      },
    },
    famousFor: 'the Atacama Desert and the moai statues of Easter Island',
  },
  CO: {
    iso2: 'CO',
    name: 'Colombia',
    capital: 'Bogotá',
    languages: ['Spanish'],
    dish: {
      name: 'Arepas',
      blurb: 'Warm, round corn cakes grilled until golden, then stuffed or topped with melty cheese. Kids eat them for breakfast!',
    },
    funFacts: [
      'Colombia has more kinds of birds than any other country in the world.',
      'The Caño Cristales river blooms red, yellow, and green — people call it the river of five colors.',
      'Colombia grows some of the most famous coffee on Earth, on green mountain farms.',
    ],
    longAgo: {
      history: [
        'Long ago, goldsmiths here made shining treasures, sparking stories of a golden city called El Dorado.',
      ],
      dino: {
        name: 'Titanoboa',
        note: 'A real giant snake longer than a school bus that slithered through steamy ancient swamps in Colombia.',
      },
    },
    famousFor: 'coffee, emeralds, and a rainbow-colored river',
  },
  EC: {
    iso2: 'EC',
    name: 'Ecuador',
    capital: 'Quito',
    languages: ['Spanish', 'Quechua'],
    dish: {
      name: 'Llapingachos',
      blurb: 'Golden potato patties with gooey cheese inside, fried until crispy. They are often served with peanut sauce!',
    },
    funFacts: [
      'Ecuador is named after the equator — you can stand with one foot in each half of the world.',
      'Giant tortoises on the Galápagos Islands can live for more than 100 years.',
      'The top of Chimborazo volcano is the farthest point on Earth from the planet\'s center.',
    ],
    longAgo: {
      history: [
        'Long ago, the Inca built stone roads through Ecuador\'s mountains that travelers still walk today.',
      ],
      dino: {
        name: 'Eremotherium',
        note: 'A giant ground sloth as big as an elephant that lumbered through Ecuador long ago.',
      },
    },
    famousFor: 'the equator and Galápagos giant tortoises',
  },
  GY: {
    iso2: 'GY',
    name: 'Guyana',
    capital: 'Georgetown',
    languages: ['English', 'Guyanese Creole'],
    dish: {
      name: 'Pepperpot',
      blurb: 'A slow-cooked meat stew with a sweet, dark sauce, scooped up with thick bread. Families share it on special mornings!',
    },
    funFacts: [
      'Kaieteur Falls plunges in one giant drop about four times taller than Niagara Falls.',
      'Giant water lilies here grow leaves so big a small child could sit on one.',
      'Most of Guyana is covered in thick green rainforest full of jaguars and giant otters.',
    ],
    longAgo: {
      history: [
        'The name Guyana means "land of many waters", and people have paddled its rivers for thousands of years.',
      ],
      dino: {
        name: 'Purussaurus',
        note: 'A giant crocodile cousin longer than a bus that lurked in the ancient rivers of this part of the world.',
      },
    },
    famousFor: 'mighty waterfalls and giant rainforest animals',
  },
  PY: {
    iso2: 'PY',
    name: 'Paraguay',
    capital: 'Asunción',
    languages: ['Guarani', 'Spanish'],
    dish: {
      name: 'Chipa',
      blurb: 'Chewy cheese bread baked in little rings. People sell warm baskets of it on buses and street corners!',
    },
    funFacts: [
      'Friends in Paraguay share tereré, a cold tea sipped through a metal straw.',
      'The Itaipu Dam on the Paraná River is one of the biggest power plants on the planet.',
      'Paraguayan artists weave ñandutí, a lace so fine it looks like a spiderweb.',
    ],
    longAgo: {
      history: [
        'The Guarani people have lived here for thousands of years, and their words still name the rivers and towns.',
      ],
      dino: {
        name: 'Giganotosaurus',
        note: 'One of the biggest meat-eating dinosaurs ever stomped through this part of South America.',
      },
    },
    famousFor: 'sharing tereré tea and spiderweb-fine lace',
  },
  PE: {
    iso2: 'PE',
    name: 'Peru',
    capital: 'Lima',
    languages: ['Spanish', 'Quechua', 'Aymara'],
    dish: {
      name: 'Lomo saltado',
      blurb: 'Sizzling beef stir-fried with tomatoes and onions, served with rice AND french fries. Two favorites on one plate!',
    },
    funFacts: [
      'Potatoes were first grown in Peru, and farmers there grow about 4,000 kinds today.',
      'Fluffy llamas and alpacas graze high in Peru\'s Andes mountains.',
      'Rainbow Mountain has natural stripes of red, gold, and turquoise rock.',
    ],
    longAgo: {
      history: [
        'The Inca built Machu Picchu, a stone city hidden high among the clouds.',
        'In the desert, ancient artists drew pictures so huge they are best seen from the sky.',
      ],
      dino: {
        name: 'Perucetus',
        note: 'An ancient whale found in Peru that may have been one of the heaviest animals ever to live.',
      },
    },
    famousFor: 'Machu Picchu, llamas, and thousands of potatoes',
  },
  SR: {
    iso2: 'SR',
    name: 'Suriname',
    capital: 'Paramaribo',
    languages: ['Dutch', 'Sranan Tongo'],
    dish: {
      name: 'Pom',
      blurb: 'A warm baked dish of chicken and a mashed root called pomtajer, with a tangy orange flavor. The star of birthday parties!',
    },
    funFacts: [
      'Suriname is the smallest country in South America.',
      'Almost all of Suriname is covered by rainforest — more than nearly any other country.',
      'Giant leatherback sea turtles crawl onto Suriname\'s beaches to lay their eggs.',
    ],
    longAgo: {
      history: [
        'For thousands of years, people have traveled Suriname\'s wide rivers by canoe, using them like watery roads.',
      ],
      dino: {
        name: 'Titanosaur',
        note: 'Giant long-necked titanosaurs, some of the biggest animals ever to walk, lived in this part of the world.',
      },
    },
    famousFor: 'deep green rainforests and nesting sea turtles',
  },
  UY: {
    iso2: 'UY',
    name: 'Uruguay',
    capital: 'Montevideo',
    languages: ['Spanish'],
    dish: {
      name: 'Chivito',
      blurb: 'A towering steak sandwich stacked with cheese, egg, and more. Uruguay\'s favorite mega-sandwich!',
    },
    funFacts: [
      'Cows outnumber people in Uruguay by about three to one.',
      'Uruguay hosted the very first soccer World Cup in 1930 — and won it.',
      'Many people carry a warm drink called mate everywhere and sip it through a metal straw.',
    ],
    longAgo: {
      history: [
        'Gauchos, the cowboy heroes of Uruguay, herded cattle across endless grassy plains.',
      ],
      dino: {
        name: 'Josephoartigasia',
        note: 'The biggest rodent of all time lived here — a giant guinea-pig cousin about the size of a bull!',
      },
    },
    famousFor: 'beaches, soccer, and sipping mate',
  },
  VE: {
    iso2: 'VE',
    name: 'Venezuela',
    capital: 'Caracas',
    languages: ['Spanish'],
    dish: {
      name: 'Cachapas',
      blurb: 'Sweet corn pancakes folded over soft, melty cheese. Crispy edges and a gooey middle — a roadside favorite!',
    },
    funFacts: [
      'Angel Falls is the tallest waterfall in the world — the water tumbles almost a kilometer.',
      'Flat-topped mountains called tepuis rise out of the jungle like stone islands in the sky.',
      'Over Lake Maracaibo, lightning lights up the night sky more often than almost anywhere on Earth.',
    ],
    longAgo: {
      history: [
        'Long ago, sailors saw houses on stilts above the water here and named the land "little Venice".',
      ],
      dino: {
        name: 'Laquintasaura',
        note: 'A small, speedy plant-eating dinosaur discovered in Venezuela that lived in little herds.',
      },
    },
    famousFor: 'Angel Falls, the world\'s tallest waterfall',
  },
};
