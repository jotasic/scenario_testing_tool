# Scenario Tool

API 시나리오 테스트 도구입니다. 복잡한 API 테스트 시나리오를 시각적으로 설계하고 실행할 수 있습니다.

## 주요 기능

### 시나리오 설계 및 시각화
- **Flow Canvas**: React Flow를 기반으로 한 시각적 시나리오 편집기
- 드래그 앤 드롭으로 스텝을 연결하고 구성

### 다양한 스텝 타입
- **Request**: HTTP API 호출 (GET, POST, PUT, PATCH, DELETE)
- **Condition**: 조건부 분기로 복잡한 로직 구현
- **Loop**: forEach, count, while 루프로 반복 실행
- **Group**: 관련 스텝을 그룹화하여 조직

### 변수 시스템
- **params**: 시나리오 입력 매개변수
- **response**: 이전 스텝의 응답값
- **loop**: 루프 변수 (item, index)
- **system**: 시스템 변수 (timestamp)

### 실행 모드
- **auto**: 자동 실행 (기본값)
- **manual**: 사용자 확인 후 실행
- **delayed**: 지정된 시간 후 실행
- **bypass**: 스텝 건너뛰기

### 실행 및 모니터링
- 스텝별 실행 상태 추적
- 응답 데이터 검증 및 확인
- 상세한 실행 로그
- 실행 결과 저장 및 분석

## 기술 스택

### Frontend
- **React 19.2**: UI 프레임워크
- **TypeScript 5.9**: 타입 안정성
- **Vite**: 빌드 도구
- **React Router**: 라우팅

### UI & Styling
- **Material-UI (MUI)**: 컴포넌트 라이브러리
- **Emotion**: CSS-in-JS 스타일링
- **React Flow**: 플로우 그래프 시각화

### State Management & Storage
- **Redux Toolkit**: 상태 관리
- **IDB (IndexedDB)**: 로컬 데이터 저장

### API & 데이터
- **Axios**: HTTP 클라이언트
- **Zod**: 데이터 검증
- **js-yaml**: YAML 처리

### 개발 도구
- **ESLint & TypeScript ESLint**: 코드 품질
- **Playwright**: 테스트

## 설치 및 실행

### 요구사항
- Node.js 18+
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd scenario_tool

# 의존성 설치
npm install
```

### 개발 서버 실행

```bash
# 개발 모드 시작 (http://localhost:5173)
npm run dev
```

### 프로덕션 빌드

```bash
# 빌드 생성
npm run build

# 빌드 결과 미리보기
npm run preview
```

### 코드 검사

```bash
# ESLint 실행
npm run lint
```

## 사용법

### 1. 시나리오 구성 (Configuration Mode)

#### 1.1 서버 설정
좌측 패널에서 서버를 추가합니다.

```
1. "Add Server" 버튼 클릭
2. 서버 정보 입력:
   - Name: 서버 이름 (예: "API Server")
   - Base URL: 기본 URL (예: "https://api.example.com")
   - Headers: 기본 헤더 (모든 요청에 포함됨)
   - Timeout: 요청 타임아웃 (기본: 30000ms)
```

#### 1.2 시나리오 매개변수 정의
시나리오의 입력 매개변수를 정의합니다.

```
Configuration Panel에서:
1. "Parameter Schema" 섹션 열기
2. 필드 추가 (이름, 타입, 기본값)

예:
- userId: type=string, description="사용자 ID"
- pageSize: type=number, default=10
- filters: type=object
```

변수 참조 예:
```
${params.userId}
${params.filters.status}
${params.list[0].name}
```

#### 1.3 Request 스텝 추가

```
Flow Canvas에서:
1. "Add Step" → "Request" 선택
2. Request 상세 설정:
   - Server: 서버 선택
   - Method: HTTP 메서드 선택 (GET, POST, PUT, PATCH, DELETE)
   - Endpoint: API 경로 (예: "/api/users/${params.userId}")
   - Headers: 요청 특정 헤더
   - Body: 요청 본문 (JSON)
   - Query Params: 쿼리 매개변수
   - Execution Mode: auto/manual/delayed/bypass
```

Request 스텝의 응답은 자동으로 저장되며, 나중에 변수로 참조할 수 있습니다:
```
${response.stepId}
${response.stepId.data.id}
${response.stepId.list[0].name}
```

#### 1.4 Condition 스텝 추가

조건부 분기를 만들어 다른 시나리오 경로를 실행합니다.

```
Flow Canvas에서:
1. "Add Step" → "Condition" 선택
2. 분기 설정:
   - "Add Branch" 버튼으로 분기 추가 (최소 2개)
   - 각 분기에 조건 설정
   - 기본 분기 설정 (조건 미충족 시)
```

##### 조건 문법

**Condition Source** (조건값 출처):
- `params`: 입력 매개변수
- `response`: 이전 스텝의 응답

**Comparison Operators** (비교 연산자):
```
== : 같음
!= : 다름
>  : 초과
>= : 이상
<  : 미만
<= : 이하
contains : 포함 (문자열/배열)
notContains : 미포함
isEmpty : 비어있음 (문자열/배열/객체)
isNotEmpty : 비어있지 않음
exists : 존재함 (null/undefined 아님)
```

**조건 예시**:
```
1. 응답 상태가 "success"인 경우
   Source: response
   Step: getUser
   Field: data.status
   Operator: ==
   Value: "success"

2. 매개변수 역할이 "admin"인 경우
   Source: params
   Field: role
   Operator: ==
   Value: "admin"

3. 응답 목록이 비어있지 않은 경우
   Source: response
   Step: searchUsers
   Field: data.results
   Operator: isNotEmpty
```

**논리 연산자** (여러 조건 결합):
```
AND: 모든 조건이 참이어야 함
OR: 하나 이상의 조건이 참이어야 함
```

**조건 예 (복합)**:
```
(status == "active") AND (count > 0)
또는
(role == "admin") OR (permission == "super_user")
```

#### 1.5 Loop 스텝 추가

반복 실행이 필요한 경우 Loop를 사용합니다.

```
Flow Canvas에서:
1. "Add Step" → "Loop" 선택
2. 루프 타입 선택 및 설정
```

##### Loop 타입별 설정

**A. forEach (배열 순회)**

배열의 각 요소에 대해 스텝을 반복 실행합니다.

```
설정:
- Source: 배열의 JSON 경로 (예: "params.users", "response.getData.items")
- Item Alias: 현재 요소 변수명 (예: "user", "item")
- Index Alias (선택): 인덱스 변수명 (예: "index")
- Count Field (선택): 각 요소를 반복할 횟수 필드

사용 예:
Source: params.userList
Item Alias: user
Index Alias: idx

루프 내에서 변수 사용:
${loop.item}           # 현재 user 객체 전체
${loop.item.id}        # 현재 user의 id
${loop.item.email}     # 현재 user의 email
${loop.index}          # 현재 인덱스 (0, 1, 2, ...)
```

**B. count (고정 횟수)**

지정된 횟수만큼 반복 실행합니다.

```
설정:
- Count: 반복 횟수 (고정 숫자 또는 변수 참조)

사용 예:
Count: 5              # 5번 반복
Count: ${params.limit} # 매개변수로 횟수 지정

루프 내에서 변수 사용:
${loop.index}  # 현재 반복 횟수 (0, 1, 2, ...)
```

**C. while (조건 반복)**

조건이 참인 동안 계속 반복합니다.

```
설정:
- Condition: 반복 계속 조건 (Condition과 동일한 문법)

사용 예:
Source: response
Field: data.hasMore
Operator: ==
Value: true

루프 내에서 변수 사용:
${loop.item}   # 현재 반복값
${loop.index}  # 현재 반복 횟수
```

**Loop 예제 시나리오**:
```
시나리오: 사용자 목록 순회

1. getUsers (Request)
   GET /api/users
   응답: { users: [{id: 1, name: "John"}, {id: 2, name: "Jane"}] }

2. userLoop (Loop - forEach)
   Source: response.getUsers.users
   Item Alias: user
   Index Alias: idx

3. getProfile (Request - Loop 내부)
   GET /api/users/${loop.item.id}/profile
   응답을 각 사용자별로 저장

변수 참조:
- ${loop.item.id}: 현재 사용자 ID
- ${loop.item.name}: 현재 사용자 이름
- ${loop.index}: 현재 반복 번호 (0, 1, ...)
```

#### 1.6 Group 스텝 추가

관련된 스텝들을 하나의 그룹으로 조직합니다.

```
Flow Canvas에서:
1. "Add Step" → "Group" 선택
2. 그룹에 포함할 스텝 선택
3. 그룹 축소/확장으로 캔버스 정리
```

### 2. 시나리오 실행 (Execution Mode)

#### 2.1 매개변수 입력

```
Execution 페이지에서:
1. "Input Parameters" 패널 오픈
2. 각 매개변수 입력
3. 변수 미리보기로 해석 확인
```

#### 2.2 시나리오 실행

```
1. "Start Execution" 버튼 클릭
2. 시나리오 자동 시작

Manual 모드 스텝 도달 시:
- 스텝 상세 정보 확인
- 요청/응답 검토
- "Execute" 또는 "Skip" 선택

Delayed 모드 스텝 도달 시:
- 설정된 지연 시간 대기 후 자동 실행
```

#### 2.3 실행 결과 확인

```
Execution Logs에서:
1. 각 스텝의 실행 상태 확인
   - PENDING: 대기 중
   - IN_PROGRESS: 실행 중
   - SUCCESS: 성공
   - FAILED: 실패
   - SKIPPED: 건너뜀

2. Step Result Viewer에서:
   - 요청 상세 정보 (Method, URL, Headers, Body)
   - 응답 상세 정보 (Status, Headers, Body)
   - 실행 시간
```

#### 2.4 변수 미리보기

Parameter Input Panel에서 변수가 어떻게 해석되는지 실시간으로 확인:

```
입력: "GET /api/users/${params.userId}"
미리보기: "GET /api/users/123" (userId=123일 때)

응답값도 미리보기:
${response.searchUsers.data.count}
미리보기: 25
```

## 프로젝트 구조

```
scenario_tool/
├── src/
│   ├── components/          # React 컴포넌트
│   │   ├── flow/           # Flow Canvas 컴포넌트
│   │   │   ├── FlowCanvas.tsx
│   │   │   ├── GraphEditor.tsx
│   │   │   ├── FlowControls.tsx
│   │   │   ├── nodes/      # Flow 노드 컴포넌트
│   │   │   │   ├── RequestNode.tsx
│   │   │   │   ├── ConditionNode.tsx
│   │   │   │   ├── LoopNode.tsx
│   │   │   │   └── GroupNode.tsx
│   │   │   └── ...
│   │   ├── steps/          # 스텝 편집 컴포넌트
│   │   │   ├── RequestStepEditor.tsx
│   │   │   ├── ConditionStepEditor.tsx
│   │   │   ├── LoopStepEditor.tsx
│   │   │   ├── GroupStepEditor.tsx
│   │   │   ├── ConditionBuilder.tsx
│   │   │   └── ...
│   │   ├── execution/      # 실행 관련 컴포넌트
│   │   │   ├── ExecutionControls.tsx
│   │   │   ├── ExecutionProgress.tsx
│   │   │   ├── ExecutionLogs.tsx
│   │   │   ├── StepResultViewer.tsx
│   │   │   └── ManualStepDialog.tsx
│   │   ├── servers/        # 서버 관리 컴포넌트
│   │   │   ├── ServerList.tsx
│   │   │   ├── ServerPanel.tsx
│   │   │   ├── ServerEditor.tsx
│   │   │   └── ...
│   │   ├── parameters/     # 매개변수 컴포넌트
│   │   │   ├── ParameterInputPanel.tsx
│   │   │   ├── ParameterSchemaEditor.tsx
│   │   │   ├── DynamicParameterForm.tsx
│   │   │   └── ...
│   │   ├── layout/         # 레이아웃 컴포넌트
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── ...
│   │   └── common/         # 공통 컴포넌트
│   │       ├── JsonEditor.tsx
│   │       ├── ImportExportDialog.tsx
│   │       └── ...
│   ├── engine/             # 실행 엔진
│   │   ├── scenarioExecutor.ts    # 시나리오 실행 오케스트레이션
│   │   ├── httpClient.ts          # HTTP 요청 실행
│   │   ├── conditionEvaluator.ts  # 조건 평가
│   │   ├── loopProcessor.ts       # 루프 처리
│   │   └── variableResolver.ts    # 변수 해석
│   ├── store/              # Redux 상태 관리
│   │   ├── scenariosSlice.ts
│   │   ├── serversSlice.ts
│   │   ├── executionSlice.ts
│   │   ├── uiSlice.ts
│   │   └── index.ts
│   ├── types/              # TypeScript 타입 정의
│   │   ├── scenario.ts
│   │   ├── step.ts
│   │   ├── loop.ts
│   │   ├── condition.ts
│   │   ├── execution.ts
│   │   ├── parameter.ts
│   │   ├── server.ts
│   │   └── ...
│   ├── pages/              # 페이지 컴포넌트
│   │   ├── ConfigPage.tsx   # 설정 모드
│   │   └── ExecutionPage.tsx # 실행 모드
│   ├── services/           # 비즈니스 로직
│   │   └── storage.ts      # 데이터 저장소
│   ├── hooks/              # 커스텀 훅
│   │   ├── useStorage.ts
│   │   ├── useScenarioExecution.ts
│   │   └── ...
│   ├── utils/              # 유틸리티 함수
│   │   ├── stepFactory.ts
│   │   ├── graphLayout.ts
│   │   └── ...
│   ├── data/               # 샘플 데이터
│   │   ├── sampleScenario.ts
│   │   └── sampleParameters.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 개념 설명

### 변수 해석 (Variable Resolution)

변수는 `${...}` 형식으로 참조됩니다. 문자열, 객체, 배열 등 모든 곳에서 사용할 수 있습니다.

**지원되는 변수 경로**:
- `${params.fieldName}` - 매개변수
- `${params.user.name}` - 중첩된 필드
- `${params.list[0].id}` - 배열 요소
- `${response.stepId}` - 전체 응답
- `${response.stepId.data.status}` - 응답의 특정 필드
- `${loop.item}` - 현재 루프 항목
- `${loop.item.name}` - 루프 항목의 필드
- `${loop.index}` - 현재 루프 인덱스 (0부터 시작)
- `${system.timestamp}` - 현재 시간 (ISO 형식)

**예제**:
```javascript
// Request 엔드포인트
"/api/users/${params.userId}/orders"

// Request Body
{
  "name": "${params.user.name}",
  "email": "${params.user.email}",
  "orderId": "${response.createOrder.id}"
}

// Loop 내부 요청
POST /api/orders/${loop.item.id}/items
{
  "itemId": "${loop.item.productId}",
  "quantity": "${loop.item.qty}",
  "index": ${loop.index}
}

// Condition
response.checkStatus.data.success == true
params.environment == "production"
```

### 실행 흐름

1. **시작**: startStepId에서 시작
2. **스텝 실행**: 각 스텝을 순서대로 실행
3. **조건 평가**: Condition 스텝은 조건에 따라 분기
4. **루프 처리**: Loop 스텝은 자식 스텝을 반복 실행
5. **응답 저장**: Request 스텝의 응답을 저장하여 이후 변수로 참조
6. **완료**: 모든 스텝 실행 완료 또는 에러 발생 시 종료

### 데이터 저장

시나리오와 서버 설정은 IndexedDB에 자동 저장됩니다.

- 자동 저장: 변경사항이 자동으로 저장 (2초 지연)
- 수동 저장: Header의 "Save" 버튼으로 즉시 저장
- 가져오기/내보내기: JSON 형식으로 시나리오 공유

## 트러블슈팅

### 변수가 해석되지 않을 때

```
문제: "${params.userId}"가 그대로 출력됨
해결: 변수명 철자 확인, 변수가 실제로 정의되었는지 확인
```

### Condition이 작동하지 않을 때

```
문제: Condition이 항상 실패함
해결:
1. 참조하는 스텝이 존재하는지 확인
2. Field 경로가 정확한지 확인 (response.stepId.field 형식)
3. Operator와 Value의 타입이 일치하는지 확인
```

### Loop가 실행되지 않을 때

```
문제: Loop 내의 스텝이 실행되지 않음
해결:
1. forEach의 Source가 유효한 배열인지 확인
2. count의 값이 올바른지 확인
3. while의 조건이 충족되는지 확인
```

### Request 타임아웃

```
문제: 요청이 타임아웃되어 실패
해결:
1. 서버 URL이 정확한지 확인
2. 네트워크 연결 확인
3. Request 스텝의 timeout 설정 증가
```

## 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

## 기여

버그 리포트, 기능 제안, Pull Request는 언제든 환영합니다.
