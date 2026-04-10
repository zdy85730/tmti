import { appConfig } from '../config'
import type { GeneratedQuizDefinition } from '../types'
import { encodeQuizToken } from './quiz'

function fallbackCopyText(value: string) {
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

export function buildQuizShareUrl(definition: GeneratedQuizDefinition) {
  const token = encodeQuizToken(definition)
  const url = new URL(appConfig.siteUrl)
  url.searchParams.set(appConfig.shareParam, token)
  return url.toString()
}

export async function copyQuizLink(definition: GeneratedQuizDefinition) {
  const url = buildQuizShareUrl(definition)

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url)
  } else {
    fallbackCopyText(url)
  }

  return url
}

export async function shareQuizLink(definition: GeneratedQuizDefinition) {
  const url = buildQuizShareUrl(definition)

  if (navigator.share) {
    await navigator.share({
      title: definition.title,
      text: definition.intro,
      url,
    })
    return url
  }

  return copyQuizLink(definition)
}

