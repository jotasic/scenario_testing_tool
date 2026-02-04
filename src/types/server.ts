/**
 * Server configuration types
 * Defines server connection settings and authentication headers
 */

/**
 * Header configuration for server requests
 */
export interface ServerHeader {
  /** Header key (e.g., "Content-Type", "Authorization") */
  key: string;
  /** Header value (supports variable references like "${token}") */
  value: string;
  /** Whether this header is enabled and should be sent with requests */
  enabled: boolean;
}

/**
 * Server definition for API endpoints
 */
export interface Server {
  /** Unique identifier (UUID) */
  id: string;
  /** Unique server name used for reference (e.g., "mock_server") */
  name: string;
  /** Base URL for the server (e.g., "http://mock.example.com") */
  baseUrl: string;
  /** Common headers applied to all requests to this server */
  headers: ServerHeader[];
  /** Request timeout in milliseconds */
  timeout: number;
  /** Optional description of the server's purpose */
  description?: string;
  /** ISO timestamp when server was created */
  createdAt: string;
  /** ISO timestamp when server was last updated */
  updatedAt: string;
}
