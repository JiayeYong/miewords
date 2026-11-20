import gre3000 from './gre3000.json'
import kmf1400 from './kmf1400.json'
import toefl from './toefl.json'

export type BuiltInList = 'GRE' | 'TOEFL' | 'KMF'

export type BuiltInWord = {
  id: string
  english: string
  chinese: string
  lists: BuiltInList[]
}

export const builtInWords: BuiltInWord[] = [
  ...(gre3000 as BuiltInWord[]),
  ...(toefl as BuiltInWord[]),
  ...(kmf1400 as BuiltInWord[]),
]

export const wordsForList = (list: BuiltInList) =>
  builtInWords.filter((word) => word.lists.includes(list))
