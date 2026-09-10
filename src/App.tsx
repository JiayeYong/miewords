import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { BuiltInWord, wordsForList } from './data/builtInWords'
import { Word, wordDatabase } from './lib/db'

type View = 'add' | 'library' | 'dictation'
type Library = 'mine' | 'GRE' | 'TOEFL'
type QuizWord = Pick<Word, 'id' | 'english' | 'chinese'>

const alphabetic = <T extends { english: string }>(words: T[]) =>
  [...words].sort((a, b) => a.english.localeCompare(b.english, 'en', { sensitivity: 'base' }))

const shuffle = <T,>(items: T[]) => {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}

const makePersonalWord = (word: BuiltInWord): Word => ({
  id: crypto.randomUUID(),
  english: word.english,
  chinese: word.chinese,
  createdAt: Date.now(),
  reviewCount: 0,
  knownCount: 0,
})

function App() {
  const [words, setWords] = useState<Word[]>([])
  const [view, setView] = useState<View>('add')
  const [library, setLibrary] = useState<Library | null>(null)
  const [quizSource, setQuizSource] = useState<Library | null>(null)
  const [english, setEnglish] = useState('')
  const [chinese, setChinese] = useState('')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [quiz, setQuiz] = useState<QuizWord[]>([])
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const englishInput = useRef<HTMLInputElement>(null)

  const refresh = async () => setWords(alphabetic(await wordDatabase.getAll()))

  useEffect(() => {
    void wordDatabase.getAll().then((savedWords) => setWords(alphabetic(savedWords)))
  }, [])

  const personalEnglish = useMemo(
    () => new Set(words.map((word) => word.english.toLocaleLowerCase())),
    [words],
  )

  const libraryWords = useMemo(() => {
    if (library === 'mine') return words
    if (library === 'GRE' || library === 'TOEFL') return alphabetic(wordsForList(library))
    return []
  }, [library, words])

  const visibleWords = useMemo(() => {
    const term = search.trim().toLocaleLowerCase()
    if (!term) return libraryWords
    return libraryWords.filter((word) =>
      `${word.english} ${word.chinese}`.toLocaleLowerCase().includes(term),
    )
  }, [libraryWords, search])

  const notify = (text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage(''), 2400)
  }

  const saveWord = async (event: FormEvent) => {
    event.preventDefault()
    const cleanEnglish = english.trim()
    const cleanChinese = chinese.trim()
    if (!cleanEnglish || !cleanChinese) return notify('请完整填写英文和中文。')

    const duplicate = words.find(
      (word) => word.english.toLocaleLowerCase() === cleanEnglish.toLocaleLowerCase() && word.id !== editingId,
    )
    const existing = editingId ? words.find((word) => word.id === editingId) : duplicate
    await wordDatabase.save({
      id: existing?.id ?? crypto.randomUUID(),
      english: cleanEnglish,
      chinese: cleanChinese,
      createdAt: existing?.createdAt ?? Date.now(),
      reviewCount: existing?.reviewCount ?? 0,
      knownCount: existing?.knownCount ?? 0,
    })
    await refresh()
    setEnglish('')
    setChinese('')
    setEditingId(null)
    notify(duplicate ? '已更新这个单词的释义。' : editingId ? '修改已保存。' : '已保存到我的词库。')
    englishInput.current?.focus()
  }

  const collectWord = async (word: BuiltInWord) => {
    if (personalEnglish.has(word.english.toLocaleLowerCase())) return notify('这个单词已经在你的词库里。')
    await wordDatabase.save(makePersonalWord(word))
    await refresh()
    notify(`已将 ${word.english} 加入我的词库。`)
  }

  const beginEdit = (word: Word) => {
    setEditingId(word.id)
    setEnglish(word.english)
    setChinese(word.chinese)
    setView('add')
    window.setTimeout(() => englishInput.current?.focus(), 0)
  }

  const deleteWord = async (word: Word) => {
    if (!window.confirm(`确定从我的词库删除 “${word.english}” 吗？`)) return
    await wordDatabase.remove(word.id)
    await refresh()
    notify('单词已删除。')
  }

  const sourceWords = (source: Library): QuizWord[] => {
    if (source === 'mine') return words
    return wordsForList(source)
  }

  const startQuiz = (source: Library) => {
    setQuizSource(source)
    setQuiz(shuffle(sourceWords(source)).slice(0, 10))
    setRevealed(new Set())
  }

  const openDictation = () => {
    setView('dictation')
    setQuizSource(null)
    setQuiz([])
  }

  const toggleAnswer = (id: string) => {
    setRevealed((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
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

  const exportJson = () => download(JSON.stringify(words, null, 2), 'miewords-backup.json', 'application/json')
  const exportCsv = () => {
    const quote = (value: string) => `"${value.replaceAll('"', '""')}"`
    const csv = ['English,Chinese', ...words.map((word) => `${quote(word.english)},${quote(word.chinese)}`)].join('\n')
    download(`\uFEFF${csv}`, 'miewords.csv', 'text/csv;charset=utf-8')
  }

  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const incoming = JSON.parse(await file.text()) as Word[]
      if (!Array.isArray(incoming) || incoming.some((word) => !word.english || !word.chinese)) throw new Error()
      for (const item of incoming) {
        await wordDatabase.save({
          id: item.id || crypto.randomUUID(), english: item.english.trim(), chinese: item.chinese.trim(),
          createdAt: item.createdAt || Date.now(), reviewCount: item.reviewCount || 0, knownCount: item.knownCount || 0,
        })
      }
      await refresh()
      notify(`成功导入 ${incoming.length} 个单词。`)
    } catch {
      notify('无法导入：请选择有效的 MieWords JSON 备份。')
    } finally {
      event.target.value = ''
    }
  }

  const openLibrary = () => {
    setView('library')
    setLibrary(null)
    setSearch('')
  }

  const libraryName = library === 'mine' ? '我的词库' : library

  return (
    <div className="app-shell">
      <header>
        <button className="brand" onClick={() => setView('add')} aria-label="返回首页">MieWords</button>
        <nav aria-label="主菜单">
          <button className={view === 'add' ? 'active' : ''} onClick={() => setView('add')}>录入</button>
          <button className={view === 'library' ? 'active' : ''} onClick={openLibrary}>词库</button>
          <button className={view === 'dictation' ? 'active' : ''} onClick={openDictation}>默写</button>
        </nav>
      </header>

      <main>
        {view === 'add' && (
          <section className="hero">
            <h1>{editingId ? '修改单词' : '添加单词'}</h1>
            <p className="section-note">保存到我的词库</p>
            <form className="word-form" onSubmit={saveWord}>
              <label>英文<input ref={englishInput} value={english} onChange={(e) => setEnglish(e.target.value)} placeholder="e.g. serendipity" autoFocus /></label>
              <label>中文<input value={chinese} onChange={(e) => setChinese(e.target.value)} placeholder="例如：意外发现美好事物的幸运" /></label>
              <button className="primary" type="submit">{editingId ? '保存修改' : '保存'}</button>
              {editingId && <button className="text-button" type="button" onClick={() => { setEditingId(null); setEnglish(''); setChinese('') }}>取消修改</button>}
            </form>
          </section>
        )}

        {view === 'library' && !library && (
          <section className="panel">
            <div className="panel-heading"><h1>词库</h1></div>
            <div className="library-directory">
              <button onClick={() => setLibrary('mine')}><span><strong>我的词库</strong><small>手动录入与收藏</small></span><em>{words.length}</em></button>
              <button onClick={() => setLibrary('GRE')}><span><strong>GRE</strong><small>内置演示词库</small></span><em>{wordsForList('GRE').length}</em></button>
              <button onClick={() => setLibrary('TOEFL')}><span><strong>TOEFL</strong><small>内置演示词库</small></span><em>{wordsForList('TOEFL').length}</em></button>
            </div>
            <p className="data-caption">内置词库为只读演示数据；完整词库将在确认开源许可后加入。</p>
          </section>
        )}

        {view === 'library' && library && (
          <section className="panel">
            <div className="panel-heading">
              <div><button className="back-button" onClick={() => { setLibrary(null); setSearch('') }}>← 所有词库</button><h1>{libraryName}</h1></div>
              {library === 'mine' && <details className="data-menu"><summary>数据</summary><div className="toolbar">
                <button onClick={exportJson} disabled={!words.length}>导出 JSON</button>
                <button onClick={exportCsv} disabled={!words.length}>导出 CSV</button>
                <label className="import">导入 JSON<input type="file" accept="application/json,.json" onChange={importJson} /></label>
              </div></details>}
            </div>
            <input className="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`搜索${libraryName}…`} />
            {!visibleWords.length ? <div className="empty">{library === 'mine' ? '这里还是空的。' : '没有找到匹配的单词。'}</div> : (
              <div className="word-list">
                {visibleWords.map((word) => <article className="word-row" key={word.id}>
                  <strong>{word.english}</strong><span className="meaning">{word.chinese}</span>
                  {library === 'mine' ? <div><button onClick={() => beginEdit(word as Word)}>编辑</button><button className="danger" onClick={() => deleteWord(word as Word)}>删除</button></div> :
                    <button className={`collect ${personalEnglish.has(word.english.toLocaleLowerCase()) ? 'collected' : ''}`} onClick={() => void collectWord(word as BuiltInWord)}>{personalEnglish.has(word.english.toLocaleLowerCase()) ? '已收藏' : '＋ 收藏'}</button>}
                </article>)}
              </div>
            )}
          </section>
        )}

        {view === 'dictation' && !quizSource && (
          <section className="panel quiz-panel">
            <div className="panel-heading"><h1>选择词库</h1></div>
            <div className="library-directory">
              <button onClick={() => startQuiz('mine')}><span><strong>我的词库</strong></span><em>{words.length}</em></button>
              <button onClick={() => startQuiz('GRE')}><span><strong>GRE</strong></span><em>{wordsForList('GRE').length}</em></button>
              <button onClick={() => startQuiz('TOEFL')}><span><strong>TOEFL</strong></span><em>{wordsForList('TOEFL').length}</em></button>
            </div>
          </section>
        )}

        {view === 'dictation' && quizSource && (
          <section className="panel quiz-panel">
            <div className="panel-heading"><div><button className="back-button" onClick={() => { setQuizSource(null); setQuiz([]) }}>← 选择词库</button><h1>默写 · {quizSource === 'mine' ? '我的词库' : quizSource}</h1><p>点击英文查看释义</p></div><button className="quiet-button" onClick={() => startQuiz(quizSource)}>换一组</button></div>
            {!quiz.length ? <div className="empty">这个词库还是空的。</div> : <div className="quiz-list">{quiz.map((word, index) => <button className={`quiz-row ${revealed.has(word.id) ? 'revealed' : ''}`} onClick={() => toggleAnswer(word.id)} key={word.id}>
              <span>{String(index + 1).padStart(2, '0')}</span><strong>{word.english}</strong><em>{revealed.has(word.id) ? word.chinese : ''}</em>
            </button>)}</div>}
          </section>
        )}
      </main>
      {message && <div className="toast" role="status">{message}</div>}
    </div>
  )
}

export default App
