export type HotspotDef = {
  key: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
  inspectText: string;
};

export const streetHotspots: HotspotDef[] = [
  {
    key: 'girl',
    label: 'Девушка',
    x: 390,
    y: 385,
    width: 70,
    height: 130,
    color: 0x000000,
    inspectText: '',
  },
  {
    key: 'chest',
    label: 'Сундук',
    x: 490,
    y: 420,
    width: 90,
    height: 55,
    color: 0x000000,
    inspectText: '',
  },
  {
    key: 'tool',
    label: '',
    x: 900,
    y: 440,
    width: 22,
    height: 22,
    color: 0x000000,
    inspectText: '',
  },
  {
    key: 'lantern',
    label: 'Фонарь',
    x: 178,
    y: 252,
    width: 30,
    height: 50,
    color: 0x000000,
    inspectText: 'Тусклый свет.',
  },
  {
    key: 'crates',
    label: 'Ящики',
    x: 930,
    y: 380,
    width: 100,
    height: 70,
    color: 0x000000,
    inspectText: 'Старые ящики.',
  },
  {
    key: 'door',
    label: 'Дверь лавки',
    x: 860,
    y: 330,
    width: 55,
    height: 100,
    color: 0x000000,
    inspectText: 'Уже закрыто.',
  },
];
