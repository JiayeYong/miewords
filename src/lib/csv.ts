export type CsvWord = { english: string; chinese: string }

function parseRows(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (character === ',' && !quoted) {
      row.push(field)
      field = ''
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      row.push(field)
      if (row.some((value) => value.trim())) rows.push(row)
      row = []
      field = ''
    } else {
      field += character
    }
  }

  row.push(field)
  if (row.some((value) => value.trim())) rows.push(row)
  if (quoted) throw new Error('CSV 中有未闭合的引号。')
  return rows
}

export function parseWordCsv(text: string) {
  const rows = parseRows(text.replace(/^\uFEFF/, ''))
  if (!rows.length) throw new Error('CSV 文件是空的。')

  const headers = rows[0].map((header) => header.trim().toLocaleLowerCase())
  const englishIndex = headers.findIndex((header) => header === 'english' || header === '英文')
  const chineseIndex = headers.findIndex((header) => header === 'chinese' || header === '中文')
  if (englishIndex < 0 || chineseIndex < 0) {
    throw new Error('找不到 English、Chinese 或英文、中文表头。')
  }

  const words: CsvWord[] = []
  const seen = new Set<string>()
  let skipped = 0
  for (const row of rows.slice(1)) {
    const english = row[englishIndex]?.trim() ?? ''
    const chinese = row[chineseIndex]?.trim() ?? ''
    const key = english.toLocaleLowerCase()
    if (!english || !chinese || seen.has(key)) {
      skipped += 1
      continue
    }
    seen.add(key)
    words.push({ english, chinese })
  }
  return { words, skipped }
}
