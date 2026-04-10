import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { appConfig, gateStages, introSignals } from './config'
import { ResultPoster } from './components/ResultPoster'
import { themePalettes } from './data/themeTokens'
import { track } from './lib/analytics'
import { buildQuestionDeck, computeResult } from './lib/quiz'
import { DEFAULT_EXPORT_MODE, deriveBrandRevealState, getHigherRevealState } from './lib/reveal'
import { downloadShareCard } from './lib/share'
import {
  clearPendingResult,
  clearResultSession,
  loadResultSession,
  saveResultSession,
  updateStoredSnapshot,
} from './lib/storage'
import type { BrandRevealState, ExportMode, PendingResult, QuizQuestion, ResultSnapshot, Screen } from './types'

function formatCountdown(timeLeftMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(timeLeftMs / 1000))
  const seconds = totalSeconds % 60
  return `00:${String(seconds).padStart(2, '0')}`
}

function createPendingResult(): PendingResult {
  const createdAt = Date.now()

  return {
    sessionId: window.crypto?.randomUUID?.() ?? `tmti-${createdAt}`,
    unlockAt: createdAt + appConfig.generationWaitSeconds * 1000,
    createdAt,
  }
}

function App() {
  const [screen, setScreen] = useState<Screen>('intro')
  const [booted, setBooted] = useState(false)
  const [questionDeck, setQuestionDeck] = useState<QuizQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [pendingResult, setPendingResult] = useState<PendingResult | null>(null)
  const [resultSnapshot, setResultSnapshot] = useState<ResultSnapshot | null>(null)
  const [timeLeftMs, setTimeLeftMs] = useState(0)
  const [resultEnteredAt, setResultEnteredAt] = useState<number | null>(null)
  const [exportMode, setExportMode] = useState<ExportMode>(DEFAULT_EXPORT_MODE)
  const [downloadBusy, setDownloadBusy] = useState(false)
  const [exportMessage, setExportMessage] = useState('')

  const answeredCount = questionDeck.filter((question) => answers[question.id] !== undefined).length
  const quizComplete = questionDeck.length > 0 && answeredCount === questionDeck.length
  const quizProgress = questionDeck.length ? Math.round((answeredCount / questionDeck.length) * 100) : 0

  const gateProgress = pendingResult
    ? Math.min(
        100,
        ((appConfig.generationWaitSeconds * 1000 - timeLeftMs) /
          (appConfig.generationWaitSeconds * 1000)) *
          100,
      )
    : 0

  const gateStage = gateStages[Math.min(gateStages.length - 1, Math.floor((gateProgress / 100) * gateStages.length))]
  const activePalette = themePalettes[resultSnapshot?.publicType.themeToken ?? 'ember']
  const revealState = resultSnapshot?.brandRevealState ?? 'tmti'
  const revealMetaVisible = revealState === 'meta-visible'
  const revealDraftVisible = revealState !== 'tmti'
  const exportPreviewShowsTrace = exportMode === 'cover-with-trace'
  const headerBrand = revealMetaVisible ? 'TMTI / META-TI' : 'TMTI'

  const visibleSignals = useMemo(() => {
    const visibleCount = Math.min(introSignals.length, Math.max(2, Math.ceil(answeredCount / 6) + 1))
    return introSignals.slice(0, visibleCount)
  }, [answeredCount])

  useEffect(() => {
    const { pending, snapshot } = loadResultSession()

    if (snapshot && !pending) {
      setResultSnapshot(snapshot)
      setExportMode(snapshot.defaultExportMode)
      setScreen('result')
      setResultEnteredAt(Date.now())
    } else if (pending && snapshot) {
      setResultSnapshot(snapshot)
      setExportMode(snapshot.defaultExportMode)

      if (pending.unlockAt <= Date.now()) {
        clearPendingResult()
        setScreen('result')
        setResultEnteredAt(Date.now())
      } else {
        setPendingResult(pending)
        setTimeLeftMs(Math.max(0, pending.unlockAt - Date.now()))
        setScreen('gate')
      }
    }

    setBooted(true)
  }, [])

  useEffect(() => {
    if (screen !== 'gate' || !pendingResult) {
      return
    }

    const syncCountdown = () => {
      const next = Math.max(0, pendingResult.unlockAt - Date.now())
      setTimeLeftMs(next)

      if (next === 0) {
        clearPendingResult()
        setPendingResult(null)
        setScreen('result')
        setResultEnteredAt(Date.now())
        track('result_revealed', {
          source: 'timer',
        })
      }
    }

    syncCountdown()
    const intervalId = window.setInterval(syncCountdown, 200)

    return () => window.clearInterval(intervalId)
  }, [pendingResult, screen])

  useEffect(() => {
    if (screen !== 'result' || !resultSnapshot || !resultEnteredAt) {
      return
    }

    const syncReveal = () => {
      const elapsed = Date.now() - resultEnteredAt
      const candidate = deriveBrandRevealState(elapsed, exportPreviewShowsTrace)
      const nextState = getHigherRevealState(resultSnapshot.brandRevealState, candidate)

      if (nextState === resultSnapshot.brandRevealState) {
        return
      }

      setResultSnapshot((current) => {
        if (!current) {
          return current
        }

        const updated = {
          ...current,
          brandRevealState: nextState,
        }
        updateStoredSnapshot(updated)
        return updated
      })
    }

    syncReveal()
    const intervalId = window.setInterval(syncReveal, 160)

    return () => window.clearInterval(intervalId)
  }, [exportPreviewShowsTrace, resultEnteredAt, resultSnapshot, screen])

  function startQuiz() {
    clearResultSession()
    setAnswers({})
    setQuestionDeck(buildQuestionDeck())
    setPendingResult(null)
    setResultSnapshot(null)
    setTimeLeftMs(0)
    setResultEnteredAt(null)
    setExportMode(DEFAULT_EXPORT_MODE)
    setExportMessage('')
    setScreen('quiz')
    track('quiz_started', {
      questionCount: 24,
    })
  }

  function goHome() {
    setScreen('intro')
  }

  function handleAnswer(questionId: string, value: number) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: value,
    }))
  }

  function handleSubmit() {
    if (!quizComplete) {
      return
    }

    const snapshot = computeResult(answers)
    const pending = createPendingResult()

    saveResultSession(pending, snapshot)
    setPendingResult(pending)
    setResultSnapshot(snapshot)
    setTimeLeftMs(Math.max(0, pending.unlockAt - Date.now()))
    setExportMode(snapshot.defaultExportMode)
    setScreen('gate')
    track('quiz_completed', {
      publicType: snapshot.publicType.code,
    })
  }

  function liftRevealState(target: BrandRevealState) {
    setResultSnapshot((current) => {
      if (!current) {
        return current
      }

      const nextState = getHigherRevealState(current.brandRevealState, target)

      if (nextState === current.brandRevealState) {
        return current
      }

      const updated = {
        ...current,
        brandRevealState: nextState,
      }
      updateStoredSnapshot(updated)
      return updated
    })
  }

  async function handleExport(nextMode: ExportMode) {
    if (!resultSnapshot) {
      return
    }

    setExportMode(nextMode)

    if (nextMode === 'cover-with-trace') {
      liftRevealState('meta-visible')
    }

    setDownloadBusy(true)

    try {
      await downloadShareCard(resultSnapshot, nextMode)
      setExportMessage(nextMode === 'cover' ? '已导出封面卡。' : '已带上留痕导出。')
      track('result_exported', {
        mode: nextMode,
        publicType: resultSnapshot.publicType.code,
      })
    } finally {
      setDownloadBusy(false)
      window.setTimeout(() => setExportMessage(''), 2200)
    }
  }

  function handleKeepLater() {
    setExportMode(DEFAULT_EXPORT_MODE)
    setExportMessage('当前先留着，不导出。')
    window.setTimeout(() => setExportMessage(''), 2000)
  }

  if (!booted) {
    return <main className="boot-screen">正在整理默认页面...</main>
  }

  return (
    <main className="app-shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <div className="ambient ambient-c" />

      {screen === 'intro' && (
        <section className="screen intro-screen">
          <article className="hero-panel">
            <div className="hero-copy">
              <p className="hero-brand">TMTI</p>
              <h1>生成一张适合公开展示的性格卡片。</h1>
              <p className="hero-lede">
                先拿到一个很顺手、很像你、也很适合发出去的版本。剩下那层，不会一开始就被摆到封面。
              </p>
              <div className="signal-row">
                {introSignals.map((signal) => (
                  <span key={signal} className="signal-pill">
                    {signal}
                  </span>
                ))}
              </div>
              <div className="hero-actions">
                <button className="button button-primary" onClick={startQuiz}>
                  开始生成
                </button>
                <a className="button button-secondary" href={appConfig.repoUrl} target="_blank" rel="noreferrer">
                  查看仓库
                </a>
              </div>
            </div>

            <div className="hero-side">
              <div className="mini-stack">
                <div className="mini-draft">
                  <span>保留片段</span>
                  <p>默认不参与分享</p>
                </div>
                <div className="mini-cover">
                  <span>TMTI</span>
                  <strong>公众版你</strong>
                  <p>默认导出这一层</p>
                </div>
              </div>
            </div>
          </article>

          <div className="intro-grid">
            <article className="info-card">
              <h2>首层先成立</h2>
              <p>封面卡必须先足够完整，用户才会认真看到下面那层没被带走的内容。</p>
            </article>
            <article className="info-card">
              <h2>第二层不命名你</h2>
              <p>底稿只留下片段、痕迹和系统注释，不再制造另一张完整人格卡。</p>
            </article>
            <article className="info-card">
              <h2>分享是一次选择</h2>
              <p>默认分享封面，是否带上留痕，要由用户自己决定。</p>
            </article>
          </div>
        </section>
      )}

      {screen === 'quiz' && (
        <section className="screen quiz-screen">
          <article className="topbar-card">
            <div>
              <p className="eyebrow">问答流程</p>
              <h2>
                {answeredCount} / {questionDeck.length}
              </h2>
            </div>
            <div className="topbar-side">
              <div className="progress-bar">
                <span style={{ width: `${quizProgress}%` }} />
              </div>
              <div className="signal-row compact">
                {visibleSignals.map((signal) => (
                  <span key={signal} className="signal-pill compact">
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          </article>

          <div className="question-list">
            {questionDeck.map((question, index) => (
              <article key={question.id} className="question-card">
                <div className="question-head">
                  <span className="question-index">Q{index + 1}</span>
                  <span className="question-tag">{question.signalTags.join(' / ')}</span>
                </div>
                <h3>{question.prompt}</h3>
                <div className="option-list">
                  {question.options.map((option) => (
                    <label key={`${question.id}-${option.value}`} className="option-card">
                      <input
                        type="radio"
                        name={question.id}
                        value={option.value}
                        checked={answers[question.id] === option.value}
                        onChange={() => handleAnswer(question.id, option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="footer-actions">
            <p className="footer-hint">按最像你当前反应的版本作答，不用替自己选最漂亮的答案。</p>
            <div className="button-row">
              <button className="button button-secondary" onClick={goHome}>
                返回首页
              </button>
              <button className="button button-primary" disabled={!quizComplete} onClick={handleSubmit}>
                提交并生成
              </button>
            </div>
          </div>
        </section>
      )}

      {screen === 'gate' && pendingResult && resultSnapshot && (
        <section className="screen gate-screen">
          <article className="gate-card">
            <div className="gate-copy">
              <p className="hero-brand">TMTI</p>
              <h2>正在整理你的可公开版本。</h2>
              <p className="hero-lede">完整侧写已经保留，当前只是在决定哪一层先放到页面前面。</p>
              <div className="countdown-display">{formatCountdown(timeLeftMs)}</div>
              <div className="progress-bar large">
                <span style={{ width: `${gateProgress}%` }} />
              </div>
              <p className="gate-stage">{gateStage}</p>
              <div className="status-grid">
                <div className="status-pill">
                  <strong>默认品牌态</strong>
                  <span>TMTI</span>
                </div>
                <div className="status-pill">
                  <strong>完整侧写</strong>
                  <span>已保留</span>
                </div>
                <div className="status-pill">
                  <strong>导出模式</strong>
                  <span>默认只带封面</span>
                </div>
              </div>
            </div>
            <div className="gate-preview">
              <ResultPoster profile={resultSnapshot.publicType} compact />
            </div>
          </article>
        </section>
      )}

      {screen === 'result' && resultSnapshot && (
        <section className="screen result-screen">
          <div className={`result-stack ${revealDraftVisible ? 'reveal-draft' : ''} ${revealMetaVisible ? 'reveal-meta' : ''}`}>
            <article className="draft-card">
              <div className="draft-card-head">
                <span>{resultSnapshot.draftCard.title}</span>
                <small>{revealMetaVisible ? 'meta-ti' : '...'}</small>
              </div>
              <div className="draft-fragment-list">
                {resultSnapshot.draftCard.fragments.map((fragment) => (
                  <div key={`${fragment.label}-${fragment.text}`} className="draft-fragment">
                    <strong>{fragment.label}</strong>
                    <span>{fragment.text}</span>
                  </div>
                ))}
              </div>
              <p className="draft-note">{resultSnapshot.draftCard.note}</p>
            </article>

            <article className="cover-card" style={{ ['--accent-soft' as string]: activePalette.accentSoft } as CSSProperties}>
              <div className="cover-topbar">
                <p className="hero-brand">{headerBrand}</p>
                <span className="cover-topbar-note">默认导出封面</span>
              </div>

              <div className="cover-grid">
                <div className="cover-copy">
                  <p className="eyebrow">公众版你</p>
                  <h2>{resultSnapshot.publicType.name}</h2>
                  <p className="cover-definition">{resultSnapshot.publicType.shortDefinition}</p>
                  <p className="cover-subtitle">{resultSnapshot.publicType.subtitle}</p>
                  <div className="descriptor-row">
                    {resultSnapshot.publicType.acceptedDescriptors.map((descriptor) => (
                      <span key={descriptor} className="descriptor-chip">
                        {descriptor}
                      </span>
                    ))}
                  </div>
                </div>

                <ResultPoster profile={resultSnapshot.publicType} />
              </div>
            </article>
          </div>

          <div className={`trace-grid ${revealDraftVisible ? 'active' : ''}`}>
            {resultSnapshot.traceNotes.map((note) => (
              <article key={note.text} className="trace-card">
                <span className="trace-label">留痕</span>
                <p>{note.text}</p>
              </article>
            ))}
          </div>

          <article className="export-card">
            <div className="export-header">
              <div>
                <p className="eyebrow">导出区</p>
                <h3>当前可传播的是封面，但底稿也存在。</h3>
              </div>
              <p className="export-note">
                {exportPreviewShowsTrace ? '这次导出会连同留痕一起带走。' : '默认只导出封面卡。'}
              </p>
            </div>

            <div className={`export-preview ${exportPreviewShowsTrace ? 'with-trace' : ''}`}>
              <div className="export-preview-draft">
                <span>{resultSnapshot.draftCard.title}</span>
                <p>{resultSnapshot.draftCard.fragments[0]?.text}</p>
              </div>
              <div className="export-preview-cover">
                <span>{exportPreviewShowsTrace ? 'META-TI' : 'TMTI'}</span>
                <strong>{resultSnapshot.publicType.name}</strong>
                <p>{resultSnapshot.publicType.subtitle}</p>
              </div>
            </div>

            <div className="button-row export-row">
              <button className="button button-primary" disabled={downloadBusy} onClick={() => handleExport('cover')}>
                {downloadBusy && exportMode === 'cover' ? '导出中...' : '发这一版'}
              </button>
              <button
                className="button button-secondary"
                disabled={downloadBusy}
                onClick={() => handleExport('cover-with-trace')}
              >
                {downloadBusy && exportMode === 'cover-with-trace' ? '导出中...' : '连同留痕一起导出'}
              </button>
              <button className="button button-tertiary" disabled={downloadBusy} onClick={handleKeepLater}>
                先留着
              </button>
            </div>

            {exportMessage && <p className="export-message">{exportMessage}</p>}
          </article>

          <div className="footer-actions">
            <p className="footer-hint">封面负责认领和传播，底稿只负责提醒你这不是唯一版本。</p>
            <div className="button-row">
              <button className="button button-secondary" onClick={goHome}>
                返回首页
              </button>
              <button className="button button-primary" onClick={startQuiz}>
                再做一次
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

export default App
