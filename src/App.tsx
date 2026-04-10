import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { appConfig } from './config'
import { generatorQuestions } from './data/generatorQuestions'
import { manifest } from './data/manifest'
import { themePalettes } from './data/themeTokens'
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
      setFeedback('问卷链接已复制。')
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
      setFeedback('已打开系统分享。')
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
                先回答几道生成器问题，系统会产出一份完整可分享的中文问卷。别人打开链接后，可以像普通测试一样一路做完并拿到结果。
              </p>
              <div className="button-row">
                <button className="button button-primary" onClick={startBuilder}>
                  开始生成
                </button>
                <button className="button button-secondary" onClick={openAbout}>
                  了解 META-TI
                </button>
              </div>
            </div>

            <div className="hero-side">
              <div className="hero-sheet hero-sheet-back">
                <span>TMTI</span>
                <strong>{manifest.themePackCount} 份题材包</strong>
                <p>完整问卷链接</p>
              </div>
              <div className="hero-sheet hero-sheet-front">
                <span>生成物</span>
                <strong>不是标签</strong>
                <p>而是一份可以继续被别人完成的问卷。</p>
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
                  继续查看
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
              <p className="eyebrow">生成器</p>
              <h2>
                {builderProgress.answered} / {builderProgress.total}
              </h2>
            </div>
            <div className="topbar-side">
              <div className="progress-bar">
                <span style={{ width: `${builderProgress.percentage}%` }} />
              </div>
              <p className="topbar-note">这些问题只决定问卷怎么长出来，不会反过来评价你。</p>
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
              生成问卷
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
                <span className="chip">{generatedQuiz.family}</span>
                <span className="chip">{generatedQuiz.tonePack}</span>
              </div>
              <div className="button-row">
                <button className="button button-primary" disabled={shareBusy} onClick={handleCopyLink}>
                  复制问卷链接
                </button>
                <button className="button button-secondary" disabled={shareBusy} onClick={handleNativeShare}>
                  系统分享
                </button>
                <button className="button button-tertiary" onClick={startPlay}>
                  我先做一遍
                </button>
              </div>
              {feedback && <p className="feedback-message">{feedback}</p>}
            </div>

            <div className="preview-sheet">
              <p className="eyebrow">问卷预览</p>
              <ul className="sample-list">
                {generatedQuiz.questions.slice(0, 3).map((question) => (
                  <li key={question.id}>{question.prompt}</li>
                ))}
              </ul>
            </div>
          </article>

          <div className="section-grid">
            <article className="info-card">
              <p className="eyebrow">题目样例</p>
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
              <p className="eyebrow">项目入口</p>
              <h2>META-TI</h2>
              <p>结果之外，这个项目关注的其实是问卷本身如何被做出来、被带走、再继续定义别人。</p>
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
                由 META-TI 生成
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
              <p className="hero-brand">{appConfig.brandName}</p>
              <h1>{result.outcome.title}</h1>
              <p className="hero-lede">{result.outcome.summary}</p>
              <div className="bullet-list">
                {result.outcome.bullets.map((bullet) => (
                  <span key={bullet} className="bullet-item">
                    {bullet}
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
            <p className="eyebrow">问卷来源</p>
            <h2>{generatedQuiz.title}</h2>
            <p>这份结果来自一份由 TMTI 生成的完整问卷。想看这个项目本身，可以从下面的入口回到 META-TI。</p>
            <div className="button-row compact-row">
              <button className="button button-secondary" onClick={handleCopyLink}>
                再复制一次问卷链接
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
              <h1>从结果转向提问方式。</h1>
              <p className="hero-lede">
                在这个版本里，主产物不再是一张人格结果卡，而是一份完整的中文问卷。它可以被继续分享、继续作答，也会把项目的关注点从“你是什么”转向“问卷本身是怎样被做出来的”。
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
                <p>负责生成问卷，不会被系统反过来评价。</p>
              </article>
              <article className="sample-card">
                <strong>二阶用户</strong>
                <p>打开链接后像普通测试一样一路做完并拿到结果。</p>
              </article>
              <article className="sample-card">
                <strong>母体库</strong>
                <p>
                  当前内置 {manifest.themePackCount} 个题材包、{manifest.questionTemplateCount} 个题目母版、{manifest.sourceTraceCount} 条来源追踪。
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
