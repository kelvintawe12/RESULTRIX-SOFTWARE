/**
 * Daemon Service
 * Background worker processes for periodic tasks
 */

export type DaemonStatus = 'idle' | 'running' | 'paused' | 'error';

export interface DaemonConfig {
  id: string;
  name: string;
  interval: number; // milliseconds
  enabled: boolean;
  onRun: () => Promise<void>;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

export interface DaemonInfo {
  id: string;
  name: string;
  status: DaemonStatus;
  interval: number;
  lastRun: number | null;
  nextRun: number | null;
  runCount: number;
  errorCount: number;
  lastError: string | null;
}

class DaemonService {
  private daemons: Map<string, DaemonConfig> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private daemonInfo: Map<string, DaemonInfo> = new Map();
  private static instance: DaemonService;
  private initialized = false;

  private constructor() {
    // Initialize daemons only once
    if (!this.initialized) {
      this.initializeDefaultDaemons();
      this.initialized = true;
    }
  }

  static getInstance(): DaemonService {
    if (!DaemonService.instance) {
      DaemonService.instance = new DaemonService();
    }
    return DaemonService.instance;
  }

  /**
   * Register a new daemon
   */
  register(config: DaemonConfig): void {
    // Check if daemon already exists
    if (this.daemons.has(config.id)) {
      console.log(`Daemon already registered: ${config.id}`);
      return;
    }

    this.daemons.set(config.id, config);
    this.daemonInfo.set(config.id, {
      id: config.id,
      name: config.name,
      status: 'idle',
      interval: config.interval,
      lastRun: null,
      nextRun: config.enabled ? Date.now() + config.interval : null,
      runCount: 0,
      errorCount: 0,
      lastError: null
    });

    if (config.enabled) {
      this.start(config.id);
    }
  }

  /**
   * Start a daemon
   */
  start(daemonId: string): boolean {
    const daemon = this.daemons.get(daemonId);
    if (!daemon) {
      console.error(`Daemon not found: ${daemonId}`);
      return false;
    }

    // Check if already running
    const existingInterval = this.intervals.get(daemonId);
    if (existingInterval) {
      // Already running, just clear and restart to prevent duplicates
      clearInterval(existingInterval);
      console.log(`Restarting daemon: ${daemon.name}`);
    } else {
      console.log(`Daemon started: ${daemon.name}`);
    }

    // Set up new interval
    const interval = setInterval(async () => {
      await this.runDaemon(daemonId);
    }, daemon.interval);

    this.intervals.set(daemonId, interval);
    
    // Update status
    const info = this.daemonInfo.get(daemonId);
    if (info) {
      info.status = 'running';
      info.nextRun = Date.now() + daemon.interval;
      this.daemonInfo.set(daemonId, info);
    }

    return true;
  }

  /**
   * Stop a daemon
   */
  stop(daemonId: string): boolean {
    const interval = this.intervals.get(daemonId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(daemonId);
      
      // Update status
      const info = this.daemonInfo.get(daemonId);
      if (info) {
        info.status = 'paused';
        info.nextRun = null;
        this.daemonInfo.set(daemonId, info);
      }
      
      console.log(`Daemon stopped: ${daemonId}`);
      return true;
    }
    return false;
  }

  /**
   * Run a daemon immediately
   */
  async runNow(daemonId: string): Promise<void> {
    await this.runDaemon(daemonId);
  }

  /**
   * Get daemon info
   */
  getDaemonInfo(daemonId: string): DaemonInfo | null {
    return this.daemonInfo.get(daemonId) || null;
  }

  /**
   * Get all daemon info
   */
  getAllDaemonInfo(): DaemonInfo[] {
    return Array.from(this.daemonInfo.values());
  }

  /**
   * Enable/disable a daemon
   */
  setEnabled(daemonId: string, enabled: boolean): boolean {
    const daemon = this.daemons.get(daemonId);
    if (!daemon) return false;

    daemon.enabled = enabled;
    this.daemons.set(daemonId, daemon);

    if (enabled) {
      return this.start(daemonId);
    } else {
      return this.stop(daemonId);
    }
  }

  /**
   * Run a single daemon execution
   */
  private async runDaemon(daemonId: string): Promise<void> {
    const daemon = this.daemons.get(daemonId);
    const info = this.daemonInfo.get(daemonId);
    
    if (!daemon || !info) {
      console.error(`Daemon not found: ${daemonId}`);
      return;
    }

    try {
      // Update status
      info.status = 'running';
      this.daemonInfo.set(daemonId, info);

      // Run the daemon
      await daemon.onRun();

      // Update success stats
      info.lastRun = Date.now();
      info.nextRun = Date.now() + daemon.interval;
      info.runCount++;
      info.status = 'idle';
      info.lastError = null;
      
      if (daemon.onSuccess) {
        daemon.onSuccess();
      }
    } catch (error: any) {
      console.error(`Daemon error: ${daemon.name}`, error);
      
      // Update error stats
      info.errorCount++;
      info.status = 'error';
      info.lastError = error.message;
      this.daemonInfo.set(daemonId, info);
      
      if (daemon.onError) {
        daemon.onError(error);
      }
    }
  }

  /**
   * Initialize default daemons
   */
  private initializeDefaultDaemons(): void {
    // Cache cleanup daemon (runs every 10 minutes)
    this.register({
      id: 'cache-cleanup',
      name: 'Cache Cleanup Daemon',
      interval: 10 * 60 * 1000,
      enabled: true,
      onRun: async () => {
        const { cacheService } = await import('./cacheService');
        cacheService.clearExpired();
      }
    });

    // Notification expiration daemon (runs every hour)
    this.register({
      id: 'notification-cleanup',
      name: 'Notification Cleanup Daemon',
      interval: 60 * 60 * 1000,
      enabled: true,
      onRun: async () => {
        const { notificationService } = await import('./notificationService');
        await notificationService.cleanupExpired();
      }
    });
  }

  /**
   * Stop all daemons
   */
  stopAll(): void {
    for (const daemonId of this.intervals.keys()) {
      this.stop(daemonId);
    }
  }

  /**
   * Restart all daemons
   */
  restartAll(): void {
    this.stopAll();
    for (const [daemonId, daemon] of this.daemons.entries()) {
      if (daemon.enabled) {
        this.start(daemonId);
      }
    }
  }
}

export const daemonService = DaemonService.getInstance();