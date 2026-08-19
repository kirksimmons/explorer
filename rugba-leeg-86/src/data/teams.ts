export interface TeamData {
  name: string;
  short: string;
  jersey: string;
  trim: string;
  skin: string;
  wide: boolean; // beefy sprite width
  shades: boolean; // sunglasses pixels
  players: string[];
}

export const TEAMS: [TeamData, TeamData] = [
  {
    name: 'BARGO BEEFCAKES',
    short: 'BEEF',
    jersey: '#7a1f2b',
    trim: '#e8b93e',
    skin: '#e8a87c',
    wide: true,
    shades: false,
    players: [
      'BIG REG BRISKET',
      'SIR LOIN',
      'MERV THE SWERVE',
      'DONK DONKERSON',
      'GRAVY DAVEY',
      'BAZZA BICEP',
      'TINY TOM COLOSSUS',
    ],
  },
  {
    name: 'GUILDFORD GRIFTERS',
    short: 'GRIF',
    jersey: '#2ea35a',
    trim: '#d4af37',
    skin: '#d9976b',
    wide: false,
    shades: true,
    players: [
      'SLICK NICK',
      'FINGERS MALONE',
      'THREE-CARD MONTY',
      'LOOPHOLE LOU',
      'DODGY ROGER',
      'THE ACCOUNTANT',
      'SWINDLER SID',
    ],
  },
];
