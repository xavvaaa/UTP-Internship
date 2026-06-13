/**
 * Persistent debug logger that survives page reloads
 */

class DebugLogger {
  constructor() {
    this.sessionId = Date.now()
    this.logs = []
    this.maxLogs = 100
  }

  log(category, message, data = {}) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      sessionId: this.sessionId,
      timestamp,
      category,
      message,
      data,
      url: window.location.href,
      pathname: window.location.pathname
    }

    this.logs.push(logEntry)
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Store in sessionStorage to survive reloads
    try {
      sessionStorage.setItem('debugLogs', JSON.stringify(this.logs))
    } catch (e) {
      // Ignore sessionStorage errors
    }

    // Also log to console
    console.log(`[${category}] ${message}`, data)
  }

  getLogs() {
    return this.logs
  }

  loadFromStorage() {
    try {
      const stored = sessionStorage.getItem('debugLogs')
      if (stored) {
        this.logs = JSON.parse(stored)
        // Filter logs from current session
        this.logs = this.logs.filter(log => log.sessionId === this.sessionId)
      }
    } catch (e) {
      // Ignore errors
    }
  }

  clear() {
    this.logs = []
    try {
      sessionStorage.removeItem('debugLogs')
    } catch (e) {
      // Ignore errors
    }
  }

  printRecentLogs(count = 20) {
    const recent = this.logs.slice(-count)
    console.group(`🔍 Recent Debug Logs (Last ${count} entries)`)
    recent.forEach(log => {
      console.log(`[${log.timestamp}] [${log.category}] ${log.message}`, log.data)
    })
    console.groupEnd()
  }
}

export const debugLogger = new DebugLogger()

// Load existing logs on initialization
debugLogger.loadFromStorage()

// Log page loads and navigation
window.addEventListener('load', () => {
  debugLogger.log('PAGE', 'Page loaded', {
    referrer: document.referrer,
    navigationType: performance.getEntriesByType('navigation')[0]?.type
  })
})

window.addEventListener('popstate', () => {
  debugLogger.log('NAVIGATION', 'Browser back/forward button used', {
    pathname: window.location.pathname,
    timestamp: Date.now(),
    search: window.location.search,
    hash: window.location.hash
  })
})

window.addEventListener('beforeunload', (event) => {
  debugLogger.log('PAGE', 'Page unloading - beforeunload event', {
    pathname: window.location.pathname,
    timestamp: Date.now(),
    reason: 'beforeunload fired'
  })
})

// Track all navigation attempts
let navigationCount = 0
const originalPushState = window.history.pushState
const originalReplaceState = window.history.replaceState

window.history.pushState = function(...args) {
  navigationCount++
  debugLogger.log('NAVIGATION', 'pushState called', {
    count: navigationCount,
    args: args,
    from: window.location.pathname,
    to: args[2] || 'unknown',
    pathname: window.location.pathname,
    timestamp: Date.now()
  })
  return originalPushState.apply(this, args)
}

window.history.replaceState = function(...args) {
  navigationCount++
  debugLogger.log('NAVIGATION', 'replaceState called', {
    count: navigationCount,
    args: args,
    from: window.location.pathname,
    to: args[2] || 'unknown',
    pathname: window.location.pathname,
    timestamp: Date.now()
  })
  return originalReplaceState.apply(this, args)
}

// Track history length changes
let lastHistoryLength = window.history.length
setInterval(() => {
  if (window.history.length !== lastHistoryLength) {
    debugLogger.log('NAVIGATION', 'History length changed', {
      from: lastHistoryLength,
      to: window.history.length,
      pathname: window.location.pathname,
      timestamp: Date.now()
    })
    lastHistoryLength = window.history.length
  }
}, 1000)

// Export convenience functions
export const logAuth = (message, data) => debugLogger.log('AUTH', message, data)
export const logNavigation = (message, data) => debugLogger.log('NAVIGATION', message, data)
export const logRedirect = (message, data) => debugLogger.log('REDIRECT', message, data)
export const logSession = (message, data) => debugLogger.log('SESSION', message, data)

// Make logger available globally for debugging
if (typeof window !== 'undefined') {
  window.debugLogger = debugLogger
  window.printDebugLogs = () => debugLogger.printRecentLogs()
  window.clearDebugLogs = () => debugLogger.clear()
}
