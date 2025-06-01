export interface PerformanceMetrics {
  frameProcessingTime: number[];
  averageProcessingTime: number;
  droppedFrames: number;
  totalFrames: number;
  memoryUsage: number;
  cpuUsage?: number;
  frameRate: number;
  effectiveProcessingFPS: number;
}

export interface PerformanceBenchmarks {
  maxProcessingTime: number; // 16ms for 60fps
  minFrameRate: number; // 55fps minimum
  maxDropRate: number; // 5% maximum
  maxMemoryIncrease: number; // 50MB maximum
}

export const PERFORMANCE_BENCHMARKS: PerformanceBenchmarks = {
  maxProcessingTime: 16,
  minFrameRate: 55,
  maxDropRate: 5,
  maxMemoryIncrease: 50 * 1024 * 1024, // 50MB in bytes
};

export class FrameProcessorPerformanceMonitor {
  private metrics: PerformanceMetrics = {
    frameProcessingTime: [],
    averageProcessingTime: 0,
    droppedFrames: 0,
    totalFrames: 0,
    memoryUsage: 0,
    frameRate: 0,
    effectiveProcessingFPS: 0,
  };
  
  private maxMetricsHistory = 100;
  private startTime: number = Date.now();
  private lastFrameTime: number = 0;
  private frameRateHistory: number[] = [];
  
  recordFrameProcessing(processingTime: number): void {
    this.metrics.frameProcessingTime.push(processingTime);
    this.metrics.totalFrames++;
    
    if (this.metrics.frameProcessingTime.length > this.maxMetricsHistory) {
      this.metrics.frameProcessingTime.shift();
    }
    
    this.updateAverageProcessingTime();
    this.updateFrameRate();
  }
  
  recordDroppedFrame(): void {
    this.metrics.droppedFrames++;
    this.metrics.totalFrames++;
  }
  
  private updateAverageProcessingTime(): void {
    const sum = this.metrics.frameProcessingTime.reduce((a, b) => a + b, 0);
    this.metrics.averageProcessingTime = sum / this.metrics.frameProcessingTime.length;
  }
  
  private updateFrameRate(): void {
    const currentTime = Date.now();
    
    if (this.lastFrameTime > 0) {
      const instantFrameRate = 1000 / (currentTime - this.lastFrameTime);
      this.frameRateHistory.push(instantFrameRate);
      
      // Keep only recent frame rate measurements
      if (this.frameRateHistory.length > 30) {
        this.frameRateHistory.shift();
      }
      
      // Calculate average frame rate
      const avgFrameRate = this.frameRateHistory.reduce((a, b) => a + b, 0) / this.frameRateHistory.length;
      this.metrics.frameRate = avgFrameRate;
    }
    
    this.lastFrameTime = currentTime;
    
    // Calculate effective processing FPS
    const elapsedTime = (currentTime - this.startTime) / 1000;
    this.metrics.effectiveProcessingFPS = this.metrics.totalFrames / elapsedTime;
  }
  
  updateMemoryUsage(memoryUsage?: number): void {
    // In a real implementation, this would use native memory monitoring
    // For now, we'll use a placeholder or performance.memory if available
    if (memoryUsage !== undefined) {
      this.metrics.memoryUsage = memoryUsage;
    } else {
      // Use performance.memory if available (web/debug builds)
      // @ts-ignore - performance.memory might not be available in React Native
      this.metrics.memoryUsage = global.performance?.memory?.usedJSHeapSize || 0;
    }
  }
  
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  getFrameRate(): number {
    return this.metrics.frameRate;
  }
  
  getDropRate(): number {
    return this.metrics.totalFrames > 0 
      ? (this.metrics.droppedFrames / this.metrics.totalFrames) * 100 
      : 0;
  }
  
  getEffectiveProcessingFPS(): number {
    return this.metrics.effectiveProcessingFPS;
  }
  
  isPerformanceGood(): boolean {
    return this.validatePerformance().overall;
  }
  
  validatePerformance(): {
    overall: boolean;
    processingTime: boolean;
    frameRate: boolean;
    dropRate: boolean;
    memory: boolean;
    details: string[];
  } {
    const benchmarks = PERFORMANCE_BENCHMARKS;
    const issues: string[] = [];
    
    const processingTimeOK = this.metrics.averageProcessingTime <= benchmarks.maxProcessingTime;
    if (!processingTimeOK) {
      issues.push(`Processing time too high: ${this.metrics.averageProcessingTime.toFixed(2)}ms (target: ${benchmarks.maxProcessingTime}ms)`);
    }
    
    const frameRateOK = this.metrics.frameRate >= benchmarks.minFrameRate;
    if (!frameRateOK) {
      issues.push(`Frame rate too low: ${this.metrics.frameRate.toFixed(1)}fps (target: ${benchmarks.minFrameRate}fps)`);
    }
    
    const dropRateOK = this.getDropRate() <= benchmarks.maxDropRate;
    if (!dropRateOK) {
      issues.push(`Drop rate too high: ${this.getDropRate().toFixed(2)}% (target: ${benchmarks.maxDropRate}%)`);
    }
    
    const memoryOK = this.metrics.memoryUsage <= benchmarks.maxMemoryIncrease;
    if (!memoryOK) {
      issues.push(`Memory usage too high: ${(this.metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB (target: ${benchmarks.maxMemoryIncrease / 1024 / 1024}MB)`);
    }
    
    return {
      overall: processingTimeOK && frameRateOK && dropRateOK && memoryOK,
      processingTime: processingTimeOK,
      frameRate: frameRateOK,
      dropRate: dropRateOK,
      memory: memoryOK,
      details: issues,
    };
  }
  
  getPerformanceSummary(): string {
    const validation = this.validatePerformance();
    
    if (validation.overall) {
      return `✅ Performance: EXCELLENT\n` +
             `Processing: ${this.metrics.averageProcessingTime.toFixed(2)}ms\n` +
             `Frame Rate: ${this.metrics.frameRate.toFixed(1)}fps\n` +
             `Drop Rate: ${this.getDropRate().toFixed(2)}%`;
    } else {
      return `⚠️ Performance Issues Detected:\n${validation.details.join('\n')}`;
    }
  }
  
  reset(): void {
    this.metrics = {
      frameProcessingTime: [],
      averageProcessingTime: 0,
      droppedFrames: 0,
      totalFrames: 0,
      memoryUsage: 0,
      frameRate: 0,
      effectiveProcessingFPS: 0,
    };
    this.startTime = Date.now();
    this.lastFrameTime = 0;
    this.frameRateHistory = [];
  }
  
  // Export data for analysis
  exportMetrics(): string {
    const data = {
      timestamp: new Date().toISOString(),
      duration: (Date.now() - this.startTime) / 1000,
      metrics: this.getMetrics(),
      validation: this.validatePerformance(),
    };
    
    return JSON.stringify(data, null, 2);
  }
}

// Singleton instance for global performance monitoring
export const globalPerformanceMonitor = new FrameProcessorPerformanceMonitor();

// Helper function to start performance monitoring
export const startPerformanceMonitoring = (): FrameProcessorPerformanceMonitor => {
  const monitor = new FrameProcessorPerformanceMonitor();
  monitor.reset();
  return monitor;
};

// Performance testing utilities
export class PerformanceTester {
  private monitor = new FrameProcessorPerformanceMonitor();
  
  async runPerformanceTest(duration: number = 30000): Promise<PerformanceMetrics> {
    console.log('🏒 Starting frame processor performance test...');
    this.monitor.reset();
    
    const startTime = Date.now();
    let frameCount = 0;
    
    const testInterval = setInterval(() => {
      const processingStart = Date.now();
      
      // Simulate frame processing work
      this.simulateFrameProcessing();
      
      const processingTime = Date.now() - processingStart;
      this.monitor.recordFrameProcessing(processingTime);
      
      frameCount++;
      
      if (Date.now() - startTime >= duration) {
        clearInterval(testInterval);
        this.reportResults();
      }
    }, 16); // Target 60fps
    
    return new Promise((resolve) => {
      setTimeout(() => {
        clearInterval(testInterval);
        resolve(this.monitor.getMetrics());
      }, duration);
    });
  }
  
  private simulateFrameProcessing(): void {
    // Simulate CPU-intensive work similar to frame processing
    const iterations = Math.random() * 1000 + 500;
    for (let i = 0; i < iterations; i++) {
      Math.sin(Math.random() * Math.PI);
    }
    
    // Simulate random processing spikes
    if (Math.random() > 0.95) {
      const spikeIterations = Math.random() * 2000 + 1000;
      for (let i = 0; i < spikeIterations; i++) {
        Math.cos(Math.random() * Math.PI);
      }
    }
  }
  
  private reportResults(): void {
    const metrics = this.monitor.getMetrics();
    const validation = this.monitor.validatePerformance();
    
    console.log('🏒 === Frame Processor Performance Results ===');
    console.log(`📊 Total Frames Processed: ${metrics.totalFrames}`);
    console.log(`⏱️ Average Processing Time: ${metrics.averageProcessingTime.toFixed(2)}ms`);
    console.log(`📉 Dropped Frames: ${metrics.droppedFrames}`);
    console.log(`🎯 Frame Rate: ${this.monitor.getFrameRate().toFixed(2)} fps`);
    console.log(`💧 Drop Rate: ${this.monitor.getDropRate().toFixed(2)}%`);
    console.log(`🚀 Effective Processing FPS: ${this.monitor.getEffectiveProcessingFPS().toFixed(2)} fps`);
    console.log('');
    
    // Performance assessment
    console.log(this.monitor.getPerformanceSummary());
    
    if (!validation.overall) {
      console.log('');
      console.log('🔧 Optimization Suggestions:');
      if (!validation.processingTime) {
        console.log('- Increase frame skip rate to reduce processing load');
        console.log('- Switch to lower quality extraction mode');
      }
      if (!validation.frameRate) {
        console.log('- Enable adaptive frame skipping');
        console.log('- Consider battery performance mode');
      }
      if (!validation.memory) {
        console.log('- Implement frame buffer pooling');
        console.log('- Reduce frame extraction resolution');
      }
    }
  }
}

// Export a default performance tester instance
export const performanceTester = new PerformanceTester(); 