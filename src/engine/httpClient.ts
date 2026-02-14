/**
 * HTTP client for making API requests
 * Wraps axios with variable resolution and error handling
 */

import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import type { HttpMethod, Server, StepHeader } from '../types';
import { resolveVariables, type VariableContext } from './variableResolver';

/**
 * HTTP response structure
 */
export interface HttpResponse {
  /** HTTP status code */
  status: number;
  /** HTTP status text */
  statusText: string;
  /** Response headers */
  headers: Record<string, string>;
  /** Response body data */
  data: unknown;
  /** Request duration in milliseconds */
  duration: number;
}

/**
 * HTTP request configuration
 */
export interface HttpRequestConfig {
  /** HTTP method */
  method: HttpMethod;
  /** Full URL or endpoint path */
  url: string;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body */
  body?: unknown;
  /** Query parameters */
  queryParams?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * HTTP error with additional context
 */
export class HttpRequestError extends Error {
  readonly status?: number;
  readonly statusText?: string;
  readonly response?: unknown;
  override readonly cause?: Error;

  constructor(
    message: string,
    status?: number,
    statusText?: string,
    response?: unknown,
    cause?: Error
  ) {
    super(message);
    this.name = 'HttpRequestError';
    this.status = status;
    this.statusText = statusText;
    this.response = response;
    this.cause = cause;
  }
}

/**
 * Merges server headers with step headers
 * Step headers take precedence over server headers
 * Only enabled headers are included
 *
 * @param serverHeaders - Headers from server configuration
 * @param stepHeaders - Headers from step configuration
 * @returns Merged headers object
 */
export function mergeHeaders(
  serverHeaders: StepHeader[],
  stepHeaders: StepHeader[] = []
): Record<string, string> {
  const merged: Record<string, string> = {};

  // Add enabled server headers
  for (const header of serverHeaders) {
    if (header.enabled) {
      merged[header.key] = header.value;
    }
  }

  // Add enabled step headers (overrides server headers)
  for (const header of stepHeaders) {
    if (header.enabled) {
      merged[header.key] = header.value;
    }
  }

  return merged;
}

/**
 * Builds full URL from base URL and endpoint
 * Handles trailing slashes properly
 *
 * @param baseUrl - Server base URL
 * @param endpoint - API endpoint path
 * @returns Complete URL
 */
export function buildUrl(baseUrl: string, endpoint: string): string {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}

/**
 * Resolves variables in request configuration
 *
 * @param config - Request configuration with potential variables
 * @param context - Variable context
 * @returns Resolved request configuration
 */
export function resolveRequestConfig(
  config: HttpRequestConfig,
  context: VariableContext
): HttpRequestConfig {
  return {
    method: config.method,
    url: resolveVariables(config.url, context) as string,
    headers: config.headers
      ? (resolveVariables(config.headers, context) as Record<string, string>)
      : undefined,
    body: config.body ? resolveVariables(config.body, context) : undefined,
    queryParams: config.queryParams
      ? (resolveVariables(config.queryParams, context) as Record<string, string>)
      : undefined,
    timeout: config.timeout,
  };
}

/**
 * Converts Axios response to our HttpResponse format
 *
 * @param response - Axios response
 * @param duration - Request duration in milliseconds
 * @returns Formatted HTTP response
 */
function formatResponse(
  response: AxiosResponse,
  duration: number
): HttpResponse {
  // Convert AxiosHeaders to plain object to ensure serialization
  // AxiosHeaders is a class instance that Redux cannot serialize
  const headers: Record<string, string> = {};
  if (response.headers) {
    // Handle both AxiosHeaders object and plain object
    // AxiosHeaders has toJSON method that returns plain object
    const headersObj = typeof response.headers.toJSON === 'function'
      ? response.headers.toJSON()
      : response.headers;

    for (const [key, value] of Object.entries(headersObj)) {
      if (typeof value === 'string') {
        headers[key] = value;
      } else if (Array.isArray(value)) {
        headers[key] = value.join(', ');
      }
    }
  }

  return {
    status: response.status,
    statusText: response.statusText,
    headers,
    data: response.data,
    duration,
  };
}

/**
 * Handles Axios errors and converts them to HttpRequestError
 *
 * @param error - Error from axios
 * @param duration - Request duration in milliseconds
 * @returns HttpRequestError with details
 */
function handleHttpError(error: unknown, duration: number): HttpRequestError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      // Server responded with error status
      return new HttpRequestError(
        `HTTP ${axiosError.response.status}: ${axiosError.response.statusText || 'Request failed'}`,
        axiosError.response.status,
        axiosError.response.statusText,
        axiosError.response.data,
        axiosError
      );
    }

    if (axiosError.request) {
      // Request was made but no response received
      if (axiosError.code === 'ECONNABORTED') {
        return new HttpRequestError(
          `Request timeout after ${duration}ms`,
          undefined,
          'Timeout',
          undefined,
          axiosError
        );
      }

      return new HttpRequestError(
        `Network error: ${axiosError.message}`,
        undefined,
        'Network Error',
        undefined,
        axiosError
      );
    }

    // Error in request configuration
    return new HttpRequestError(
      `Request configuration error: ${axiosError.message}`,
      undefined,
      'Configuration Error',
      undefined,
      axiosError
    );
  }

  // Non-axios error
  const message = error instanceof Error ? error.message : String(error);
  return new HttpRequestError(
    `Unexpected error: ${message}`,
    undefined,
    'Unknown Error',
    undefined,
    error instanceof Error ? error : undefined
  );
}

/**
 * Makes an HTTP request using axios
 *
 * @param config - Request configuration
 * @returns Promise resolving to HTTP response
 * @throws HttpRequestError on failure
 */
export async function makeHttpRequest(
  config: HttpRequestConfig
): Promise<HttpResponse> {
  const startTime = Date.now();

  try {
    const axiosConfig: AxiosRequestConfig = {
      method: config.method.toLowerCase(),
      url: config.url,
      headers: config.headers,
      params: config.queryParams,
      timeout: config.timeout,
    };

    // Add body for methods that support it
    if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      // If body is a JSON string, parse it to ensure proper serialization
      // This prevents double-encoding issues
      if (typeof config.body === 'string') {
        try {
          axiosConfig.data = JSON.parse(config.body);
        } catch {
          // Not valid JSON string, send as-is (raw text)
          axiosConfig.data = config.body;
        }
      } else {
        axiosConfig.data = config.body;
      }
    }

    const response = await axios(axiosConfig);
    const duration = Date.now() - startTime;

    return formatResponse(response, duration);
  } catch (error) {
    const duration = Date.now() - startTime;
    throw handleHttpError(error, duration);
  }
}

/**
 * Executes an HTTP request for a scenario step
 * Handles server configuration, header merging, and variable resolution
 *
 * @param server - Server configuration
 * @param method - HTTP method
 * @param endpoint - API endpoint
 * @param stepHeaders - Step-specific headers
 * @param body - Request body
 * @param queryParams - Query parameters
 * @param timeout - Request timeout (overrides server timeout)
 * @param context - Variable context for resolution
 * @returns Promise resolving to HTTP response
 */
export async function executeStepRequest(
  server: Server,
  method: HttpMethod,
  endpoint: string,
  stepHeaders: StepHeader[],
  body: unknown,
  queryParams: Record<string, string> | undefined,
  timeout: number | undefined,
  context: VariableContext
): Promise<HttpResponse> {
  // Build full URL
  const fullUrl = buildUrl(server.baseUrl, endpoint);

  // Merge headers
  const mergedHeaders = mergeHeaders(server.headers, stepHeaders);

  // Create request configuration
  const config: HttpRequestConfig = {
    method,
    url: fullUrl,
    headers: mergedHeaders,
    body,
    queryParams,
    timeout: timeout ?? server.timeout,
  };

  // Resolve variables in configuration
  const resolvedConfig = resolveRequestConfig(config, context);

  // Execute request
  return makeHttpRequest(resolvedConfig);
}
