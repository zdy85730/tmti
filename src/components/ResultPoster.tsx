import type { CSSProperties } from 'react'
import { themePalettes } from '../data/themeTokens'
import type { PublicTypeProfile } from '../types'

interface ResultPosterProps {
  profile: PublicTypeProfile
  compact?: boolean
}

export function ResultPoster({ profile, compact = false }: ResultPosterProps) {
  const palette = themePalettes[profile.themeToken]

  return (
    <div
      className={`result-poster motif-${profile.motif} ${compact ? 'compact' : ''}`}
      style={
        {
          ['--poster-paper' as string]: palette.paper,
          ['--poster-paper-soft' as string]: palette.paperSoft,
          ['--poster-accent' as string]: palette.accent,
          ['--poster-accent-soft' as string]: palette.accentSoft,
          ['--poster-text' as string]: palette.text,
          ['--poster-line' as string]: palette.line,
          ['--poster-glow' as string]: palette.glow,
          ['--poster-ghost' as string]: palette.ghost,
        } as CSSProperties
      }
    >
      <div className="poster-noise" />
      <div className="poster-ornament ornament-a" />
      <div className="poster-ornament ornament-b" />
      <div className="poster-ornament ornament-c" />
      <div className="poster-content">
        <div className="poster-kicker-row">
          <span className="poster-kicker">TMTI</span>
        </div>
        <div className="poster-main-copy">
          <p className="poster-code">{profile.code}</p>
          <h3>{profile.name}</h3>
          <p className="poster-subtitle">{profile.subtitle}</p>
        </div>
        <div className="poster-chip-row">
          {profile.acceptedDescriptors.map((descriptor) => (
            <span key={descriptor} className="poster-chip">
              {descriptor}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
