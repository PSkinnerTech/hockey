# Gemini API Integration - Smart Hockey Coach

## Overview

This document covers the integration of Gemini 2.5 Pro for video analysis, including both development (Developer API) and production (Vertex AI) configurations.

## Environment Setup

### Development Environment
```javascript
// Using Gemini Developer API
const GEMINI_CONFIG = {
  apiKey: process.env.GEMINI_API_KEY,
  model: "models/gemini-2.5-pro-preview-0506",
  endpoint: "https://generativelanguage.googleapis.com/v1beta",
  maxRetries: 3,
  retryDelay: 1000, // ms
};
```

### Production Environment (Vertex AI)
```javascript
// Using Vertex AI with provisioned throughput
const VERTEX_CONFIG = {
  projectId: process.env.GCP_PROJECT_ID,
  location: "us-central1",
  endpoint: process.env.VERTEX_AI_ENDPOINT,
  model: "gemini-2.5-pro",
  serviceAccountKey: process.env.GCP_SERVICE_ACCOUNT_KEY,
};
```

## Vertex AI Production Setup

### 1. Model Deployment
```bash
# Deploy Gemini 2.5 Pro to Vertex AI endpoint
gcloud ai endpoints deploy-model $ENDPOINT_ID \
  --model=$MODEL_ID \
  --display-name="smart-hockey-coach-gemini" \
  --machine-type="n1-standard-8" \
  --min-replica-count=2 \
  --max-replica-count=10 \
  --enable-autoscaling
```

### 2. Provisioned Throughput Configuration
```yaml
# vertex-ai-config.yaml
deployedModel:
  model: "projects/PROJECT_ID/locations/LOCATION/models/MODEL_ID"
  displayName: "smart-hockey-coach-gemini"
  dedicatedResources:
    machineSpec:
      machineType: "n1-standard-8"
      acceleratorType: "NVIDIA_TESLA_T4"
      acceleratorCount: 1
    minReplicaCount: 2  # Provisioned capacity
    maxReplicaCount: 10
    autoscalingMetricSpecs:
    - metricName: "aiplatform.googleapis.com/prediction/online/cpu/utilization"
      target: 60
```

### 3. Service Account Setup
```bash
# Create service account
gcloud iam service-accounts create smart-hockey-coach-sa \
  --display-name="Smart Hockey Coach Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:smart-hockey-coach-sa@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Create and download key
gcloud iam service-accounts keys create sa-key.json \
  --iam-account=smart-hockey-coach-sa@PROJECT_ID.iam.gserviceaccount.com
```

## API Client Implementation

### Base Client Class
```typescript
import { GoogleAuth } from 'google-auth-library';
import fetch from 'node-fetch';

class GeminiClient {
  private auth: GoogleAuth;
  private endpoint: string;
  
  constructor(config: VertexConfig | DeveloperConfig) {
    if ('serviceAccountKey' in config) {
      // Vertex AI setup
      this.auth = new GoogleAuth({
        credentials: JSON.parse(
          Buffer.from(config.serviceAccountKey, 'base64').toString()
        ),
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
      this.endpoint = config.endpoint;
    } else {
      // Developer API setup
      this.endpoint = config.endpoint;
      this.apiKey = config.apiKey;
    }
  }
  
  async generateContentStream(request: GeminiRequest): AsyncGenerator<string> {
    const url = this.buildUrl('generateContent', { alt: 'sse' });
    const headers = await this.getHeaders();
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }
    
    // Parse SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            yield data.candidates[0].content.parts[0].text;
          }
        }
      }
    }
  }
  
  private async getHeaders(): Promise<Record<string, string>> {
    if (this.auth) {
      const accessToken = await this.auth.getAccessToken();
      return {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      };
    } else {
      return {
        'x-goog-api-key': this.apiKey,
        'Content-Type': 'application/json',
      };
    }
  }
}
```

### Streaming Response Handler
```typescript
export async function callGeminiStreaming({
  prompt,
  videoData,
  maxTokens,
  responseFormat,
}: {
  prompt: string;
  videoData: Buffer | string; // Base64 or URI
  maxTokens: number;
  responseFormat: 'json' | 'text';
}): AsyncGenerator<string> {
  const client = new GeminiClient(getConfig());
  
  const request: GeminiRequest = {
    contents: [{
      role: 'user',
      parts: [
        { text: prompt },
        {
          fileData: {
            mimeType: 'video/mp4',
            fileUri: videoData, // Or inlineData for base64
          }
        }
      ]
    }],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.2, // Lower for factual analysis
      topP: 0.8,
      topK: 40,
      responseMimeType: responseFormat === 'json' 
        ? 'application/json' 
        : 'text/plain',
    },
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH'
      }
    ]
  };
  
  try {
    yield* client.generateContentStream(request);
  } catch (error) {
    if (error.status === 429) {
      // Rate limit - implement exponential backoff
      await sleep(Math.min(2 ** retryCount * 1000, 32000));
      yield* callGeminiStreaming(arguments[0]); // Retry
    } else {
      throw error;
    }
  }
}
```

## Error Handling

### Error Types and Responses
```typescript
enum GeminiErrorType {
  RATE_LIMIT = 'RATE_LIMIT',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  CONTENT_FILTER = 'CONTENT_FILTER',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

class GeminiErrorHandler {
  static async handle(error: any, context: AnalysisContext): Promise<void> {
    const errorType = this.classifyError(error);
    
    switch (errorType) {
      case GeminiErrorType.RATE_LIMIT:
        // Implement exponential backoff
        await this.handleRateLimit(context);
        break;
        
      case GeminiErrorType.CONTENT_FILTER:
        // Video may contain inappropriate content
        await this.handleContentFilter(context);
        break;
        
      case GeminiErrorType.SERVER_ERROR:
        // Retry with backoff
        await this.handleServerError(context);
        break;
        
      default:
        // Log and notify user
        await this.handleGenericError(error, context);
    }
  }
  
  private static classifyError(error: any): GeminiErrorType {
    if (error.status === 429) return GeminiErrorType.RATE_LIMIT;
    if (error.status === 403) return GeminiErrorType.QUOTA_EXCEEDED;
    if (error.status === 400) return GeminiErrorType.INVALID_REQUEST;
    if (error.message?.includes('content filter')) return GeminiErrorType.CONTENT_FILTER;
    if (error.status >= 500) return GeminiErrorType.SERVER_ERROR;
    return GeminiErrorType.NETWORK_ERROR;
  }
}
```

## Monitoring and Observability

### Metrics to Track
```typescript
interface GeminiMetrics {
  // Latency metrics
  timeToFirstToken: number;
  totalResponseTime: number;
  tokensPerSecond: number;
  
  // Usage metrics
  totalTokensUsed: number;
  costEstimate: number;
  
  // Error metrics
  errorRate: number;
  errorsByType: Record<GeminiErrorType, number>;
  
  // Quality metrics
  feedbackCompleteness: number; // % of expected fields populated
  userSatisfactionScore?: number;
}

class GeminiMonitor {
  static async trackRequest(
    requestId: string,
    request: GeminiRequest,
    response: AsyncGenerator<string>
  ): Promise<GeminiMetrics> {
    const startTime = Date.now();
    let firstTokenTime: number | null = null;
    let totalTokens = 0;
    let content = '';
    
    try {
      for await (const chunk of response) {
        if (!firstTokenTime) {
          firstTokenTime = Date.now();
        }
        content += chunk;
        totalTokens += this.estimateTokens(chunk);
      }
      
      const metrics: GeminiMetrics = {
        timeToFirstToken: firstTokenTime - startTime,
        totalResponseTime: Date.now() - startTime,
        tokensPerSecond: totalTokens / ((Date.now() - startTime) / 1000),
        totalTokensUsed: totalTokens,
        costEstimate: this.calculateCost(totalTokens),
        errorRate: 0,
        errorsByType: {},
        feedbackCompleteness: this.assessCompleteness(content),
      };
      
      await this.logMetrics(requestId, metrics);
      return metrics;
      
    } catch (error) {
      await this.logError(requestId, error);
      throw error;
    }
  }
}
```

### Vertex AI Monitoring Dashboard
```yaml
# monitoring-config.yaml
dashboards:
  - name: "Smart Hockey Coach - Gemini Performance"
    widgets:
      - title: "Request Latency"
        metric: "aiplatform.googleapis.com/prediction/online/request_latency"
        aggregation: "ALIGN_MEAN"
        
      - title: "Error Rate"
        metric: "aiplatform.googleapis.com/prediction/online/error_count"
        aggregation: "ALIGN_RATE"
        
      - title: "Resource Utilization"
        metric: "aiplatform.googleapis.com/prediction/online/cpu/utilization"
        aggregation: "ALIGN_MEAN"
        
      - title: "Throughput"
        metric: "aiplatform.googleapis.com/prediction/online/prediction_count"
        aggregation: "ALIGN_RATE"

alerts:
  - name: "high-latency"
    condition: "latency > 5000ms for 5 minutes"
    notification: "pagerduty"
    
  - name: "high-error-rate"
    condition: "error_rate > 5% for 3 minutes"
    notification: "slack"
```

## Best Practices

### 1. Request Optimization
- Keep prompts concise and structured
- Use appropriate max_output_tokens limits
- Compress video data appropriately
- Cache common responses when possible

### 2. Cost Management
- Monitor token usage closely
- Use provisioned throughput for predictable costs
- Implement request throttling during peak usage
- Consider tiered service levels

### 3. Reliability
- Implement circuit breakers for API failures
- Use health checks for Vertex AI endpoints
- Maintain fallback responses for common scenarios
- Queue requests during outages

### 4. Security
- Rotate service account keys regularly
- Use least-privilege IAM roles
- Encrypt sensitive data in transit
- Audit API usage regularly