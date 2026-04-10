import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import './App.css'
import { appConfig, gateStages } from './config'
import { ResultPoster } from './components/ResultPoster'
import { themePalettes } from './data/themeTokens'
import { track } from './lib/analytics'
import { buildQuestionDeck, computeResult } from './lib/quiz'
import { DEFAULT_EXPORT_MODE, transitionBrandRevealState } from './lib/reveal'
import { downloadShareCard } from './lib/share'
import {
  clearPendingResult,
  clearResultSession,
  loadResultSession,
  saveResultSession,
  updateStoredSnapshot,
} from './lib/storage'
import type { BrandRevealEvent, ExportMode, PendingResult, QuizQuestion, ResultSnapshot, Screen } from './types'

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
  const [exportMode, setExportMode] = useState<ExportMode>(DEFAULT_EXPORT_MODE)
  const [downloadBusy, setDownloadBusy] = useState(false)
  const [exportMessage, setExportMessage] = useState('')

  const answeredCount = questionDeck.filter((question) => answers[question.id] !== undefined).length
  const quizComplete = questionDeck.length > 0 && answeredCount === questionDeck.length
  const quizProgress = questionDeck.length ? Math.round((answeredCount / questionDeck.length) * 100) : 0

  const gateProgress = pendingResult
    ? Math.min(
        100,
        ((appConfig.generationWaitSeconds * 1000 - timeLeftMs) / (appConfig.generationWaitSeconds * 1000)) * 100,
      )
    : 0

  const gateStage = gateStages[Math.min(gateStages.length - 1, Math.floor((gateProgress / 100) * gateStages.length))]
  const activePalette = themePalettes[resultSnapshot?.selectedCover.themeToken ?? 'ember']
  const revealState = resultSnapshot?.brandRevealState ?? 'tmti'
  const revealMetaVisible = revealState === 'meta-visible'
  const revealDraftVisible = revealState === 'draft-peek' || revealState === 'meta-visible'
  const exportPreviewShowsTrace = exportMode === 'cover-with-trace'
  const residueLabel = resultSnapshot?.cutWords.length ? '裁切' : '边角'

  useEffect(() => {
    const { pending, snapshot } = loadResultSession()

    if (snapshot && !pending) {
      setResultSnapshot(snapshot)
      setExportMode(snapshot.defaultExportMode)
      setScreen('result')
    } else if (pending && snapshot) {
      setResultSnapshot(snapshot)
      setExportMode(snapshot.defaultExportMode)

      if (pending.unlockAt <= Date.now()) {
        clearPendingResult()
        setScreen('result')
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
        track('result_revealed', { source: 'timer' })
      }
    }

    syncCountdown()
    const intervalId = window.setInterval(syncCountdown, 200)

    return () => window.clearInterval(intervalId)
  }, [pendingResult, screen])

  function startQuiz() {
    clearResultSession()
    setAnswers({})
    setQuestionDeck(buildQuestionDeck())
    setPendingResult(null)
    setResultSnapshot(null)
    setTimeLeftMs(0)
    setExportMode(DEFAULT_EXPORT_MODE)
    setExportMessage('')
    setScreen('quiz')
    track('quiz_started', { questionCount: 24 })
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
      selectedCover: snapshot.selectedCover.code,
      coverCandidate: snapshot.candidatePool[0]?.code,
    })
  }

  function applyReveal(event: BrandRevealEvent) {
    setResultSnapshot((current) => {
      if (!current) {
        return current
      }

      const nextState = transitionBrandRevealState(current.brandRevealState, event)

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
    applyReveal(nextMode === 'cover-with-trace' ? 'select-trace-export' : 'attempt-share')
    setDownloadBusy(true)

    try {
      await downloadShareCard(resultSnapshot, nextMode)
      setExportMessage(nextMode === 'cover' ? '已导出。' : '已导出扩展版。')
      track('result_exported', {
        mode: nextMode,
        selectedCover: resultSnapshot.selectedCover.code,
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

  function handleResultInteraction() {
    applyReveal('peek-draft')
  }

  function handlePreviewInspect() {
    applyReveal('inspect-preview')
  }

  if (!booted) {
    return <main className="boot-screen">正在整理页面...</main>
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
              <p className="hero-lede">用一组问题，生成一张适合截图分享的结果页。</p>
              <div className="hero-actions">
                <button className="button button-primary" onClick={startQuiz}>
                  开始生成
                </button>
              </div>
            </div>

            <div className="hero-side">
              <div className="mini-stack">
                <div className="mini-draft">
                  <span>...</span>
                  <p>怕被误解</p>
                  <p>想确认关系</p>
                </div>
                <div className="mini-cover">
                  <span>TMTI</span>
                  <strong>结果页</strong>
                  <p>适合截图分享</p>
                </div>
              </div>
            </div>
          </article>
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
            </div>
          </article>

          <div className="question-list">
            {questionDeck.map((question, index) => (
              <article key={question.id} className="question-card">
                <div className="question-head">
                  <span className="question-index">Q{index + 1}</span>
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
            <p className="footer-hint">按第一反应选择。</p>
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
              <h2>正在生成结果页。</h2>
              <div className="countdown-display">{formatCountdown(timeLeftMs)}</div>
              <div className="progress-bar large">
                <span style={{ width: `${gateProgress}%` }} />
              </div>
              <p className="gate-stage">{gateStage}</p>
            </div>
            <div className="gate-preview">
              <ResultPoster profile={resultSnapshot.selectedCover} chips={resultSnapshot.coverWords} compact />
            </div>
          </article>
        </section>
      )}

      {screen === 'result' && resultSnapshot && (
        <section
          className="screen result-screen"
          onPointerEnter={handleResultInteraction}
          onWheel={handleResultInteraction}
          onTouchMove={handleResultInteraction}
        >
          <article
            className="candidate-stage-card"
            style={{ ['--accent-soft' as string]: activePalette.accentSoft } as CSSProperties}
            onPointerDown={handleResultInteraction}
          >
            <div className="candidate-stage-grid">
              <div className="selected-cover-sheet">
                <div className="cover-topbar">
                  <p className="hero-brand">TMTI</p>
                  <span className="selection-state">定稿</span>
                </div>
                <p className="eyebrow">结果</p>
                <h2>{resultSnapshot.selectedCover.name}</h2>
                <p className="cover-definition">{resultSnapshot.selectedCover.shortDefinition}</p>
                <p className="cover-subtitle">{resultSnapshot.selectedCover.subtitle}</p>
                <div className="descriptor-row">
                  {resultSnapshot.coverWords.map((descriptor) => (
                    <span key={descriptor} className="descriptor-chip">
                      {descriptor}
                    </span>
                  ))}
                </div>
              </div>

              <aside className={`candidate-pool ${revealDraftVisible ? 'active' : ''}`}>
                {resultSnapshot.candidatePool.map((candidate, index) => (
                  <article key={candidate.code} className={`candidate-card ${index === 0 ? 'selected' : 'ghost'}`}>
                    <small>{index === 0 ? '当前' : '备选'}</small>
                    <strong>{candidate.name}</strong>
                    <div className="candidate-reason-row">
                      {candidate.reasonWords.map((word) => (
                        <span key={`${candidate.code}-${word}`}>{word}</span>
                      ))}
                    </div>
                  </article>
                ))}
              </aside>
            </div>
          </article>

          <section className={`residue-section ${revealDraftVisible ? 'active' : ''}`}>
            <div className="residue-header">
              <p className="eyebrow">边角</p>
              {revealMetaVisible && <small className="export-meta-tag">META-TI</small>}
            </div>

            <div className="residue-layout">
              <div className="residue-mark-wall">
                {resultSnapshot.residueMarks.map((mark) => (
                  <span
                    key={`${mark.tone}-${mark.text}`}
                    className={`residue-mark tone-${mark.tone} ${mark.strike ? 'strike' : ''}`}
                  >
                    {mark.text}
                  </span>
                ))}
              </div>

              <div className="trace-grid">
                {resultSnapshot.traceNotes.map((note) => (
                  <article key={note.text} className="trace-card">
                    <p>{note.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <article className="export-card" onPointerEnter={handlePreviewInspect}>
            <div className="export-header">
              <p className="eyebrow">预览</p>
              <small className="preview-status">{exportPreviewShowsTrace ? '带上边角' : '只带成品'}</small>
              {revealMetaVisible && <small className="export-meta-tag">META-TI</small>}
            </div>

            <div className={`export-preview ${revealDraftVisible ? 'peeked' : ''} ${exportPreviewShowsTrace ? 'with-trace' : ''}`}>
              <div className="export-preview-draft">
                <span>{revealMetaVisible ? 'META-TI' : residueLabel}</span>
                <div className="export-preview-draft-marks">
                  {resultSnapshot.residueMarks.slice(0, 5).map((mark) => (
                    <p key={`${mark.tone}-${mark.text}`} className={`${mark.strike ? 'strike' : ''} tone-${mark.tone}`}>
                      {mark.text}
                    </p>
                  ))}
                </div>
              </div>

              <div className="export-preview-cover">
                <ResultPoster profile={resultSnapshot.selectedCover} chips={resultSnapshot.coverWords} compact />
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
