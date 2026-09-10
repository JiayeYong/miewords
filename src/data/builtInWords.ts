import gre3000 from './gre3000.json'

export type BuiltInWord = {
  id: string
  english: string
  chinese: string
  lists: Array<'GRE' | 'TOEFL'>
}

const toeflWords: BuiltInWord[] = [
  { id: 'toefl-adaptation', english: 'adaptation', chinese: '适应；改编', lists: ['TOEFL'] },
  { id: 'toefl-allocate', english: 'allocate', chinese: '分配；划拨', lists: ['TOEFL'] },
  { id: 'toefl-anomaly', english: 'anomaly', chinese: '异常事物；反常现象', lists: ['TOEFL'] },
  { id: 'toefl-aquatic', english: 'aquatic', chinese: '水生的；水中的', lists: ['TOEFL'] },
  { id: 'toefl-arid', english: 'arid', chinese: '干旱的；贫瘠的', lists: ['TOEFL'] },
  { id: 'toefl-artifact', english: 'artifact', chinese: '人工制品；文物', lists: ['TOEFL'] },
  { id: 'toefl-biodiversity', english: 'biodiversity', chinese: '生物多样性', lists: ['TOEFL'] },
  { id: 'toefl-coherent', english: 'coherent', chinese: '连贯的；一致的', lists: ['TOEFL'] },
  { id: 'toefl-deteriorate', english: 'deteriorate', chinese: '恶化；退化', lists: ['TOEFL'] },
  { id: 'toefl-disperse', english: 'disperse', chinese: '分散；散布', lists: ['TOEFL'] },
  { id: 'toefl-ecosystem', english: 'ecosystem', chinese: '生态系统', lists: ['TOEFL'] },
  { id: 'toefl-empirical', english: 'empirical', chinese: '以观察或实验为依据的', lists: ['TOEFL'] },
  { id: 'toefl-erosion', english: 'erosion', chinese: '侵蚀；腐蚀', lists: ['TOEFL'] },
  { id: 'toefl-indigenous', english: 'indigenous', chinese: '本土的；土生土长的', lists: ['TOEFL'] },
  { id: 'toefl-inhibit', english: 'inhibit', chinese: '抑制；阻碍', lists: ['TOEFL'] },
  { id: 'toefl-migration', english: 'migration', chinese: '迁徙；移居', lists: ['TOEFL'] },
  { id: 'toefl-nutrient', english: 'nutrient', chinese: '营养物；营养素', lists: ['TOEFL'] },
  { id: 'toefl-pragmatic', english: 'pragmatic', chinese: '务实的；实用主义的', lists: ['TOEFL'] },
  { id: 'toefl-precipitation', english: 'precipitation', chinese: '降水；沉淀', lists: ['TOEFL'] },
  { id: 'toefl-sediment', english: 'sediment', chinese: '沉积物', lists: ['TOEFL'] },
  { id: 'toefl-sustain', english: 'sustain', chinese: '维持；支撑', lists: ['TOEFL'] },
  { id: 'toefl-ubiquitous', english: 'ubiquitous', chinese: '无处不在的', lists: ['TOEFL'] },
]

export const builtInWords: BuiltInWord[] = [
  ...(gre3000 as BuiltInWord[]),
  ...toeflWords,
]

export const wordsForList = (list: 'GRE' | 'TOEFL') =>
  builtInWords.filter((word) => word.lists.includes(list))
