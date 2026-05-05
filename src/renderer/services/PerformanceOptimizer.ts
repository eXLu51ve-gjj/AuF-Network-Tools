/**
 * Performance Optimizer Service
 * Handles performance optimizations, resource management, and operation cancellation
 */

export interface OperationHandle {
  id: string;
  cancel: () => void;
  cleanup: () => void;
  status: 'running' | 'completed' | 'cancelled' | 'failed';
}

export interface ResourceUsage {
  memory: number;
  operations: number;
  cacheSize: number;
  timestamp: Date;
}

export class PerformanceOptimizer {
  private static operations = new Map<string, OperationHandle>();
  private static cache = new Map<string, { data: any; timestamp: number; size: number }>();
  private static maxCacheSize = 50 * 1024 * 1024; // 50MB
  private static currentCacheSize = 0;
  private static resourceMonitorInterval: NodeJS.Timeout | null = null;
  private static resourceHistory: ResourceUsage[] = [];

  /**
   * Register an operation for tracking and cancellation
   */
  static registerOperation(
    id: string,
    cancelFn: () => void,
    cleanupFn: () => void
  ): OperationHandle {
    const handle: OperationHandle = {
      id,
      cancel: () => {
        cancelFn();
        handle.status = 'cancelled';
        this.operations.delete(id);
      },
      cleanup: () => {
        cleanupFn();
        this.operations.delete(id);
      },
      status: 'running',
    };

    this.operations.set(id, handle);
    return handle;
  }

  /**
   * Cancel an operation by ID
   */
  static cancelOperation(id: string): boolean {
    const operation = this.operations.get(id);
    if (operation && operation.status === 'running') {
      operation.cancel();
      return true;
    }
    return false;
  }

  /**
   * Cancel all running operations
   */
  static cancelAllOperations(): number {
    let count = 0;
    this.operations.forEach((operation) => {
      if (operation.status === 'running') {
        operation.cancel();
        count++;
      }
    });
    return count;
  }

  /**
   * Get all running operations
   */
  static getRunningOperations(): OperationHandle[] {
    return Array.from(this.operations.values()).filter((op) => op.status === 'running');
  }

  /**
   * Complete an operation
   */
  static completeOperation(id: string): void {
    const operation = this.operations.get(id);
    if (operation) {
      operation.status = 'completed';
      operation.cleanup();
    }
  }

  /**
   * Fail an operation
   */
  static failOperation(id: string): void {
    const operation = this.operations.get(id);
    if (operation) {
      operation.status = 'failed';
      operation.cleanup();
    }
  }

  /**
   * Cache data with automatic size management
   */
  static cacheData(key: string, data: any, ttl: number = 300000): void {
    // 5 minutes default TTL
    const serialized = JSON.stringify(data);
    const size = new Blob([serialized]).size;

    // Check if adding this would exceed cache size
    if (this.currentCacheSize + size > this.maxCacheSize) {
      this.evictCache(size);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      size,
    });

    this.currentCacheSize += size;

    // Set expiration
    setTimeout(() => {
      this.removeCacheEntry(key);
    }, ttl);
  }

  /**
   * Get cached data
   */
  static getCachedData<T = any>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired (additional safety check)
    const age = Date.now() - entry.timestamp;
    if (age > 300000) {
      // 5 minutes
      this.removeCacheEntry(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Remove cache entry
   */
  private static removeCacheEntry(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentCacheSize -= entry.size;
      this.cache.delete(key);
    }
  }

  /**
   * Evict cache entries to make room
   */
  private static evictCache(requiredSize: number): void {
    // Sort by timestamp (oldest first)
    const entries = Array.from(this.cache.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    );

    let freedSize = 0;
    for (const [key, entry] of entries) {
      this.removeCacheEntry(key);
      freedSize += entry.size;

      if (freedSize >= requiredSize) {
        break;
      }
    }
  }

  /**
   * Clear all cache
   */
  static clearCache(): void {
    this.cache.clear();
    this.currentCacheSize = 0;
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    entries: number;
    size: number;
    maxSize: number;
    utilization: number;
  } {
    return {
      entries: this.cache.size,
      size: this.currentCacheSize,
      maxSize: this.maxCacheSize,
      utilization: (this.currentCacheSize / this.maxCacheSize) * 100,
    };
  }

  /**
   * Virtual scrolling helper for large lists
   */
  static calculateVisibleRange(
    scrollTop: number,
    containerHeight: number,
    itemHeight: number,
    totalItems: number,
    overscan: number = 3
  ): { start: number; end: number } {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(totalItems, start + visibleCount + overscan * 2);

    return { start, end };
  }

  /**
   * Debounce function for performance optimization
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        func(...args);
      }, wait);
    };
  }

  /**
   * Throttle function for performance optimization
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }

  /**
   * Batch operations for better performance
   */
  static async batchProcess<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 10,
    onProgress?: (processed: number, total: number) => void
  ): Promise<R[]> {
    const results: R[] = [];
    const total = items.length;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processor));
      results.push(...batchResults);

      if (onProgress) {
        onProgress(Math.min(i + batchSize, total), total);
      }
    }

    return results;
  }

  /**
   * Start resource monitoring
   */
  static startResourceMonitoring(interval: number = 5000): void {
    if (this.resourceMonitorInterval) {
      return;
    }

    this.resourceMonitorInterval = setInterval(() => {
      const usage: ResourceUsage = {
        memory: (performance as any).memory?.usedJSHeapSize || 0,
        operations: this.operations.size,
        cacheSize: this.currentCacheSize,
        timestamp: new Date(),
      };

      this.resourceHistory.push(usage);

      // Keep only last 100 entries
      if (this.resourceHistory.length > 100) {
        this.resourceHistory.shift();
      }

      // Auto-cleanup if memory usage is high
      if (usage.memory > 100 * 1024 * 1024) {
        // 100MB
        this.performAutoCleanup();
      }
    }, interval);
  }

  /**
   * Stop resource monitoring
   */
  static stopResourceMonitoring(): void {
    if (this.resourceMonitorInterval) {
      clearInterval(this.resourceMonitorInterval);
      this.resourceMonitorInterval = null;
    }
  }

  /**
   * Get resource usage history
   */
  static getResourceHistory(): ResourceUsage[] {
    return [...this.resourceHistory];
  }

  /**
   * Get current resource usage
   */
  static getCurrentResourceUsage(): ResourceUsage {
    return {
      memory: (performance as any).memory?.usedJSHeapSize || 0,
      operations: this.operations.size,
      cacheSize: this.currentCacheSize,
      timestamp: new Date(),
    };
  }

  /**
   * Perform automatic cleanup
   */
  private static performAutoCleanup(): void {
    console.log('Performing automatic cleanup...');

    // Clear old cache entries
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    for (const [key, entry] of entries) {
      const age = now - entry.timestamp;
      if (age > 60000) {
        // 1 minute
        this.removeCacheEntry(key);
      }
    }

    // Cancel stale operations
    this.operations.forEach((operation) => {
      if (operation.status === 'completed' || operation.status === 'failed') {
        this.operations.delete(operation.id);
      }
    });
  }

  /**
   * Optimize large dataset rendering
   */
  static optimizeDataset<T>(
    data: T[],
    maxItems: number = 1000
  ): { data: T[]; truncated: boolean } {
    if (data.length <= maxItems) {
      return { data, truncated: false };
    }

    return {
      data: data.slice(0, maxItems),
      truncated: true,
    };
  }

  /**
   * Memory-efficient data transformation
   */
  static* transformDataStream<T, R>(
    data: T[],
    transformer: (item: T) => R
  ): Generator<R, void, unknown> {
    for (const item of data) {
      yield transformer(item);
    }
  }

  /**
   * Lazy load data in chunks
   */
  static async* lazyLoadChunks<T>(
    loader: (offset: number, limit: number) => Promise<T[]>,
    chunkSize: number = 50
  ): AsyncGenerator<T[], void, unknown> {
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const chunk = await loader(offset, chunkSize);
      if (chunk.length === 0) {
        hasMore = false;
      } else {
        yield chunk;
        offset += chunk.length;
      }
    }
  }

  /**
   * Request idle callback wrapper
   */
  static requestIdleTask(callback: () => void, timeout: number = 1000): number {
    if ('requestIdleCallback' in window) {
      return (window as any).requestIdleCallback(callback, { timeout });
    } else {
      return window.setTimeout(callback, 0) as any;
    }
  }

  /**
   * Cancel idle task
   */
  static cancelIdleTask(id: number): void {
    if ('cancelIdleCallback' in window) {
      (window as any).cancelIdleCallback(id);
    } else {
      clearTimeout(id);
    }
  }
}
