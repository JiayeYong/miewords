export type BuiltInWord = {
  id: string
  english: string
  chinese: string
  lists: Array<'GRE' | 'TOEFL'>
}

export const builtInWords: BuiltInWord[] = [
  { id: 'abate', english: 'abate', chinese: '减轻；减弱', lists: ['GRE'] },
  { id: 'aberrant', english: 'aberrant', chinese: '异常的；偏离常规的', lists: ['GRE'] },
  { id: 'abhor', english: 'abhor', chinese: '憎恶；厌恶', lists: ['GRE'] },
  { id: 'alacrity', english: 'alacrity', chinese: '欣然；敏捷', lists: ['GRE'] },
  { id: 'ambivalent', english: 'ambivalent', chinese: '矛盾的；犹豫不决的', lists: ['GRE'] },
  { id: 'anomaly', english: 'anomaly', chinese: '异常事物；反常现象', lists: ['GRE', 'TOEFL'] },
  { id: 'assuage', english: 'assuage', chinese: '缓和；减轻', lists: ['GRE'] },
  { id: 'capricious', english: 'capricious', chinese: '反复无常的', lists: ['GRE'] },
  { id: 'cogent', english: 'cogent', chinese: '有说服力的', lists: ['GRE'] },
  { id: 'conundrum', english: 'conundrum', chinese: '难题；谜题', lists: ['GRE'] },
  { id: 'deleterious', english: 'deleterious', chinese: '有害的', lists: ['GRE'] },
  { id: 'enervate', english: 'enervate', chinese: '使衰弱；削弱', lists: ['GRE'] },
  { id: 'equivocal', english: 'equivocal', chinese: '模棱两可的', lists: ['GRE'] },
  { id: 'fastidious', english: 'fastidious', chinese: '挑剔的；一丝不苟的', lists: ['GRE'] },
  { id: 'laconic', english: 'laconic', chinese: '言简意赅的', lists: ['GRE'] },
  { id: 'obdurate', english: 'obdurate', chinese: '顽固的；执拗的', lists: ['GRE'] },
  { id: 'pragmatic', english: 'pragmatic', chinese: '务实的；实用主义的', lists: ['GRE', 'TOEFL'] },
  { id: 'prodigal', english: 'prodigal', chinese: '挥霍的；浪费的', lists: ['GRE'] },
  { id: 'reticent', english: 'reticent', chinese: '沉默寡言的；有所保留的', lists: ['GRE'] },
  { id: 'sagacious', english: 'sagacious', chinese: '睿智的；有远见的', lists: ['GRE'] },
  { id: 'ubiquitous', english: 'ubiquitous', chinese: '无处不在的', lists: ['GRE', 'TOEFL'] },
  { id: 'adaptation', english: 'adaptation', chinese: '适应；改编', lists: ['TOEFL'] },
  { id: 'allocate', english: 'allocate', chinese: '分配；划拨', lists: ['TOEFL'] },
  { id: 'aquatic', english: 'aquatic', chinese: '水生的；水中的', lists: ['TOEFL'] },
  { id: 'arid', english: 'arid', chinese: '干旱的；贫瘠的', lists: ['TOEFL'] },
  { id: 'artifact', english: 'artifact', chinese: '人工制品；文物', lists: ['TOEFL'] },
  { id: 'biodiversity', english: 'biodiversity', chinese: '生物多样性', lists: ['TOEFL'] },
  { id: 'coherent', english: 'coherent', chinese: '连贯的；一致的', lists: ['TOEFL'] },
  { id: 'deteriorate', english: 'deteriorate', chinese: '恶化；退化', lists: ['TOEFL'] },
  { id: 'disperse', english: 'disperse', chinese: '分散；散布', lists: ['TOEFL'] },
  { id: 'ecosystem', english: 'ecosystem', chinese: '生态系统', lists: ['TOEFL'] },
  { id: 'empirical', english: 'empirical', chinese: '以观察或实验为依据的', lists: ['TOEFL'] },
  { id: 'erosion', english: 'erosion', chinese: '侵蚀；腐蚀', lists: ['TOEFL'] },
  { id: 'indigenous', english: 'indigenous', chinese: '本土的；土生土长的', lists: ['TOEFL'] },
  { id: 'inhibit', english: 'inhibit', chinese: '抑制；阻碍', lists: ['TOEFL'] },
  { id: 'migration', english: 'migration', chinese: '迁徙；移居', lists: ['TOEFL'] },
  { id: 'nutrient', english: 'nutrient', chinese: '营养物；营养素', lists: ['TOEFL'] },
  { id: 'precipitation', english: 'precipitation', chinese: '降水；沉淀', lists: ['TOEFL'] },
  { id: 'sediment', english: 'sediment', chinese: '沉积物', lists: ['TOEFL'] },
  { id: 'sustain', english: 'sustain', chinese: '维持；支撑', lists: ['TOEFL'] },
]

export const wordsForList = (list: 'GRE' | 'TOEFL') =>
  builtInWords.filter((word) => word.lists.includes(list))
