# Move to Container & Cut Features PRD

## 1. Overview

### 1.1 Background
- 현재 시스템은 TFX 파이프라인 스타일의 ReactFlow 기반 노드 시각화를 제공합니다
- Loop와 Group 컨테이너가 존재하며 stepIds 배열로 자식 스텝을 관리합니다
- 사용자는 스텝 추가/삭제/복사/붙여넣기 기능을 사용할 수 있습니다
- 하지만 기존 스텝을 컨테이너(Loop/Group)로 이동하는 기능이 없어 불편합니다
- Cut(잘라내기) 기능도 없어 Copy → Delete 두 단계를 거쳐야 합니다

### 1.2 목표
- **Move to Container**: 드래그 앤 드롭 또는 컨텍스트 메뉴로 노드를 Loop/Group 컨테이너로 이동
- **Cut 기능 추가**: Ctrl+X, 컨텍스트 메뉴, UI 버튼으로 노드 잘라내기
- **엣지 충돌 처리**: 이동 시 컨테이너 경계를 넘는 엣지 발견 시 경고 다이얼로그 표시
- **Undo/Redo 지원**: 모든 작업이 50단계 히스토리에 기록되어 실행 취소 가능

### 1.3 대상 사용자
- 시나리오 작성자 (개발자, QA 담당자)
- 복잡한 플로우를 구조화하여 관리하고자 하는 사용자

### 1.4 기대 효과
- 시나리오 재구성 시간 단축 (드래그 한 번으로 컨테이너로 이동)
- UI 일관성 향상 (Cut 기능 표준 제공)
- 데이터 무결성 보장 (엣지 충돌 자동 감지 및 안내)
- 작업 효율 증대 (Undo로 실수 복구 가능)

---

## 2. 기능 요구사항

### 2.1 Must Have (P0)

| ID | 기능 | 설명 | 우선순위 |
|----|------|------|----------|
| F-001 | Move to Container - 드래그 앤 드롭 | 노드를 드래그하여 Loop/Group 노드 위에 드롭하면 해당 컨테이너의 stepIds에 추가 | P0 |
| F-002 | Move to Container - 컨텍스트 메뉴 | 노드 우클릭 시 "Move to Container" 메뉴 표시, 대상 컨테이너 선택 | P0 |
| F-003 | 엣지 충돌 감지 | 이동할 노드가 컨테이너 외부 노드와 연결된 엣지가 있는지 자동 감지 | P0 |
| F-004 | 엣지 충돌 경고 다이얼로그 | 충돌 엣지 발견 시 "엣지가 삭제됩니다" 경고 표시 및 확인/취소 선택 | P0 |
| F-005 | Cut - Ctrl+X | 선택된 노드를 Ctrl+X로 잘라내기 (클립보드에 저장 + 원본 삭제 예약) | P0 |
| F-006 | Cut - 컨텍스트 메뉴 | 노드 우클릭 시 "Cut" 메뉴 항목 추가 | P0 |
| F-007 | Cut - UI 버튼 | 툴바 또는 상단 액션 바에 "Cut" 아이콘 버튼 제공 | P0 |
| F-008 | Cut 시각적 피드백 | Cut된 노드는 반투명 또는 점선 테두리로 표시 | P0 |
| F-009 | Paste 동작 개선 | Cut된 노드를 Paste하면 원본 삭제 + 새 위치에 추가 | P0 |
| F-010 | Undo/Redo 지원 | Move to Container, Cut 모든 작업이 redux-undo에 기록 | P0 |

### 2.2 Should Have (P1)

| ID | 기능 | 설명 | 우선순위 |
|----|------|------|----------|
| F-011 | 드래그 시각화 | 노드 드래그 중 컨테이너 하이라이트 표시 (드롭 가능 영역 강조) | P1 |
| F-012 | 키보드 단축키 안내 | 툴바 버튼에 툴팁으로 "Ctrl+X" 안내 표시 | P1 |
| F-013 | 엣지 충돌 상세 정보 | 다이얼로그에 삭제될 엣지 목록 표시 (source → target) | P1 |
| F-014 | 컨테이너 선택 UI 개선 | "Move to Container" 메뉴에서 현재 Loop/Group 목록을 계층 구조로 표시 | P1 |

### 2.3 Nice to Have (P2)

| ID | 기능 | 설명 | 우선순위 |
|----|------|------|----------|
| F-015 | 다중 선택 지원 | 여러 노드를 동시에 선택하여 한 번에 이동/Cut (추후 단계) | P2 |
| F-016 | 자동 엣지 재연결 | 이동 후 가능한 경우 엣지를 컨테이너 입출구로 자동 재연결 | P2 |
| F-017 | 애니메이션 효과 | Move to Container 시 부드러운 이동 애니메이션 | P2 |

---

## 3. 사용자 시나리오

### 시나리오 1: 드래그 앤 드롭으로 노드를 Loop로 이동

**사용자**: QA 담당자
**목표**: 기존에 만든 Request 스텝을 반복 처리하기 위해 Loop 안으로 이동

**흐름**:
1. 사용자가 GraphEditor에서 "API 호출" 노드를 클릭하여 선택
2. 마우스로 노드를 드래그 시작
3. "반복 처리" Loop 노드 위로 드래그하면 Loop 노드가 하이라이트됨
4. Loop 노드 위에 드롭
5. 시스템이 엣지 충돌 감지 실행:
   - "API 호출" 노드에 연결된 엣지 확인
   - Loop 외부로 나가는 엣지 2개 발견
6. 경고 다이얼로그 표시:
   ```
   Warning: Edge Conflicts Detected

   Moving "API 호출" into "반복 처리" will remove the following edges:
   - API 호출 → 결과 저장
   - 결과 저장 → API 호출

   These edges cross the container boundary and will be deleted.
   Continue?

   [Cancel] [Confirm]
   ```
7. 사용자가 Confirm 클릭
8. 시스템 동작:
   - "API 호출" 노드의 ID를 Loop의 stepIds 배열에 추가
   - 충돌하는 2개 엣지 삭제
   - Redux action 발생: `addStepToContainer`, `deleteEdge` (2회)
   - Undo 히스토리에 기록
9. GraphEditor가 자동으로 내부 뷰로 전환되어 Loop 안의 "API 호출" 노드 표시

**성공 기준**:
- Loop stepIds에 노드 ID가 추가됨
- 외부 엣지가 삭제됨
- Undo 실행 시 원래 상태로 복구됨

---

### 시나리오 2: 컨텍스트 메뉴로 노드를 Group으로 이동

**사용자**: 개발자
**목표**: 여러 스텝을 논리적으로 그룹화하기 위해 Group 컨테이너로 이동

**흐름**:
1. 사용자가 "파라미터 검증" 노드 위에서 우클릭
2. 컨텍스트 메뉴 표시:
   ```
   Copy          Ctrl+C
   Cut           Ctrl+X
   Paste         Ctrl+V
   Delete        Delete
   ──────────────────────
   Move to Container  >
   ──────────────────────
   Auto Layout
   ```
3. "Move to Container" 메뉴 항목에 마우스 오버
4. 서브메뉴 표시 (현재 시나리오의 모든 Loop/Group):
   ```
   > Move to Container
       ├─ 사전 검증 (Group)
       ├─ 반복 처리 (Loop)
       └─ 후처리 (Group)
   ```
5. "사전 검증 (Group)" 클릭
6. 시스템이 엣지 충돌 감지:
   - 충돌 없음 (이미 Group 내부 노드들과만 연결됨)
7. 즉시 이동 실행:
   - "파라미터 검증"을 "사전 검증" Group의 stepIds에 추가
   - Redux action: `addStepToContainer`
   - Undo 히스토리에 기록
8. 토스트 메시지 표시: "✓ Moved to '사전 검증'"

**성공 기준**:
- Group stepIds에 노드 ID가 추가됨
- 충돌 감지가 정확히 동작함
- 사용자 피드백 제공됨

---

### 시나리오 3: Cut & Paste로 노드 이동

**사용자**: QA 담당자
**목표**: 잘못 배치한 노드를 다른 위치로 빠르게 이동

**흐름**:
1. 사용자가 "로그 저장" 노드 선택
2. Ctrl+X 키 입력 (또는 컨텍스트 메뉴 "Cut" 클릭)
3. 시스템 동작:
   - 노드를 clipboardStep 상태에 저장
   - 노드에 `isCut: true` 표시 추가 (시각적 피드백용)
   - 노드가 반투명해짐 (opacity: 0.5, 점선 테두리)
4. 사용자가 다른 위치로 이동하여 Ctrl+V 입력
5. 시스템 동작:
   - clipboardStep이 `isCut: true`인지 확인
   - 원본 노드 삭제 (deleteStep)
   - 새 위치에 노드 추가 (addStep, 새 position으로)
   - 관련 엣지도 함께 이동 처리
   - Redux actions: `deleteStep`, `addStep`, `addEdge` (여러 개)
   - Undo 히스토리에 기록
6. 토스트 메시지: "✓ Step moved"

**성공 기준**:
- 원본 노드가 삭제됨
- 새 위치에 동일한 설정의 노드가 생성됨
- Undo 실행 시 Cut 전 상태로 복구됨

---

### 시나리오 4: 엣지 충돌로 인한 이동 취소

**사용자**: 개발자
**목표**: 노드를 Loop로 이동하려 했으나 엣지 충돌 경고를 보고 취소

**흐름**:
1. 사용자가 "데이터 처리" 노드를 Loop로 드래그
2. Loop 위에 드롭
3. 시스템이 엣지 충돌 감지:
   - "데이터 처리"가 Loop 외부의 "최종 저장"과 연결됨
4. 경고 다이얼로그 표시:
   ```
   Warning: Edge Conflicts Detected

   Moving "데이터 처리" into "반복 처리" will remove 1 edge:
   - 데이터 처리 → 최종 저장

   Continue?

   [Cancel] [Confirm]
   ```
5. 사용자가 Cancel 클릭
6. 이동 작업 취소, 노드가 원래 위치에 유지됨
7. Redux action 없음 (상태 변경 없음)

**성공 기준**:
- 이동이 실행되지 않음
- 노드와 엣지가 원래 상태 유지됨
- 사용자가 정보를 확인하고 결정을 내릴 수 있음

---

## 4. UI/UX 디자인

### 4.1 드래그 앤 드롭 UI

#### 4.1.1 드래그 시작 (Drag Start)
- 사용자가 노드를 마우스로 드래그 시작
- 드래그 중인 노드에 시각적 효과:
  ```css
  .dragging-node {
    opacity: 0.7;
    cursor: grabbing;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  }
  ```

#### 4.1.2 드래그 오버 (Drag Over)
- Loop/Group 노드 위로 드래그 시 하이라이트:
  ```css
  .drop-target-container {
    border: 2px dashed #1976d2;
    background-color: rgba(25, 118, 210, 0.1);
    animation: pulse 1s ease-in-out infinite;
  }
  ```
- 툴팁 표시: "Drop to move inside"

#### 4.1.3 드롭 (Drop)
- Loop/Group 위에 드롭 시:
  1. 엣지 충돌 감지 실행
  2. 충돌 시 → 경고 다이얼로그
  3. 충돌 없음 → 즉시 이동 + 토스트 메시지

### 4.2 컨텍스트 메뉴 (Right-Click Menu)

#### 4.2.1 메뉴 구조
```
┌────────────────────────────────┐
│ Copy           Ctrl+C          │
│ Cut            Ctrl+X          │  ← 새로 추가
│ Paste          Ctrl+V          │
│ Delete         Delete           │
├────────────────────────────────┤
│ Move to Container  >           │  ← 새로 추가
├────────────────────────────────┤
│ Auto Layout                     │
└────────────────────────────────┘
```

#### 4.2.2 Move to Container 서브메뉴
```
┌────────────────────────────────┐
│ > Move to Container            │
│   ┌──────────────────────────┐ │
│   │ 사전 검증 (Group)        │ │
│   │ 반복 처리 (Loop)         │ │
│   │ 후처리 (Group)           │ │
│   │ ──────────────────────   │ │
│   │ (No containers)          │ │  ← 컨테이너 없을 때
│   └──────────────────────────┘ │
└────────────────────────────────┘
```

#### 4.2.3 Cut 메뉴 동작
- Cut 클릭 시:
  1. 노드를 clipboardStep에 저장
  2. `isCut: true` 플래그 설정
  3. 노드 시각적 변경 (반투명 + 점선)
  4. 토스트: "✓ Step cut to clipboard"

### 4.3 툴바 버튼

#### 4.3.1 Cut 버튼 추가
```tsx
// ConfigPage.tsx 상단 툴바
<Tooltip title="Cut (Ctrl+X)">
  <IconButton
    onClick={handleCut}
    disabled={!selectedStepId}
    size="small"
  >
    <ContentCutIcon />
  </IconButton>
</Tooltip>
```

#### 4.3.2 버튼 배치
```
┌──────────────────────────────────────────────────────┐
│  [Undo] [Redo]  |  [Copy] [Cut] [Paste] [Delete]    │
│                 |                                     │
└──────────────────────────────────────────────────────┘
```

### 4.4 엣지 충돌 경고 다이얼로그

#### 4.4.1 다이얼로그 구조
```tsx
<Dialog open={edgeConflictDialogOpen}>
  <DialogTitle>
    <WarningIcon color="warning" />
    Edge Conflicts Detected
  </DialogTitle>

  <DialogContent>
    <Typography variant="body1">
      Moving "{stepName}" into "{containerName}" will remove
      the following edges:
    </Typography>

    <List dense>
      {conflictingEdges.map(edge => (
        <ListItem key={edge.id}>
          <ListItemIcon>
            <ArrowForwardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={`${edge.sourceName} → ${edge.targetName}`}
          />
        </ListItem>
      ))}
    </List>

    <Alert severity="warning" sx={{ mt: 2 }}>
      These edges cross the container boundary and will be deleted.
    </Alert>
  </DialogContent>

  <DialogActions>
    <Button onClick={handleCancel}>Cancel</Button>
    <Button
      onClick={handleConfirm}
      variant="contained"
      color="warning"
    >
      Confirm
    </Button>
  </DialogActions>
</Dialog>
```

#### 4.4.2 다이얼로그 표시 조건
- Move to Container 실행 시 `detectEdgeConflicts()` 호출
- 충돌 엣지 개수 > 0이면 다이얼로그 표시
- 충돌 없으면 즉시 이동 실행

### 4.5 Cut 상태 시각화

#### 4.5.1 Cut된 노드 스타일
```tsx
// TFXNode.tsx 또는 각 노드 컴포넌트
const nodeStyle = {
  opacity: isCut ? 0.5 : 1,
  border: isCut ? '2px dashed #999' : '1px solid #ddd',
  transition: 'opacity 0.2s, border 0.2s',
};
```

#### 4.5.2 Cut 상태 표시
- Cut된 노드 상단에 작은 뱃지 표시:
  ```
  ┌──────────────────┐
  │ [✂️ Cut]         │  ← 뱃지
  │  API 호출        │
  │  POST /api/data  │
  └──────────────────┘
  ```

---

## 5. 엣지 충돌 감지 및 처리 로직

### 5.1 엣지 충돌 정의

**엣지 충돌 (Edge Conflict)**: 이동할 노드와 연결된 엣지가 컨테이너 경계를 넘는 경우

**충돌 케이스**:
1. **Outgoing Edge**: 이동할 노드 → 컨테이너 외부 노드
2. **Incoming Edge**: 컨테이너 외부 노드 → 이동할 노드
3. **Mixed**: 양방향 모두 존재

**비충돌 케이스**:
- 이동할 노드 ↔ 같은 컨테이너에 함께 들어갈 노드
- 컨테이너 내부에만 존재하는 엣지

### 5.2 감지 알고리즘

```typescript
interface EdgeConflict {
  edgeId: string;
  sourceName: string;
  targetName: string;
  direction: 'outgoing' | 'incoming';
}

/**
 * 노드를 컨테이너로 이동 시 충돌하는 엣지 감지
 * @param stepId - 이동할 노드 ID
 * @param containerId - 대상 컨테이너 ID
 * @param steps - 모든 스텝 배열
 * @param edges - 모든 엣지 배열
 * @returns 충돌하는 엣지 목록
 */
function detectEdgeConflicts(
  stepId: string,
  containerId: string,
  steps: Step[],
  edges: ScenarioEdge[]
): EdgeConflict[] {
  const conflicts: EdgeConflict[] = [];

  // 1. 컨테이너 찾기
  const container = steps.find(s => s.id === containerId);
  if (!container || (container.type !== 'loop' && container.type !== 'group')) {
    return conflicts;
  }

  // 2. 컨테이너 내부 노드 ID 수집 (이동 후 상태)
  const insideStepIds = new Set([
    ...container.stepIds,
    stepId, // 이동할 노드도 포함
  ]);

  // 3. 이동할 노드와 연결된 모든 엣지 확인
  const relatedEdges = edges.filter(
    edge => edge.sourceStepId === stepId || edge.targetStepId === stepId
  );

  // 4. 각 엣지가 컨테이너 경계를 넘는지 확인
  relatedEdges.forEach(edge => {
    const sourceInside = insideStepIds.has(edge.sourceStepId);
    const targetInside = insideStepIds.has(edge.targetStepId);

    // 한쪽은 내부, 한쪽은 외부 → 충돌
    if (sourceInside !== targetInside) {
      const sourceStep = steps.find(s => s.id === edge.sourceStepId);
      const targetStep = steps.find(s => s.id === edge.targetStepId);

      conflicts.push({
        edgeId: edge.id,
        sourceName: sourceStep?.name || 'Unknown',
        targetName: targetStep?.name || 'Unknown',
        direction: edge.sourceStepId === stepId ? 'outgoing' : 'incoming',
      });
    }
  });

  return conflicts;
}
```

### 5.3 충돌 처리 흐름

```
┌─────────────────────────────────────────────────────────┐
│  1. 사용자가 Move to Container 실행                      │
│     (드래그 드롭 또는 컨텍스트 메뉴)                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  2. detectEdgeConflicts() 호출                          │
│     - 이동할 노드 + 대상 컨테이너                        │
│     - 모든 관련 엣지 검사                                │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
         충돌 엣지 있는가?
                 │
        ┌────────┴────────┐
        │ Yes             │ No
        ▼                 ▼
┌──────────────────┐  ┌──────────────────┐
│ 경고 다이얼로그  │  │ 즉시 이동 실행   │
│ 표시             │  │                  │
│ - 충돌 엣지 목록 │  │ - addStepTo      │
│ - Confirm/Cancel │  │   Container      │
└────┬─────────────┘  │ - Toast 표시     │
     │                └──────────────────┘
     ▼
사용자 선택
     │
┌────┴─────┐
│          │
▼          ▼
Cancel   Confirm
│          │
│          ▼
│    ┌──────────────────┐
│    │ 이동 + 엣지 삭제 │
│    │                  │
│    │ - addStepTo      │
│    │   Container      │
│    │ - deleteEdge     │
│    │   (여러 번)      │
└────┴──────────────────┘
```

### 5.4 엣지 삭제 로직

```typescript
/**
 * 충돌 엣지를 삭제하고 노드를 컨테이너로 이동
 */
async function moveStepToContainerWithConflictResolution(
  stepId: string,
  containerId: string,
  conflicts: EdgeConflict[],
  dispatch: AppDispatch,
  scenarioId: string
) {
  // 1. 충돌 엣지 삭제
  conflicts.forEach(conflict => {
    dispatch(deleteEdge({
      scenarioId,
      edgeId: conflict.edgeId,
    }));
  });

  // 2. 노드를 컨테이너로 이동
  dispatch(addStepToContainer({
    scenarioId,
    containerId,
    stepId,
  }));

  // 3. 성공 메시지
  showToast(`Moved to container (${conflicts.length} edges removed)`);
}
```

---

## 6. Redux 상태 관리

### 6.1 새로운 Redux Actions

#### 6.1.1 기존 Actions 활용
- `addStepToContainer`: 이미 구현됨 (scenariosSlice.ts line 333-347)
- `deleteEdge`: 이미 구현됨 (scenariosSlice.ts line 232-271)
- `deleteStep`: Cut → Paste 시 사용
- `addStep`: Cut → Paste 시 사용

#### 6.1.2 새로운 UI State (uiSlice.ts에 추가)
```typescript
interface UIState {
  // ... 기존 상태
  clipboardStep: Step | null;
  clipboardMode: 'copy' | 'cut' | null; // 새로 추가
}

// Actions
setCut: (state, action: PayloadAction<Step>) => {
  state.clipboardStep = action.payload;
  state.clipboardMode = 'cut';
},

clearClipboard: (state) => {
  state.clipboardStep = null;
  state.clipboardMode = null;
},
```

### 6.2 Undo/Redo 통합

#### 6.2.1 Undoable Actions
```typescript
// scenariosSlice.ts - 기존 undoable actions에 추가됨
const undoableActions = [
  // ... 기존 actions
  'scenarios/addStepToContainer',    // 이미 포함됨
  'scenarios/removeStepFromContainer', // 이미 포함됨
  'scenarios/deleteEdge',             // 이미 포함됨
  // Cut/Paste는 deleteStep + addStep 조합이므로 자동 지원
];
```

#### 6.2.2 Batch Actions
Move to Container + Edge Deletion을 하나의 Undo 단위로 묶기:
```typescript
// 현재 redux-undo는 각 action을 개별 기록
// 여러 action을 하나의 undo 단위로 만들려면:
// Option 1: 커스텀 action creator 사용
// Option 2: redux-undo의 groupBy 옵션 사용

// 간단한 방법: 현재처럼 각 action 개별 기록
// 사용자가 Undo 여러 번 클릭하면 됨 (허용 가능)
```

### 6.3 상태 동기화

#### 6.3.1 Cut 상태 동기화
```typescript
// ConfigPage.tsx
const clipboardMode = useAppSelector(state => state.ui.clipboardMode);
const clipboardStep = useAppSelector(state => state.ui.clipboardStep);

// Cut된 노드 ID 계산
const cutStepId = clipboardMode === 'cut' ? clipboardStep?.id : null;

// FlowCanvas에 전달
<FlowCanvas
  steps={filteredSteps}
  edges={filteredEdges}
  cutStepId={cutStepId} // 새로 추가
  onNodeDrop={handleNodeDrop}
  // ...
/>
```

#### 6.3.2 Paste 처리
```typescript
const handlePaste = useCallback(() => {
  if (!clipboardStep) return;

  if (clipboardMode === 'cut') {
    // Cut 모드: 원본 삭제 + 새 위치에 추가
    dispatch(deleteStep({
      scenarioId: currentScenario.id,
      stepId: clipboardStep.id,
    }));

    const newStep = {
      ...clipboardStep,
      id: `step_${Date.now()}`,
      position: { x: 100, y: 100 }, // 새 위치
    };

    dispatch(addStep({
      scenarioId: currentScenario.id,
      step: newStep,
    }));

    // 클립보드 초기화
    dispatch(clearClipboard());

  } else {
    // Copy 모드: 기존 동작 유지
    // ... 기존 복사 로직
  }
}, [clipboardStep, clipboardMode, dispatch]);
```

---

## 7. 구현 범위 및 제약사항

### 7.1 구현 범위 (In Scope)

#### Phase 1 (First Release - 2주)
- ✅ Move to Container - 드래그 앤 드롭 기본 기능
- ✅ Move to Container - 컨텍스트 메뉴
- ✅ 엣지 충돌 감지 로직
- ✅ 엣지 충돌 경고 다이얼로그
- ✅ Cut 기능 (Ctrl+X, 컨텍스트 메뉴, 툴바 버튼)
- ✅ Cut 시각적 피드백
- ✅ Paste 동작 개선 (Cut 모드 지원)
- ✅ Undo/Redo 지원

#### Phase 2 (추후)
- ⏸️ 다중 선택 지원 (여러 노드 동시 이동)
- ⏸️ 자동 엣지 재연결 (스마트 연결)
- ⏸️ 애니메이션 효과

### 7.2 제약사항

#### 7.2.1 기술 제약
| 제약 | 설명 | 영향 |
|------|------|------|
| 단일 선택만 지원 | 한 번에 하나의 노드만 이동/Cut 가능 | 대량 작업 시 여러 번 반복 필요 |
| ReactFlow 드래그 이벤트 제한 | ReactFlow의 기본 드래그는 노드 위치 이동용 | 별도 드롭 핸들러 구현 필요 |
| Redux Undo 메모리 | 50단계 히스토리 제한 | 메모리 사용량 제한 |

#### 7.2.2 비즈니스 제약
| 제약 | 설명 |
|------|------|
| 엣지 자동 복구 불가 | 삭제된 엣지는 자동으로 복구되지 않음 (Undo만 가능) |
| 네스팅 깊이 제한 없음 | Loop 안의 Group 안의 Loop 등 무제한 중첩 가능 (성능 고려 필요) |
| 컨테이너 간 이동 | 노드를 A 컨테이너에서 B 컨테이너로 직접 이동 불가 (먼저 꺼낸 후 이동) |

#### 7.2.3 UI/UX 제약
| 제약 | 설명 |
|------|------|
| 드래그 타겟 시각화 | 컨테이너가 겹쳐있을 때 드롭 타겟 모호할 수 있음 |
| 모바일 지원 제외 | 드래그 앤 드롭은 데스크톱 전용 (모바일은 컨텍스트 메뉴만) |

### 7.3 Out of Scope (이번 릴리스에서 제외)

#### 제외 항목
- ❌ 다중 노드 선택 및 일괄 이동
- ❌ 컨테이너 자체를 다른 컨테이너로 이동 (무한 중첩 방지)
- ❌ 엣지 자동 재연결 (향후 AI 기반 추론 기능으로)
- ❌ Drag & Drop으로 컨테이너 밖으로 꺼내기 (컨텍스트 메뉴만)
- ❌ 엣지 충돌 시 자동 컨테이너 입출구 연결

---

## 8. 성공 지표 (KPI)

| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|-----------|
| 노드 재배치 작업 시간 | 평균 30초 (Copy → Delete 2단계) | 평균 5초 (Drag or Cut 1단계) | 사용자 테스트 |
| 엣지 충돌 발견율 | 수동 확인 (사용자가 직접 삭제) | 자동 감지 100% | 자동화 테스트 |
| Undo 사용률 | 현재 복사/붙여넣기의 20% | Move/Cut의 30% (실수 복구) | 로그 분석 |
| 사용자 만족도 | N/A (기능 없음) | 4.5/5.0 | 사용자 설문 |

---

## 9. 비기능 요구사항

### 9.1 성능

| 요구사항 | 기대치 | 측정 방법 |
|----------|--------|-----------|
| 엣지 충돌 감지 속도 | 100ms 이내 (노드 100개, 엣지 200개 기준) | Performance API |
| 드래그 앤 드롭 응답성 | 60fps 유지 | React DevTools Profiler |
| Undo/Redo 실행 속도 | 50ms 이내 | Performance API |

### 9.2 보안

| 요구사항 | 설명 |
|----------|------|
| XSS 방지 | 노드 이름 표시 시 React의 기본 escaping 활용 |
| 데이터 무결성 | Redux actions는 Immer를 통한 불변성 보장 |

### 9.3 호환성

| 요구사항 | 설명 |
|----------|------|
| 브라우저 | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |
| 키보드 단축키 | 표준 단축키 (Ctrl+X, Ctrl+C, Ctrl+V) 준수 |
| 스크린 리더 | 컨텍스트 메뉴에 aria-label 추가 |

---

## 10. 사용자 피드백 및 에러 처리

### 10.1 성공 메시지

| 동작 | 메시지 | 표시 방법 |
|------|--------|-----------|
| Move to Container (충돌 없음) | "✓ Moved to '{containerName}'" | Toast (2초) |
| Move to Container (충돌 있음) | "✓ Moved to '{containerName}' ({N} edges removed)" | Toast (3초) |
| Cut | "✓ Step cut to clipboard" | Toast (2초) |
| Paste (Cut 모드) | "✓ Step moved" | Toast (2초) |

### 10.2 에러 메시지

| 에러 상황 | 메시지 | 표시 방법 |
|-----------|--------|-----------|
| 컨테이너가 존재하지 않음 | "Container not found" | Toast (Error) |
| 노드가 이미 컨테이너 안에 있음 | "Step is already inside this container" | Toast (Warning) |
| 자기 자신을 자신으로 이동 | "Cannot move a container into itself" | Toast (Warning) |
| Cut 후 삭제된 노드 Paste | "Source step no longer exists" | Toast (Error) |

### 10.3 확인 다이얼로그

| 상황 | 다이얼로그 내용 |
|------|----------------|
| 엣지 충돌 | "Warning: Edge Conflicts Detected" + 충돌 목록 + [Cancel] [Confirm] |
| 컨테이너 중첩 경고 (추후) | "This will create nested containers. Continue?" |

---

## 11. 테스트 시나리오

### 11.1 기능 테스트

| ID | 테스트 케이스 | 예상 결과 |
|----|---------------|-----------|
| TC-001 | 노드를 Loop로 드래그 앤 드롭 (충돌 없음) | Loop stepIds에 추가, 토스트 표시 |
| TC-002 | 노드를 Loop로 드래그 앤 드롭 (충돌 있음) | 경고 다이얼로그 → Confirm → 엣지 삭제 + 이동 |
| TC-003 | 노드를 Loop로 드래그 앤 드롭 (충돌 있음) | 경고 다이얼로그 → Cancel → 이동 취소 |
| TC-004 | 컨텍스트 메뉴 "Move to Container" → Group 선택 | Group stepIds에 추가 |
| TC-005 | Ctrl+X로 노드 Cut | 노드가 반투명 + 점선, 클립보드에 저장 |
| TC-006 | Cut 후 Ctrl+V로 Paste | 원본 삭제, 새 위치에 추가 |
| TC-007 | Copy 후 Paste (기존 동작) | 원본 유지, 복사본 추가 |
| TC-008 | Move to Container 후 Undo | 원래 위치로 복구, 엣지도 복구 |
| TC-009 | Cut → Paste 후 Undo | Cut 전 상태로 복구 |

### 11.2 엣지 케이스

| ID | 케이스 | 예상 동작 |
|----|--------|-----------|
| EC-001 | 컨테이너가 없는 시나리오에서 "Move to Container" | 메뉴 표시 "(No containers)" |
| EC-002 | 노드를 자기 자신으로 이동 시도 | 에러 메시지 표시 |
| EC-003 | Loop를 자신의 stepIds에 포함된 노드로 이동 | 에러 메시지 (순환 참조 방지) |
| EC-004 | Cut된 노드를 삭제 후 Paste | 에러 메시지 "Source step no longer exists" |
| EC-005 | 50회 Undo 후 추가 Undo | 더 이상 Undo 안됨 |

### 11.3 성능 테스트

| ID | 테스트 조건 | 기대치 |
|----|-------------|--------|
| PT-001 | 노드 100개, 엣지 200개 시나리오에서 충돌 감지 | 100ms 이내 |
| PT-002 | 드래그 중 FPS 측정 | 60fps 유지 |
| PT-003 | 50회 연속 Move to Container 후 Undo 50회 | 각 작업 50ms 이내 |

---

## 12. 구현 우선순위 및 일정

### 12.1 Phase 1 - Core Features (1주차)

| 작업 | 예상 시간 | 담당 |
|------|-----------|------|
| 엣지 충돌 감지 로직 구현 | 4시간 | Backend Developer |
| 경고 다이얼로그 컴포넌트 | 3시간 | Frontend Developer |
| 드래그 앤 드롭 핸들러 | 6시간 | Frontend Developer |
| 컨텍스트 메뉴 "Move to Container" | 4시간 | Frontend Developer |
| Cut 기능 (Ctrl+X, 클립보드) | 5시간 | Frontend Developer |
| Redux 상태 관리 통합 | 3시간 | Frontend Developer |

**합계: 약 25시간 (3-4일)**

### 12.2 Phase 2 - Polish & Testing (2주차)

| 작업 | 예상 시간 | 담당 |
|------|-----------|------|
| Cut 시각적 피드백 | 2시간 | Frontend Developer |
| 툴바 버튼 추가 | 2시간 | Frontend Developer |
| 드래그 하이라이트 효과 | 3시간 | Frontend Developer |
| 토스트 메시지 통합 | 2시간 | Frontend Developer |
| 단위 테스트 작성 | 8시간 | Test Writer |
| E2E 테스트 작성 | 6시간 | E2E Tester |
| 사용자 테스트 및 피드백 | 4시간 | PM |

**합계: 약 27시간 (3-4일)**

### 12.3 총 일정
- **Phase 1**: 1주차 (핵심 기능)
- **Phase 2**: 2주차 (완성도 + 테스트)
- **총 기간**: **2주**

---

## 13. 의존성 및 리스크

### 13.1 기술 의존성

| 의존성 | 영향 | 대응 방안 |
|--------|------|-----------|
| ReactFlow 드래그 이벤트 | 기본 드래그가 위치 이동과 충돌 가능 | onNodeDragStop 이벤트에서 컨테이너 검사 추가 |
| Redux Undo 라이브러리 | 버전 업데이트 시 호환성 문제 | 현재 버전 고정, 변경 시 회귀 테스트 |
| Material-UI 컨텍스트 메뉴 | 표준 컴포넌트 없음 | 커스텀 Menu 컴포넌트 사용 (기존 패턴 참고) |

### 13.2 리스크 관리

| 리스크 | 확률 | 영향도 | 대응 전략 |
|--------|------|--------|-----------|
| 드래그 앤 드롭 성능 저하 | 중 | 중 | 디바운싱, 가상화 적용 |
| 엣지 충돌 감지 오류 (false positive) | 낮 | 높 | 철저한 단위 테스트, 엣지 케이스 문서화 |
| Undo/Redo 메모리 누수 | 낮 | 중 | 프로파일링, 메모리 모니터링 |
| 사용자 혼란 (엣지 삭제에 대한 이해 부족) | 중 | 중 | 명확한 경고 메시지, 튜토리얼 제공 |

---

## 14. 향후 확장 계획

### 14.1 Phase 3 - Advanced Features (추후)

| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 다중 선택 | Shift+Click, Ctrl+Click으로 여러 노드 선택 | P1 |
| 컨테이너 밖으로 꺼내기 | 드래그로 컨테이너 밖으로 이동 | P1 |
| 자동 엣지 재연결 | 이동 후 가능한 경로로 엣지 자동 재생성 | P2 |
| 컨테이너 간 직접 이동 | A 컨테이너에서 B 컨테이너로 바로 이동 | P2 |

### 14.2 AI 기반 기능 (비전)

| 기능 | 설명 |
|------|------|
| 스마트 그룹화 | 유사한 스텝을 자동으로 Group으로 제안 |
| 엣지 재연결 추론 | AI가 이동 후 적절한 엣지 연결 제안 |

---

## 15. 다음 단계

이 PRD를 기반으로 다음 단계로 진행하세요:

### 15.1 즉시 진행 가능
1. **시스템 설계 요청**:
   ```
   Use the architect agent to design the system architecture
   based on docs/specs/move-to-container-and-cut-prd.md
   ```

2. **Architect가 설계할 내용**:
   - 컴포넌트 구조 (EdgeConflictDialog, MoveToContainerMenu 등)
   - 엣지 충돌 감지 알고리즘 상세 설계
   - Redux actions 통합 방안
   - 이벤트 핸들러 구조
   - 테스트 가능한 아키텍처

### 15.2 구현 순서
1. Architect → 설계 문서 작성
2. Frontend Developer → UI 컴포넌트 구현
3. Test Writer → 단위 테스트 작성
4. E2E Tester → 통합 테스트 작성
5. Code Reviewer → 코드 리뷰
6. QA → 사용자 테스트

---

## 부록 A: 용어 정리

| 용어 | 설명 |
|------|------|
| Container | Loop 또는 Group 스텝 (stepIds 배열을 가짐) |
| Edge Conflict | 컨테이너 경계를 넘는 엣지 |
| Cut Mode | 클립보드에 저장되고 원본 삭제 예약된 상태 |
| Copy Mode | 클립보드에 저장되지만 원본 유지되는 상태 |
| stepIds | Loop/Group이 포함하는 자식 스텝 ID 배열 |

## 부록 B: 참고 자료

| 문서 | 경로 |
|------|------|
| 기존 PRD | /Users/taewookim/dev/scenario_tool/docs/prd.md |
| Redux Store 구조 | /Users/taewookim/dev/scenario_tool/src/store/scenariosSlice.ts |
| Step 타입 정의 | /Users/taewookim/dev/scenario_tool/src/types/step.ts |
| ConfigPage 구현 | /Users/taewookim/dev/scenario_tool/src/pages/ConfigPage.tsx |

---

**문서 버전**: 1.0
**작성일**: 2026-02-07
**작성자**: Spec Writer Agent
**승인자**: (승인 필요)
**다음 리뷰**: Phase 1 완료 후
