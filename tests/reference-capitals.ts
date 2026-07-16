/**
 * Independent capital-city reference used by the data validation suite to
 * mechanically cross-check authored country content. If content and this
 * table disagree, one of them is wrong — investigate before changing either.
 */
export const REFERENCE_CAPITALS: Record<string, string> = {
  // Africa
  DZ: 'Algiers', AO: 'Luanda', BJ: 'Porto-Novo', BW: 'Gaborone', BF: 'Ouagadougou',
  BI: 'Gitega', CV: 'Praia', CM: 'Yaoundé', CF: 'Bangui', TD: "N'Djamena",
  KM: 'Moroni', CG: 'Brazzaville', CD: 'Kinshasa', CI: 'Yamoussoukro', DJ: 'Djibouti City',
  EG: 'Cairo', GQ: 'Malabo', ER: 'Asmara', SZ: 'Mbabane', ET: 'Addis Ababa',
  GA: 'Libreville', GM: 'Banjul', GH: 'Accra', GN: 'Conakry', GW: 'Bissau',
  KE: 'Nairobi', LS: 'Maseru', LR: 'Monrovia', LY: 'Tripoli', MG: 'Antananarivo',
  MW: 'Lilongwe', ML: 'Bamako', MR: 'Nouakchott', MU: 'Port Louis', MA: 'Rabat',
  MZ: 'Maputo', NA: 'Windhoek', NE: 'Niamey', NG: 'Abuja', RW: 'Kigali',
  ST: 'São Tomé', SN: 'Dakar', SC: 'Victoria', SL: 'Freetown', SO: 'Mogadishu',
  ZA: 'Pretoria', SS: 'Juba', SD: 'Khartoum', TZ: 'Dodoma', TG: 'Lomé',
  TN: 'Tunis', UG: 'Kampala', ZM: 'Lusaka', ZW: 'Harare',
  // Asia
  AF: 'Kabul', AM: 'Yerevan', AZ: 'Baku', BH: 'Manama', BD: 'Dhaka',
  BT: 'Thimphu', BN: 'Bandar Seri Begawan', KH: 'Phnom Penh', CN: 'Beijing',
  CY: 'Nicosia', GE: 'Tbilisi', IN: 'New Delhi', ID: 'Jakarta', IR: 'Tehran',
  IQ: 'Baghdad', IL: 'Jerusalem', JP: 'Tokyo', JO: 'Amman', KZ: 'Astana',
  KW: 'Kuwait City', KG: 'Bishkek', LA: 'Vientiane', LB: 'Beirut', MY: 'Kuala Lumpur',
  MV: 'Malé', MN: 'Ulaanbaatar', MM: 'Naypyidaw', NP: 'Kathmandu', KP: 'Pyongyang',
  OM: 'Muscat', PK: 'Islamabad', PS: 'Ramallah', PH: 'Manila', QA: 'Doha',
  SA: 'Riyadh', SG: 'Singapore', KR: 'Seoul', LK: 'Sri Jayawardenepura Kotte',
  SY: 'Damascus', TW: 'Taipei', TJ: 'Dushanbe', TH: 'Bangkok', TL: 'Dili',
  TR: 'Ankara', TM: 'Ashgabat', AE: 'Abu Dhabi', UZ: 'Tashkent', VN: 'Hanoi',
  YE: 'Sanaa',
  // Europe
  AL: 'Tirana', AD: 'Andorra la Vella', AT: 'Vienna', BY: 'Minsk', BE: 'Brussels',
  BA: 'Sarajevo', BG: 'Sofia', HR: 'Zagreb', CZ: 'Prague', DK: 'Copenhagen',
  EE: 'Tallinn', FI: 'Helsinki', FR: 'Paris', DE: 'Berlin', GR: 'Athens',
  HU: 'Budapest', IS: 'Reykjavík', IE: 'Dublin', IT: 'Rome', XK: 'Pristina',
  LV: 'Riga', LI: 'Vaduz', LT: 'Vilnius', LU: 'Luxembourg City', MT: 'Valletta',
  MD: 'Chișinău', MC: 'Monaco', ME: 'Podgorica', NL: 'Amsterdam', MK: 'Skopje',
  NO: 'Oslo', PL: 'Warsaw', PT: 'Lisbon', RO: 'Bucharest', RU: 'Moscow',
  SM: 'San Marino', RS: 'Belgrade', SK: 'Bratislava', SI: 'Ljubljana', ES: 'Madrid',
  SE: 'Stockholm', CH: 'Bern', UA: 'Kyiv', GB: 'London', VA: 'Vatican City',
  // North America
  AG: "Saint John's", BS: 'Nassau', BB: 'Bridgetown', BZ: 'Belmopan', CA: 'Ottawa',
  CR: 'San José', CU: 'Havana', DM: 'Roseau', DO: 'Santo Domingo', SV: 'San Salvador',
  GD: "Saint George's", GT: 'Guatemala City', HT: 'Port-au-Prince', HN: 'Tegucigalpa',
  JM: 'Kingston', MX: 'Mexico City', NI: 'Managua', PA: 'Panama City', KN: 'Basseterre',
  LC: 'Castries', VC: 'Kingstown', TT: 'Port of Spain', US: 'Washington, D.C.',
  // South America
  AR: 'Buenos Aires', BO: 'Sucre', BR: 'Brasília', CL: 'Santiago', CO: 'Bogotá',
  EC: 'Quito', GY: 'Georgetown', PY: 'Asunción', PE: 'Lima', SR: 'Paramaribo',
  UY: 'Montevideo', VE: 'Caracas',
  // Oceania
  AU: 'Canberra', FJ: 'Suva', KI: 'Tarawa', MH: 'Majuro', FM: 'Palikir',
  NR: 'Yaren', NZ: 'Wellington', PW: 'Ngerulmud', PG: 'Port Moresby', WS: 'Apia',
  SB: 'Honiara', TO: "Nuku'alofa", TV: 'Funafuti', VU: 'Port Vila',
};
