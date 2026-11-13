/**
 * Single source of truth for the seeded catalog. It is consumed by
 * `prisma/seed-products.ts` (database rows) and by
 * `scripts/generate-covers.mjs` (local SVG cover art).
 *
 * Every game has exactly two purchasable editions: digital and physical.
 */

/** Product whose cover file is intentionally absent to exercise image fallbacks. */
export const MISSING_IMAGE_PRODUCT_SLUG = 'skybound-legion-digital';

/** Physical edition intentionally seeded with no stock to exercise sold-out states. */
export const OUT_OF_STOCK_PRODUCT_SLUG = 'hollow-tide-physical';

export const categories = [
  {
    slug: 'action-adventure',
    name: 'Action & Adventure',
    description:
      'Cinematic combat, open worlds and stories that never stop moving.',
    games: [
      {
        slug: 'ashen-crown',
        title: 'Ashen Crown',
        platform: 'PC',
        description:
          'A fallen kingdom, a cursed blade and one last heir fighting to reclaim a throne that was never meant to be theirs.',
        digital: { price: '49.99', stock: 32 },
        physical: { price: '59.99', stock: 18 },
      },
      {
        slug: 'neon-drifter',
        title: 'Neon Drifter',
        platform: 'PlayStation 5',
        description:
          'Street racing through a rain-soaked megacity where every shortcut has a price and every rival remembers your name.',
        digital: { price: '39.99', stock: 24 },
        physical: { price: '49.99', stock: 12 },
      },
      {
        slug: 'hollow-tide',
        title: 'Hollow Tide',
        platform: 'Xbox Series X',
        description:
          'A coastal town disappears beneath the waves, and the only diver who can explain it has been missing for a decade.',
        digital: { price: '44.99', stock: 20 },
        physical: { price: '54.99', stock: 0 },
      },
      {
        slug: 'skybound-legion',
        title: 'Skybound Legion',
        platform: 'PC',
        description:
          'Lead a ragtag airship crew across floating ruins in a war for the last stretch of open sky.',
        digital: { price: '29.99', stock: 40 },
        physical: { price: '39.99', stock: 15 },
      },
    ],
  },
  {
    slug: 'rpg',
    name: 'RPG',
    description:
      'Deep character progression, difficult choices and worlds worth getting lost in.',
    games: [
      {
        slug: 'emberwake',
        title: 'Emberwake',
        platform: 'PC',
        description:
          'Wake the dormant fire god or bury it forever in a realm of ash, old oaths and roads that remember every step.',
        digital: { price: '54.99', stock: 28 },
        physical: { price: '64.99', stock: 10 },
      },
      {
        slug: 'moonsong-saga',
        title: 'Moonsong Saga',
        platform: 'Nintendo Switch',
        description:
          'A bard discovers a song that rewrites reality, and three rival kingdoms will do anything to hear the final verse.',
        digital: { price: '49.99', stock: 22 },
        physical: { price: '59.99', stock: 14 },
      },
      {
        slug: 'the-last-runekeeper',
        title: 'The Last Runekeeper',
        platform: 'PC',
        description:
          'Every rune you forge changes the dungeon, the monsters and the hero who has to carry it back into the dark.',
        digital: { price: '59.99', stock: 16 },
        physical: { price: '69.99', stock: 8 },
      },
      {
        slug: 'starfall-covenant',
        title: 'Starfall Covenant',
        platform: 'PlayStation 5',
        description:
          'A pact with a dying star grants forbidden magic, a kingdom-shaking secret and a deadline nobody can outrun.',
        digital: { price: '49.99', stock: 30 },
        physical: { price: '59.99', stock: 11 },
      },
    ],
  },
  {
    slug: 'shooters',
    name: 'Shooters',
    description:
      'Precision gunplay, competitive arenas and squad tactics under pressure.',
    games: [
      {
        slug: 'iron-vector',
        title: 'Iron Vector',
        platform: 'PC',
        description:
          'A vertical shooter about mercenaries, orbital elevators and one contract that should never have been accepted.',
        digital: { price: '39.99', stock: 35 },
        physical: { price: '49.99', stock: 20 },
      },
      {
        slug: 'zero-protocol',
        title: 'Zero Protocol',
        platform: 'Xbox Series X',
        description:
          'A rogue AI has locked down the moon base. You have six hours, no backup and one increasingly unreliable rifle.',
        digital: { price: '44.99', stock: 26 },
        physical: { price: '54.99', stock: 13 },
      },
      {
        slug: 'riftstrike',
        title: 'Riftstrike',
        platform: 'PlayStation 5',
        description:
          'Squad-based combat across collapsing dimensions where cover is temporary and the map is never on your side.',
        digital: { price: '49.99', stock: 19 },
        physical: { price: '59.99', stock: 9 },
      },
      {
        slug: 'blacksite-echo',
        title: 'Blacksite Echo',
        platform: 'PC',
        description:
          'A tactical extraction shooter set in a listening post that does not appear on any map, official or otherwise.',
        digital: { price: '29.99', stock: 33 },
        physical: { price: '39.99', stock: 17 },
      },
    ],
  },
  {
    slug: 'indie-strategy',
    name: 'Indie & Strategy',
    description:
      'Inventive small-team games and tactical challenges that reward patience.',
    games: [
      {
        slug: 'paper-kingdoms',
        title: 'Paper Kingdoms',
        platform: 'Nintendo Switch',
        description:
          'Fold armies, rebuild castles and outwit a rival monarch one sheet of paper at a time.',
        digital: { price: '19.99', stock: 40 },
        physical: { price: '29.99', stock: 22 },
      },
      {
        slug: 'orbit-weavers',
        title: 'Orbit Weavers',
        platform: 'PC',
        description:
          'Build a space station from salvage while three factions negotiate with trade routes and railguns.',
        digital: { price: '24.99', stock: 31 },
        physical: { price: '34.99', stock: 16 },
      },
      {
        slug: 'tiny-frontiers',
        title: 'Tiny Frontiers',
        platform: 'PC',
        description:
          'A pocket-sized colony builder where every square meter is a hard decision and every winter is a warning.',
        digital: { price: '14.99', stock: 38 },
        physical: { price: '24.99', stock: 25 },
      },
      {
        slug: 'signal-and-stone',
        title: 'Signal & Stone',
        platform: 'Nintendo Switch',
        description:
          'Decode a lost language and raise a city from the ruins before the signal fades for good.',
        digital: { price: '21.99', stock: 27 },
        physical: { price: '31.99', stock: 12 },
      },
    ],
  },
];
