/**
 * ConditionBuilder Component
 * Visual builder for creating condition expressions with support for nested groups
 */

import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Divider,
  Chip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  AddCircle as AddGroupIcon,
} from '@mui/icons-material';
import type {
  ConditionExpression,
  Condition,
  ConditionGroup,
  ConditionSource,
  ComparisonOperator,
  LogicalOperator,
} from '@/types';
import { useCurrentSteps } from '@/store/hooks';

const OPERATORS: ComparisonOperator[] = [
  '==',
  '!=',
  '>',
  '>=',
  '<',
  '<=',
  'contains',
  'notContains',
  'isEmpty',
  'isNotEmpty',
  'exists',
];

const OPERATOR_LABELS: Record<ComparisonOperator, string> = {
  '==': 'Equals',
  '!=': 'Not Equals',
  '>': 'Greater Than',
  '>=': 'Greater or Equal',
  '<': 'Less Than',
  '<=': 'Less or Equal',
  'contains': 'Contains',
  'notContains': 'Does Not Contain',
  'isEmpty': 'Is Empty',
  'isNotEmpty': 'Is Not Empty',
  'exists': 'Exists',
};

interface ConditionBuilderProps {
  value: ConditionExpression | undefined;
  onChange: (value: ConditionExpression | undefined) => void;
  depth?: number;
}

export function ConditionBuilder({ value, onChange, depth = 0 }: ConditionBuilderProps) {
  const steps = useCurrentSteps();
  const requestSteps = steps.filter((s) => s.type === 'request');

  const isGroup = value && 'operator' in value && 'conditions' in value;

  const handleCreateGroup = () => {
    const newGroup: ConditionGroup = {
      id: `cond_group_${Date.now()}`,
      operator: 'AND',
      conditions: [],
    };
    onChange(newGroup);
  };

  const handleCreateCondition = () => {
    const newCondition: Condition = {
      id: `cond_${Date.now()}`,
      source: 'params',
      field: '',
      operator: '==',
    };
    onChange(newCondition);
  };

  if (!value) {
    return (
      <Box sx={{ display: 'flex', gap: 1, ml: depth * 2, flexWrap: 'wrap' }}>
        <Button
          startIcon={<AddIcon />}
          onClick={handleCreateCondition}
          variant="outlined"
          size="small"
        >
          Condition
        </Button>
        <Button
          startIcon={<AddGroupIcon />}
          onClick={handleCreateGroup}
          variant="outlined"
          size="small"
        >
          Group
        </Button>
      </Box>
    );
  }

  if (isGroup) {
    return (
      <ConditionGroupEditor
        value={value as ConditionGroup}
        onChange={onChange}
        onDelete={() => onChange(undefined)}
        depth={depth}
      />
    );
  }

  return (
    <ConditionEditor
      value={value as Condition}
      onChange={onChange}
      onDelete={() => onChange(undefined)}
      depth={depth}
      requestSteps={requestSteps}
    />
  );
}

interface ConditionGroupEditorProps {
  value: ConditionGroup;
  onChange: (value: ConditionExpression) => void;
  onDelete: () => void;
  depth: number;
}

function ConditionGroupEditor({ value, onChange, onDelete, depth }: ConditionGroupEditorProps) {
  const handleOperatorChange = (operator: LogicalOperator) => {
    onChange({ ...value, operator });
  };

  const handleAddCondition = () => {
    const newCondition: Condition = {
      id: `cond_${Date.now()}`,
      source: 'params',
      field: '',
      operator: '==',
    };
    onChange({
      ...value,
      conditions: [...value.conditions, newCondition],
    });
  };

  const handleAddGroup = () => {
    const newGroup: ConditionGroup = {
      id: `cond_group_${Date.now()}`,
      operator: 'AND',
      conditions: [],
    };
    onChange({
      ...value,
      conditions: [...value.conditions, newGroup],
    });
  };

  const handleConditionChange = (index: number, newValue: ConditionExpression | undefined) => {
    const newConditions = [...value.conditions];
    if (newValue === undefined) {
      newConditions.splice(index, 1);
    } else {
      newConditions[index] = newValue;
    }
    onChange({ ...value, conditions: newConditions });
  };

  return (
    <Paper
      elevation={depth}
      sx={{
        p: 2,
        ml: depth * 2,
        border: '1px solid',
        borderColor: 'divider',
        position: 'relative',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <ToggleButtonGroup
          value={value.operator}
          exclusive
          onChange={(_, newOperator) => newOperator && handleOperatorChange(newOperator)}
          size="small"
        >
          <ToggleButton value="AND">AND</ToggleButton>
          <ToggleButton value="OR">OR</ToggleButton>
        </ToggleButtonGroup>

        <IconButton onClick={onDelete} size="small" color="error">
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {value.conditions.map((condition, index) => (
          <Box key={'id' in condition ? condition.id : index}>
            <ConditionBuilder
              value={condition}
              onChange={(newValue) => handleConditionChange(index, newValue)}
              depth={depth + 1}
            />
          </Box>
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button startIcon={<AddIcon />} onClick={handleAddCondition} size="small" variant="outlined">
          Condition
        </Button>
        <Button startIcon={<AddGroupIcon />} onClick={handleAddGroup} size="small" variant="outlined">
          Group
        </Button>
      </Box>
    </Paper>
  );
}

interface ConditionEditorProps {
  value: Condition;
  onChange: (value: Condition) => void;
  onDelete: () => void;
  depth: number;
  requestSteps: any[];
}

function ConditionEditor({ value, onChange, onDelete, depth, requestSteps }: ConditionEditorProps) {
  const needsValue = !['isEmpty', 'isNotEmpty', 'exists'].includes(value.operator);

  const handleChange = (field: string, fieldValue: any) => {
    onChange({ ...value, [field]: fieldValue } as Condition);
  };

  const handleSourceChange = (source: ConditionSource) => {
    if (source === 'params') {
      const newCondition: Condition = {
        id: value.id,
        source: 'params',
        field: value.field,
        operator: value.operator,
        value: value.value,
      };
      onChange(newCondition);
    } else {
      const newCondition: Condition = {
        id: value.id,
        source: 'response',
        stepId: requestSteps[0]?.id || '',
        field: value.field,
        operator: value.operator,
        value: value.value,
      };
      onChange(newCondition);
    }
  };

  const insertTemplate = (template: string) => {
    const currentField = value.field || '';
    const newField = currentField ? `${currentField}.${template}` : template;
    handleChange('field', newField);
  };

  return (
    <Paper
      sx={{
        p: 2,
        ml: depth * 2,
        border: '1px solid',
        borderColor: 'divider',
        position: 'relative',
      }}
    >
      {/* Delete button at top right */}
      <IconButton
        onClick={onDelete}
        size="small"
        color="error"
        sx={{ position: 'absolute', top: 8, right: 8 }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>

      {/* Condition fields in vertical layout */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pr: 4 }}>
        {/* Source and Step (if response) in one row */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 100, flex: '1 1 100px' }}>
            <InputLabel>Source</InputLabel>
            <Select
              value={value.source}
              label="Source"
              onChange={(e) => handleSourceChange(e.target.value as ConditionSource)}
            >
              <MenuItem value="params">Parameters</MenuItem>
              <MenuItem value="response">Response</MenuItem>
            </Select>
          </FormControl>

          {value.source === 'response' && (
            <FormControl size="small" sx={{ minWidth: 120, flex: '1 1 120px' }}>
              <InputLabel>Step</InputLabel>
              <Select
                value={'stepId' in value ? value.stepId : ''}
                label="Step"
                onChange={(e) => handleChange('stepId', e.target.value)}
              >
                {requestSteps.map((step) => (
                  <MenuItem key={step.id} value={step.id}>
                    {step.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        {/* Field path */}
        <Box>
          <TextField
            label="Field Path"
            value={value.field}
            onChange={(e) => handleChange('field', e.target.value)}
            size="small"
            placeholder="data.status, items[0].name, ${loop.item}.id"
            helperText={
              <Box component="span" sx={{ fontSize: '0.75rem' }}>
                JSON path to field. Array: <code style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '0 4px', borderRadius: '2px' }}>items[0]</code>,
                Loop item: <code style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '0 4px', borderRadius: '2px' }}>{'${loop.item}'}</code>,
                Loop index: <code style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '0 4px', borderRadius: '2px' }}>{'${loop.index}'}</code>
              </Box>
            }
            fullWidth
          />

          {/* Quick insert templates */}
          <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', alignSelf: 'center', mr: 0.5 }}>
              Quick insert:
            </Typography>
            <Chip
              label="${loop.item}"
              size="small"
              onClick={() => insertTemplate('${loop.item}')}
              sx={{ cursor: 'pointer', height: 20, fontSize: '0.7rem' }}
            />
            <Chip
              label="${loop.index}"
              size="small"
              onClick={() => insertTemplate('${loop.index}')}
              sx={{ cursor: 'pointer', height: 20, fontSize: '0.7rem' }}
            />
            <Chip
              label="[0]"
              size="small"
              onClick={() => {
                const currentField = value.field || '';
                handleChange('field', `${currentField}[0]`);
              }}
              sx={{ cursor: 'pointer', height: 20, fontSize: '0.7rem' }}
            />
          </Box>
        </Box>

        {/* Operator and Value in one row */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 120, flex: '1 1 120px' }}>
            <InputLabel>Operator</InputLabel>
            <Select
              value={value.operator}
              label="Operator"
              onChange={(e) => handleChange('operator', e.target.value)}
            >
              {OPERATORS.map((op) => (
                <MenuItem key={op} value={op}>
                  {OPERATOR_LABELS[op]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {needsValue && (
            <TextField
              label="Value"
              value={value.value ?? ''}
              onChange={(e) => handleChange('value', e.target.value)}
              size="small"
              sx={{ flex: '1 1 100px' }}
            />
          )}
        </Box>
      </Box>
    </Paper>
  );
}
