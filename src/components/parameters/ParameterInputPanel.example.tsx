/**
 * Example Usage of Parameter Components
 * This file demonstrates various use cases for the parameter input components
 */

import React from 'react';
import { Box, Container, Paper, Typography, Divider } from '@mui/material';
import { ParameterInputPanel, DynamicParameterForm, ParameterPreview } from './index';
import type { ParameterSchema, ParameterValue } from '@/types';

/**
 * Example 1: Simple Form with Basic Types
 */
export function SimpleParameterExample() {
  const schemas: ParameterSchema[] = [
    {
      id: 'username',
      name: 'username',
      type: 'string',
      required: true,
      description: 'User login name',
      validation: {
        min: 3,
        max: 20,
        pattern: '^[a-zA-Z0-9_]+$',
      },
    },
    {
      id: 'age',
      name: 'age',
      type: 'number',
      required: false,
      defaultValue: 18,
      description: 'User age',
      validation: {
        min: 0,
        max: 120,
      },
    },
    {
      id: 'active',
      name: 'active',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Whether the user is active',
    },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Simple Parameter Form
      </Typography>
      <Paper sx={{ p: 2 }}>
        <ParameterInputPanel schemas={schemas} />
      </Paper>
    </Container>
  );
}

/**
 * Example 2: Complex Nested Structure
 */
export function NestedParameterExample() {
  const schemas: ParameterSchema[] = [
    {
      id: 'user',
      name: 'user',
      type: 'object',
      required: true,
      description: 'User information',
      properties: [
        {
          id: 'firstName',
          name: 'firstName',
          type: 'string',
          required: true,
          description: 'First name',
        },
        {
          id: 'lastName',
          name: 'lastName',
          type: 'string',
          required: true,
          description: 'Last name',
        },
        {
          id: 'email',
          name: 'email',
          type: 'string',
          required: true,
          description: 'Email address',
          validation: {
            pattern: '^[^@]+@[^@]+\\.[^@]+$',
          },
        },
      ],
    },
    {
      id: 'permissions',
      name: 'permissions',
      type: 'array',
      required: false,
      description: 'User permissions',
      itemSchema: {
        id: 'permission',
        name: 'permission',
        type: 'string',
        required: true,
        validation: {
          enum: ['read', 'write', 'delete', 'admin'],
        },
      },
    },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Nested Parameters
      </Typography>
      <Paper sx={{ p: 2 }}>
        <ParameterInputPanel schemas={schemas} />
      </Paper>
    </Container>
  );
}

/**
 * Example 3: Array of Objects
 */
export function ArrayOfObjectsExample() {
  const schemas: ParameterSchema[] = [
    {
      id: 'products',
      name: 'products',
      type: 'array',
      required: true,
      description: 'List of products to order',
      itemSchema: {
        id: 'product',
        name: 'product',
        type: 'object',
        required: true,
        properties: [
          {
            id: 'productId',
            name: 'productId',
            type: 'string',
            required: true,
            description: 'Product SKU',
          },
          {
            id: 'quantity',
            name: 'quantity',
            type: 'number',
            required: true,
            description: 'Order quantity',
            defaultValue: 1,
            validation: {
              min: 1,
            },
          },
          {
            id: 'price',
            name: 'price',
            type: 'number',
            required: true,
            description: 'Unit price',
            validation: {
              min: 0,
            },
          },
        ],
      },
    },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Array of Objects
      </Typography>
      <Paper sx={{ p: 2 }}>
        <ParameterInputPanel schemas={schemas} />
      </Paper>
    </Container>
  );
}

/**
 * Example 4: With Variable References
 */
export function VariableReferenceExample() {
  const schemas: ParameterSchema[] = [
    {
      id: 'baseUrl',
      name: 'baseUrl',
      type: 'string',
      required: true,
      defaultValue: 'https://api.example.com',
      description: 'Base API URL',
    },
    {
      id: 'endpoint',
      name: 'endpoint',
      type: 'string',
      required: true,
      defaultValue: '${baseUrl}/users',
      description: 'Full endpoint URL (can reference baseUrl)',
    },
    {
      id: 'token',
      name: 'token',
      type: 'string',
      required: true,
      defaultValue: 'abc123',
      description: 'Authentication token',
    },
    {
      id: 'authHeader',
      name: 'authHeader',
      type: 'string',
      required: false,
      defaultValue: 'Bearer ${token}',
      description: 'Authorization header value',
    },
  ];

  const [values, setValues] = React.useState<Record<string, ParameterValue>>({
    baseUrl: 'https://api.example.com',
    endpoint: '${baseUrl}/users',
    token: 'abc123',
    authHeader: 'Bearer ${token}',
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Variable References
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Input Form
          </Typography>
          <DynamicParameterForm
            schemas={schemas}
            values={values}
            onChange={setValues}
          />
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Preview (Variable References Highlighted)
          </Typography>
          <ParameterPreview values={values} highlightVariables />
        </Paper>
      </Box>
    </Container>
  );
}

/**
 * Example 5: API Testing Scenario
 */
export function ApiTestingExample() {
  const schemas: ParameterSchema[] = [
    {
      id: 'config',
      name: 'config',
      type: 'object',
      required: true,
      description: 'API configuration',
      properties: [
        {
          id: 'baseUrl',
          name: 'baseUrl',
          type: 'string',
          required: true,
          defaultValue: 'https://api.example.com',
        },
        {
          id: 'timeout',
          name: 'timeout',
          type: 'number',
          required: false,
          defaultValue: 30000,
          validation: { min: 0 },
        },
        {
          id: 'retries',
          name: 'retries',
          type: 'number',
          required: false,
          defaultValue: 3,
          validation: { min: 0, max: 10 },
        },
      ],
    },
    {
      id: 'testCases',
      name: 'testCases',
      type: 'array',
      required: true,
      description: 'Test cases to execute',
      itemSchema: {
        id: 'testCase',
        name: 'testCase',
        type: 'object',
        required: true,
        properties: [
          {
            id: 'name',
            name: 'name',
            type: 'string',
            required: true,
          },
          {
            id: 'method',
            name: 'method',
            type: 'string',
            required: true,
            validation: {
              enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            },
          },
          {
            id: 'path',
            name: 'path',
            type: 'string',
            required: true,
          },
          {
            id: 'expectedStatus',
            name: 'expectedStatus',
            type: 'number',
            required: true,
            defaultValue: 200,
            validation: { min: 100, max: 599 },
          },
        ],
      },
    },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        API Testing Scenario
      </Typography>
      <Paper sx={{ p: 2 }}>
        <ParameterInputPanel
          schemas={schemas}
          onApply={(values) => {
            console.log('Test configuration:', values);
            alert('Parameters applied! Check console for values.');
          }}
        />
      </Paper>
    </Container>
  );
}

/**
 * Example 6: All Examples Showcase
 */
export function ParameterComponentsShowcase() {
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h2" gutterBottom align="center">
          Parameter Components Showcase
        </Typography>
        <Typography variant="body1" paragraph align="center" color="text.secondary">
          Interactive examples demonstrating the parameter input components
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Stack spacing={6}>
          <SimpleParameterExample />
          <Divider />
          <NestedParameterExample />
          <Divider />
          <ArrayOfObjectsExample />
          <Divider />
          <VariableReferenceExample />
          <Divider />
          <ApiTestingExample />
        </Stack>
      </Container>
    </Box>
  );
}

// Helper imports
import { Stack } from '@mui/material';
