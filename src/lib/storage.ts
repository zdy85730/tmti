import type { PendingResult, ResultSnapshot } from '../types'

const PENDING_RESULT_KEY = 'tmti:pending-result'
const RESULT_SNAPSHOT_KEY = 'tmti:last-result'

export function saveResultSession(pending: PendingResult, snapshot: ResultSnapshot) {
  localStorage.setItem(PENDING_RESULT_KEY, JSON.stringify(pending))
  localStorage.setItem(RESULT_SNAPSHOT_KEY, JSON.stringify(snapshot))
}

export function updateStoredSnapshot(snapshot: ResultSnapshot) {
  localStorage.setItem(RESULT_SNAPSHOT_KEY, JSON.stringify(snapshot))
}

export function loadResultSession() {
  const pendingRaw = localStorage.getItem(PENDING_RESULT_KEY)
  const snapshotRaw = localStorage.getItem(RESULT_SNAPSHOT_KEY)

  return {
    pending: pendingRaw ? (JSON.parse(pendingRaw) as PendingResult) : null,
    snapshot: snapshotRaw ? (JSON.parse(snapshotRaw) as ResultSnapshot) : null,
  }
}

export function clearPendingResult() {
  localStorage.removeItem(PENDING_RESULT_KEY)
}

export function clearResultSession() {
  localStorage.removeItem(PENDING_RESULT_KEY)
  localStorage.removeItem(RESULT_SNAPSHOT_KEY)
}
