# Recursive Step Visualization Component Architecture

## 1. Context

### 1.1 Current State

현재 `LoopNode.tsx`와 `GroupNode.tsx`에서 child step을 렌더링하는 코드가 약 300줄 이상 중복되어 있습니다.

**중복되는 코드 패턴:**
- Child steps 해석 (`stepIds` -> `Step[]`)
- Step 아이콘/색상 매핑 (`getStepIcon`, `getStepColor`)
- Step 아이템 렌더링 (클릭 가능한 카드 형태)
- Condition branch 시각화
- Container target (Loop/Group)의 nested children 표시

### 1.2 Problem Statement

```
현재 구조의 문제점:
┌─────────────────────────────────────────────────────────────────┐
│  LoopNode.tsx (730 lines)                                       │
│  ├── childSteps 렌더링 로직 (~200 lines)                         │
│  └── branch target 렌더링 로직 (~100 lines)  ← 중복!             │
├─────────────────────────────────────────────────────────────────┤
│  GroupNode.tsx (634 lines)                                      │
│  ├── childSteps 렌더링 로직 (~200 lines)  ← 거의 동일!           │
│  └── branch target 렌더링 로직 (~100 lines)  ← 중복!             │
└─────────────────────────────────────────────────────────────────┘
```

**추가 문제:**
- 무한 중첩 시 재귀 렌더링 불가 (현재는 1-depth만 표시)
- 깊은 중첩 구조에서 성능/가독성 저하
- 새로운 step type 추가 시 여러 파일 수정 필요

### 1.3 Constraints

| Constraint | Description |
|------------|-------------|
| Technology | React 18+, TypeScript, MUI v5, ReactFlow |
| Performance | 중첩 depth 3-4까지는 60fps 유지 필요 |
| Accessibility | 키보드 네비게이션, 스크린리더 호환 |
| Bundle Size | 추가 의존성 최소화 |

---

## 2. Design Options

### Option A: Recursive Component with Context

**Description:**
재귀적 `StepTreeRenderer` 컴포넌트를 만들고, Context를 통해 depth와 설정을 전달합니다.

```
┌────────────────────────────────────────────────────────────┐
│  StepVisualizationContext                                  │
│  ├── maxDepth: number                                      │
│  ├── currentDepth: number                                  │
│  ├── collapsedPaths: Set<string>                          │
│  ├── onStepClick: (stepId) => void                        │
│  └── allSteps: Step[]                                      │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│  <StepTreeRenderer step={step} />                          │
│                                                            │
│  switch (step.type):                                       │
│    case 'request':    <RequestStepItem />                  │
│    case 'condition':  <ConditionStepItem>                  │
│                         <BranchList>                       │
│                           <StepTreeRenderer /> ← 재귀      │
│                         </BranchList>                      │
│                       </ConditionStepItem>                 │
│    case 'loop':       <ContainerStepItem>                  │
│    case 'group':        <StepTreeRenderer /> ← 재귀        │
│                       </ContainerStepItem>                 │
└────────────────────────────────────────────────────────────┘
```

**Pros:**
- Context로 설정을 한 번에 관리
- 재귀 depth 추적이 자연스러움
- 컴포넌트 간 loose coupling

**Cons:**
- Context 남용 시 re-render 이슈
- Provider 중첩으로 구조 복잡해질 수 있음

**Effort:** M (Medium)

---

### Option B: Compound Component Pattern

**Description:**
`StepList`, `StepItem`, `StepChildren` 등 조합 가능한 작은 컴포넌트들로 구성합니다.

```typescript
<StepList steps={childSteps} maxDepth={3}>
  {(step, depth) => (
    <StepItem step={step} depth={depth}>
      <StepItem.Icon />
      <StepItem.Content />
      <StepItem.Children /> {/* 자동으로 재귀 */}
    </StepItem>
  )}
</StepList>
```

**Pros:**
- 높은 유연성과 커스터마이징
- 부분적 오버라이드 가능
- 테스트 용이

**Cons:**
- 사용하는 쪽의 boilerplate 증가
- API 학습 곡선
- 일관성 유지가 어려울 수 있음

**Effort:** L (Large)

---

### Option C: Recursive HOC + Render Props (Hybrid)

**Description:**
재귀 로직은 HOC로 감싸고, 렌더링은 render props로 위임합니다.

```typescript
const RecursiveStepRenderer = withRecursiveRendering(
  ({ step, depth, renderChildren }) => (
    <StepCard step={step} depth={depth}>
      {renderChildren(step.children)}
    </StepCard>
  )
);
```

**Pros:**
- 재귀 로직 완전 분리
- 다양한 렌더링 전략 적용 가능

**Cons:**
- HOC 패턴이 다소 구식
- TypeScript 타입 추론 복잡
- 디버깅 어려움

**Effort:** M (Medium)

---

### Option D: Single Recursive Component with Props (Recommended)

**Description:**
단일 `RecursiveStepList` 컴포넌트가 모든 케이스를 처리하며, props로 설정을 전달합니다.

```
┌─────────────────────────────────────────────────────────────┐
│  <RecursiveStepList                                         │
│    steps={childSteps}                                       │
│    allSteps={allSteps}                                      │
│    depth={0}                                                │
│    maxDepth={3}                                             │
│    collapsedSteps={collapsedSet}                            │
│    onToggleCollapse={handleToggle}                          │
│    onStepClick={handleClick}                                │
│    containerType="loop" | "group"                           │
│    containerColor="#9c27b0"                                 │
│  />                                                         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Internal Structure:                                        │
│                                                             │
│  steps.map(step =>                                          │
│    <StepItemCard step={step} depth={depth}>                 │
│      {step.type === 'condition' &&                          │
│        <BranchTargetList branches={step.branches}>          │
│          {branch.nextStep is container &&                   │
│            <RecursiveStepList                               │
│              steps={branch.nextStep.children}               │
│              depth={depth + 1}  ← 재귀                      │
│            />                                               │
│          }                                                  │
│        </BranchTargetList>                                  │
│      }                                                      │
│      {(step.type === 'loop' || step.type === 'group') &&    │
│        <RecursiveStepList                                   │
│          steps={step.children}                              │
│          depth={depth + 1}  ← 재귀                          │
│        />                                                   │
│      }                                                      │
│    </StepItemCard>                                          │
│  )                                                          │
└─────────────────────────────────────────────────────────────┘
```

**Pros:**
- 단순하고 이해하기 쉬움
- Context 없이 props drilling으로 명시적
- 타입 안전성 높음
- 메모이제이션 적용 용이
- 테스트가 쉬움

**Cons:**
- 깊은 중첩 시 props 전달이 많아질 수 있음 (하지만 maxDepth로 제한되므로 문제없음)

**Effort:** S-M (Small to Medium)

---

## 3. Recommendation

### 3.1 Chosen Approach: Option D - Single Recursive Component

**Rationale:**
1. **단순성**: 하나의 컴포넌트가 모든 케이스를 처리하여 이해하기 쉬움
2. **명시적 데이터 흐름**: props drilling이지만 maxDepth가 3-4로 제한되므로 문제없음
3. **타입 안전성**: TypeScript로 모든 props를 명확하게 타입 지정 가능
4. **성능 최적화 용이**: `React.memo`로 불필요한 re-render 방지 가능
5. **점진적 도입**: 기존 코드를 점진적으로 마이그레이션 가능

---

## 4. Implementation Design

### 4.1 File Structure

```
src/components/flow/nodes/
├── LoopNode.tsx              (기존, 수정)
├── GroupNode.tsx             (기존, 수정)
├── ConditionNode.tsx         (기존, 유지)
├── RequestNode.tsx           (기존, 유지)
└── shared/
    ├── index.ts              (새로 생성)
    ├── RecursiveStepList.tsx (새로 생성) - 메인 재귀 컴포넌트
    ├── StepItemCard.tsx      (새로 생성) - 개별 step 카드
    ├── BranchTargetList.tsx  (새로 생성) - condition branch 목록
    ├── stepVisualUtils.ts    (새로 생성) - 아이콘/색상 유틸리티
    └── types.ts              (새로 생성) - 공유 타입 정의
```

### 4.2 Props Interface Design

```typescript
// src/components/flow/nodes/shared/types.ts

import type { Step, ConditionStep, LoopStep, GroupStep, Branch } from '@/types';

/**
 * Container step types that can have children
 */
export type ContainerStep = LoopStep | GroupStep;

/**
 * Step types for visualization styling
 */
export type StepVisualizationType = 'request' | 'condition' | 'loop' | 'group';

/**
 * Configuration for recursive rendering behavior
 */
export interface RecursiveRenderConfig {
  /** Maximum depth to render (0 = unlimited, default: 3) */
  maxDepth: number;
  /** Current rendering depth (internal use) */
  currentDepth: number;
  /** Set of step IDs that are collapsed */
  collapsedStepIds: Set<string>;
  /** Whether to auto-collapse steps beyond a certain depth */
  autoCollapseDepth: number;
}

/**
 * Event handlers for step interactions
 */
export interface StepInteractionHandlers {
  /** Called when a step is clicked */
  onStepClick: (stepId: string, event: React.MouseEvent) => void;
  /** Called when collapse/expand is toggled */
  onToggleCollapse: (stepId: string) => void;
}

/**
 * Props for RecursiveStepList component
 */
export interface RecursiveStepListProps {
  /** Steps to render */
  steps: Step[];
  /** All steps in the scenario (for resolving references) */
  allSteps: Step[];
  /** Parent container type (affects styling) */
  containerType: 'loop' | 'group' | 'root';
  /** Parent container's theme color */
  containerColor: string;
  /** Current nesting depth (0 = top level) */
  depth?: number;
  /** Maximum depth to render before showing placeholder */
  maxDepth?: number;
  /** Set of collapsed step IDs */
  collapsedStepIds?: Set<string>;
  /** Depth at which to auto-collapse (default: 2) */
  autoCollapseDepth?: number;
  /** Step click handler */
  onStepClick: (stepId: string, event: React.MouseEvent) => void;
  /** Collapse toggle handler */
  onToggleCollapse?: (stepId: string) => void;
  /** Whether the list is inside a container's scope */
  parentStepIds?: string[];
}

/**
 * Props for StepItemCard component
 */
export interface StepItemCardProps {
  /** Step to render */
  step: Step;
  /** All steps for resolving references */
  allSteps: Step[];
  /** Current nesting depth */
  depth: number;
  /** Maximum rendering depth */
  maxDepth: number;
  /** Whether this step is collapsed */
  isCollapsed: boolean;
  /** Click handler */
  onStepClick: (stepId: string, event: React.MouseEvent) => void;
  /** Collapse toggle handler */
  onToggleCollapse: (stepId: string) => void;
  /** Container's theme color */
  containerColor: string;
  /** Parent step IDs (for scope checking) */
  parentStepIds?: string[];
  /** Recursive render function for children */
  renderChildren: (childSteps: Step[], newDepth: number) => React.ReactNode;
}

/**
 * Props for BranchTargetList component
 */
export interface BranchTargetListProps {
  /** Branches to render */
  branches: Branch[];
  /** All steps for resolving targets */
  allSteps: Step[];
  /** Current nesting depth */
  depth: number;
  /** Maximum rendering depth */
  maxDepth: number;
  /** Click handler */
  onStepClick: (stepId: string, event: React.MouseEvent) => void;
  /** Collapse toggle handler */
  onToggleCollapse: (stepId: string) => void;
  /** Parent step IDs for scope checking */
  parentStepIds?: string[];
  /** Collapsed step IDs */
  collapsedStepIds: Set<string>;
  /** Render function for nested children */
  renderChildren: (childSteps: Step[], newDepth: number) => React.ReactNode;
}

/**
 * Depth indicator configuration
 */
export interface DepthIndicatorConfig {
  /** Show depth number badge */
  showDepthBadge: boolean;
  /** Show vertical indent lines */
  showIndentLines: boolean;
  /** Indent size per depth level (in pixels) */
  indentSize: number;
}
```

### 4.3 Component Implementation

#### 4.3.1 stepVisualUtils.ts

```typescript
// src/components/flow/nodes/shared/stepVisualUtils.ts

import HttpIcon from '@mui/icons-material/Http';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import LoopIcon from '@mui/icons-material/Loop';
import FolderIcon from '@mui/icons-material/Folder';
import type { Step, StepType } from '@/types';

/**
 * Color mapping for each step type
 */
export const STEP_COLORS: Record<StepType, string> = {
  request: '#1976d2',
  condition: '#ed6c02',
  loop: '#9c27b0',
  group: '#0288d1',
};

/**
 * Get the theme color for a step type
 */
export function getStepColor(type: StepType): string {
  return STEP_COLORS[type] || '#757575';
}

/**
 * Get the icon component for a step type
 */
export function getStepIcon(type: StepType, fontSize: number = 14): JSX.Element | null {
  const sx = { fontSize };
  
  switch (type) {
    case 'request':
      return <HttpIcon sx={sx} />;
    case 'condition':
      return <AltRouteIcon sx={sx} />;
    case 'loop':
      return <LoopIcon sx={sx} />;
    case 'group':
      return <FolderIcon sx={sx} />;
    default:
      return null;
  }
}

/**
 * Check if a step is a container (can have children)
 */
export function isContainerStep(step: Step): step is (LoopStep | GroupStep) {
  return step.type === 'loop' || step.type === 'group';
}

/**
 * Get child step IDs from a container step
 */
export function getChildStepIds(step: Step): string[] {
  if (step.type === 'loop' || step.type === 'group') {
    return (step as any).stepIds || [];
  }
  return [];
}

/**
 * Resolve step IDs to Step objects
 */
export function resolveSteps(stepIds: string[], allSteps: Step[]): Step[] {
  return stepIds
    .map((id) => allSteps.find((s) => s.id === id))
    .filter((s): s is Step => s !== undefined);
}

/**
 * Calculate visual indent based on depth
 */
export function getIndentStyle(depth: number, baseIndent: number = 12): React.CSSProperties {
  return {
    marginLeft: depth * baseIndent,
  };
}

/**
 * Get depth indicator color (progressively fades)
 */
export function getDepthIndicatorColor(depth: number, maxDepth: number): string {
  const opacity = Math.max(0.2, 1 - (depth / maxDepth) * 0.6);
  return `rgba(0, 0, 0, ${opacity})`;
}
```

#### 4.3.2 RecursiveStepList.tsx

```typescript
// src/components/flow/nodes/shared/RecursiveStepList.tsx

import { memo, useCallback, useMemo } from 'react';
import { Box, Typography, Stack, Collapse, IconButton, Chip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import type { Step, ConditionStep } from '@/types';
import type { RecursiveStepListProps } from './types';
import { StepItemCard } from './StepItemCard';
import { BranchTargetList } from './BranchTargetList';
import { 
  getStepColor, 
  getStepIcon, 
  isContainerStep, 
  resolveSteps,
  getChildStepIds 
} from './stepVisualUtils';

/**
 * Default configuration values
 */
const DEFAULT_MAX_DEPTH = 3;
const DEFAULT_AUTO_COLLAPSE_DEPTH = 2;

/**
 * RecursiveStepList - Renders a list of steps with recursive nesting support
 * 
 * This component handles:
 * - Rendering child steps of Loop/Group containers
 * - Rendering branch targets for Condition steps
 * - Automatic depth limiting with "show more" indicator
 * - Collapsible nested containers
 */
function RecursiveStepListComponent({
  steps,
  allSteps,
  containerType,
  containerColor,
  depth = 0,
  maxDepth = DEFAULT_MAX_DEPTH,
  collapsedStepIds = new Set(),
  autoCollapseDepth = DEFAULT_AUTO_COLLAPSE_DEPTH,
  onStepClick,
  onToggleCollapse,
  parentStepIds = [],
}: RecursiveStepListProps): JSX.Element {
  
  // Check if we've reached the depth limit
  const isAtMaxDepth = depth >= maxDepth;
  
  // Determine if a step should be auto-collapsed
  const shouldAutoCollapse = useCallback(
    (stepId: string) => {
      if (collapsedStepIds.has(stepId)) return true;
      if (depth >= autoCollapseDepth) return true;
      return false;
    },
    [collapsedStepIds, depth, autoCollapseDepth]
  );
  
  // Render function for recursive children
  const renderChildren = useCallback(
    (childSteps: Step[], newDepth: number) => (
      <RecursiveStepList
        steps={childSteps}
        allSteps={allSteps}
        containerType={containerType}
        containerColor={containerColor}
        depth={newDepth}
        maxDepth={maxDepth}
        collapsedStepIds={collapsedStepIds}
        autoCollapseDepth={autoCollapseDepth}
        onStepClick={onStepClick}
        onToggleCollapse={onToggleCollapse}
        parentStepIds={parentStepIds}
      />
    ),
    [
      allSteps,
      containerType,
      containerColor,
      maxDepth,
      collapsedStepIds,
      autoCollapseDepth,
      onStepClick,
      onToggleCollapse,
      parentStepIds,
    ]
  );
  
  // Show depth limit indicator
  if (isAtMaxDepth && steps.length > 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          p: 0.75,
          bgcolor: 'rgba(0,0,0,0.04)',
          borderRadius: 1,
          border: '1px dashed',
          borderColor: 'divider',
        }}
      >
        <MoreHorizIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: '0.6rem',
            fontStyle: 'italic',
          }}
        >
          {steps.length} nested step{steps.length !== 1 ? 's' : ''} (expand to view)
        </Typography>
      </Box>
    );
  }
  
  // Empty state
  if (steps.length === 0) {
    return (
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          fontStyle: 'italic',
          display: 'block',
          textAlign: 'center',
          py: 0.5,
          fontSize: '0.6rem',
        }}
      >
        No steps
      </Typography>
    );
  }
  
  return (
    <Stack spacing={0.5}>
      {steps.map((step, index) => {
        const isCollapsed = shouldAutoCollapse(step.id);
        const isContainer = isContainerStep(step);
        const childStepIds = getChildStepIds(step);
        const childSteps = resolveSteps(childStepIds, allSteps);
        
        return (
          <Box key={step.id}>
            {/* Arrow between steps */}
            {index > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.25 }}>
                <ArrowDownwardIcon sx={{ fontSize: 10, color: 'text.disabled' }} />
              </Box>
            )}
            
            {/* Step Card */}
            <StepItemCard
              step={step}
              allSteps={allSteps}
              depth={depth}
              maxDepth={maxDepth}
              isCollapsed={isCollapsed}
              onStepClick={onStepClick}
              onToggleCollapse={onToggleCollapse || (() => {})}
              containerColor={containerColor}
              parentStepIds={parentStepIds}
              renderChildren={renderChildren}
            />
            
            {/* Condition Branches */}
            {step.type === 'condition' && (step as ConditionStep).branches.length > 0 && (
              <BranchTargetList
                branches={(step as ConditionStep).branches}
                allSteps={allSteps}
                depth={depth}
                maxDepth={maxDepth}
                onStepClick={onStepClick}
                onToggleCollapse={onToggleCollapse || (() => {})}
                parentStepIds={parentStepIds}
                collapsedStepIds={collapsedStepIds}
                renderChildren={renderChildren}
              />
            )}
            
            {/* Container Children (Loop/Group) */}
            {isContainer && childSteps.length > 0 && !isCollapsed && (
              <Collapse in={!isCollapsed}>
                <Box
                  sx={{
                    ml: 2,
                    mt: 0.5,
                    pl: 1,
                    borderLeft: '2px solid',
                    borderColor: `${getStepColor(step.type)}40`,
                  }}
                >
                  {renderChildren(childSteps, depth + 1)}
                </Box>
              </Collapse>
            )}
          </Box>
        );
      })}
    </Stack>
  );
}

export const RecursiveStepList = memo(RecursiveStepListComponent);
```

#### 4.3.3 StepItemCard.tsx

```typescript
// src/components/flow/nodes/shared/StepItemCard.tsx

import { memo } from 'react';
import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { Step } from '@/types';
import type { StepItemCardProps } from './types';
import { getStepColor, getStepIcon, isContainerStep, getChildStepIds } from './stepVisualUtils';

/**
 * StepItemCard - Renders a single step as a clickable card
 * 
 * Features:
 * - Type-specific icon and color
 * - Collapsible indicator for containers
 * - Depth-aware styling
 * - Click to select step
 */
function StepItemCardComponent({
  step,
  allSteps,
  depth,
  maxDepth,
  isCollapsed,
  onStepClick,
  onToggleCollapse,
  containerColor,
  parentStepIds = [],
}: StepItemCardProps): JSX.Element {
  const stepColor = getStepColor(step.type);
  const isContainer = isContainerStep(step);
  const childCount = getChildStepIds(step).length;
  
  // Determine if this step is a nested container (needs special styling)
  const isNestedContainer = isContainer && depth > 0;
  
  // Handle collapse toggle
  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCollapse(step.id);
  };
  
  return (
    <Box
      onClick={(e) => onStepClick(step.id, e)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        p: depth === 0 ? 1 : 0.75,
        bgcolor: isNestedContainer ? `${stepColor}08` : 'white',
        borderRadius: 1.5,
        border: isNestedContainer ? '2px solid' : '1.5px solid',
        borderColor: isNestedContainer ? stepColor : 'divider',
        borderLeft: '4px solid',
        borderLeftColor: stepColor,
        boxShadow: depth === 0 ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
        transition: 'all 0.2s',
        cursor: 'pointer',
        minHeight: depth === 0 ? 44 : 36,
        '&:hover': {
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          transform: 'translateX(2px)',
          bgcolor: isNestedContainer ? `${stepColor}12` : 'rgba(0,0,0,0.02)',
        },
      }}
    >
      {/* Step Icon */}
      <Box sx={{ color: stepColor, display: 'flex', flexShrink: 0 }}>
        {getStepIcon(step.type, depth === 0 ? 14 : 12)}
      </Box>
      
      {/* Step Name */}
      <Typography
        variant="caption"
        sx={{
          flex: 1,
          fontWeight: isContainer ? 700 : 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: depth === 0 ? '0.7rem' : '0.65rem',
          color: isNestedContainer ? stepColor : 'text.primary',
        }}
      >
        {step.name}
      </Typography>
      
      {/* Child count for containers */}
      {isContainer && (
        <Typography
          component="span"
          sx={{
            fontSize: '0.55rem',
            color: stepColor,
            opacity: 0.7,
          }}
        >
          ({childCount})
        </Typography>
      )}
      
      {/* Type chip */}
      <Chip
        label={step.type}
        size="small"
        sx={{
          fontSize: depth === 0 ? '0.55rem' : '0.5rem',
          height: depth === 0 ? 16 : 14,
          bgcolor: `${stepColor}15`,
          color: stepColor,
          fontWeight: 600,
          flexShrink: 0,
        }}
      />
      
      {/* Collapse toggle for containers */}
      {isContainer && childCount > 0 && (
        <Tooltip title={isCollapsed ? 'Expand' : 'Collapse'}>
          <IconButton
            size="small"
            onClick={handleToggleClick}
            sx={{
              p: 0.25,
              color: stepColor,
              '&:hover': {
                bgcolor: `${stepColor}20`,
              },
            }}
          >
            {isCollapsed ? (
              <ExpandMoreIcon sx={{ fontSize: 14 }} />
            ) : (
              <ExpandLessIcon sx={{ fontSize: 14 }} />
            )}
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

export const StepItemCard = memo(StepItemCardComponent);
```

#### 4.3.4 BranchTargetList.tsx

```typescript
// src/components/flow/nodes/shared/BranchTargetList.tsx

import { memo } from 'react';
import { Box, Typography, Chip, Collapse } from '@mui/material';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import type { Step, LoopStep, GroupStep } from '@/types';
import type { BranchTargetListProps } from './types';
import { getStepColor, getStepIcon, isContainerStep, resolveSteps, getChildStepIds } from './stepVisualUtils';

/**
 * BranchTargetList - Renders condition branch targets
 * 
 * Features:
 * - Shows branch label and target step
 * - Special visualization for container targets (Loop/Group)
 * - Recursive rendering of container children
 * - Scope awareness (shows "exit" indicator for external targets)
 */
function BranchTargetListComponent({
  branches,
  allSteps,
  depth,
  maxDepth,
  onStepClick,
  onToggleCollapse,
  parentStepIds = [],
  collapsedStepIds,
  renderChildren,
}: BranchTargetListProps): JSX.Element {
  
  // Check if a step is within the current container scope
  const isStepInScope = (stepId: string): boolean => {
    return parentStepIds.includes(stepId);
  };
  
  // Get step by ID
  const getStepById = (stepId: string): Step | undefined => {
    return allSteps.find((s) => s.id === stepId);
  };
  
  return (
    <Box
      sx={{
        ml: 2,
        mt: 0.5,
        pl: 1,
        borderLeft: '2px solid',
        borderColor: '#ed6c02',
      }}
    >
      {branches.map((branch, branchIndex) => {
        const hasTarget = branch.nextStepId && branch.nextStepId !== '';
        const targetStep = hasTarget ? getStepById(branch.nextStepId) : undefined;
        const isInScope = hasTarget && isStepInScope(branch.nextStepId);
        const isExitingScope = hasTarget && !isInScope && targetStep !== undefined;
        const isContainerTarget = targetStep && isContainerStep(targetStep);
        const isCollapsed = targetStep ? collapsedStepIds.has(targetStep.id) : false;
        
        // Determine target display name
        let targetName = '(no target)';
        if (hasTarget) {
          if (targetStep) {
            targetName = targetStep.name;
            if (isExitingScope) {
              targetName += ' (exit)';
            }
          } else {
            targetName = '(unknown step)';
          }
        }
        
        const branchLabel = branch.label || (branch.isDefault ? 'default' : `branch ${branchIndex + 1}`);
        
        return (
          <Box
            key={branch.id}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
              py: 0.25,
            }}
          >
            {/* Branch header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '0.65rem',
                color: 'text.secondary',
              }}
            >
              <SubdirectoryArrowRightIcon sx={{ fontSize: 12, color: '#ed6c02' }} />
              <Typography
                variant="caption"
                sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#ed6c02' }}
              >
                {branchLabel}
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontSize: '0.65rem', color: 'text.secondary' }}
              >
                →
              </Typography>
              
              {/* Container target card */}
              {isContainerTarget && targetStep ? (
                <Box
                  onClick={(e) => onStepClick(branch.nextStepId, e)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 0.75,
                    py: 0.5,
                    bgcolor: `${getStepColor(targetStep.type)}08`,
                    border: '1.5px solid',
                    borderColor: getStepColor(targetStep.type),
                    borderRadius: 1,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: `${getStepColor(targetStep.type)}15`,
                      boxShadow: `0 2px 6px ${getStepColor(targetStep.type)}40`,
                    },
                  }}
                >
                  <Box sx={{ color: getStepColor(targetStep.type), display: 'flex' }}>
                    {getStepIcon(targetStep.type, 12)}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      color: getStepColor(targetStep.type),
                      maxWidth: 100,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {targetStep.name}
                  </Typography>
                  <Chip
                    label={targetStep.type}
                    size="small"
                    sx={{
                      fontSize: '0.5rem',
                      height: 14,
                      bgcolor: `${getStepColor(targetStep.type)}20`,
                      color: getStepColor(targetStep.type),
                    }}
                  />
                  {isExitingScope && (
                    <Typography
                      variant="caption"
                      sx={{ fontSize: '0.5rem', color: 'warning.main', fontStyle: 'italic' }}
                    >
                      (exit)
                    </Typography>
                  )}
                </Box>
              ) : (
                /* Simple text target */
                <Typography
                  variant="caption"
                  onClick={(e) => hasTarget && branch.nextStepId ? onStepClick(branch.nextStepId, e) : undefined}
                  sx={{
                    fontSize: '0.65rem',
                    color: isInScope ? 'text.primary' : isExitingScope ? 'warning.main' : 'text.disabled',
                    fontStyle: isInScope ? 'normal' : 'italic',
                    fontWeight: isExitingScope ? 600 : 400,
                    cursor: hasTarget ? 'pointer' : 'default',
                    '&:hover': hasTarget ? { textDecoration: 'underline' } : {},
                  }}
                >
                  {targetName}
                </Typography>
              )}
            </Box>
            
            {/* Container children (recursive) */}
            {isContainerTarget && targetStep && !isCollapsed && (
              <Collapse in={!isCollapsed}>
                <Box
                  sx={{
                    ml: 3,
                    pl: 1,
                    borderLeft: '2px solid',
                    borderColor: `${getStepColor(targetStep.type)}40`,
                  }}
                >
                  {renderChildren(
                    resolveSteps(getChildStepIds(targetStep), allSteps),
                    depth + 1
                  )}
                </Box>
              </Collapse>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

export const BranchTargetList = memo(BranchTargetListComponent);
```

#### 4.3.5 index.ts (exports)

```typescript
// src/components/flow/nodes/shared/index.ts

export { RecursiveStepList } from './RecursiveStepList';
export { StepItemCard } from './StepItemCard';
export { BranchTargetList } from './BranchTargetList';
export * from './stepVisualUtils';
export type * from './types';
```

---

### 4.4 Integration with Existing Components

#### LoopNode.tsx Integration

```typescript
// Before (기존 730 lines)
// ... 중복된 childSteps 렌더링 로직

// After
import { RecursiveStepList } from './shared';

function LoopNode({ data, selected }: NodeProps<LoopNodeData>) {
  const { step, allSteps = [] } = data;
  const [collapsedStepIds, setCollapsedStepIds] = useState<Set<string>>(new Set());
  const dispatch = useDispatch();
  
  const childSteps = useMemo(() => 
    step.stepIds
      .map((id) => allSteps.find((s) => s.id === id))
      .filter((s): s is Step => s !== undefined),
    [step.stepIds, allSteps]
  );
  
  const handleStepClick = useCallback((stepId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    dispatch(setSelectedStep(stepId));
  }, [dispatch]);
  
  const handleToggleCollapse = useCallback((stepId: string) => {
    setCollapsedStepIds(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  }, []);
  
  return (
    <Box /* ... existing header ... */>
      {/* ... */}
      
      {/* Child Steps - 새로운 공통 컴포넌트 사용 */}
      <Box sx={{ p: 1.5, /* ... */ }}>
        <RecursiveStepList
          steps={childSteps}
          allSteps={allSteps}
          containerType="loop"
          containerColor="#9c27b0"
          depth={0}
          maxDepth={3}
          collapsedStepIds={collapsedStepIds}
          autoCollapseDepth={2}
          onStepClick={handleStepClick}
          onToggleCollapse={handleToggleCollapse}
          parentStepIds={step.stepIds}
        />
      </Box>
      
      {/* ... existing footer ... */}
    </Box>
  );
}
```

#### GroupNode.tsx Integration

```typescript
// 동일한 패턴으로 적용
import { RecursiveStepList } from './shared';

function GroupNode({ data, selected }: NodeProps<GroupNodeData>) {
  // ... 동일한 구조, containerType="group", containerColor="#0288d1"
  
  return (
    <Box /* ... */>
      {!isCollapsed && (
        <RecursiveStepList
          steps={childSteps}
          allSteps={allSteps}
          containerType="group"
          containerColor="#0288d1"
          depth={0}
          maxDepth={3}
          collapsedStepIds={collapsedStepIds}
          autoCollapseDepth={2}
          onStepClick={handleStepClick}
          onToggleCollapse={handleToggleCollapse}
          parentStepIds={step.stepIds}
        />
      )}
    </Box>
  );
}
```

---

### 4.5 Depth Limit and Collapse UI

```
┌────────────────────────────────────────────────────────────────┐
│  Depth 0 (expanded by default)                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 📋 Request: Get Users                              [GET] │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🔀 Condition: Check Status                    [condition]│  │
│  └──────────────────────────────────────────────────────────┘  │
│     └─ success → ┌─────────────────────────────────────────┐   │
│                  │ 🔄 Loop: Process Items          [loop] ▼│   │  ← Depth 1
│                  └─────────────────────────────────────────┘   │
│                     │                                          │
│                     │  Depth 1 (auto-collapsed at depth 2)     │
│                     ├─ 📋 Request: Process Item                │
│                     └─ 🔀 Condition: Validate                  │
│                           └─ pass → ┌────────────────────────┐ │
│                                     │ 📁 Group: Cleanup  [▼] │ │  ← Depth 2
│                                     └────────────────────────┘ │
│                                        │                       │
│                                        └─ ⋯ 3 nested steps     │  ← maxDepth reached
│                                           (expand to view)     │
└────────────────────────────────────────────────────────────────┘

Legend:
  ▼  = Collapsed (click to expand)
  ▲  = Expanded (click to collapse)
  ⋯  = Depth limit reached
```

---

## 5. Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            LoopNode / GroupNode                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  State: collapsedStepIds: Set<string>                             │  │
│  │  Handlers: onStepClick, onToggleCollapse                          │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│                                    ▼                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                       RecursiveStepList                           │  │
│  │  Props: steps, allSteps, depth, maxDepth, collapsedStepIds        │  │
│  │                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │  for each step:                                             │  │  │
│  │  │                                                             │  │  │
│  │  │  ┌───────────────────────────────────────────────────────┐  │  │  │
│  │  │  │              StepItemCard                             │  │  │  │
│  │  │  │  - Renders step with icon, name, type chip            │  │  │  │
│  │  │  │  - Collapse toggle for containers                     │  │  │  │
│  │  │  └───────────────────────────────────────────────────────┘  │  │  │
│  │  │                          │                                  │  │  │
│  │  │                          ▼                                  │  │  │
│  │  │  if step.type === 'condition':                              │  │  │
│  │  │  ┌───────────────────────────────────────────────────────┐  │  │  │
│  │  │  │            BranchTargetList                           │  │  │  │
│  │  │  │  - Renders branch labels and targets                  │  │  │  │
│  │  │  │  - Special card for container targets                 │  │  │  │
│  │  │  │  - Calls renderChildren for nested containers         │  │  │  │
│  │  │  └───────────────────────────────────────────────────────┘  │  │  │
│  │  │                          │                                  │  │  │
│  │  │                          ▼                                  │  │  │
│  │  │  if step is container && not collapsed:                     │  │  │
│  │  │  ┌───────────────────────────────────────────────────────┐  │  │  │
│  │  │  │         RecursiveStepList (depth + 1)                 │  │  │  │
│  │  │  │         ↺ RECURSIVE CALL                              │  │  │  │
│  │  │  └───────────────────────────────────────────────────────┘  │  │  │
│  │  │                                                             │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  │                                                                   │  │
│  │  if depth >= maxDepth:                                            │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │  "⋯ N nested steps (expand to view)"                       │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Risk Mitigation

### 6.1 Performance Risks

| Risk | Mitigation |
|------|------------|
| Deep recursion causing stack overflow | `maxDepth` 제한 (기본 3) |
| Many re-renders from collapse toggle | `React.memo`로 컴포넌트 메모이제이션 |
| Large step count causing slow render | Virtualization 검토 (future enhancement) |
| Unnecessary prop recalculation | `useMemo`/`useCallback` 적용 |

### 6.2 UX Risks

| Risk | Mitigation |
|------|------------|
| Confusing deep nesting | Auto-collapse at depth 2, clear visual hierarchy |
| Lost in navigation | Breadcrumb trail (future), click to select |
| Accessibility issues | Proper ARIA labels, keyboard navigation |

### 6.3 Maintenance Risks

| Risk | Mitigation |
|------|------------|
| Breaking existing functionality | 점진적 마이그레이션, 기존 테스트 유지 |
| Complex type definitions | 철저한 TypeScript 타입, JSDoc 문서화 |
| Future step types | `StepType` union 확장 가능한 구조 |

---

## 7. Migration Plan

### Phase 1: Create Shared Components (Day 1-2)
1. `shared/` 디렉토리 및 파일 생성
2. `stepVisualUtils.ts` 구현 (기존 유틸 함수 추출)
3. `types.ts` 인터페이스 정의
4. Unit tests 작성

### Phase 2: Implement Core Components (Day 3-4)
1. `StepItemCard.tsx` 구현
2. `BranchTargetList.tsx` 구현
3. `RecursiveStepList.tsx` 구현
4. Integration tests 작성

### Phase 3: Migrate LoopNode (Day 5)
1. `LoopNode.tsx`에서 공통 컴포넌트 import
2. 기존 child rendering 로직 교체
3. Visual regression test

### Phase 4: Migrate GroupNode (Day 6)
1. `GroupNode.tsx`에서 공통 컴포넌트 import
2. 기존 child rendering 로직 교체
3. Visual regression test

### Phase 5: Cleanup & Documentation (Day 7)
1. 불필요한 중복 코드 제거
2. Storybook stories 작성
3. 문서 업데이트

---

## 8. Testing Strategy

```typescript
// Example test cases

describe('RecursiveStepList', () => {
  it('renders empty state when no steps provided', () => {});
  it('renders step cards for each step', () => {});
  it('shows depth limit indicator at maxDepth', () => {});
  it('auto-collapses steps at autoCollapseDepth', () => {});
  it('expands/collapses on toggle', () => {});
  it('calls onStepClick with correct stepId', () => {});
});

describe('StepItemCard', () => {
  it('renders correct icon for each step type', () => {});
  it('shows child count for container steps', () => {});
  it('applies container styling for nested containers', () => {});
});

describe('BranchTargetList', () => {
  it('renders branch labels correctly', () => {});
  it('shows exit indicator for out-of-scope targets', () => {});
  it('recursively renders container children', () => {});
});
```

---

## 9. Summary

| Aspect | Decision |
|--------|----------|
| **Pattern** | Single Recursive Component (Option D) |
| **Max Depth** | 3 (configurable) |
| **Auto-Collapse** | Depth 2+ |
| **State Management** | Local state in parent node |
| **Optimization** | React.memo, useMemo, useCallback |
| **Migration** | Phased, 7 days total |

이 설계를 통해:
- **코드 중복 제거**: ~400 lines 감소 예상
- **유지보수성 향상**: 단일 수정 지점
- **확장성**: 새로운 step type 쉽게 추가 가능
- **성능**: 깊이 제한과 메모이제이션으로 최적화
