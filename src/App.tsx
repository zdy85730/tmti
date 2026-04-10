import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { appConfig } from './config'
import { generatorQuestions } from './data/generatorQuestions'
import { manifest } from './data/manifest'
import { themePalettes } from './data/themeTokens'
import { voicePacks } from './data/voicePacks'
import { track } from './lib/analytics'
import {
  buildGeneratedQuiz,
  buildGeneratorProfile,
  computeGeneratedQuizResult,
  decodeQuizToken,
  encodeQuizToken,
  getOutcomePackById,
} from './lib/quiz'
import { copyQuizLink, shareQuizLink } from './lib/share'
import { clearGeneratedQuizSession, loadGeneratedQuizSession, saveGeneratedQuizSession } from './lib/storage'
import type {
  GeneratedQuizDefinition,
  GeneratedQuizResult,
  GeneratorAnswerMap,
  GeneratorQuestion,
  Screen,
} from './types'

function readInitialScreen() {
  const url = new URL(window.location.href)

  if (url.searchParams.get('about') === 'metati') {
    return {
      screen: 'about' as Screen,
      definition: null,
    }
  }

  const token = url.searchParams.get(appConfig.shareParam)
  if (token) {
    const decoded = decodeQuizToken(token)

    if (decoded) {
      return {
        screen: 'play' as Screen,
        definition: decoded,
      }
    }
  }

  return {
    screen: 'intro' as Screen,
    definition: null,
  }
}

function getProgress(questionList: GeneratorQuestion[], answers: GeneratorAnswerMap) {
  const answered = questionList.filter((question) => answers[question.id]).length
  return {
    answered,
    total: questionList.length,
    percentage: questionList.length ? Math.round((answered / questionList.length) * 100) : 0,
  }
}

function getQuizProgress(questionList: GeneratedQuizDefinition['questions'], answers: Record<string, string>) {
  const answered = questionList.filter((question) => answers[question.id]).length
  return {
    answered,
    total: questionList.length,
    percentage: questionList.length ? Math.round((answered / questionList.length) * 100) : 0,
    complete: questionList.length > 0 && answered === questionList.length,
  }
}

function syncUrl(definition: GeneratedQuizDefinition | null, about = false) {
  const url = new URL(window.location.href)
  url.searchParams.delete('about')
  url.searchParams.delete(appConfig.shareParam)

  if (about) {
    url.searchParams.set('about', 'metati')
  } else if (definition) {
    url.searchParams.set(appConfig.shareParam, encodeQuizToken(definition))
  }

  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

function App() {
  const initialState = useMemo(() => readInitialScreen(), [])
  const [screen, setScreen] = useState<Screen>(initialState.screen)
  const [builderAnswers, setBuilderAnswers] = useState<GeneratorAnswerMap>({})
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuizDefinition | null>(initialState.definition ?? null)
  const [playAnswers, setPlayAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<GeneratedQuizResult | null>(null)
  const [feedback, setFeedback] = useState('')
  const [shareBusy, setShareBusy] = useState(false)
  const [returnScreen, setReturnScreen] = useState<Screen>('intro')

  useEffect(() => {
    if (initialState.definition) {
      return
    }

    const stored = loadGeneratedQuizSession()
    if (stored?.definition) {
      setGeneratedQuiz(stored.definition)
      setBuilderAnswers(stored.builderAnswers)
    }
  }, [initialState.definition])

  const builderProgress = getProgress(generatorQuestions, builderAnswers)
  const quizProgress = generatedQuiz ? getQuizProgress(generatedQuiz.questions, playAnswers) : null
  const activePalette = themePalettes[generatedQuiz?.themeToken ?? 'linen']
  const activeOutcomePack = generatedQuiz ? getOutcomePackById(generatedQuiz.outcomePackId) : null
  const activeVoicePack = voicePacks[generatedQuiz?.voicePackId ?? 'groupchat']

  function setBuilderAnswer(questionId: string, value: string) {
    setBuilderAnswers((current) => ({
      ...current,
      [questionId]: value,
    }))
  }

  function startBuilder() {
    setScreen('builder')
    setResult(null)
    setPlayAnswers({})
    track('builder_started', { source: 'intro' })
  }

  function goHome() {
    setScreen('intro')
    setResult(null)
    setPlayAnswers({})
    window.history.replaceState({}, '', window.location.pathname)
  }

  function openAbout() {
    setReturnScreen(screen)
    setScreen('about')
    const url = new URL(window.location.href)
    url.searchParams.set('about', 'metati')
    url.searchParams.delete(appConfig.shareParam)
    window.history.replaceState({}, '', `${url.pathname}${url.search}`)
  }

  function closeAbout() {
    setScreen(returnScreen === 'about' ? (generatedQuiz ? 'preview' : 'intro') : returnScreen)
    const url = new URL(window.location.href)
    url.searchParams.delete('about')
    if (generatedQuiz && returnScreen !== 'intro') {
      url.searchParams.set(appConfig.shareParam, encodeQuizToken(generatedQuiz))
    } else {
      url.searchParams.delete(appConfig.shareParam)
    }
    window.history.replaceState({}, '', `${url.pathname}${url.search}`)
  }

  function generateQuiz() {
    if (builderProgress.answered !== builderProgress.total) {
      return
    }

    const definition = buildGeneratedQuiz(buildGeneratorProfile(builderAnswers))
    setGeneratedQuiz(definition)
    setResult(null)
    setPlayAnswers({})
    saveGeneratedQuizSession(definition, builderAnswers)
    setScreen('preview')
    syncUrl(definition)

    track('quiz_generated', { themePackId: definition.themePackId, family: definition.family, tone: definition.tonePack })
  }

  function startPlay() {
    setScreen('play')
    setResult(null)
    setPlayAnswers({})
    track('quiz_play_started', { themePackId: generatedQuiz?.themePackId ?? 'none' })
  }

  function setPlayAnswer(questionId: string, optionId: string) {
    setPlayAnswers((current) => ({
      ...current,
      [questionId]: optionId,
    }))
  }

  function submitPlay() {
    if (!generatedQuiz || !quizProgress?.complete) {
      return
    }

    const computed = computeGeneratedQuizResult(playAnswers, generatedQuiz)
    setResult(computed)
    setScreen('result')
    track('quiz_result_ready', { outcomeId: computed.outcome.id, themePackId: generatedQuiz.themePackId })
  }

  async function handleCopyLink() {
    if (!generatedQuiz) {
      return
    }

    setShareBusy(true)
    try {
      await copyQuizLink(generatedQuiz)
      setFeedback(voicePacks[generatedQuiz.voicePackId].copyFeedback)
    } finally {
      setShareBusy(false)
      window.setTimeout(() => setFeedback(''), 1800)
    }
  }

  async function handleNativeShare() {
    if (!generatedQuiz) {
      return
    }

    setShareBusy(true)
    try {
      await shareQuizLink(generatedQuiz)
      setFeedback(voicePacks[generatedQuiz.voicePackId].nativeFeedback)
    } finally {
      setShareBusy(false)
      window.setTimeout(() => setFeedback(''), 1800)
    }
  }

  function resetAll() {
    clearGeneratedQuizSession()
    setBuilderAnswers({})
    setGeneratedQuiz(null)
    setPlayAnswers({})
    setResult(null)
    setScreen('intro')
    window.history.replaceState({}, '', window.location.pathname)
  }

  return (
    <main
      className="app-shell"
      style={
        {
          ['--paper' as string]: activePalette.paper,
          ['--paper-soft' as string]: activePalette.paperSoft,
          ['--accent' as string]: activePalette.accent,
          ['--accent-soft' as string]: activePalette.accentSoft,
          ['--text-color' as string]: activePalette.text,
          ['--subtext' as string]: activePalette.subtext,
          ['--line-color' as string]: activePalette.line,
          ['--ghost' as string]: activePalette.ghost,
        } as CSSProperties
      }
    >
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <div className="ambient ambient-c" />

      {screen === 'intro' && (
        <section className="screen intro-screen">
          <article className="hero-card">
            <div className="hero-copy">
              <p className="hero-brand">{appConfig.brandName}</p>
              <h1>{appConfig.brandTagline}</h1>
              <p className="hero-lede">
                先挑几下口味，系统会长出一套能直接丢群里的测试。别人点开链接之后，可以像平时做梗测试一样一路做完，再拿到自己的圈内外号。
              </p>
              <div className="button-row">
                <button className="button button-primary" onClick={startBuilder}>
                  开始捏题
                </button>
                <button className="button button-secondary" onClick={openAbout}>
                  了解 META-TI
                </button>
              </div>
            </div>

            <div className="hero-side">
              <div className="hero-sheet hero-sheet-back">
                <span>TMTI</span>
                <strong>{manifest.themePackCount} 个具体局</strong>
                <p>能直接发群</p>
              </div>
              <div className="hero-sheet hero-sheet-front">
                <span>第一波</span>
                <strong>游戏 + 职场</strong>
                <p>先从最容易互相对号入座的几种局开做。</p>
              </div>
            </div>
          </article>

          {generatedQuiz && (
            <article className="resume-card">
              <div>
                <p className="eyebrow">上次生成</p>
                <h2>{generatedQuiz.title}</h2>
                <p>{generatedQuiz.intro}</p>
              </div>
              <div className="button-row compact-row">
                <button className="button button-secondary" onClick={() => setScreen('preview')}>
                  继续看这套
                </button>
                <button className="button button-tertiary" onClick={resetAll}>
                  清空重来
                </button>
              </div>
            </article>
          )}
        </section>
      )}

      {screen === 'builder' && (
        <section className="screen builder-screen">
          <article className="topbar-card">
            <div>
              <p className="eyebrow">捏题台</p>
              <h2>
                {builderProgress.answered} / {builderProgress.total}
              </h2>
            </div>
            <div className="topbar-side">
              <div className="progress-bar">
                <span style={{ width: `${builderProgress.percentage}%` }} />
              </div>
              <p className="topbar-note">这些只是在挑这套题怎么长，不会顺手把你也测一遍。</p>
            </div>
          </article>

          <div className="question-list">
            {generatorQuestions.map((question) => (
              <article key={question.id} className="question-card">
                <div className="question-head">
                  <span className="question-tag">{question.eyebrow}</span>
                </div>
                <h3>{question.prompt}</h3>
                <div className="option-list">
                  {question.options.map((option) => (
                    <label key={`${question.id}-${option.value}`} className="option-card">
                      <input
                        type="radio"
                        name={question.id}
                        value={option.value}
                        checked={builderAnswers[question.id] === option.value}
                        onChange={() => setBuilderAnswer(question.id, option.value)}
                      />
                      <span className="option-copy">
                        <strong>{option.label}</strong>
                        {option.description && <small>{option.description}</small>}
                      </span>
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="footer-actions">
            <button className="button button-secondary" onClick={goHome}>
              返回首页
            </button>
            <button
              className="button button-primary"
              disabled={builderProgress.answered !== builderProgress.total}
              onClick={generateQuiz}
            >
              长出这套
            </button>
          </div>
        </section>
      )}

      {screen === 'preview' && generatedQuiz && (
        <section className="screen preview-screen">
          <article className="hero-card preview-hero">
            <div className="hero-copy">
              <p className="hero-brand">{appConfig.brandName}</p>
              <h1>{generatedQuiz.title}</h1>
              <p className="hero-lede">{generatedQuiz.intro}</p>
              <div className="chip-row">
                <span className="chip">{generatedQuiz.questions.length} 道题</span>
                <span className="chip">{activeVoicePack.label}</span>
                {generatedQuiz.memeTags.slice(0, 2).map((tag) => (
                  <span key={tag} className="chip">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="button-row">
                <button className="button button-primary" disabled={shareBusy} onClick={handleCopyLink}>
                  {activeVoicePack.copyAction}
                </button>
                <button className="button button-secondary" disabled={shareBusy} onClick={handleNativeShare}>
                  {activeVoicePack.shareAction}
                </button>
                <button className="button button-tertiary" onClick={startPlay}>
                  {activeVoicePack.playAction}
                </button>
              </div>
              {feedback && <p className="feedback-message">{feedback}</p>}
            </div>

            <div className="preview-sheet">
              <p className="eyebrow">{activeVoicePack.previewSheetLabel}</p>
              <ul className="sample-list">
                {generatedQuiz.questions.slice(0, 3).map((question) => (
                  <li key={question.id}>{question.prompt}</li>
                ))}
              </ul>
            </div>
          </article>

          <div className="section-grid">
            <article className="info-card">
              <p className="eyebrow">{activeVoicePack.previewEyebrow}</p>
              <div className="sample-cards">
                {generatedQuiz.questions.slice(0, 4).map((question) => (
                  <article key={question.id} className="sample-card">
                    <strong>{question.prompt}</strong>
                    <p>{question.options.map((option) => option.label).join(' / ')}</p>
                  </article>
                ))}
              </div>
            </article>

            <article className="meta-card">
              <p className="eyebrow">来源</p>
              <h2>META-TI</h2>
              <p>这套题是从 META-TI 那边长出来的。想看它为什么要做成现在这味，可以从这里回去看。</p>
              <button className="button button-secondary" onClick={openAbout}>
                {appConfig.metaTiLinkLabel}
              </button>
            </article>
          </div>
        </section>
      )}

      {screen === 'play' && generatedQuiz && (
        <section className="screen play-screen">
          <article className="topbar-card">
            <div>
              <p className="eyebrow">{appConfig.brandName}</p>
              <h2>{generatedQuiz.title}</h2>
            </div>
            <div className="topbar-side">
              <div className="progress-bar">
                <span style={{ width: `${quizProgress?.percentage ?? 0}%` }} />
              </div>
              <p className="topbar-note">{generatedQuiz.intro}</p>
            </div>
          </article>

          <div className="question-list">
            {generatedQuiz.questions.map((question, index) => (
              <article key={question.id} className="question-card">
                <div className="question-head">
                  <span className="question-tag">Q{index + 1}</span>
                  <small>{question.role}</small>
                </div>
                <h3>{question.prompt}</h3>
                <div className="option-list">
                  {question.options.map((option) => (
                    <label key={`${question.id}-${option.id}`} className="option-card">
                      <input
                        type="radio"
                        name={question.id}
                        value={option.id}
                        checked={playAnswers[question.id] === option.id}
                        onChange={() => setPlayAnswer(question.id, option.id)}
                      />
                      <span className="option-copy">
                        <strong>{option.label}</strong>
                      </span>
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <footer className="play-footer">
            <div>
              <a
                className="meta-link"
                href={generatedQuiz.metaTiLink}
                onClick={(event) => {
                  event.preventDefault()
                  openAbout()
                }}
              >
                {activeVoicePack.resultSourceLabel}
              </a>
            </div>
            <div className="button-row compact-row">
              <button className="button button-secondary" onClick={() => setScreen('preview')}>
                返回预览
              </button>
              <button className="button button-primary" disabled={!quizProgress?.complete} onClick={submitPlay}>
                查看结果
              </button>
            </div>
          </footer>
        </section>
      )}

      {screen === 'result' && generatedQuiz && result && activeOutcomePack && (
        <section className="screen result-screen">
          <article className="hero-card result-hero">
            <div className="hero-copy">
              <p className="hero-brand">{activeVoicePack.resultEyebrow}</p>
              <h1>{result.outcome.nickname}</h1>
              <p className="hero-lede">{result.outcome.tagline}</p>
              <p>{result.outcome.summary}</p>
              <div className="bullet-list">
                <span className="bullet-item">{result.outcome.shareLine}</span>
                {generatedQuiz.memeTags.slice(0, 2).map((tag) => (
                  <span key={tag} className="bullet-item">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="result-panel">
              {activeOutcomePack.axes.map((axis) => (
                <article key={axis.id} className="axis-card">
                  <div className="axis-head">
                    <strong>{axis.label}</strong>
                    <span>{result.axisLevels[axis.id] === 'high' ? axis.highLabel : axis.lowLabel}</span>
                  </div>
                  <div className="progress-bar axis-bar">
                    <span style={{ width: `${result.axisPercentages[axis.id]}%` }} />
                  </div>
                  <small>{result.axisPercentages[axis.id]}%</small>
                </article>
              ))}
            </div>
          </article>

          <article className="meta-card result-meta-card">
            <p className="eyebrow">这套题</p>
            <h2>{generatedQuiz.title}</h2>
            <p>{generatedQuiz.shareSubtitle}</p>
            <div className="button-row compact-row">
              <button className="button button-secondary" onClick={handleCopyLink}>
                再把这套发出去
              </button>
              <button className="button button-tertiary" onClick={openAbout}>
                {appConfig.metaTiLinkLabel}
              </button>
            </div>
            {feedback && <p className="feedback-message">{feedback}</p>}
          </article>

          <div className="footer-actions">
            <button className="button button-secondary" onClick={startPlay}>
              重新作答
            </button>
            <button className="button button-primary" onClick={goHome}>
              返回首页
            </button>
          </div>
        </section>
      )}

      {screen === 'about' && (
        <section className="screen about-screen">
          <article className="hero-card">
            <div className="hero-copy">
              <p className="hero-brand">META-TI</p>
              <h1>从“测出啥”转到“题是怎么长出来的”。</h1>
              <p className="hero-lede">
                这个版本里，主产物不再是一张结果卡，而是一套能继续被别人做完的测试。TMTI 负责把它长出来，META-TI 负责留下这个项目为什么要这样做的入口。
              </p>
              <div className="button-row">
                <a className="button button-secondary" href={appConfig.repoUrl} target="_blank" rel="noreferrer">
                  查看仓库
                </a>
                <button className="button button-primary" onClick={closeAbout}>
                  返回
                </button>
              </div>
            </div>

            <div className="about-grid">
              <article className="sample-card">
                <strong>一阶用户</strong>
                <p>只负责把一套题长出来，不会被系统反过来下结论。</p>
              </article>
              <article className="sample-card">
                <strong>二阶用户</strong>
                <p>打开链接后就当普通测试做，一路做完再拿自己的圈内外号。</p>
              </article>
              <article className="sample-card">
                <strong>母体库</strong>
                <p>
                  当前内置 {manifest.themePackCount} 个具体局、{manifest.questionTemplateCount} 个题目母版、{manifest.sourceTraceCount} 条来源追踪。
                </p>
              </article>
            </div>
          </article>
        </section>
      )}
    </main>
  )
}

export default App
