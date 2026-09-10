import { ChangeEvent, FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import { BuiltInWord, wordsForList } from './data/builtInWords'
import {
  AppSettings,
  DEFAULT_LIST_ID,
  MieWordsBackup,
  PersonalList,
  ReviewProgress,
  Word,
  initializePersonalData,
  listDatabase,
  progressDatabase,
  settingsDatabase,
  wordDatabase,
} from './lib/db'

type View = 'add' | 'library' | 'dictation'
type Rating = 'known' | 'unknown'
type QuizWord = Pick<Word, 'id' | 'english' | 'chinese'>
type BuiltInSource = typeof GRE_SOURCE | typeof TOEFL_SOURCE
type CardSession = { source: BuiltInSource; groupIndex: number }

const GRE_SOURCE = 'builtin:GRE'
const TOEFL_SOURCE = 'builtin:TOEFL'
const personalSource = (id: string) => `personal:${id}`
const personalId = (source: string) => source.replace('personal:', '')

const alphabetic = <T extends { english: string }>(items: T[]) =>
  [...items].sort((a, b) => a.english.localeCompare(b.english, 'en', { sensitivity: 'base' }))

const shuffle = <T,>(items: T[]) => {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}

const seededShuffle = <T,>(items: T[], seedText: string) => {
  let seed = [...seedText].reduce((value, character) => Math.imul(value ^ character.charCodeAt(0), 16777619), 2166136261)
  const random = () => {
    seed += 0x6d2b79f5
    let value = seed
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}

const timestamp = () => Date.now()
const unique = <T,>(items: T[]) => [...new Set(items)]

function App() {
  const [words, setWords] = useState<Word[]>([])
  const [lists, setLists] = useState<PersonalList[]>([])
  const [progressRecords, setProgressRecords] = useState<ReviewProgress[]>([])
  const [settings, setSettings] = useState<AppSettings>({ id: 'settings', activeListId: DEFAULT_LIST_ID, builtInPositions: {} })
  const [ready, setReady] = useState(false)
  const [view, setView] = useState<View>('add')
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [english, setEnglish] = useState('')
  const [chinese, setChinese] = useState('')
  const [chineseTouched, setChineseTouched] = useState(false)
  const [suggestionSource, setSuggestionSource] = useState('')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [quizSource, setQuizSource] = useState<string | null>(null)
  const [quiz, setQuiz] = useState<QuizWord[]>([])
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [ratings, setRatings] = useState<Record<string, Rating>>({})
  const englishInput = useRef<HTMLInputElement>(null)
  const ratingLock = useRef(false)
  const [ratingSaving, setRatingSaving] = useState(false)
  const [groupSelections, setGroupSelections] = useState<Record<BuiltInSource, number>>({ [GRE_SOURCE]: 0, [TOEFL_SOURCE]: 0 })
  const [cardSession, setCardSession] = useState<CardSession | null>(null)
  const [cardIndex, setCardIndex] = useState(0)
  const [cardFlipped, setCardFlipped] = useState(false)

  const loadData = async () => {
    const data = await initializePersonalData()
    setWords(alphabetic(data.words))
    setLists(data.lists)
    setSettings(data.settings)
    setProgressRecords(data.progress)
    setReady(true)
  }

  useEffect(() => {
    void initializePersonalData().then((data) => {
      setWords(alphabetic(data.words))
      setLists(data.lists)
      setSettings(data.settings)
      setProgressRecords(data.progress)
      setReady(true)
    })
  }, [])

  const notify = (text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage(''), 2400)
  }

  const activeList = lists.find((list) => list.id === settings.activeListId) ?? lists[0]
  const personalEnglish = useMemo(
    () => new Map(words.map((word) => [word.english.toLocaleLowerCase(), word])),
    [words],
  )
  const builtInDecks = useMemo<Record<BuiltInSource, BuiltInWord[]>>(() => ({
    [GRE_SOURCE]: seededShuffle(wordsForList('GRE'), 'miewords-gre-v1'),
    [TOEFL_SOURCE]: seededShuffle(wordsForList('TOEFL'), 'miewords-toefl-v1'),
  }), [])
  const greEnglish = useMemo(() => new Map(wordsForList('GRE').map((word) => [word.english.toLocaleLowerCase(), word])), [])
  const toeflEnglish = useMemo(() => new Map(wordsForList('TOEFL').map((word) => [word.english.toLocaleLowerCase(), word])), [])

  const getSourceWords = (source: string | null): QuizWord[] => {
    if (!source) return []
    if (source === GRE_SOURCE) return wordsForList('GRE')
    if (source === TOEFL_SOURCE) return wordsForList('TOEFL')
    const list = lists.find((item) => item.id === personalId(source))
    if (!list) return []
    const wordIds = new Set(list.wordIds)
    return words.filter((word) => wordIds.has(word.id))
  }

  const sourceName = (source: string | null) => {
    if (source === GRE_SOURCE) return 'GRE（镇考 3000 词）'
    if (source === TOEFL_SOURCE) return 'TOEFL（ECDICT 词库）'
    return lists.find((list) => list.id === personalId(source ?? ''))?.name ?? ''
  }

  const selectedWords = useMemo(
    () => alphabetic(getSourceWords(selectedSource)),
    // getSourceWords is intentionally derived from these state values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedSource, lists, words],
  )

  const visibleWords = useMemo(() => {
    const term = search.trim().toLocaleLowerCase()
    if (!term) return selectedWords
    return selectedWords.filter((word) =>
      `${word.english} ${word.chinese}`.toLocaleLowerCase().includes(term),
    )
  }, [search, selectedWords])

  const setActiveList = async (listId: string) => {
    const next = { ...settings, id: 'settings' as const, activeListId: listId }
    await settingsDatabase.save(next)
    setSettings(next)
  }

  const handleEnglishChange = (value: string) => {
    setEnglish(value)
    const key = value.trim().toLocaleLowerCase()
    const existing = personalEnglish.get(key)
    const greWord = greEnglish.get(key)
    const toeflWord = toeflEnglish.get(key)
    const match = existing ?? greWord ?? toeflWord
    if (!chineseTouched) setChinese(match?.chinese ?? '')
    if (existing) setSuggestionSource('来自你的个人词库')
    else if (greWord) setSuggestionSource(toeflWord ? '来自 GRE · 同时收录于 TOEFL' : '来自 GRE')
    else if (toeflWord) setSuggestionSource('来自 TOEFL')
    else setSuggestionSource('')
  }

  const resetForm = () => {
    setEnglish('')
    setChinese('')
    setChineseTouched(false)
    setSuggestionSource('')
    setEditingId(null)
  }

  const saveWord = async (event: FormEvent) => {
    event.preventDefault()
    const cleanEnglish = english.trim()
    const cleanChinese = chinese.trim()
    if (!cleanEnglish || !cleanChinese || !activeList) return notify('请完整填写英文和中文。')

    const duplicate = personalEnglish.get(cleanEnglish.toLocaleLowerCase())
    const existing = editingId ? words.find((word) => word.id === editingId) : duplicate
    const word: Word = {
      id: existing?.id ?? crypto.randomUUID(),
      english: cleanEnglish,
      chinese: cleanChinese,
      createdAt: existing?.createdAt ?? timestamp(),
      reviewCount: existing?.reviewCount ?? 0,
      knownCount: existing?.knownCount ?? 0,
    }
    await wordDatabase.save(word)
    if (!editingId && !activeList.wordIds.includes(word.id)) {
      await listDatabase.save({ ...activeList, wordIds: [...activeList.wordIds, word.id] })
    }
    await loadData()
    resetForm()
    notify(editingId ? '修改已保存。' : existing ? `已更新并加入“${activeList.name}”。` : `已保存到“${activeList.name}”。`)
    englishInput.current?.focus()
  }

  const createList = async () => {
    const name = window.prompt('新词库叫什么名字？')?.trim()
    if (!name) return
    if (lists.some((list) => list.name.toLocaleLowerCase() === name.toLocaleLowerCase())) return notify('已经有同名词库。')
    const list: PersonalList = { id: crypto.randomUUID(), name, wordIds: [], createdAt: timestamp() }
    await listDatabase.save(list)
    await setActiveList(list.id)
    await loadData()
    notify(`已创建“${name}”，之后的新单词会保存到这里。`)
  }

  const renameList = async (list: PersonalList) => {
    const name = window.prompt('输入新的词库名称', list.name)?.trim()
    if (!name || name === list.name) return
    if (lists.some((item) => item.id !== list.id && item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) return notify('已经有同名词库。')
    await listDatabase.save({ ...list, name })
    await loadData()
  }

  const deleteList = async (list: PersonalList) => {
    if (list.id === DEFAULT_LIST_ID) return notify('默认词库不能删除。')
    if (!window.confirm(`确定删除“${list.name}”吗？其中没有其他归属的单词会移入默认词库。`)) return
    const defaultList = lists.find((item) => item.id === DEFAULT_LIST_ID)
    if (!defaultList) return
    const otherIds = new Set(lists.filter((item) => item.id !== list.id).flatMap((item) => item.wordIds))
    const orphans = list.wordIds.filter((id) => !otherIds.has(id))
    await listDatabase.save({ ...defaultList, wordIds: unique([...defaultList.wordIds, ...orphans]) })
    await listDatabase.remove(list.id)
    if (settings.activeListId === list.id) await setActiveList(DEFAULT_LIST_ID)
    setSelectedSource(null)
    await loadData()
    notify('词库已删除。')
  }

  const addToActiveList = async (word: BuiltInWord) => {
    if (!activeList) return
    let personalWord = personalEnglish.get(word.english.toLocaleLowerCase())
    if (!personalWord) {
      personalWord = {
        id: crypto.randomUUID(), english: word.english, chinese: word.chinese,
        createdAt: timestamp(), reviewCount: 0, knownCount: 0,
      }
      await wordDatabase.save(personalWord)
    }
    if (activeList.wordIds.includes(personalWord.id)) return notify(`已经在“${activeList.name}”中。`)
    await listDatabase.save({ ...activeList, wordIds: [...activeList.wordIds, personalWord.id] })
    await loadData()
    notify(`已收藏到“${activeList.name}”。`)
  }

  const beginEdit = (word: Word) => {
    setEditingId(word.id)
    setEnglish(word.english)
    setChinese(word.chinese)
    setChineseTouched(false)
    setView('add')
    window.setTimeout(() => englishInput.current?.focus(), 0)
  }

  const removeFromList = async (word: Word, list: PersonalList) => {
    if (!window.confirm(`确定从“${list.name}”移除 “${word.english}” 吗？`)) return
    await listDatabase.save({ ...list, wordIds: list.wordIds.filter((id) => id !== word.id) })
    const existsElsewhere = lists.some((item) => item.id !== list.id && item.wordIds.includes(word.id))
    if (!existsElsewhere) await wordDatabase.remove(word.id)
    await loadData()
    notify('单词已移除。')
  }

  const reconciledProgress = (source: string, sourceWords: QuizWord[], restart = false, nextRound = false) => {
    const ids = sourceWords.map((word) => word.id)
    const valid = new Set(ids)
    const previous = progressRecords.find((item) => item.id === source)
    if (!previous || restart || nextRound) {
      return {
        id: source,
        round: nextRound ? (previous?.round ?? 0) + 1 : previous?.round ?? 1,
        queue: shuffle(ids),
        passed: [],
        stats: previous?.stats ?? {},
      } satisfies ReviewProgress
    }
    const passed = previous.passed.filter((id) => valid.has(id))
    const accounted = new Set([...passed, ...previous.queue])
    const additions = shuffle(ids.filter((id) => !accounted.has(id)))
    return {
      ...previous,
      passed,
      queue: [...previous.queue.filter((id) => valid.has(id) && !passed.includes(id)), ...additions],
    }
  }

  const showGroup = (progress: ReviewProgress, sourceWords: QuizWord[]) => {
    const byId = new Map(sourceWords.map((word) => [word.id, word]))
    setQuiz(progress.queue.slice(0, 10).flatMap((id) => byId.get(id) ?? []))
    setRevealed(new Set())
    setRatings({})
  }

  const beginReview = async (source: string, mode: 'continue' | 'restart' | 'next' = 'continue') => {
    const sourceWords = getSourceWords(source)
    const progress = reconciledProgress(source, sourceWords, mode === 'restart', mode === 'next')
    await progressDatabase.save(progress)
    setProgressRecords((current) => [...current.filter((item) => item.id !== source), progress])
    setQuizSource(source)
    showGroup(progress, sourceWords)
  }

  const rateWord = async (wordId: string, rating: Rating) => {
    if (!quizSource || ratings[wordId] || ratingLock.current) return
    const progress = progressRecords.find((item) => item.id === quizSource)
    if (!progress) return
    ratingLock.current = true
    setRatingSaving(true)
    const queue = progress.queue.filter((id) => id !== wordId)
    const stats = progress.stats[wordId] ?? { knownCount: 0, unknownCount: 0, lastReviewedAt: 0 }
    const next: ReviewProgress = {
      ...progress,
      queue: rating === 'unknown' ? [wordId, ...queue] : queue,
      passed: rating === 'known' ? unique([...progress.passed, wordId]) : progress.passed,
      stats: {
        ...progress.stats,
        [wordId]: {
          knownCount: stats.knownCount + (rating === 'known' ? 1 : 0),
          unknownCount: stats.unknownCount + (rating === 'unknown' ? 1 : 0),
          lastReviewedAt: timestamp(),
        },
      },
    }
    try {
      await progressDatabase.save(next)
      setProgressRecords((current) => [...current.filter((item) => item.id !== quizSource), next])
      setRatings((current) => ({ ...current, [wordId]: rating }))
    } finally {
      ratingLock.current = false
      setRatingSaving(false)
    }
  }

  const nextGroup = () => {
    if (!quizSource) return
    const progress = progressRecords.find((item) => item.id === quizSource)
    if (progress) showGroup(progress, getSourceWords(quizSource))
  }

  const restartRound = async () => {
    if (!quizSource || !window.confirm('确定重新开始当前轮次吗？本轮进度会清零并重新打乱，累计历史记录会保留。')) return
    await beginReview(quizSource, 'restart')
  }

  const toggleAnswer = (id: string) => {
    setRevealed((current) => {
      const next = new Set(current)
      next.add(id)
      return next
    })
  }

  const download = (contents: string, filename: string, type: string) => {
    const url = URL.createObjectURL(new Blob([contents], { type }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const exportJson = () => {
    const backup: MieWordsBackup = { version: 2, words, lists, progress: progressRecords, settings }
    download(JSON.stringify(backup, null, 2), 'miewords-backup.json', 'application/json')
  }

  const exportCsv = () => {
    const quote = (value: string) => `"${value.replaceAll('"', '""')}"`
    const rows = lists.flatMap((list) => list.wordIds.flatMap((id) => {
      const word = words.find((item) => item.id === id)
      return word ? [`${quote(list.name)},${quote(word.english)},${quote(word.chinese)}`] : []
    }))
    download(`\uFEFF${['List,English,Chinese', ...rows].join('\n')}`, 'miewords.csv', 'text/csv;charset=utf-8')
  }

  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const incoming = JSON.parse(await file.text()) as MieWordsBackup | Word[]
      if (Array.isArray(incoming)) {
        if (incoming.some((word) => !word.english || !word.chinese)) throw new Error()
        const defaultList = lists.find((list) => list.id === DEFAULT_LIST_ID) ?? lists[0]
        for (const word of incoming) await wordDatabase.save(word)
        await listDatabase.save({ ...defaultList, wordIds: unique([...defaultList.wordIds, ...incoming.map((word) => word.id)]) })
      } else {
        if (incoming.version !== 2 || !Array.isArray(incoming.words) || !Array.isArray(incoming.lists)) throw new Error()
        for (const word of incoming.words) await wordDatabase.save(word)
        for (const list of incoming.lists) await listDatabase.save(list)
        for (const progress of incoming.progress ?? []) await progressDatabase.save(progress)
        if (incoming.settings) await settingsDatabase.save(incoming.settings)
      }
      await loadData()
      notify('备份导入成功。')
    } catch {
      notify('无法导入：请选择有效的 MieWords JSON 备份。')
    } finally {
      event.target.value = ''
    }
  }

  const startCardStudy = (source: BuiltInSource) => {
    const groupIndex = groupSelections[source]
    const positionKey = `${source}:${groupIndex}`
    const groupLength = Math.min(100, builtInDecks[source].length - groupIndex * 100)
    const savedPosition = settings.builtInPositions?.[positionKey] ?? 0
    setCardSession({ source, groupIndex })
    setCardIndex(Math.min(savedPosition, Math.max(0, groupLength - 1)))
    setCardFlipped(false)
  }

  const saveCardPosition = async (index: number) => {
    if (!cardSession) return
    const positionKey = `${cardSession.source}:${cardSession.groupIndex}`
    const nextSettings: AppSettings = {
      ...settings,
      builtInPositions: { ...settings.builtInPositions, [positionKey]: index },
    }
    setCardIndex(index)
    setCardFlipped(false)
    setSettings(nextSettings)
    await settingsDatabase.save(nextSettings)
  }

  const moveCard = (change: number) => {
    if (!cardSession) return
    const length = Math.min(100, builtInDecks[cardSession.source].length - cardSession.groupIndex * 100)
    const next = Math.min(length - 1, Math.max(0, cardIndex + change))
    if (next !== cardIndex) void saveCardPosition(next)
  }

  const handleCardKey = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowLeft') moveCard(-1)
    else if (event.key === 'ArrowRight') moveCard(1)
    else if (event.key === ' ') {
      event.preventDefault()
      setCardFlipped((value) => !value)
    }
  }

  const openLibrary = () => { setView('library'); setSelectedSource(null); setSearch('') }
  const openDictation = () => { setView('dictation'); setQuizSource(null); setQuiz([]); setCardSession(null) }
  const currentProgress = progressRecords.find((item) => item.id === quizSource)
  const quizTotal = getSourceWords(quizSource).length
  const selectedPersonalList = selectedSource?.startsWith('personal:')
    ? lists.find((list) => list.id === personalId(selectedSource))
    : undefined
  const cardWords = cardSession
    ? builtInDecks[cardSession.source].slice(cardSession.groupIndex * 100, cardSession.groupIndex * 100 + 100)
    : []
  const currentCard = cardWords[cardIndex]

  if (!ready) return <div className="loading">MieWords</div>

  return (
    <div className="app-shell">
      <header>
        <button className="brand" onClick={() => setView('add')}>MieWords</button>
        <nav aria-label="主菜单">
          <button className={view === 'add' ? 'active' : ''} onClick={() => setView('add')}>录入</button>
          <button className={view === 'library' ? 'active' : ''} onClick={openLibrary}>词库</button>
          <button className={view === 'dictation' ? 'active' : ''} onClick={openDictation}>背诵</button>
        </nav>
      </header>

      <main>
        {view === 'add' && <section className="hero">
          <h1>{editingId ? '修改单词' : '添加单词'}</h1>
          <label className="destination">保存到
            <select value={activeList?.id} onChange={(event) => void setActiveList(event.target.value)}>
              {lists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}
            </select>
          </label>
          <form className="word-form" onSubmit={saveWord}>
            <label>英文<input ref={englishInput} value={english} onChange={(event) => handleEnglishChange(event.target.value)} placeholder="e.g. serendipity" autoFocus />{suggestionSource && <small className="source-hint">{suggestionSource}</small>}</label>
            <label>中文<input value={chinese} onChange={(event) => { setChinese(event.target.value); setChineseTouched(true) }} placeholder="例如：意外发现美好事物的幸运" /></label>
            <button className="primary" type="submit">{editingId ? '保存修改' : '保存'}</button>
            {editingId && <button className="text-button" type="button" onClick={resetForm}>取消修改</button>}
          </form>
        </section>}

        {view === 'library' && !selectedSource && <section className="panel">
          <div className="panel-heading"><h1>词库</h1><button className="quiet-button" onClick={() => void createList()}>＋ 新建词库</button></div>
          <h2 className="group-title">我的词库</h2>
          <div className="library-directory">
            {lists.map((list) => <button key={list.id} onClick={() => setSelectedSource(personalSource(list.id))}><span><strong>{list.name}</strong>{list.id === activeList?.id && <small>正在录入</small>}</span><em>{list.wordIds.length}</em></button>)}
          </div>
          <h2 className="group-title built-in-title">内置词库</h2>
          <div className="library-directory">
            <button onClick={() => setSelectedSource(GRE_SOURCE)}><span><strong>GRE</strong><small>镇考 3000 词</small></span><em>{wordsForList('GRE').length}</em></button>
            <button onClick={() => setSelectedSource(TOEFL_SOURCE)}><span><strong>TOEFL</strong><small>ECDICT 词库</small></span><em>{wordsForList('TOEFL').length}</em></button>
          </div>
        </section>}

        {view === 'library' && selectedSource && <section className="panel">
          <div className="panel-heading">
            <div><button className="back-button" onClick={() => { setSelectedSource(null); setSearch('') }}>← 所有词库</button><h1>词库</h1><p>{sourceName(selectedSource)}</p></div>
            {selectedPersonalList ? <div className="list-actions">
              <button className="quiet-button" onClick={() => void setActiveList(selectedPersonalList.id)}>{activeList?.id === selectedPersonalList.id ? '正在录入' : '设为录入词库'}</button>
              <button className="quiet-button" onClick={() => void renameList(selectedPersonalList)}>重命名</button>
              {selectedPersonalList.id !== DEFAULT_LIST_ID && <button className="quiet-button danger" onClick={() => void deleteList(selectedPersonalList)}>删除词库</button>}
              <details className="data-menu"><summary>数据</summary><div className="toolbar"><button onClick={exportJson}>导出 JSON</button><button onClick={exportCsv}>导出 CSV</button><label className="import">导入 JSON<input type="file" accept="application/json,.json" onChange={importJson} /></label></div></details>
            </div> : <label className="collect-target">收藏到<select value={activeList?.id} onChange={(event) => void setActiveList(event.target.value)}>{lists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}</select></label>}
          </div>
          <input className="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`搜索${sourceName(selectedSource)}…`} />
          {!visibleWords.length ? <div className="empty">这里还是空的。</div> : <div className="word-list">
            {visibleWords.map((word) => <article className="word-row" key={word.id}><strong>{word.english}</strong><span className="meaning">{word.chinese}</span>
              {selectedPersonalList ? <div><button onClick={() => beginEdit(word as Word)}>编辑</button><button className="danger" onClick={() => void removeFromList(word as Word, selectedPersonalList)}>移除</button></div> : (() => { const collected = activeList?.wordIds.some((id) => words.find((item) => item.id === id)?.english.toLocaleLowerCase() === word.english.toLocaleLowerCase()); return <button className={`collect ${collected ? 'collected' : ''}`} onClick={() => void addToActiveList(word as BuiltInWord)}>{collected ? '已收藏' : '＋ 收藏'}</button> })()}
            </article>)}
          </div>}
        </section>}

        {view === 'dictation' && !quizSource && !cardSession && <section className="panel study-home">
          <div className="panel-heading"><h1>背诵</h1></div>
          <h2 className="group-title">我的词库 · 复习</h2>
          <div className="library-directory">
            {lists.map((list) => { const progress = progressRecords.find((item) => item.id === personalSource(list.id)); return <button key={list.id} onClick={() => void beginReview(personalSource(list.id))}><span><strong>{list.name}</strong><small>{progress ? `第 ${progress.round} 轮` : '尚未开始'}</small></span><em>{progress?.passed.length ?? 0} / {list.wordIds.length}</em></button> })}
          </div>
          <h2 className="group-title built-in-title">内置词库 · 单词卡</h2>
          <div className="deck-selectors">
            {([GRE_SOURCE, TOEFL_SOURCE] as BuiltInSource[]).map((source) => <article key={source}>
              <div><strong>{source === GRE_SOURCE ? 'GRE' : 'TOEFL'}</strong><small>{source === GRE_SOURCE ? '镇考 3000 词' : 'ECDICT 词库'}</small></div>
              <select value={groupSelections[source]} onChange={(event) => setGroupSelections((current) => ({ ...current, [source]: Number(event.target.value) }))}>
                {Array.from({ length: Math.ceil(builtInDecks[source].length / 100) }, (_, index) => { const start = index * 100 + 1; const end = Math.min(start + 99, builtInDecks[source].length); return <option value={index} key={index}>List {String(index + 1).padStart(2, '0')} · {start}–{end}</option> })}
              </select>
              <button className="primary" onClick={() => startCardStudy(source)}>开始背诵</button>
            </article>)}
          </div>
        </section>}

        {view === 'dictation' && quizSource && !cardSession && <section className="panel quiz-panel">
          <div className="panel-heading"><div><button className="back-button" onClick={() => { setQuizSource(null); setQuiz([]) }}>← 背诵</button><h1>复习</h1><p>{sourceName(quizSource)} · 第 {currentProgress?.round ?? 1} 轮 · {currentProgress?.passed.length ?? 0} / {quizTotal}</p></div><button className="quiet-button" onClick={() => void restartRound()}>重新开始本轮</button></div>
          {!quizTotal ? <div className="empty">这个词库还是空的。</div> : currentProgress?.queue.length === 0 ? <div className="round-complete"><p>这一轮完成了。</p><button className="primary" onClick={() => void beginReview(quizSource, 'next')}>开始下一轮</button></div> : <>
            <div className="quiz-list">{quiz.map((word, index) => <div className={`quiz-row ${revealed.has(word.id) ? 'revealed' : ''}`} key={word.id}>
              <button className="quiz-word" onClick={() => toggleAnswer(word.id)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{word.english}</strong><em>{revealed.has(word.id) ? word.chinese : ''}</em></button>
              {revealed.has(word.id) && <div className="rating"><button className={ratings[word.id] === 'unknown' ? 'selected' : ''} disabled={ratingSaving || Boolean(ratings[word.id])} onClick={() => void rateWord(word.id, 'unknown')}>不认识</button><button className={ratings[word.id] === 'known' ? 'selected' : ''} disabled={ratingSaving || Boolean(ratings[word.id])} onClick={() => void rateWord(word.id, 'known')}>认识</button></div>}
            </div>)}</div>
            <div className="quiz-footer"><span>{Object.keys(ratings).length} / {quiz.length} 已选择</span><button className="primary" disabled={ratingSaving} onClick={nextGroup}>下一组</button></div>
          </>}
        </section>}

        {view === 'dictation' && cardSession && currentCard && <section className="panel card-study" tabIndex={0} onKeyDown={handleCardKey} autoFocus>
          <div className="card-study-heading">
            <div><button className="back-button" onClick={() => setCardSession(null)}>← 背诵</button><h1>单词卡</h1><p>{sourceName(cardSession.source)} · List {String(cardSession.groupIndex + 1).padStart(2, '0')}</p></div>
            <span>{cardIndex + 1} / {cardWords.length}</span>
          </div>
          <button className={`flashcard ${cardFlipped ? 'flipped' : ''}`} onClick={() => setCardFlipped((value) => !value)}>
            {cardFlipped && <span>中文</span>}
            <strong>{currentCard.english}</strong>
            <p>{cardFlipped ? currentCard.chinese : '点击查看中文释义'}</p>
          </button>
          <div className="card-controls">
            <button disabled={cardIndex === 0} onClick={() => moveCard(-1)}>← 上一个</button>
            <button onClick={() => void saveCardPosition(0)} disabled={cardIndex === 0}>回到第一张</button>
            <button disabled={cardIndex === cardWords.length - 1} onClick={() => moveCard(1)}>下一个 →</button>
          </div>
          <p className="keyboard-hint">空格翻面 · 方向键切换</p>
        </section>}
      </main>
      {message && <div className="toast" role="status">{message}</div>}
    </div>
  )
}

export default App
