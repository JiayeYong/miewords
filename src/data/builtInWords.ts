import gre3000 from './gre3000.json'
import toefl from './toefl.json'

export type BuiltInWord = {
  id: string
  english: string
  chinese: string
  lists: Array<'GRE' | 'TOEFL'>
}

export const builtInWords: BuiltInWord[] = [
  ...(gre3000 as BuiltInWord[]),
  ...(toefl as BuiltInWord[]),
]

export const wordsForList = (list: 'GRE' | 'TOEFL') =>
  builtInWords.filter((word) => word.lists.includes(list))
