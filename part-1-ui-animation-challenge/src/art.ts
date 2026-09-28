// Original, resolution-independent illustrations. No image requests or font downloads.
const ink = '#263c86';
export type FruitKind = 'pear' | 'orange' | 'strawberry' | 'lemon';
export interface Friend {
  kind: FruitKind;
  name: string;
  note: string;
  color: string;
}
const shapes: Record<FruitKind, string> = {
  pear: `<path d="M113 62C76 60 85 105 59 135C10 193 45 245 121 245C199 245 220 190 175 137C149 108 151 61 113 62Z" fill="#c6da78"/><path d="M117 65Q108 42 126 28" fill="none"/><path d="M122 48Q161 19 169 49Q143 68 122 48" fill="#6a9c67"/>`,
  orange: `<path d="M199 156C202 211 169 246 117 242C65 244 29 205 34 154C38 104 75 79 119 82C166 77 196 112 199 156Z" fill="#ffad50"/><path d="M120 82Q115 60 129 47" fill="none"/><path d="M124 66Q159 29 180 60Q157 84 124 66Z" fill="#749966"/><path d="M52 144Q56 122 72 115" fill="none" stroke="#ffcf83" stroke-width="8"/>`,
  strawberry: `<path d="M44 104Q118 66 194 103C215 129 165 231 119 245C75 226 23 138 44 104Z" fill="#ed827e"/><path d="M116 96L69 74L88 109L47 111L87 130L118 108L146 131L185 106L145 105L164 71Z" fill="#729a69"/><g stroke="#ffe4b1" stroke-width="4"><path d="M69 144l3 6M101 172l2 6M152 150l-2 6M143 195l-3 5M105 216l2 5M62 175l3 5M177 131l-2 5"/></g>`,
  lemon: `<path d="M35 173C33 142 60 96 104 88Q160 71 190 115L207 125L198 147C194 195 158 231 114 230Q70 239 48 199L31 193Z" fill="#efda69"/><path d="M159 91Q176 46 200 63Q209 91 159 91Z" fill="#7ca17b"/><path d="M63 152Q71 128 91 119" fill="none" stroke="#fff1a1" stroke-width="8"/>`
};
export function fruit(kind: FruitKind, variant = 0): string {
  return `<svg viewBox="0 0 240 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g stroke="${ink}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><g class="limbs"><path d="M86 228L76 266L53 273Q42 283 73 281L86 277L101 234M144 232L153 266L178 271Q190 281 157 280L146 276L133 234" fill="#f6f3e9"/><path d="M48 156Q17 165 23 192M189 153Q220 166 211 190" fill="none"/></g>${shapes[kind]}<g class="face">${variant % 2 ? '<path d="M87 153q8-9 15 0M134 153q8-9 15 0" fill="none"/>' : '<ellipse cx="94" cy="152" rx="4" ry="7" fill="#263c86" stroke="none"/><ellipse cx="141" cy="152" rx="4" ry="7" fill="#263c86" stroke="none"/>'}<path d="M104 174Q119 190 134 173" fill="none"/><ellipse cx="78" cy="170" rx="10" ry="5" fill="#e99181" stroke="none" opacity=".6"/><ellipse cx="156" cy="170" rx="10" ry="5" fill="#e99181" stroke="none" opacity=".6"/></g></g></svg>`;
}
export const friends: Friend[] = [
  { kind: 'pear', name: 'Perry', note: 'A little offbeat', color: '#dce4b1' },
  {
    kind: 'orange',
    name: 'Sunny',
    note: 'Your daily bright side',
    color: '#f4bb91'
  },
  {
    kind: 'strawberry',
    name: 'Berry',
    note: 'Sweet, with a wild side',
    color: '#e9bccb'
  },
  { kind: 'lemon', name: 'Lou', note: 'A fresh perspective', color: '#e9dc98' }
];
