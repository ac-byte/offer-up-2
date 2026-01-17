import { MultiplayerApiClient, ServerSentEvent } from './multiplayerApi'

/**
 * Connection states for the SSE connection lifecycle
 */
export type ConnectionState = 
  | 'disconnected'
  | 'connecting' 
  | 'connected' 
  | 'retrying'
  | 'failed'

/**
 * Represents a single connection attempt with timing and outcome
 */
export interface ConnectionAttempt {
  attemptNumber: number      // 1-based attempt number
  startTime: number          // Unix timestamp (ms)
  endTime?: number           // Unix timestamp (ms) when completed
  duration?: number          // Milliseconds from start to end
  success: boolean           // Whether connection succeeded
  error?: string             // Error message if failed
}

/**
 * Aggregated metrics for all connection attempts in a session
 */
export interface ConnectionMetrics {
  totalAttempts: number           // Total connection attempts
  successfulAttempts: number      // Successful connections
  failedAttempts: number          // Failed connections
  averageConnectionTime: number   // Average time to connect (ms)
  attempts: ConnectionAttempt[]   // Detailed attempt history
}

/**
 * Configuration options for ConnectionManager
 */
export interface ConnectionManagerConfig {
  maxRetries: number              // Default: 5
  initialRetryDelay: number       // Default: 1000ms
  maxRetryDelay: number           // Default: 5000ms
  connectionTimeout: number       // Default: 8000ms
  enableAutoReconnect: boolean    // Default: true
  logToServer: boolean            // Default: true
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: ConnectionManagerConfig = {
  maxRetries: 5,
  initialRetryDelay: 1000,
  maxRetryDelay: 5000,
  connectionTimeout: 8000,
  enableAutoReconnect: true,
  logToServer: true,
}

/**
 * ConnectionManager wraps EventSource with resilience features:
 * - Automatic retry with exponential backoff
 * - Connection timeout handling
 * - Connection lifecycle logging
 * - Connection metrics tracking
 */
export class ConnectionManager {
  private eventSource: EventSource | null = null
  private state: ConnectionState = 'disconnected'
  private config: ConnectionManagerConfig
  private retryCount: number = 0
  private metrics: ConnectionMetrics
  private connectionTimer: NodeJS.Timeout | null = null
  private retryTimer: NodeJS.Timeout | null = null
  private currentAttempt: ConnectionAttempt | null = null

  // Event handler callbacks (to be set by consumer)
  public onStateChange?: (state: ConnectionState) => void
  public onMessage?: (event: ServerSentEvent) => void
  public onError?: (error: Error) => void

  constructor(
    private apiClient: MultiplayerApiClient,
    private gameId: string,
    private playerId: string,
    config?: Partial<ConnectionManagerConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.metrics = {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      averageConnectionTime: 0,
      attempts: [],
    }
  }

  /**
   * Get current connection state
   */
  public getState(): ConnectionState {
    return this.state
  }

  /**
   * Get connection metrics
   */
  public getMetrics(): ConnectionMetrics {
    return { ...this.metrics }
  }

  /**
   * Initiate connection with timeout and retry logic
   */
  public async connect(): Promise<void> {
    // Don't connect if already connected or connecting
    if (this.state === 'connected' || this.state === 'connecting') {
      return
    }

    // Start a new connection attempt
    this.startConnectionAttempt()

    return new Promise((resolve, reject) => {
      try {
        // Create EventSource connection
        this.eventSource = this.apiClient.connectToGameEvents(this.gameId, this.playerId)

        // Set up connection timeout
        this.connectionTimer = setTimeout(() => {
          this.handleConnectionTimeout()
          reject(new Error('Connection timeout'))
        }, this.config.connectionTimeout)

        // Handle successful connection
        this.eventSource.onopen = () => {
          this.handleConnectionSuccess()
          resolve()
        }

        // Handle incoming messages
        this.eventSource.onmessage = (event) => {
          this.handleMessage(event)
        }

        // Handle connection errors
        this.eventSource.onerror = (event) => {
          this.handleConnectionError(event)
          reject(new Error('Connection error'))
        }

      } catch (error) {
        this.handleConnectionError(error)
        reject(error)
      }
    })
  }

  /**
   * Disconnect and cleanup resources
   */
  public disconnect(): void {
    this.logConnectionEvent('closed', 'Manual disconnect')

    // Clear timers
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer)
      this.connectionTimer = null
    }

    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }

    // Close EventSource
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }

    // Update state
    this.setState('disconnected')
    this.retryCount = 0
  }

  /**
   * Manual retry - resets retry counter and attempts connection
   */
  public async manualRetry(): Promise<void> {
    this.logConnectionEvent('retry', 'Manual retry triggered')
    
    // Reset retry counter
    this.retryCount = 0
    
    // Clear any pending retry timer
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }

    // Attempt connection
    try {
      await this.connect()
    } catch (error) {
      // Connection will handle retry logic
      console.error('Manual retry failed:', error)
    }
  }

  /**
   * Start tracking a new connection attempt
   */
  private startConnectionAttempt(): void {
    this.currentAttempt = {
      attemptNumber: this.metrics.totalAttempts + 1,
      startTime: Date.now(),
      success: false,
    }

    this.metrics.totalAttempts++
    this.setState('connecting')
    this.logConnectionEvent('connecting')
  }

  /**
   * Handle successful connection
   */
  private handleConnectionSuccess(): void {
    // Clear connection timeout
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer)
      this.connectionTimer = null
    }

    // Complete current attempt
    if (this.currentAttempt) {
      this.currentAttempt.endTime = Date.now()
      this.currentAttempt.duration = this.currentAttempt.endTime - this.currentAttempt.startTime
      this.currentAttempt.success = true
      this.metrics.attempts.push(this.currentAttempt)
      this.metrics.successfulAttempts++
      this.updateAverageConnectionTime()
    }

    // Update state
    this.setState('connected')
    this.retryCount = 0
    
    const duration = this.currentAttempt?.duration || 0
    this.logConnectionEvent('connected', undefined, duration)
    this.currentAttempt = null
  }

  /**
   * Handle connection timeout
   */
  private handleConnectionTimeout(): void {
    // Complete current attempt as failed
    if (this.currentAttempt) {
      this.currentAttempt.endTime = Date.now()
      this.currentAttempt.duration = this.currentAttempt.endTime - this.currentAttempt.startTime
      this.currentAttempt.success = false
      this.currentAttempt.error = 'Connection timeout'
      this.metrics.attempts.push(this.currentAttempt)
      this.metrics.failedAttempts++
    }

    const duration = this.currentAttempt?.duration || 0
    this.logConnectionEvent('timeout', 'Connection timeout', duration)
    this.currentAttempt = null

    // Close the EventSource
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }

    // Schedule retry if retries remain
    this.scheduleRetry()
  }

  /**
   * Handle connection error
   */
  private handleConnectionError(error: any): void {
    // Clear connection timeout
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer)
      this.connectionTimer = null
    }

    // Complete current attempt as failed
    if (this.currentAttempt) {
      this.currentAttempt.endTime = Date.now()
      this.currentAttempt.duration = this.currentAttempt.endTime - this.currentAttempt.startTime
      this.currentAttempt.success = false
      this.currentAttempt.error = error?.message || 'Connection error'
      this.metrics.attempts.push(this.currentAttempt)
      this.metrics.failedAttempts++
    }

    const errorMessage = error?.message || 'Unknown error'
    this.logConnectionEvent('error', errorMessage)
    this.currentAttempt = null

    // Close the EventSource
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }

    // Notify error handler
    if (this.onError) {
      this.onError(error instanceof Error ? error : new Error(errorMessage))
    }

    // Schedule retry if retries remain
    this.scheduleRetry()
  }

  /**
   * Schedule retry with exponential backoff
   */
  private scheduleRetry(): void {
    // Check if we've exhausted retries
    if (this.retryCount >= this.config.maxRetries) {
      this.setState('failed')
      return
    }

    // Increment retry count
    this.retryCount++
    this.setState('retrying')

    // Calculate exponential backoff delay
    const delay = Math.min(
      this.config.initialRetryDelay * Math.pow(2, this.retryCount - 1),
      this.config.maxRetryDelay
    )

    this.logConnectionEvent('retry', `Scheduling retry ${this.retryCount}/${this.config.maxRetries} in ${delay}ms`)

    // Schedule retry
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null
      this.connect().catch((error) => {
        console.error('Retry connection failed:', error)
      })
    }, delay)
  }

  /**
   * Handle incoming message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data) as ServerSentEvent
      if (this.onMessage) {
        this.onMessage(data)
      }
    } catch (error) {
      console.error('Failed to parse SSE message:', error)
    }
  }

  /**
   * Validate if a state transition is allowed
   */
  private isValidStateTransition(from: ConnectionState, to: ConnectionState): boolean {
    // Define valid state transitions
    const validTransitions: Record<ConnectionState, ConnectionState[]> = {
      'disconnected': ['connecting'],
      'connecting': ['connected', 'retrying', 'failed', 'disconnected'],
      'connected': ['disconnected', 'retrying'],
      'retrying': ['connecting', 'failed', 'disconnected'],
      'failed': ['connecting', 'disconnected'],
    }

    // Check if transition is valid
    return validTransitions[from]?.includes(to) || from === to
  }

  /**
   * Update connection state and notify listeners
   * Validates state transitions according to state machine rules
   */
  private setState(newState: ConnectionState): void {
    // Validate state transition
    if (!this.isValidStateTransition(this.state, newState)) {
      console.warn(
        `[ConnectionManager] Invalid state transition: ${this.state} -> ${newState}`
      )
      return
    }

    if (this.state !== newState) {
      const oldState = this.state
      this.state = newState
      
      console.log(
        `[ConnectionManager] State transition: ${oldState} -> ${newState}`
      )
      
      if (this.onStateChange) {
        this.onStateChange(newState)
      }
    }
  }

  /**
   * Log connection event
   */
  private logConnectionEvent(
    event: 'connecting' | 'connected' | 'error' | 'closed' | 'timeout' | 'retry',
    message?: string,
    duration?: number
  ): void {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      event,
      gameId: this.gameId,
      playerId: this.playerId,
      message,
      duration,
      retryCount: this.retryCount,
    }

    // Log to console
    console.log('[ConnectionManager]', logEntry)

    // TODO: Send to server if configured
    if (this.config.logToServer) {
      // Will be implemented in task 16
    }
  }

  /**
   * Update average connection time metric
   */
  private updateAverageConnectionTime(): void {
    const successfulAttempts = this.metrics.attempts.filter(a => a.success && a.duration)
    if (successfulAttempts.length > 0) {
      const totalTime = successfulAttempts.reduce((sum, a) => sum + (a.duration || 0), 0)
      this.metrics.averageConnectionTime = totalTime / successfulAttempts.length
    }
  }
}
