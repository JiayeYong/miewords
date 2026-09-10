import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Word, wordDatabase } from './lib/db'

type View = 'add' | 'words' | 'dictation'

const alphabetic = (words: Word[]) =>
  [...words].sort((a, b) => a.english.localeCompare(b.english, 'en', { sensitivity: 'base' }))

const shuffle = <T,>(items: T[]) => {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}

function App() {
  const [words, setWords] = useState<Word[]>([])
  const [view, setView] = useState<View>('add')
  const [english, setEnglish] = useState('')
  const [chinese, setChinese] = useState('')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [quiz, setQuiz] = useState<Word[]>([])
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const englishInput = useRef<HTMLInputElement>(null)

  const refresh = async () => setWords(alphabetic(await wordDatabase.getAll()))

  useEffect(() => {
    void wordDatabase.getAll().then((savedWords) => setWords(alphabetic(savedWords)))
  }, [])

  const visibleWords = useMemo(() => {
    const term = search.trim().toLocaleLowerCase()
    if (!term) return words
    return words.filter((word) =>
      `${word.english} ${word.chinese}`.toLocaleLowerCase().includes(term),
    )
  }, [search, words])

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
    const word: Word = {
      id: existing?.id ?? crypto.randomUUID(),
      english: cleanEnglish,
      chinese: cleanChinese,
      createdAt: existing?.createdAt ?? Date.now(),
      reviewCount: existing?.reviewCount ?? 0,
      knownCount: existing?.knownCount ?? 0,
    }
    await wordDatabase.save(word)
    await refresh()
    setEnglish('')
    setChinese('')
    setEditingId(null)
    notify(duplicate ? '已更新这个单词的释义。' : editingId ? '修改已保存。' : '单词已收进词库。')
    englishInput.current?.focus()
  }

  const beginEdit = (word: Word) => {
    setEditingId(word.id)
    setEnglish(word.english)
    setChinese(word.chinese)
    setView('add')
    window.setTimeout(() => englishInput.current?.focus(), 0)
  }

  const deleteWord = async (word: Word) => {
    if (!window.confirm(`确定删除 “${word.english}” 吗？`)) return
    await wordDatabase.remove(word.id)
    await refresh()
    notify('单词已删除。')
  }

  const startQuiz = () => {
    setQuiz(shuffle(words).slice(0, 10))
    setRevealed(new Set())
    setView('dictation')
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

  return (
    <div className="app-shell">
      <header>
        <button className="brand" onClick={() => setView('add')} aria-label="返回首页">
          MieWords
        </button>
        <nav aria-label="主菜单">
          <button className={view === 'add' ? 'active' : ''} onClick={() => setView('add')}>录入</button>
          <button className={view === 'words' ? 'active' : ''} onClick={() => setView('words')}>词库 <span>{words.length}</span></button>
          <button className={view === 'dictation' ? 'active' : ''} onClick={startQuiz}>默写</button>
        </nav>
      </header>

      <main>
        {view === 'add' && (
          <section className="hero">
            <h1>{editingId ? '修改单词' : '添加单词'}</h1>
            <form className="word-form" onSubmit={saveWord}>
              <label>英文<input ref={englishInput} value={english} onChange={(e) => setEnglish(e.target.value)} placeholder="e.g. serendipity" autoFocus /></label>
              <label>中文<input value={chinese} onChange={(e) => setChinese(e.target.value)} placeholder="例如：意外发现美好事物的幸运" /></label>
              <button className="primary" type="submit">{editingId ? '保存修改' : '保存'}</button>
              {editingId && <button className="text-button" type="button" onClick={() => { setEditingId(null); setEnglish(''); setChinese('') }}>取消修改</button>}
            </form>
          </section>
        )}

        {view === 'words' && (
          <section className="panel">
            <div className="panel-heading">
              <h1>词库</h1>
              <details className="data-menu">
                <summary>数据</summary>
                <div className="toolbar">
                  <button onClick={exportJson} disabled={!words.length}>导出 JSON</button>
                  <button onClick={exportCsv} disabled={!words.length}>导出 CSV</button>
                  <label className="import">导入 JSON<input type="file" accept="application/json,.json" onChange={importJson} /></label>
                </div>
              </details>
            </div>
            <input className="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索英文或中文…" />
            {!visibleWords.length ? <div className="empty">{words.length ? '没有找到匹配的单词。' : '词库还是空的，先去种下第一个单词吧。'}</div> : (
              <div className="word-list">
                {visibleWords.map((word) => <article className="word-row" key={word.id}>
                  <strong>{word.english}</strong><span className="meaning">{word.chinese}</span>
                  <div><button onClick={() => beginEdit(word)}>编辑</button><button className="danger" onClick={() => deleteWord(word)}>删除</button></div>
                </article>)}
              </div>
            )}
          </section>
        )}

        {view === 'dictation' && (
          <section className="panel quiz-panel">
            <div className="panel-heading"><div><h1>默写</h1><p>点击英文查看释义</p></div><button className="quiet-button" onClick={startQuiz}>换一组</button></div>
            {!quiz.length ? <div className="empty">至少录入一个单词，就可以开始默写。</div> : (
              <div className="quiz-list">{quiz.map((word, index) => <button className={`quiz-row ${revealed.has(word.id) ? 'revealed' : ''}`} onClick={() => toggleAnswer(word.id)} key={word.id}>
                <span>{String(index + 1).padStart(2, '0')}</span><strong>{word.english}</strong><em>{revealed.has(word.id) ? word.chinese : ''}</em>
              </button>)}</div>
            )}
          </section>
        )}
      </main>
      {message && <div className="toast" role="status">{message}</div>}
    </div>
  )
}

export default App
