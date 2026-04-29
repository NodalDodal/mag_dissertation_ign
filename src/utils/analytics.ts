/**
 * Analytics Utility
 * Tracks user interactions for UX research
 * Integrates with PostHog for analytics
 */

import posthog from 'posthog-js'

export interface AnalyticsEvent {
  type: 'click' | 'control_change' | 'finish' | 'modal_open' | 'modal_close' | 'session_start' | 'sidebar_toggle'
  x?: number
  y?: number
  controlName?: string
  value?: number | string
  timestamp: number
  sessionId: string
  variantId?: string
}

class Analytics {
  private sessionId: string
  private events: AnalyticsEvent[] = []
  private startTime: number

  constructor() {
    this.sessionId = this.generateSessionId()
    this.startTime = Date.now()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  getSessionId(): string {
    return this.sessionId
  }

  getSessionDuration(): number {
    return Date.now() - this.startTime
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events]
  }

  getEventCount(): number {
    return this.events.length
  }

  getControlChangeCount(): number {
    return this.events.filter(e => e.type === 'control_change').length
  }

  private captureToPostHog(event: AnalyticsEvent): void {
    // Map analytics event types to PostHog event names
    const eventNameMap: Record<string, string> = {
      click: 'click',
      control_change: 'control_change',
      finish: 'experiment_finish',
      modal_open: 'modal_open',
      modal_close: 'modal_close',
      session_start: 'session_start',
      sidebar_toggle: 'sidebar_toggle',
    }

    const postHogEventName = eventNameMap[event.type] || event.type

    // Send to PostHog
    posthog.capture(postHogEventName, {
      ...event,
      sessionId: this.sessionId,
      sessionDuration: this.getSessionDuration(),
    })
  }

  track(event: Omit<AnalyticsEvent, 'timestamp' | 'sessionId'>): void {
    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    }
    
    this.events.push(fullEvent)
    
    // Log to console
    console.log(`[Analytics] ${event.type}:`, {
      ...event,
      time: this.getSessionDuration(),
    })

    // Send to PostHog
    this.captureToPostHog(fullEvent)
  }

  trackClick(x: number, y: number): void {
    this.track({ type: 'click', x, y })
  }

  trackControlChange(name: string, value: number | string): void {
    this.track({ type: 'control_change', controlName: name, value })
  }

  trackFinish(): void {
    this.track({ type: 'finish' })
  }

  trackModalOpen(modalName: string): void {
    this.track({ type: 'modal_open', controlName: modalName })
  }

  trackModalClose(modalName: string): void {
    this.track({ type: 'modal_close', controlName: modalName })
  }

  trackSessionStart(variantId?: string): void {
    this.track({ type: 'session_start', controlName: variantId })
  }

  // Get summary for analytics
  getSummary(): {
    sessionId: string
    duration: number
    totalEvents: number
    controlChanges: number
    clicks: number
    events: AnalyticsEvent[]
  } {
    return {
      sessionId: this.sessionId,
      duration: this.getSessionDuration(),
      totalEvents: this.getEventCount(),
      controlChanges: this.getControlChangeCount(),
      clicks: this.events.filter(e => e.type === 'click').length,
      events: this.events,
    }
  }

  // Export for backend (placeholder)
  export(): string {
    return JSON.stringify(this.getSummary(), null, 2)
  }

  // Clear events (for testing)
  reset(): void {
    this.events = []
    this.startTime = Date.now()
    this.sessionId = this.generateSessionId()
  }
}

// Singleton instance
export const analytics = new Analytics()

// React hook for using analytics
export function useAnalytics() {
  return analytics
}