/**
 * 자연어 질의를 API 호출로 변환하는 NLP 모듈
 */

import { CHATBOT_CONSTRAINTS, validateQuery, validateDateRange } from './constraints';

/**
 * API 호출 타입 정의
 */
export type ApiCallType = 'launcher-logs' | 'user-logs' | 'error-logs';

export interface ApiCallParams {
  endpoint: string;
  params: Record<string, any>;
  apiType: ApiCallType;
  description: string; // 사용자에게 보여줄 설명
}

export interface NlpResult {
  success: boolean;
  apiCalls?: ApiCallParams[];
  error?: string;
  clarificationNeeded?: string;
}

/**
 * OpenAI를 사용하여 자연어를 구조화된 API 파라미터로 변환
 */
export async function parseNaturalLanguageQuery(
  query: string,
  apiKey: string
): Promise<NlpResult> {
  // 1. 제약 조건 검증
  const validation = validateQuery(query);
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.reason,
    };
  }

  // 2. OpenAI API 호출하여 의도 파악
  try {
    const systemPrompt = createSystemPrompt();
    const userPrompt = createUserPrompt(query);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, // 일관성 있는 응답을 위해 낮은 temperature
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('OpenAI 응답이 비어있습니다.');
    }

    // 3. AI 응답을 JSON으로 파싱
    const parsed = parseAiResponse(aiResponse);

    // 4. 파싱된 결과를 API 호출 파라미터로 변환
    return convertToApiCalls(parsed);
  } catch (error) {
    console.error('NLP 처리 오류:', error);
    return {
      success: false,
      error: '질문을 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }
}

/**
 * OpenAI 시스템 프롬프트 생성
 */
function createSystemPrompt(): string {
  return `당신은 로그 분석 시스템의 자연어 질의 파서입니다.
사용자의 질문을 분석하여 적절한 API 호출 파라미터로 변환해야 합니다.

## 사용 가능한 API:

### 1. Launcher Logs (런처 로그 분석)
- 용도: trace_log 테이블의 런처 관련 로그 조회
- 파라미터:
  - queryType: "recent" | "range"
  - limit: ${CHATBOT_CONSTRAINTS.apiConstraints.launcherLogs.limit.allowed.join(', ')}
  - logType: ${CHATBOT_CONSTRAINTS.apiConstraints.launcherLogs.logType.allowed.join(', ')} (선택)
  - appName: 앱 이름 (선택)
  - profile: ${CHATBOT_CONSTRAINTS.apiConstraints.launcherLogs.profile.allowed.join(', ')} (선택)
  - startDate, endDate: ISO 8601 형식 (range 모드)

### 2. User Logs (사용자 로그)
- 용도: trace_log 테이블의 특정 사용자(UUID) 로그 조회
- 파라미터:
  - queryType: "recent" | "range"
  - uuid: 사용자 UUID (선택)
  - minutes: ${CHATBOT_CONSTRAINTS.apiConstraints.userLogs.minutes.allowed.join(', ')}
  - logType: ${CHATBOT_CONSTRAINTS.apiConstraints.userLogs.logType.allowed.join(', ')}
  - limit: 조회 개수
  - startDate, endDate: ISO 8601 형식 (range 모드)

### 3. Error Logs (에러 로그)
- 용도: refined_error_logs 테이블의 에러 로그 조회
- 파라미터:
  - queryType: "recent" | "range"
  - minutes: ${CHATBOT_CONSTRAINTS.apiConstraints.errorLogs.minutes.allowed.join(', ')}
  - profile: ${CHATBOT_CONSTRAINTS.apiConstraints.errorLogs.profile.allowed.join(', ')}
  - appName: ${CHATBOT_CONSTRAINTS.apiConstraints.errorLogs.appName.allowed.join(', ')}
  - limit: 조회 개수
  - startDate, endDate: ISO 8601 형식 (range 모드)

## 중요한 규칙:
1. **읽기 전용**: 조회(READ) 작업만 허용됩니다. 수정/삭제/추가는 절대 불가합니다.
2. **날짜 범위**: 최대 30일까지만 조회 가능합니다.
3. **시간 표현 변환**:
   - "최근 N분/시간" → recent 모드, minutes 사용
   - "오늘" → range 모드, startDate는 오늘 00:00:00, endDate는 현재 시간
   - 구체적인 날짜/시간 → range 모드
4. **Launcher Logs는 minutes 파라미터를 지원하지 않습니다**:
   - 런처 로그의 경우 "최근" 질의는 recent 모드에서 limit만 사용
   - 시간 범위가 필요하면 range 모드 사용
5. **불명확한 경우**: clarificationNeeded 필드에 추가 질문을 넣으세요.

## 응답 형식 (JSON):
{
  "intent": "launcher-logs" | "user-logs" | "error-logs" | "unknown",
  "queryType": "recent" | "range",
  "params": {
    // API별 파라미터
  },
  "clarificationNeeded": "추가로 필요한 정보" (선택)
}

## 예시:

사용자: "최근 1시간 동안의 에러 로그 보여줘"
→ {
  "intent": "error-logs",
  "queryType": "recent",
  "params": {
    "minutes": 60,
    "profile": "all",
    "appName": "all",
    "limit": 100
  }
}

사용자: "UUID abc123인 사용자의 최근 로그"
→ {
  "intent": "user-logs",
  "queryType": "recent",
  "params": {
    "uuid": "abc123",
    "minutes": 10,
    "limit": 100
  }
}

사용자: "어제 오전 9시부터 오후 5시까지 런처 로그"
→ {
  "intent": "launcher-logs",
  "queryType": "range",
  "params": {
    "startDate": "YYYY-MM-DDT09:00:00", // 어제 날짜 계산
    "endDate": "YYYY-MM-DDT17:00:00",
    "limit": 100
  }
}

사용자: "오늘 디버그 로그"
→ {
  "intent": "launcher-logs",
  "queryType": "range",
  "params": {
    "startDate": "YYYY-MM-DDT00:00:00", // 오늘 00시
    "endDate": "현재 시간의 ISO 형식",
    "logType": "debug",
    "limit": 100
  }
}

오직 JSON만 응답하세요. 다른 텍스트는 포함하지 마세요.`;
}

/**
 * 사용자 질의 프롬프트 생성
 */
function createUserPrompt(query: string): string {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toISOString();

  return `현재 시간: ${currentTime}
오늘 날짜: ${today}

사용자 질문: "${query}"

위 질문을 분석하여 JSON 형식으로 응답해주세요.`;
}

/**
 * AI 응답 파싱
 */
function parseAiResponse(response: string): any {
  try {
    // JSON 블록 추출 (```json ... ``` 형식일 수 있음)
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                     response.match(/```\s*([\s\S]*?)\s*```/) ||
                     [null, response];

    const jsonStr = jsonMatch[1] || response;
    return JSON.parse(jsonStr.trim());
  } catch (error) {
    console.error('AI 응답 파싱 오류:', error);
    throw new Error('AI 응답을 해석할 수 없습니다.');
  }
}

/**
 * 파싱된 AI 응답을 API 호출 파라미터로 변환
 */
function convertToApiCalls(parsed: any): NlpResult {
  if (parsed.intent === 'unknown' || !parsed.intent) {
    return {
      success: false,
      error: CHATBOT_CONSTRAINTS.errorMessages.unknownQuery,
      clarificationNeeded: parsed.clarificationNeeded,
    };
  }

  if (parsed.clarificationNeeded) {
    return {
      success: false,
      clarificationNeeded: parsed.clarificationNeeded,
    };
  }

  try {
    const apiCall = buildApiCall(parsed);

    // 날짜 범위 검증 (range 모드인 경우)
    if (parsed.queryType === 'range' && parsed.params.startDate && parsed.params.endDate) {
      const startDate = new Date(parsed.params.startDate);
      const endDate = new Date(parsed.params.endDate);
      const validation = validateDateRange(startDate, endDate);

      if (!validation.isValid) {
        return {
          success: false,
          error: validation.reason,
        };
      }
    }

    return {
      success: true,
      apiCalls: [apiCall],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || CHATBOT_CONSTRAINTS.errorMessages.invalidParameter,
    };
  }
}

/**
 * API 호출 객체 생성
 */
function buildApiCall(parsed: any): ApiCallParams {
  const { intent, queryType, params } = parsed;

  switch (intent) {
    case 'launcher-logs':
      return {
        apiType: 'launcher-logs',
        endpoint: queryType === 'recent'
          ? '/api/trace-logs-launcher/recent'
          : '/api/trace-logs-launcher/range',
        params: sanitizeLauncherParams(params, queryType),
        description: `런처 로그 ${queryType === 'recent' ? '최근 조회' : '기간 조회'}`,
      };

    case 'user-logs':
      return {
        apiType: 'user-logs',
        endpoint: '/api/user-logs',
        params: sanitizeUserLogParams(params, queryType),
        description: `사용자 로그 조회${params.uuid ? ` (UUID: ${params.uuid})` : ''}`,
      };

    case 'error-logs':
      return {
        apiType: 'error-logs',
        endpoint: queryType === 'recent'
          ? '/api/error-logs/recent'
          : '/api/error-logs/range',
        params: sanitizeErrorLogParams(params, queryType),
        description: `에러 로그 ${queryType === 'recent' ? '최근 조회' : '기간 조회'}`,
      };

    default:
      throw new Error(`알 수 없는 API 타입: ${intent}`);
  }
}

/**
 * Launcher Logs 파라미터 정제
 */
function sanitizeLauncherParams(params: any, queryType: string): Record<string, any> {
  const sanitized: Record<string, any> = {};
  const constraints = CHATBOT_CONSTRAINTS.apiConstraints.launcherLogs;

  // limit
  if (params.limit && constraints.limit.allowed.includes(params.limit)) {
    sanitized.limit = params.limit;
  } else {
    sanitized.limit = constraints.limit.default;
  }

  // logType
  if (params.logType && constraints.logType.allowed.includes(params.logType)) {
    sanitized.logType = params.logType;
  }

  // appName
  if (params.appName) {
    sanitized.appName = params.appName;
  }

  // profile
  if (params.profile && constraints.profile.allowed.includes(params.profile)) {
    sanitized.profile = params.profile;
  }

  // 날짜 범위
  if (queryType === 'range') {
    if (params.startDate) sanitized.startDate = params.startDate;
    if (params.endDate) sanitized.endDate = params.endDate;
  }

  return sanitized;
}

/**
 * User Logs 파라미터 정제
 */
function sanitizeUserLogParams(params: any, queryType: string): Record<string, any> {
  const sanitized: Record<string, any> = {};
  const constraints = CHATBOT_CONSTRAINTS.apiConstraints.userLogs;

  // uuid
  if (params.uuid) {
    sanitized.uuid = params.uuid;
  }

  // limit
  sanitized.limit = params.limit || constraints.limit.default;
  if (sanitized.limit > constraints.limit.max) {
    sanitized.limit = constraints.limit.max;
  }

  // logType
  if (params.logType && constraints.logType.allowed.includes(params.logType)) {
    sanitized.logType = params.logType;
  } else {
    sanitized.logType = constraints.logType.default;
  }

  // 날짜 범위
  if (queryType === 'range') {
    if (params.startDate) sanitized.startDate = params.startDate;
    if (params.endDate) sanitized.endDate = params.endDate;
  } else {
    // 최근 모드
    if (params.minutes && constraints.minutes.allowed.includes(params.minutes)) {
      sanitized.minutes = params.minutes;
    } else {
      sanitized.minutes = constraints.minutes.default;
    }
  }

  return sanitized;
}

/**
 * Error Logs 파라미터 정제
 */
function sanitizeErrorLogParams(params: any, queryType: string): Record<string, any> {
  const sanitized: Record<string, any> = {};
  const constraints = CHATBOT_CONSTRAINTS.apiConstraints.errorLogs;

  // limit
  sanitized.limit = params.limit || constraints.limit.default;
  if (sanitized.limit > constraints.limit.max) {
    sanitized.limit = constraints.limit.max;
  }

  // profile
  if (params.profile && constraints.profile.allowed.includes(params.profile)) {
    sanitized.profile = params.profile;
  } else {
    sanitized.profile = constraints.profile.default;
  }

  // appName
  if (params.appName && constraints.appName.allowed.includes(params.appName)) {
    sanitized.appName = params.appName;
  } else {
    sanitized.appName = constraints.appName.default;
  }

  // 날짜 범위
  if (queryType === 'range') {
    if (params.startDate) sanitized.startDate = params.startDate;
    if (params.endDate) sanitized.endDate = params.endDate;
  } else {
    // 최근 모드
    if (params.minutes && constraints.minutes.allowed.includes(params.minutes)) {
      sanitized.minutes = params.minutes;
    } else {
      sanitized.minutes = constraints.minutes.default;
    }
  }

  return sanitized;
}
