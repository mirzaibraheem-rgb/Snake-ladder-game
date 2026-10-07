/**
 * Original cartoon kid characters, drawn as SVG in code (no image files, no third party art).
 *
 * To add a character: copy one entry in CHARACTERS, give it a new unique id and name,
 * and change the colors and styles. See DEVELOPER_GUIDE.md.
 */

export type HairStyle = 'short' | 'curly' | 'braid' | 'ponytail' | 'bob' | 'hijab';
export type TopStyle = 'kameez' | 'shirt' | 'hoodie' | 'frock';
export type BottomStyle = 'shalwar' | 'pants';
export type Accessory = 'glasses' | 'cap' | 'topi' | 'dupatta' | 'headband';

export interface CharacterDef {
  id: string;
  name: string; // display name on the setup screen
  nameUr: string;
  skin: string;
  hair: HairStyle;
  hairColor: string;
  hijabColor?: string;
  top: string;
  topTrim: string;
  topStyle: TopStyle;
  bottom: string;
  bottomStyle: BottomStyle;
  shoes: string;
  accessories: Accessory[];
  accent: string; // color used for the player card and highlights
}

export const CHARACTERS: CharacterDef[] = [
  { id: 'ayesha', name: 'Ayesha', nameUr: 'عائشہ', skin: '#E9B98F', hair: 'hijab', hairColor: '#2B1B12', hijabColor: '#F06BAA', top: '#7B2FBE', topTrim: '#FFC94A', topStyle: 'kameez', bottom: '#F4E9FF', bottomStyle: 'shalwar', shoes: '#B5179E', accessories: [], accent: '#F06BAA' },
  { id: 'ali', name: 'Ali', nameUr: 'علی', skin: '#D49A6A', hair: 'short', hairColor: '#1E1410', top: '#2E9E5B', topTrim: '#BFF2D3', topStyle: 'kameez', bottom: '#FFFFFF', bottomStyle: 'shalwar', shoes: '#6B3E1F', accessories: [], accent: '#2E9E5B' },
  { id: 'zara', name: 'Zara', nameUr: 'زارا', skin: '#F2C9A5', hair: 'braid', hairColor: '#2A1810', top: '#FF8A1F', topTrim: '#FFE3A3', topStyle: 'kameez', bottom: '#FFF3E0', bottomStyle: 'shalwar', shoes: '#C2410C', accessories: ['dupatta'], accent: '#FF8A1F' },
  { id: 'hamza', name: 'Hamza', nameUr: 'حمزہ', skin: '#B97A4A', hair: 'short', hairColor: '#120C08', top: '#2F7BEA', topTrim: '#BFD8FF', topStyle: 'shirt', bottom: '#33415C', bottomStyle: 'pants', shoes: '#F25F5C', accessories: ['glasses', 'cap'], accent: '#2F7BEA' },
  { id: 'fatima', name: 'Fatima', nameUr: 'فاطمہ', skin: '#8D5A3B', hair: 'hijab', hairColor: '#120C08', hijabColor: '#14B8A6', top: '#0E7490', topTrim: '#A5F3FC', topStyle: 'kameez', bottom: '#E0F7F5', bottomStyle: 'shalwar', shoes: '#134E4A', accessories: ['glasses'], accent: '#14B8A6' },
  { id: 'bilal', name: 'Bilal', nameUr: 'بلال', skin: '#9C6440', hair: 'curly', hairColor: '#1A120D', top: '#E63946', topTrim: '#FFD6D9', topStyle: 'hoodie', bottom: '#3D405B', bottomStyle: 'pants', shoes: '#FFFFFF', accessories: [], accent: '#E63946' },
  { id: 'maryam', name: 'Maryam', nameUr: 'مریم', skin: '#E3A97F', hair: 'ponytail', hairColor: '#3B2414', top: '#8BC34A', topTrim: '#F1FFD6', topStyle: 'frock', bottom: '#6B7280', bottomStyle: 'pants', shoes: '#7C3AED', accessories: ['headband'], accent: '#7CB342' },
  { id: 'omar', name: 'Omar', nameUr: 'عمر', skin: '#C68A5C', hair: 'short', hairColor: '#20140C', top: '#F5F0E6', topTrim: '#D4A017', topStyle: 'kameez', bottom: '#F5F0E6', bottomStyle: 'shalwar', shoes: '#7A4A1F', accessories: ['topi'], accent: '#D4A017' },
];

export function characterById(id: string): CharacterDef {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}

function darken(hex: string, amt = 0.18): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 - amt))));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function hairBack(c: CharacterDef): string {
  const hc = c.hairColor;
  switch (c.hair) {
    case 'braid':
      return `<g fill="${hc}"><ellipse cx="86" cy="66" rx="7" ry="8"/><ellipse cx="88" cy="79" rx="6.5" ry="7.5"/><ellipse cx="89" cy="92" rx="6" ry="7"/><ellipse cx="89" cy="104" rx="5" ry="6"/><circle cx="89" cy="111" r="3.5" fill="${c.topTrim}"/></g>`;
    case 'ponytail':
      return `<path d="M84 34 C104 34 106 60 96 78 C94 64 90 52 82 46Z" fill="${hc}"/>`;
    case 'bob':
      return `<path d="M30 52 C30 20 90 20 90 52 L92 70 C84 74 36 74 28 70Z" fill="${hc}"/>`;
    case 'hijab':
      return `<path d="M26 54 C26 14 94 14 94 54 C94 72 90 84 98 98 L22 98 C30 84 26 72 26 54Z" fill="${c.hijabColor}"/>`;
    default:
      return '';
  }
}

function hairFront(c: CharacterDef): string {
  const hc = c.hairColor;
  switch (c.hair) {
    case 'short':
      return `<path d="M31 50 C29 22 52 16 64 18 C80 19 92 30 89 50 C86 40 80 34 70 33 C64 38 52 38 44 34 C38 38 33 43 31 50Z" fill="${hc}"/>`;
    case 'curly':
      return `<g fill="${hc}"><circle cx="36" cy="40" r="8"/><circle cx="44" cy="29" r="9"/><circle cx="56" cy="24" r="9"/><circle cx="68" cy="24" r="9"/><circle cx="79" cy="30" r="9"/><circle cx="85" cy="41" r="8"/><circle cx="50" cy="34" r="6"/><circle cx="70" cy="34" r="6"/></g>`;
    case 'braid':
    case 'ponytail':
    case 'bob':
      return `<path d="M31 52 C28 22 50 17 62 18 C80 18 93 30 89 52 C84 38 74 33 66 33 C58 40 42 40 36 38 C33 42 32 47 31 52Z" fill="${hc}"/>`;
    case 'hijab': {
      const d = darken(c.hijabColor ?? '#888', 0.15);
      return `<path d="M33 54 C33 24 87 24 87 54 C87 44 80 30 60 30 C40 30 33 44 33 54Z" fill="${d}" opacity="0.55"/><path d="M31 56 C30 26 90 26 89 56 C88 36 76 28 60 28 C44 28 32 36 31 56Z" fill="${c.hijabColor}"/>`;
    }
  }
}

function accessories(c: CharacterDef): { back: string; front: string; body: string } {
  let back = '';
  let front = '';
  let body = '';
  for (const a of c.accessories) {
    if (a === 'glasses')
      front += `<g fill="none" stroke="#1F2937" stroke-width="2.4"><circle cx="49" cy="52" r="7.5"/><circle cx="71" cy="52" r="7.5"/><path d="M56.5 52 h7"/></g>`;
    if (a === 'cap')
      front += `<path d="M30 42 C32 18 88 18 90 42 C80 34 40 34 30 42Z" fill="#F59E0B"/><path d="M82 36 C94 34 104 38 104 42 C96 42 88 42 84 42Z" fill="#D97706"/><circle cx="60" cy="21" r="3" fill="#D97706"/>`;
    if (a === 'topi')
      front += `<path d="M36 34 L36 18 C50 12 70 12 84 18 L84 34 C76 30 70 30 66 34 C62 26 58 26 54 34 C50 30 44 30 36 34Z" fill="#B91C1C"/><g fill="#FDE047"><circle cx="44" cy="22" r="2.2"/><circle cx="60" cy="18" r="2.2"/><circle cx="76" cy="22" r="2.2"/></g><path d="M38 28 h44" stroke="#FDE047" stroke-width="1.6" stroke-dasharray="3 3"/>`;
    if (a === 'headband') front += `<path d="M32 40 C40 26 80 26 88 40" fill="none" stroke="#EC4899" stroke-width="5" stroke-linecap="round"/><circle cx="80" cy="31" r="4.5" fill="#F9A8D4"/>`;
    if (a === 'dupatta') body += `<path d="M40 84 C52 100 70 106 84 120 L88 112 C74 100 58 92 48 82Z" fill="${c.topTrim}" opacity="0.95"/>`;
  }
  return { back, front, body };
}

function torso(c: CharacterDef): string {
  const trim = c.topTrim;
  switch (c.topStyle) {
    case 'kameez':
      return `<path d="M42 80 C50 78 70 78 78 80 L84 122 C70 126 50 126 36 122Z" fill="${c.top}"/><path d="M54 80 L60 92 L66 80" fill="none" stroke="${trim}" stroke-width="3" stroke-linecap="round"/><path d="M38 118 C52 122 68 122 82 118" fill="none" stroke="${trim}" stroke-width="3"/>`;
    case 'frock':
      return `<path d="M44 80 C52 78 68 78 76 80 L88 116 C72 122 48 122 32 116Z" fill="${c.top}"/><path d="M34 112 C50 118 70 118 86 112" fill="none" stroke="${trim}" stroke-width="3.5" stroke-dasharray="1 5" stroke-linecap="round"/><circle cx="60" cy="88" r="3" fill="${trim}"/>`;
    case 'hoodie':
      return `<path d="M40 80 C50 76 70 76 80 80 L80 112 C66 116 54 116 40 112Z" fill="${c.top}"/><path d="M48 80 C52 88 68 88 72 80" fill="none" stroke="${trim}" stroke-width="3"/><rect x="50" y="98" width="20" height="9" rx="4" fill="${darken(c.top, 0.15)}"/>`;
    default:
      return `<path d="M41 80 C50 78 70 78 79 80 L78 112 C66 115 54 115 42 112Z" fill="${c.top}"/><path d="M54 80 L60 86 L66 80" fill="none" stroke="${trim}" stroke-width="3"/><circle cx="68" cy="96" r="4" fill="${trim}"/>`;
  }
}

function legs(c: CharacterDef): string {
  const b = c.bottom;
  const outline = darken(b, 0.12);
  const leg =
    c.bottomStyle === 'shalwar'
      ? `<path d="M44 112 L58 112 L57 134 L47 134 C43 126 43 118 44 112Z" fill="${b}" stroke="${outline}" stroke-width="1"/><path d="M62 112 L76 112 C77 118 77 126 73 134 L63 134Z" fill="${b}" stroke="${outline}" stroke-width="1"/>`
      : `<rect x="46" y="108" width="12" height="27" rx="4" fill="${b}"/><rect x="62" y="108" width="12" height="27" rx="4" fill="${b}"/>`;
  return `<g class="legs">${leg}<ellipse class="shoe-l" cx="51" cy="138" rx="9" ry="5" fill="${c.shoes}"/><ellipse class="shoe-r" cx="69" cy="138" rx="9" ry="5" fill="${c.shoes}"/></g>`;
}

function arm(c: CharacterDef, side: 'l' | 'r'): string {
  const x = side === 'l' ? 36 : 76;
  const handX = side === 'l' ? 39 : 81;
  const sleeve = c.topStyle === 'shirt' ? c.top : c.top;
  return `<g class="arm arm-${side}"><rect x="${x}" y="82" width="9" height="28" rx="4.5" fill="${sleeve}"/><circle cx="${handX + (side === 'l' ? 1.5 : -1.5)}" cy="112" r="5" fill="${c.skin}"/></g>`;
}

/**
 * Full SVG for a character. The wrapper element gets a state class
 * (st-idle, st-hop, st-celebrate, st-sad, st-climb) and CSS does the rest.
 */
export function characterSVG(c: CharacterDef, opts: { avatar?: boolean; title?: string } = {}): string {
  const viewBox = opts.avatar ? '22 8 76 76' : '0 0 120 150';
  const acc = accessories(c);
  const skinShade = darken(c.skin, 0.12);
  return `<svg class="char-svg" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${opts.title ?? c.name}">
  ${opts.avatar ? '' : '<ellipse class="shadow" cx="60" cy="143" rx="27" ry="5" fill="rgba(30,0,60,.28)"/>'}
  <g class="body-g">
    ${legs(c)}
    ${arm(c, 'l')}${arm(c, 'r')}
    ${torso(c)}
    ${acc.body}
    <g class="head-g">
      ${hairBack(c)}
      <rect x="54" y="70" width="12" height="12" rx="3" fill="${skinShade}"/>
      ${c.hair === 'hijab' ? '' : `<circle cx="32" cy="54" r="5" fill="${c.skin}"/><circle cx="88" cy="54" r="5" fill="${c.skin}"/>`}
      <circle cx="60" cy="52" r="${c.hair === 'hijab' ? 25 : 28}" fill="${c.skin}"/>
      ${hairFront(c)}
      <g class="brows" stroke="${c.hairColor}" stroke-width="2.2" stroke-linecap="round"><path class="brow-l" d="M44 42 q5 -3 10 0"/><path class="brow-r" d="M66 42 q5 -3 10 0"/></g>
      <g class="eyes"><ellipse cx="49" cy="52" rx="3.6" ry="4.6" fill="#1B1030"/><ellipse cx="71" cy="52" rx="3.6" ry="4.6" fill="#1B1030"/><circle cx="50.4" cy="50.4" r="1.4" fill="#fff"/><circle cx="72.4" cy="50.4" r="1.4" fill="#fff"/></g>
      <g class="cheeks" fill="#FF7A9C" opacity=".45"><ellipse cx="42" cy="61" rx="5" ry="3"/><ellipse cx="78" cy="61" rx="5" ry="3"/></g>
      <path class="mouth mouth-happy" d="M52 63 Q60 71 68 63" fill="none" stroke="#5A1A1A" stroke-width="2.6" stroke-linecap="round"/>
      <path class="mouth mouth-open" d="M51 62 Q60 76 69 62 Z" fill="#7A1F2B"/>
      <path class="mouth mouth-sad" d="M53 69 Q60 62 67 69" fill="none" stroke="#5A1A1A" stroke-width="2.6" stroke-linecap="round"/>
      <path class="tear" d="M45 58 q-3 6 0 8 q3 -2 0 -8Z" fill="#60A5FA"/>
      ${acc.front}
    </g>
  </g>
</svg>`;
}
