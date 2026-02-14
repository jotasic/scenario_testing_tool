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
- **params**: 시나리오 입력 파라미터
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
- **[Loop Visualization](./docs/features/loop-visualization.md)**: 루프 실행의 실시간 시각화 및 모니터링

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

#### 1.2 시나리오 파라미터 정의
시나리오의 입력 파라미터를 정의합니다.

##### 파라미터 스키마 설정 (parameterSchema)

Configuration Panel에서:
```
1. "Parameter Schema" 섹션 열기
2. 필드 추가 (이름, 타입, 기본값, 검증 규칙)
3. 각 필드의 설명 추가
```

**지원되는 파라미터 타입**:
- `string` - 텍스트
- `number` - 숫자 (정수, 소수)
- `boolean` - 참/거짓
- `object` - JSON 객체
- `array` - 배열

**itemSchema 구조** (배열 타입의 항목 정의):
배열 타입(`array`)의 각 요소 구조를 정의하는 중첩된 스키마입니다.
```
array → itemSchema → properties
- array: 최상위 배열 타입
  - itemSchema: 배열의 각 요소가 무엇인지 정의 (object 또는 primitive 타입)
    - properties: itemSchema가 object 타입일 경우, 내부 필드들의 스키마 배열
```
예를 들어, `userList` 배열의 각 요소가 `id`와 `count`를 가진 객체라면:
```
userList (array)
├── itemSchema (object)
│   ├── id (number)
│   └── count (number)
```

**파라미터 스키마 정의 예**:

```javascript
parameterSchema: [
  {
    id: 'param_user_id',
    name: 'userId',
    type: 'string',
    required: true,
    description: '대상 사용자 ID',
  },
  {
    id: 'param_page_size',
    name: 'pageSize',
    type: 'number',
    required: false,
    defaultValue: 10,
    description: '페이지 크기',
    validation: { min: 1, max: 100 },
  },
  {
    id: 'param_filters',
    name: 'filters',
    type: 'object',
    required: false,
    description: '검색 필터',
    properties: [
      {
        id: 'filter_status',
        name: 'status',
        type: 'string',
        description: '상태 (active, inactive)',
      },
      {
        id: 'filter_role',
        name: 'role',
        type: 'string',
        description: '역할 (admin, user)',
      },
    ],
  },
  {
    id: 'param_user_list',
    name: 'userList',
    type: 'array',
    required: true,
    description: '처리할 사용자 목록',
    itemSchema: {
      id: 'param_user_item',
      name: 'user',
      type: 'object',
      properties: [
        {
          id: 'user_item_id',
          name: 'id',
          type: 'number',
          required: true,
          description: '사용자 ID',
        },
        {
          id: 'user_item_count',
          name: 'count',
          type: 'number',
          required: false,
          defaultValue: 1,
          description: '반복 횟수',
        },
      ],
    },
  },
]
```

##### 파라미터 값 입력 (Execute 페이지)

**실행 페이지에서 파라미터 입력**:

```
1. Execution 페이지로 이동
2. "Input Parameters" 패널 오픈
3. 각 파라미터 입력:
   - 단순 타입: 직접 입력
   - 객체: JSON 형식으로 입력
   - 배열: JSON 배열 형식으로 입력
4. "변수 미리보기" 확인으로 해석 검증
5. "Start Execution" 클릭하여 시작
```

**파라미터 입력 예**:

```json
{
  "userId": "user123",
  "pageSize": 20,
  "filters": {
    "status": "active",
    "role": "admin"
  },
  "userList": [
    {
      "id": 1,
      "repeatCount": 2
    },
    {
      "id": 2,
      "repeatCount": 3
    }
  ]
}
```

##### 파라미터 사용 방법 (변수 치환)

**Request Step에서의 파라미터 사용**:

```javascript
// Endpoint 정의
endpoint: '/api/users/${params.userId}',

// 쿼리 파라미터
queryParams: {
  'page-size': '${params.pageSize}',
  'status': '${params.filters.status}',
}

// Request Body
body: {
  name: '${params.userName}',
  email: '${params.userEmail}',
  metadata: {
    source: '${params.filters.source}',
    priority: '${params.priority}'
  }
}

// Headers
headers: [
  {
    key: 'X-User-Id',
    value: '${params.userId}',
    enabled: true
  }
]
```

**Loop Step에서의 파라미터 사용**:

```javascript
// forEach: 배열 순회
loop: {
  type: 'forEach',
  source: 'params.userList',      // 파라미터의 배열 지정
  itemAlias: 'currentUser',
  indexAlias: 'idx'
}

// count: 고정 횟수 (파라미터로 지정 가능)
loop: {
  type: 'count',
  count: '${params.repeatCount}'  // 파라미터 값으로 횟수 설정
}

// while: 조건 반복 (파라미터 참조)
loop: {
  type: 'while',
  condition: {
    source: 'params',
    field: 'continueLoop',
    operator: '==',
    value: true
  }
}
```

**응답값 참조**:

```javascript
// 이전 단계의 응답 참조
${response.stepId}                    // 전체 응답
${response.getUser.id}                // 응답의 특정 필드
${response.getUser.data.profile.name} // 중첩된 필드
${response.searchUsers.items[0].id}   // 배열 요소

// Request Body에서 이전 응답 사용
body: {
  userId: '${response.getUser.id}',
  userName: '${response.getUser.name}',
  orders: '${response.getOrders.items}'
}
```

**변수 참조 예**:

```
${params.userId}              # 문자열 파라미터
${params.filters.status}      # 객체 내 필드
${params.list[0].name}        # 배열의 첫 번째 요소 필드
${response.stepId}            # 응답 전체
${response.stepId.data.count} # 응답의 특정 필드
${loop.item}                  # 루프의 현재 항목 전체
${loop.item.id}               # 루프 항목의 필드
${loop.index}                 # 루프 인덱스 (0부터 시작)
${loop.total}                 # 루프의 전체 반복 횟수 (forEach/count에서 사용)
${system.timestamp}           # 시스템 시간
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
   - Query Params: 쿼리 파라미터
   - Execution Mode: auto/manual/delayed/bypass
```

**Request 스텝 응답 참조**:

Request 스텝의 응답은 자동으로 저장되며, 나중에 변수로 참조할 수 있습니다.
응답은 stepId 또는 responseAlias로 참조할 수 있습니다:
```
${response.stepId}              # stepId로 참조
${response.alias}               # responseAlias로 참조 (설정한 경우)
${response.stepId.data.id}      # responseAlias로 참조할 수도 있음
${response.stepId.list[0].name} # stepId로 참조
```

responseAlias 설정 시:
- alias를 설정하면 `${response.alias}` 형식으로 참조 가능
- stepId로도 여전히 참조 가능 (둘 다 사용 가능)
- 동일한 응답을 두 가지 방법으로 접근 가능

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
- `params`: 입력 파라미터
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

2. 파라미터 역할이 "admin"인 경우
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
Count: ${params.limit} # 파라미터로 횟수 지정

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

#### 1.7 실제 예시 시나리오: 사용자별 주문 처리

다음은 파라미터를 활용한 실제 시나리오 예시입니다.

**목표**: 사용자 목록을 받아서 각 사용자별로 주문을 처리하는 시나리오

**파라미터 정의** (parameterSchema):

```typescript
parameterSchema: [
  {
    id: 'param_users',
    name: 'userList',
    type: 'array',
    required: true,
    description: '처리할 사용자 목록',
    itemSchema: {
      id: 'param_user_item',
      name: 'user',
      type: 'object',
      properties: [
        {
          id: 'user_id',
          name: 'id',
          type: 'number',
          required: true,
          description: '사용자 ID'
        },
        {
          id: 'user_order_count',
          name: 'orderCount',
          type: 'number',
          required: false,
          defaultValue: 1,
          description: '생성할 주문 수'
        }
      ]
    }
  },
  {
    id: 'param_env',
    name: 'environment',
    type: 'string',
    required: false,
    defaultValue: 'production',
    description: '실행 환경 (development, staging, production)'
  }
]
```

**실행 시 파라미터 입력**:

```json
{
  "userList": [
    {
      "id": 101,
      "orderCount": 2
    },
    {
      "id": 102,
      "orderCount": 1
    },
    {
      "id": 103,
      "orderCount": 3
    }
  ],
  "environment": "production"
}
```

**스텝 구성**:

```
1. 첫 번째 사용자 조회 (Request)
   Method: GET
   Endpoint: /api/users/${params.userList[0].id}
   응답 저장: user_detail

2. 사용자별 처리 (Loop - forEach)
   Source: params.userList
   Item Alias: currentUser
   Index Alias: userIdx

3. 각 사용자별 주문 생성 (Loop 내부 Request)
   Method: POST
   Endpoint: /api/orders
   Body:
   {
     "userId": "${loop.item.id}",
     "timestamp": "${system.timestamp}",
     "itemIndex": ${loop.index}
   }
   반복 횟수: ${loop.item.orderCount} (Count Field 사용)

4. 결과 검증 (Condition)
   Source: response
   Step: 마지막 주문 생성 스텝
   Field: statusCode
   Operator: ==
   Value: 201

5. 최종 통계 조회 (Request)
   Method: GET
   Endpoint: /api/stats?environment=${params.environment}
```

**변수 미리보기**:

```
입력값:
- params.userList[0].id = 101
- params.environment = "production"

해석 결과:
- /api/users/${params.userList[0].id}  →  /api/users/101
- Loop에서 첫 반복:
  - ${loop.item.id} → 101
  - ${loop.item.orderCount} → 2
  - ${loop.index} → 0
- /api/stats?environment=${params.environment}  →  /api/stats?environment=production
```

**Response 변수 참조 예**:

```javascript
// 1단계 응답 참조
${response.getUser}
${response.getUser.name}
${response.getUser.email}

// Loop 내에서 이전 응답 참조
body: {
  firstName: '${response.user_detail.name}',
  userId: '${loop.item.id}',
  orderNumber: ${loop.index}
}

// Condition에서 Loop 내 응답 검증
Source: response
Field: statusCode
Operator: ==
Value: 201
```

#### 1.8 주의사항 및 타입 검증

**필수 파라미터 처리**:

```
- required: true로 지정된 파라미터는 반드시 입력해야 함
- 실행 시 필수 파라미터가 비어있으면 에러 발생
- 선택사항 파라미터는 defaultValue 사용
```

**타입 일치**:

```
타입이 맞지 않으면 예상과 다른 결과 발생:
- number 필드에 문자열 입력: 자동 변환되거나 에러
- array 필드에 단일 객체: 배열로 감싸기
- object 필드에 JSON 문자열: JSON으로 파싱 필요
```

**Validation 동작**:

```
Validation 규칙은 파라미터 입력 시점에 검증됩니다:
- 실행 시작 전: 입력 파라미터의 유효성을 확인
- required: 필수 필드는 반드시 입력 필요
- validation 규칙:
  - min/max: 숫자 범위 검증
  - pattern: 정규식 문자열 검증
  - 조건 미충족 시: 실행 불가 에러 발생

Validation은 Request 실행 시점이 아니라 파라미터 입력 시점에서만 동작합니다.
```

**올바른 타입 사용 예**:

```javascript
// 정상
queryParams: {
  'limit': '${params.pageSize}'  // number를 문자열로 변환
}

// 정상
body: {
  count: ${params.pageSize}  // number 그대로 사용
}

// 정상
forEach source: 'params.users'  // array 타입 정확히 지정

// 주의 - 타입 검증
validation: {
  min: 1,        // 최소값
  max: 100,      // 최대값
  pattern: '^[a-z]+$'  // 정규식
}
```

**변수 참조 시 타입 주의**:

```javascript
// 문자열로 감싸야 하는 경우
endpoint: '/api/users/${params.userId}'  // 문자열 연결

// JSON 값으로 사용하는 경우
body: {
  userId: ${params.userId},        // 따옴표 없음 (number)
  name: '${params.userName}',       // 따옴표 있음 (string)
  active: ${params.isActive}        // 따옴표 없음 (boolean)
}
```

**null/undefined 처리**:

```javascript
// 파라미터가 선택사항인 경우
defaultValue 설정으로 항상 값 보장

// Loop Source가 비어있는 경우
forEach는 실행되지 않음 (에러 아님)

// Response 필드가 없는 경우
${response.stepId.missingField}은 undefined가 됨
Condition 검증으로 확인 필수
```

**배열 인덱싱 주의**:

```javascript
// 올바른 사용
${params.users[0].id}        // 첫 번째 요소
${response.items[0].name}    // 첫 번째 요소

// 범위 초과 주의
${params.users[10].id}  // 10개 미만일 경우 undefined

// Loop 내에서 인덱싱
${loop.item}            // 현재 항목 (이미 배열 요소)
${params.users[loop.index]}  // 같은 효과
```

**성능 고려**:

```
- forEach 루프는 배열 크기만큼 반복
  - 10,000개 이상 배열: 성능 저하 주의
  - 필요시 서버에서 페이징 처리 후 루프

- 중첩 루프: 외부 루프 × 내부 루프 반복
  - 100 × 100 = 10,000회 실행 주의

- 응답값이 큰 경우: saveResponse 선택적 사용
  - 필요한 스텝만 저장하여 메모리 절약
```

### 2. 시나리오 실행 (Execution Mode)

#### 2.1 파라미터 입력

```
Execution 페이지에서:
1. "Input Parameters" 패널 오픈
2. 각 파라미터 입력
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
│   │   ├── parameters/     # 파라미터 컴포넌트
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
- `${params.fieldName}` - 파라미터
- `${params.user.name}` - 중첩된 필드
- `${params.list[0].id}` - 배열 요소
- `${response.stepId}` - 전체 응답
- `${response.stepId.data.status}` - 응답의 특정 필드
- `${loop.item}` - 현재 루프 항목
- `${loop.item.name}` - 루프 항목의 필드
- `${loop.index}` - 현재 루프 인덱스 (0부터 시작)
- `${loop.total}` - 루프의 전체 반복 횟수 (forEach의 배열 크기, count 루프의 반복 횟수)
- `${system.timestamp}` - 현재 시간 (ISO 형식)

**파라미터 변수 해석 예**:

```javascript
// 입력 파라미터
{
  "userId": "user123",
  "filters": {
    "status": "active",
    "roles": ["admin", "user"]
  },
  "items": [
    { "id": 1, "name": "Item 1" },
    { "id": 2, "name": "Item 2" }
  ]
}

// Request Step에서의 사용
Endpoint: /api/users/${params.userId}
해석 결과: /api/users/user123

Query Params:
- status: ${params.filters.status}
해석 결과: status=active

Body:
{
  "role": "${params.filters.roles[0]}",  // "admin"
  "firstItemId": ${params.items[0].id},  // 1
  "firstItemName": "${params.items[0].name}"  // "Item 1"
}
```

**Response 변수 해석 예**:

```javascript
// 1단계 요청 응답
// GET /api/users/user123 응답
Response (저장됨: getUser):
{
  "id": "user123",
  "name": "John Doe",
  "email": "john@example.com",
  "data": {
    "createdAt": "2024-01-01",
    "status": "active"
  }
}

// 이후 스텝에서 참조
${response.getUser}                    // 전체 응답 객체
${response.getUser.id}                 // "user123"
${response.getUser.name}               // "John Doe"
${response.getUser.data.status}        // "active"
${response.getUser.data.createdAt}     // "2024-01-01"

// Request Body에서 사용
{
  "userId": "${response.getUser.id}",
  "userName": "${response.getUser.name}",
  "email": "${response.getUser.email}",
  "joinDate": "${response.getUser.data.createdAt}"
}
```

**Loop 변수 해석 예**:

```javascript
// forEach 루프 설정
source: 'params.items'
itemAlias: 'currentItem'
indexAlias: 'itemIdx'

// 입력 파라미터
{
  "items": [
    { "id": 101, "name": "Product A", "qty": 2 },
    { "id": 102, "name": "Product B", "qty": 3 }
  ]
}

// Loop 첫 번째 반복 (itemIdx = 0)
${loop.item}              // { "id": 101, "name": "Product A", "qty": 2 }
${loop.item.id}           // 101
${loop.item.name}         // "Product A"
${loop.item.qty}          // 2
${loop.index}             // 0
${loop.total}             // 2 (배열의 전체 요소 수)

// Loop 두 번째 반복 (itemIdx = 1)
${loop.item.id}           // 102
${loop.item.name}         // "Product B"
${loop.item.qty}          // 3
${loop.index}             // 1
${loop.total}             // 2 (배열의 전체 요소 수)

// Request Body 예
POST /api/orders
{
  "productId": ${loop.item.id},
  "productName": "${loop.item.name}",
  "quantity": ${loop.item.qty},
  "orderIndex": ${loop.index},
  "totalItems": ${loop.total},
  "timestamp": "${system.timestamp}"
}
```

**System 변수 해석 예**:

```javascript
// system.timestamp: 현재 시간 (ISO 8601 형식)
${system.timestamp}  // "2024-02-10T14:30:45.123Z"

// Header에서 사용
{
  "key": "X-Request-Time",
  "value": "${system.timestamp}"
}

// Body에서 사용
{
  "requestTime": "${system.timestamp}",
  "userId": "${params.userId}"
}
```

**복합 변수 참조 예**:

```javascript
// Request 엔드포인트
"/api/users/${params.userId}/orders"

// Request Body
{
  "name": "${params.user.name}",
  "email": "${params.user.email}",
  "orderId": "${response.createOrder.id}",
  "items": [
    {
      "productId": ${params.items[0].id},
      "quantity": ${params.items[0].quantity}
    }
  ]
}

// Loop 내부 요청
POST /api/orders/${response.createOrder.id}/items
{
  "itemId": "${loop.item.productId}",
  "quantity": "${loop.item.qty}",
  "index": ${loop.index},
  "userId": "${params.userId}",
  "createdAt": "${system.timestamp}"
}

// Condition 비교
response.checkStatus.data.success == true
params.environment == "production"
loop.index < 5
```

**변수 타입과 문법**:

```javascript
// 문자열 이스케이핑
Endpoint: "/api/users/${params.userId}"  // 변수가 문자열 내에 포함

// 숫자 (따옴표 없음)
Body: {
  "count": ${params.pageSize},          // number 타입
  "active": ${params.isActive}          // boolean 타입
}

// 객체/배열 (따옴표 없음)
Body: {
  "metadata": ${params.filters},        // 전체 객체
  "items": ${response.getItems}         // 배열
}

// 날짜 문자열
Body: {
  "createdAt": "${system.timestamp}"    // 문자열로 처리
}
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

### 파라미터가 입력되지 않을 때

```
문제: "필수 파라미터 입력 필요" 에러 발생
원인 및 해결:
1. 필수 파라미터 확인 (required: true)
   - Parameter Input Panel에서 모든 필수 필드 입력 확인

2. 파라미터 타입 확인
   - String: 텍스트 입력
   - Number: 숫자만 입력
   - Array/Object: JSON 형식으로 입력

3. JSON 형식 오류
   - Object/Array 파라미터는 반드시 유효한 JSON 형식
   - 큰따옴표 사용 (작은따옴표 불가)
   - 마지막 쉼표 제거
```

**정상 입력 예**:
```json
{
  "userId": "user123",
  "pageSize": 20,
  "userList": [
    { "id": 1, "name": "John" },
    { "id": 2, "name": "Jane" }
  ]
}
```

**잘못된 입력 예**:
```json
// 따옴표 불일치
{
  'userId': 'user123'  // 작은따옴표는 불가
}

// 마지막 쉼표
{
  "userId": "user123",
  "pageSize": 20,  // 쉼표 제거 필요
}

// 문자열이 아닌 숫자 입력 안됨
{
  "pageSize": "twenty"  // "20"으로 수정
}
```

### 변수가 해석되지 않을 때

```
문제: "${params.userId}"가 그대로 출력됨
원인 및 해결:
1. 변수명 철자 확인
   - 정의된 파라미터명과 일치하는지 확인
   - 대소문자 구분 (userId != UserId)

2. 변수가 실제로 정의되었는지 확인
   - Parameter Schema에 해당 필드가 존재하는지 확인
   - 입력 파라미터에 값이 있는지 확인

3. 변수 경로 확인
   - 올바른 경로: ${params.userId}, ${response.stepId.field}
   - 잘못된 경로: ${params.userId} (대소문자 불일치)

4. 변수 미리보기 확인
   - Parameter Input Panel에서 "변수 미리보기" 섹션 확인
   - 해석된 값이 예상과 일치하는지 검증
```

**변수 경로 체크리스트**:
```
✓ 올바른 방법
- ${params.userId}
- ${params.filters.status}
- ${response.getUser.id}
- ${loop.item.name}

✗ 잘못된 방법
- ${paramS.userId}  // 대소문자
- ${param.userId}   // param이 아니라 params
- ${response.stepId} 라고 입력했는데 실제 ID는 getUser
```

### Condition이 작동하지 않을 때

```
문제: Condition이 항상 실패함 또는 작동하지 않음
원인 및 해결:
1. 참조하는 스텝 확인
   - Source에서 정확한 스텝 ID 선택
   - 해당 스텝이 실제로 실행되었는지 확인 (이전 조건에서 스킵되지 않았는지)

2. Field 경로 확인
   - response.stepId.field 형식이 정확한지 확인
   - 응답 구조와 실제 경로가 일치하는지 확인
   - 변수 미리보기에서 실제 값 확인

3. Operator와 Value 타입 확인
   - ==, != : 모든 타입
   - >, >=, <, <= : number 타입만
   - contains, notContains : string/array 타입
   - isEmpty, isNotEmpty : string/array/object 타입

4. 논리 연산자 확인
   - AND: 모든 조건이 참이어야 함
   - OR: 하나 이상의 조건이 참이어야 함
```

**Condition 디버깅**:
```
1. Execution 로그에서 각 조건 평가 결과 확인
2. Step Result Viewer에서 실제 응답값 확인
3. 응답값의 타입과 경로 재검증
4. 조건을 간단하게 수정해서 테스트

예:
상태 코드가 200인 경우만 진행
- Source: response
- Step ID: 실제 스텝 선택
- Field: 응답 상태 코드 필드명 확인 (statusCode vs status)
- Operator: ==
- Value: 200
```

### Loop가 실행되지 않을 때

```
문제: Loop 내의 스텝이 실행되지 않음
원인 및 해결:

1. forEach의 Source 확인
   - Source가 유효한 배열인지 확인 (params.list vs response.getList)
   - 배열이 실제로 요소를 포함하는지 확인
   - 변수 미리보기에서 배열 내용 확인

2. count의 값 확인
   - count가 0 이상인지 확인
   - count가 변수 참조인 경우, 해당 파라미터/응답이 숫자인지 확인

3. while의 조건 확인
   - 초기 조건이 참인지 확인
   - 루프 내에서 조건을 변경하는 요청이 있는지 확인
   - 무한 루프 방지 (maxIterations 설정 확인)

4. 자식 스텝 확인
   - Loop에 자식 스텝(stepIds)이 연결되었는지 확인
   - 자식 스텝의 스킵 모드 확인 (executionMode: 'bypass')
```

**Loop 디버깅**:
```
forEach 루프가 실행되지 않을 때:
1. 변수 미리보기에서 source 값 확인
2. 변수 미리보기에서 배열 요소 확인
3. Item Alias가 설정되었는지 확인
4. Loop 내부 스텝이 존재하는지 확인

count 루프가 실행되지 않을 때:
1. count 값이 0보다 큰지 확인
2. 변수 참조인 경우 파라미터/응답 확인
3. 숫자 타입 확인 (문자열 "5" vs 숫자 5)

while 루프가 실행되지 않을 때:
1. 초기 조건 확인
2. 루프 내 요청이 응답을 저장하는지 확인
3. maxIterations 확인 (기본값 초과 시 중단)
```

### 변수 미리보기가 정확하지 않을 때

```
문제: 변수 미리보기의 값이 예상과 다름
해결:
1. 입력 파라미터 재확인
   - Parameter Input Panel에서 입력값 확인
   - 스크롤하여 모든 파라미터 확인

2. 응답값 변수 미리보기
   - 참조하는 스텝이 실제로 실행되었는지 확인
   - 응답이 저장되었는지 확인 (saveResponse: true)
   - Step Result Viewer에서 실제 응답 확인

3. 루프 변수
   - 루프 상태에서만 loop 변수 사용 가능
   - forEach의 source와 itemAlias 확인
```

### Request 타임아웃

```
문제: 요청이 타임아웃되어 실패
해결:
1. 서버 URL이 정확한지 확인
   - Server의 baseUrl 확인
   - Endpoint 경로 확인
   - 변수 참조가 올바른지 확인

2. 네트워크 연결 확인
   - 인터넷 연결 확인
   - 서버 상태 확인 (다른 도구에서 직접 요청)
   - 방화벽/프록시 설정 확인

3. 타임아웃 설정 증가
   - Server의 timeout 값 증가 (ms 단위)
   - 기본값: 30000ms (30초)
   - 필요시 60000ms (60초) 이상으로 설정
```

## 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

## 기여

버그 리포트, 기능 제안, Pull Request는 언제든 환영합니다.
