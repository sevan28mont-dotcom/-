export interface PaletteColor {
  hex: string;
  name: string;
}

export interface ColorGroup {
  groupName: string;
  colors: PaletteColor[];
}

export const COLOR_GROUPS: ColorGroup[] = [
  {
    groupName: '🌸 柔和马卡龙甜品系 (24色)',
    colors: [
      { name: '樱花粉', hex: '#fecdd3' },
      { name: '水蜜桃', hex: '#fde68a' },
      { name: '草莓奶昔', hex: '#fda4af' },
      { name: '薄荷冰沙', hex: '#a7f3d0' },
      { name: '天空淡蓝', hex: '#bae6fd' },
      { name: '香草风铃', hex: '#ddd6fe' },
      { name: '风信子紫', hex: '#f5d0fe' },
      { name: '牛油果黄', hex: '#e9d5ff' },
      { name: '海盐柠檬', hex: '#fef08a' },
      { name: '抹茶青绿', hex: '#bbf7d0' },
      { name: '冰霜青蓝', hex: '#c7d2fe' },
      { name: '杏仁奶油', hex: '#fed7aa' },
      { name: '蔷薇微粉', hex: '#fbcfe8' },
      { name: '冰晶天蓝', hex: '#e0f2fe' },
      { name: '晨露浅绿', hex: '#dcfce7' },
      { name: '薰衣草甜', hex: '#fae8ff' },
      { name: '蜜橘奶油', hex: '#ffedd5' },
      { name: '香芋布丁', hex: '#f3e8ff' },
      { name: '青提乳酸', hex: '#ecfdf5' },
      { name: '晴空云朵', hex: '#f0f9ff' },
      { name: '阳光泡泡', hex: '#fef9c3' },
      { name: '晚霞云彩', hex: '#ffe4e6' },
      { name: '粉海珊瑚', hex: '#fecdd3' },
      { name: '灰紫奶咖', hex: '#f5f5f4' },
    ],
  },
  {
    groupName: '🎨 莫兰迪雅致低饱和系 (24色)',
    colors: [
      { name: '莫兰迪红', hex: '#e11d48' },
      { name: '灰调粉红', hex: '#fb7185' },
      { name: '陶土红棕', hex: '#f43f5e' },
      { name: '暮光橙红', hex: '#f97316' },
      { name: '暖柿黄棕', hex: '#d97706' },
      { name: '芥末落叶', hex: '#eab308' },
      { name: '橄榄复古绿', hex: '#84cc16' },
      { name: '鼠尾草绿', hex: '#22c55e' },
      { name: '苔藓松针绿', hex: '#10b981' },
      { name: '暗雨林青', hex: '#14b8a6' },
      { name: '孔雀绿蓝', hex: '#06b6d4' },
      { name: '低调灰海蓝', hex: '#0284c7' },
      { name: '克莱因蓝', hex: '#3b82f6' },
      { name: '静谧靛蓝', hex: '#6366f1' },
      { name: '迷雾灰紫', hex: '#8b5cf6' },
      { name: '丁香薰紫', hex: '#a855f7' },
      { name: '野蔷薇紫', hex: '#d946ef' },
      { name: '复古洋红', hex: '#ec4899' },
      { name: '冷调铁灰', hex: '#64748b' },
      { name: '暖卡其棕', hex: '#78716c' },
      { name: '温暖砖橙', hex: '#c2410c' },
      { name: '深邃橄榄', hex: '#4d7c0f' },
      { name: '高雅黛蓝', hex: '#1d4ed8' },
      { name: '皇家紫罗兰', hex: '#6d28d9' },
    ],
  },
  {
    groupName: '🌈 高饱和璀璨彩虹系 (24色)',
    colors: [
      { name: '鲜活火红', hex: '#ff0000' },
      { name: '西瓜红', hex: '#ff3366' },
      { name: '极光霓虹粉', hex: '#ff007f' },
      { name: '洋红荧光', hex: '#ff00ff' },
      { name: '电光深紫', hex: '#7f00ff' },
      { name: '星空蓝紫', hex: '#4b0082' },
      { name: '纯亮天蓝', hex: '#007fff' },
      { name: '宝石深蓝', hex: '#0000ff' },
      { name: '青绿荧光', hex: '#00ffff' },
      { name: '孔雀绿蓝', hex: '#00bfff' },
      { name: '热带海洋绿', hex: '#00fa9a' },
      { name: '翡翠鲜绿', hex: '#00ff00' },
      { name: '柠檬荧绿', hex: '#7fff00' },
      { name: '亮金黄', hex: '#ffff00' },
      { name: '璀璨金', hex: '#ffd700' },
      { name: '活力暖橙', hex: '#ff7f00' },
      { name: '珊瑚橙', hex: '#ff5722' },
      { name: '朱红赤', hex: '#e64a19' },
      { name: '紫红玫瑰', hex: '#c2185b' },
      { name: '深紫红', hex: '#880e4f' },
      { name: '墨绿金', hex: '#004d40' },
      { name: '极光暗绿', hex: '#0f5132' },
      { name: '海蓝波浪', hex: '#0369a1' },
      { name: '紫水晶', hex: '#6b21a8' },
    ],
  },
  {
    groupName: '🌲 森林大地与经典和色系 (24色)',
    colors: [
      { name: '木褐棕', hex: '#854d0e' },
      { name: '焦糖拿铁', hex: '#a16207' },
      { name: '枫叶落棕', hex: '#b45309' },
      { name: '赭石黄', hex: '#ca8a04' },
      { name: '若竹色', hex: '#15803d' },
      { name: '松柏绿', hex: '#166534' },
      { name: '深幽墨绿', hex: '#14532d' },
      { name: '常磐绿', hex: '#047857' },
      { name: '浅葱蓝', hex: '#0f766e' },
      { name: '琉璃色', hex: '#0e7490' },
      { name: '绀青海', hex: '#1e40af' },
      { name: '群青蓝', hex: '#1e3a8a' },
      { name: '藤紫', hex: '#5b21b6' },
      { name: '桔梗紫', hex: '#4c1d95' },
      { name: '古代紫', hex: '#701a75' },
      { name: '韩红花', hex: '#9f1239' },
      { name: '胭脂红', hex: '#be123c' },
      { name: '琥珀赤', hex: '#9a3412' },
      { name: '竹炭灰', hex: '#334155' },
      { name: '石墨黑灰', hex: '#1e293b' },
      { name: '沙丘黄', hex: '#eab308' },
      { name: '茶褐', hex: '#713f12' },
      { name: '暖灰', hex: '#57534e' },
      { name: '高雅玄黑', hex: '#0f172a' },
    ],
  },
  {
    groupName: '💎 极奢宝石夜调系 (24色)',
    colors: [
      { name: '红宝石', hex: '#9f1239' },
      { name: '蓝宝石', hex: '#1e3a8a' },
      { name: '祖母绿', hex: '#064e3b' },
      { name: '紫水晶', hex: '#581c87' },
      { name: '粉钻', hex: '#831843' },
      { name: '猫眼绿', hex: '#065f46' },
      { name: '坦桑石紫', hex: '#3730a3' },
      { name: '黄玉金', hex: '#854d0e' },
      { name: '黑曜石', hex: '#18181b' },
      { name: '金绿玉', hex: '#3f6212' },
      { name: '干红葡萄酒', hex: '#881337' },
      { name: '午夜天蓝', hex: '#172554' },
      { name: '孔雀绿石', hex: '#115e59' },
      { name: '紫罗兰黑', hex: '#4a044e' },
      { name: '深海玄蓝', hex: '#082f49' },
      { name: '赤金', hex: '#78350f' },
      { name: '黑钻灰', hex: '#27272a' },
      { name: '深绯红', hex: '#4c0519' },
      { name: '暗海青', hex: '#042f2e' },
      { name: '深幽青', hex: '#022c22' },
      { name: '沉木黑', hex: '#1c1917' },
      { name: '复古灰黑', hex: '#09090b' },
      { name: '极光蓝黑', hex: '#030712' },
      { name: '暮光黑紫', hex: '#2e1065' },
    ],
  },
];

const TAILWIND_MAP: Record<string, string> = {
  rose: '#f43f5e',
  sky: '#0284c7',
  indigo: '#4f46e5',
  emerald: '#059669',
  amber: '#d97706',
  purple: '#9333ea',
  teal: '#0d9488',
  fuchsia: '#c026d3',
};

export function getHexColor(colorKey: string): string {
  if (!colorKey) return '#f43f5e';
  if (TAILWIND_MAP[colorKey]) return TAILWIND_MAP[colorKey];
  if (colorKey.startsWith('#')) return colorKey;
  return '#' + colorKey;
}

export function parseColorToStyle(colorKey: string) {
  const hex = getHexColor(colorKey);
  return {
    hex,
    style: {
      backgroundColor: `${hex}22`,
      borderLeft: `3px solid ${hex}`,
      color: '#1e293b',
    },
  };
}
