// Security monitoring and logging for threat detection

import { createWriteStream, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { alertSecurityEvent, alertLoginBurst } from './alerts'

export interface SecurityEvent {
  timestamp: string
  type: 'RATE_LIMIT' | 'BOT_DETECTED' | 'INJECTION' | 'AUTH_FAILURE' | 'SUSPICIOUS_ACTIVITY' | 'BLOCKED_IP'
  ip: string
  userAgent?: string
  path?: string
  details: Record<string, any>
}

class SecurityMonitor {
  private logStream: any = null
  private metrics: Map<string, any> = new Map()
  private alerts: SecurityEvent[] = []

  constructor() {
    // Vercel and most serverless platforms have a read-only filesystem
    // except for /tmp. Wrap in try/catch so the singleton always instantiates
    // even when the log path is inaccessible — alerting still works.
    try {
      const logDir = process.env.LOG_DIR || '/tmp/agentbot-logs'
      const logFile = join(logDir, 'security.log')
      if (!existsSync(logDir)) {
        mkdirSync(logDir, { recursive: true })
      }
      this.logStream = createWriteStream(logFile, { flags: 'a' })
    } catch {
      // Log file unavailable (expected in serverless) — alerts still fire
      this.logStream = null
    }
  }
  
  /**
   * Log security event
   */
  logEvent(event: SecurityEvent) {
    const logEntry = JSON.stringify(event)
    this.logStream?.write(logEntry + '\n')
    
    // Keep alerts in memory for monitoring
    this.alerts.push(event)
    
    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts.shift()
    }
    
    // Alert to console for critical events
    if (['INJECTION', 'BOT_DETECTED', 'BLOCKED_IP'].includes(event.type)) {
      console.error(`[SECURITY_ALERT] ${event.type}:`, event)
      // Fire webhook alert (non-blocking)
      alertSecurityEvent(
        event.type,
        event.ip,
        event.path || 'unknown',
        JSON.stringify(event.details)
      ).catch(() => {}) // swallow — never let alerting break the request
    }
  }
  
  /**
   * Record rate limit event
   */
  recordRateLimit(ip: string, path: string, userAgent?: string) {
    this.logEvent({
      timestamp: new Date().toISOString(),
      type: 'RATE_LIMIT',
      ip,
      userAgent,
      path,
      details: { reason: 'Too many requests' }
    })

    this.updateMetric('rate_limits', 1)

    // Alert on auth-path rate limits (likely brute force)
    const authPaths = ['/api/auth', '/api/register', '/api/provision', '/api/demo/chat']
    if (authPaths.some(p => path?.startsWith(p))) {
      const count = (this.metrics.get('rate_limits') || 0) as number
      alertLoginBurst(ip, path, count).catch(() => {})
    }
  }
  
  /**
   * Record bot detection
   */
  recordBotDetection(ip: string, userAgent: string, path: string) {
    this.logEvent({
      timestamp: new Date().toISOString(),
      type: 'BOT_DETECTED',
      ip,
      userAgent,
      path,
      details: { detection: 'Suspicious user agent or pattern' }
    })
    
    this.updateMetric('bot_detections', 1)
  }
  
  /**
   * Record injection attempt
   */
  recordInjectionAttempt(ip: string, path: string, details: Record<string, any>) {
    this.logEvent({
      timestamp: new Date().toISOString(),
      type: 'INJECTION',
      ip,
      path,
      details
    })
    
    this.updateMetric('injection_attempts', 1)
  }
  
  /**
   * Record auth failure
   */
  recordAuthFailure(ip: string, email?: string, reason: string = 'Invalid credentials') {
    this.logEvent({
      timestamp: new Date().toISOString(),
      type: 'AUTH_FAILURE',
      ip,
      path: '/api/auth/signin',
      details: { email, reason }
    })
    
    this.updateMetric('auth_failures', 1)
  }
  
  /**
   * Record suspicious activity
   */
  recordSuspiciousActivity(ip: string, activity: string, details: Record<string, any>) {
    this.logEvent({
      timestamp: new Date().toISOString(),
      type: 'SUSPICIOUS_ACTIVITY',
      ip,
      details: { activity, ...details }
    })
    
    this.updateMetric('suspicious_activities', 1)
  }
  
  /**
   * Record IP blocking
   */
  recordIPBlocked(ip: string, reason: string) {
    this.logEvent({
      timestamp: new Date().toISOString(),
      type: 'BLOCKED_IP',
      ip,
      details: { reason }
    })
    
    this.updateMetric('blocked_ips', 1)
  }
  
  /**
   * Update metrics
   */
  private updateMetric(key: string, increment: number = 1) {
    const current = this.metrics.get(key) || 0
    this.metrics.set(key, current + increment)
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return Object.fromEntries(this.metrics)
  }
  
  /**
   * Get recent alerts
   */
  getRecentAlerts(count: number = 100) {
    return this.alerts.slice(-count)
  }
  
  /**
   * Get alerts by type
   */
  getAlertsByType(type: SecurityEvent['type']) {
    return this.alerts.filter(a => a.type === type)
  }
  
  /**
   * Get alerts by IP
   */
  getAlertsByIP(ip: string) {
    return this.alerts.filter(a => a.ip === ip)
  }
  
  /**
   * Export metrics for external monitoring
   */
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      recentAlerts: this.getRecentAlerts(50),
      summary: {
        totalEvents: this.alerts.length,
        rateLimit: this.getAlertsByType('RATE_LIMIT').length,
        botDetections: this.getAlertsByType('BOT_DETECTED').length,
        injectionAttempts: this.getAlertsByType('INJECTION').length,
        authFailures: this.getAlertsByType('AUTH_FAILURE').length,
        blockedIPs: this.getAlertsByType('BLOCKED_IP').length,
      }
    }
  }
}

// Singleton instance
export const securityMonitor = new SecurityMonitor()

// Export helper functions
export function logRateLimit(ip: string, path: string, userAgent?: string) {
  securityMonitor.recordRateLimit(ip, path, userAgent)
}

export function logBotDetection(ip: string, userAgent: string, path: string) {
  securityMonitor.recordBotDetection(ip, userAgent, path)
}

export function logInjectionAttempt(ip: string, path: string, details: Record<string, any>) {
  securityMonitor.recordInjectionAttempt(ip, path, details)
}

export function logAuthFailure(ip: string, email?: string, reason?: string) {
  securityMonitor.recordAuthFailure(ip, email, reason)
}

export function logSuspiciousActivity(ip: string, activity: string, details?: Record<string, any>) {
  securityMonitor.recordSuspiciousActivity(ip, activity, details || {})
}
