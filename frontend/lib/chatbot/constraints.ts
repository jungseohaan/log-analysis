/**
 * 챗봇 자연어 질의 제약 조건 설정
 *
 * 이 파일은 챗봇이 자연어 질의를 처리할 때 적용되는 제약 조건을 정의합니다.
 * 보안과 데이터 무결성을 위해 읽기 전용 작업만 허용됩니다.
 */

export const CHATBOT_CONSTRAINTS = {
  /**
   * 허용된 작업 타입
   * - READ: 데이터 조회만 허용
   * - UPDATE, DELETE, INSERT: 모두 금지
   */
  allowedOperations: ['READ'] as const,

  /**
   * 금지된 작업 키워드
   * 자연어 질의에서 이러한 키워드가 포함되면 거부됩니다.
   */
  forbiddenKeywords: [
    '삭제', 'delete', 'remove', '지워',
    '수정', 'update', 'modify', 'change', '변경', '바꿔',
    '추가', 'insert', 'add', 'create', '생성',
    '업데이트', '갱신',
    'drop', 'truncate', 'alter',
  ],

  /**
   * 허용된 API 엔드포인트
   * 챗봇은 이 목록의 API만 호출할 수 있습니다.
   */
  allowedEndpoints: [
    '/api/trace-logs-launcher/recent',
    '/api/trace-logs-launcher/range',
    '/api/user-logs',
    '/api/error-logs/recent',
    '/api/error-logs/range',
  ],

  /**
   * API별 파라미터 제약 조건
   */
  apiConstraints: {
    /**
     * Launcher Logs API 제약
     */
    launcherLogs: {
      limit: {
        allowed: [100, 200, 300, 1000, 10000, 100000],
        default: 100,
        max: 100000,
      },
      logType: {
        allowed: ['debug', 'ack', 'stats', 'error', 'event'],
        default: null, // null = all
      },
      appName: {
        description: '앱 이름 (자유 입력)',
        default: null, // null = all
      },
      profile: {
        allowed: ['stg', 'dev', 'stg1', 'r-math', 'r-engl'],
        default: null, // null = all
      },
    },

    /**
     * User Logs API 제약
     */
    userLogs: {
      minutes: {
        allowed: [10, 20, 30, 60, 480, 720],
        default: 10,
      },
      limit: {
        default: 100,
        max: 10000,
      },
      logType: {
        allowed: ['all', 'debug', 'ack', 'stats', 'error', 'event'],
        default: 'all',
      },
      uuid: {
        description: 'UUID 검색 (like 검색, 앞부분 와일드카드 불가)',
        default: null,
      },
    },

    /**
     * Error Logs API 제약
     */
    errorLogs: {
      minutes: {
        allowed: [10, 30, 60, 360, 720, 1440],
        default: 10,
      },
      limit: {
        default: 100,
        max: 1000,
      },
      profile: {
        allowed: ['all', 'dev', 'stg', 'access', 'r-engl', 'r-math'],
        default: 'all',
      },
      appName: {
        allowed: ['all', 'vlmsapi', 'launcher', 'socket', 'tool', 'VIEWER'],
        default: 'all',
      },
    },
  },

  /**
   * 시간 범위 제약
   */
  timeRangeConstraints: {
    /**
     * 최대 조회 가능 기간 (일)
     */
    maxDaysRange: 30,

    /**
     * 미래 날짜 조회 금지
     */
    allowFutureDates: false,

    /**
     * 날짜 형식
     */
    dateFormat: 'ISO 8601 (YYYY-MM-DDTHH:mm:ss)',
  },

  /**
   * 결과 제한
   */
  resultLimits: {
    /**
     * 챗봇이 한 번에 표시할 수 있는 최대 결과 수
     */
    maxDisplayResults: 100,

    /**
     * 대용량 결과에 대한 경고 임계값
     */
    warningThreshold: 1000,
  },

  /**
   * 보안 설정
   */
  security: {
    /**
     * SQL 인젝션 방지를 위한 특수 문자 필터링
     */
    forbiddenChars: [';', '--', '/*', '*/', 'xp_', 'sp_'],

    /**
     * 민감한 필드 접근 제한
     * 챗봇 응답에서 이러한 필드는 마스킹되거나 제외됩니다.
     */
    sensitiveFields: ['password', 'token', 'secret', 'key'],

    /**
     * API 호출 속도 제한 (초당 요청 수)
     */
    rateLimit: {
      maxRequestsPerMinute: 30,
      maxRequestsPerHour: 500,
    },
  },

  /**
   * 자연어 이해 가이드
   * 챗봇이 자연어를 API 파라미터로 변환할 때 사용하는 매핑
   */
  naturalLanguageMapping: {
    timeExpressions: {
      '최근': 'recent',
      '지난': 'recent',
      '최신': 'recent',
      '오늘': { minutes: 1440 }, // 24시간
      '어제': { daysAgo: 1 },
      '이번 주': { daysAgo: 7 },
      '이번 달': { daysAgo: 30 },
    },

    logTypes: {
      '디버그': 'debug',
      '디버깅': 'debug',
      '에러': 'error',
      '오류': 'error',
      '에러로그': 'error',
      '이벤트': 'event',
      '통계': 'stats',
      '확인': 'ack',
    },

    profiles: {
      '스테이징': 'stg',
      '스테이지': 'stg',
      '개발': 'dev',
      '수학': 'r-math',
      '영어': 'r-engl',
    },

    apps: {
      'API': 'vlmsapi',
      '런처': 'launcher',
      '소켓': 'socket',
      '도구': 'tool',
      '뷰어': 'VIEWER',
    },

    counts: {
      '조금': 100,
      '적당히': 200,
      '많이': 1000,
      '전체': 10000,
    },
  },

  /**
   * 에러 메시지 템플릿
   */
  errorMessages: {
    forbiddenOperation: '죄송합니다. 데이터 조회만 가능합니다. 수정, 삭제, 추가 작업은 허용되지 않습니다.',
    invalidTimeRange: '조회 기간은 최대 30일까지만 가능합니다.',
    futureDateNotAllowed: '미래 날짜는 조회할 수 없습니다.',
    invalidParameter: '유효하지 않은 파라미터입니다. 허용된 값을 확인해주세요.',
    rateLimitExceeded: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    apiNotFound: '요청하신 데이터를 찾을 수 없습니다. 다시 한 번 확인해주세요.',
    unknownQuery: '질문을 이해하지 못했습니다. 더 구체적으로 말씀해주세요.',
  },
};

/**
 * 자연어 질의가 제약 조건을 위반하는지 검사
 */
export function validateQuery(query: string): {
  isValid: boolean;
  reason?: string;
} {
  const lowerQuery = query.toLowerCase();

  // 금지된 키워드 검사
  for (const keyword of CHATBOT_CONSTRAINTS.forbiddenKeywords) {
    if (lowerQuery.includes(keyword.toLowerCase())) {
      return {
        isValid: false,
        reason: CHATBOT_CONSTRAINTS.errorMessages.forbiddenOperation,
      };
    }
  }

  // 특수 문자 검사
  for (const char of CHATBOT_CONSTRAINTS.security.forbiddenChars) {
    if (query.includes(char)) {
      return {
        isValid: false,
        reason: '유효하지 않은 문자가 포함되어 있습니다.',
      };
    }
  }

  return { isValid: true };
}

/**
 * API 엔드포인트가 허용되는지 검사
 */
export function isEndpointAllowed(endpoint: string): boolean {
  return CHATBOT_CONSTRAINTS.allowedEndpoints.includes(endpoint);
}

/**
 * 날짜 범위가 유효한지 검사
 */
export function validateDateRange(startDate: Date, endDate: Date): {
  isValid: boolean;
  reason?: string;
} {
  const now = new Date();
  const maxDays = CHATBOT_CONSTRAINTS.timeRangeConstraints.maxDaysRange;
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // 미래 날짜 체크
  if (!CHATBOT_CONSTRAINTS.timeRangeConstraints.allowFutureDates) {
    if (endDate > now) {
      return {
        isValid: false,
        reason: CHATBOT_CONSTRAINTS.errorMessages.futureDateNotAllowed,
      };
    }
  }

  // 최대 범위 체크
  if (daysDiff > maxDays) {
    return {
      isValid: false,
      reason: CHATBOT_CONSTRAINTS.errorMessages.invalidTimeRange,
    };
  }

  // 시작일이 종료일보다 늦은 경우
  if (startDate > endDate) {
    return {
      isValid: false,
      reason: '시작 날짜가 종료 날짜보다 늦을 수 없습니다.',
    };
  }

  return { isValid: true };
}
