import OpenAI from "openai";
import { getEvtCdDescription } from "./evtCdMapping";

// OpenAI API 클라이언트 초기화
// API 키는 환경 변수에서 가져옵니다
export const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
  dangerouslyAllowBrowser: true, // 클라이언트 사이드에서 사용
});

export interface LogSummaryRequest {
  logs: Array<{
    id: number;
    createdAt: string;
    logPayload: string;
  }>;
  queryType: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export interface LogSummaryResponse {
  summary: string;
  error?: string;
  tokenCount?: number;
}

/**
 * 시간에서 초를 제거하는 함수 (yyyy-MM-dd HH:mm 형식으로 변환)
 */
function formatTimeWithoutSeconds(dateString: string): string {
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
}

/**
 * 대략적인 토큰 수를 계산하는 함수
 * (영문 4자 = 1토큰, 한글 1.5자 = 1토큰으로 추정)
 */
function estimateTokenCount(text: string): number {
  // 한글과 영문을 구분하여 계산
  const koreanChars = (text.match(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g) || []).length;
  const otherChars = text.length - koreanChars;

  // 한글: 1.5자당 1토큰, 영문 및 기타: 4자당 1토큰
  const koreanTokens = Math.ceil(koreanChars / 1.5);
  const otherTokens = Math.ceil(otherChars / 4);

  return koreanTokens + otherTokens;
}

/**
 * OpenAI API를 사용하여 로그 데이터를 요약합니다
 */
export async function summarizeLogs(
  request: LogSummaryRequest
): Promise<LogSummaryResponse> {
  try {
    // 로그 데이터를 최소화하여 텍스트로 변환 (이름, 시간(초 제외), evtCd 의미)
    const logsText = request.logs
      .map((log) => {
        try {
          const payload = JSON.parse(log.logPayload);
          const time = formatTimeWithoutSeconds(log.createdAt);
          const name = payload.uName || "";
          const userType = payload.uType === "S" ? "학생" : payload.uType === "T" ? "선생님" : "";
          const evtCd = payload.evtCd || "";

          // evtCd를 의미로 변환
          const evtCdDescription = evtCd ? getEvtCdDescription(evtCd) : "";

          // 최소한의 정보만 포함 (evtCd 원본 대신 해석된 의미 사용)
          if (evtCdDescription) {
            return `[${time}] ${name} ${userType} - ${evtCdDescription}`;
          } else {
            return `[${time}] ${name} ${userType}`;
          }
        } catch {
          return "";
        }
      })
      .filter((line) => line !== "") // 빈 줄 제거
      .join("\n");

    const systemPrompt = `You are a log analysis assistant. Analyze the provided log data and provide a comprehensive summary in Korean.

The log format is: [yyyy-MM-dd HH:mm] name userType - event description
Note: The event description is already translated from event codes to Korean descriptions.

Your summary should include:
1. 전체 로그 개수와 시간 범위 (한 줄로 표시. 예: "2025년 10월 27일 09:45부터 09:55까지 (총 58개)")
2. 주요 이벤트 패턴과 빈도 (이벤트 설명 기준. 예: "2. 주요 이벤트 패턴과 빈도)
3. 사용자 활동 분석 (사용자 별 행동 비율)
4. 발견된 주요 이벤트 TOP 10 (각 이벤트의 분포율을 100% 기준으로 표기. 예: "이벤트명 - XX건 (YY%)")
5. 특이사항이나 주목할 만한 패턴
6. 시간대별 활동 분석
7. 이상 행동 분석(한 사용자가 잦은 로그인 시도)

Be concise but informative. Use bullet points and clear structure.`;

    const userPrompt = `다음 런처 로그 데이터를 분석하고 요약해주세요:\n\n${logsText.substring(0, 100000)}`; // 토큰 제한을 위해 최대 100KB

    // 토큰 수 추정
    const estimatedTokens = estimateTokenCount(systemPrompt) + estimateTokenCount(userPrompt);

    // OpenAI API 호출 - gpt-3.5-turbo가 가장 저렴함 ($0.0005 per 1K input tokens)
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const summary = completion.choices[0]?.message?.content || "요약을 생성할 수 없습니다.";

    return { summary, tokenCount: estimatedTokens };
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    return {
      summary: "",
      error: error.message || "요약 생성 중 오류가 발생했습니다.",
    };
  }
}

export interface ErrorLogSummaryRequest {
  logs: Array<{
    id: number;
    appName: string;
    createdAt: string;
    error: string;
    errMsg: string;
    userId: string;
  }>;
}

/**
 * OpenAI API를 사용하여 에러 로그 데이터를 요약합니다
 */
export async function summarizeErrorLogs(
  request: ErrorLogSummaryRequest
): Promise<LogSummaryResponse> {
  try {
    // 에러 로그 데이터를 텍스트로 변환
    const logsText = request.logs
      .map((log) => {
        const time = formatTimeWithoutSeconds(log.createdAt);
        return `[${time}] ${log.appName} - ${log.error} - ${log.errMsg}${log.userId ? ` (User: ${log.userId})` : ""}`;
      })
      .join("\n");

    const systemPrompt = `You are an error log analysis assistant. Analyze the provided error log data and provide a comprehensive summary in Korean.

The log format is: [yyyy-MM-dd HH:mm] appName - error description - error message (User: userId)

Your summary should include:
1. 전체 에러 로그 개수와 시간 범위
2. 주요 에러 유형과 빈도 (에러 설명 기준)
3. 앱별 에러 분포
4. 발견된 주요 에러 TOP 10 (각 에러의 분포율을 100% 기준으로 표기. 예: "에러명 - XX건 (YY%)")
5. 특이사항이나 주목할 만한 패턴
6. 시간대별 에러 발생 분석

Be concise but informative. Use bullet points and clear structure.`;

    const userPrompt = `다음 에러 로그 데이터를 분석하고 요약해주세요:\n\n${logsText.substring(0, 100000)}`; // 토큰 제한을 위해 최대 100KB

    // 토큰 수 추정
    const estimatedTokens = estimateTokenCount(systemPrompt) + estimateTokenCount(userPrompt);

    // OpenAI API 호출
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const summary = completion.choices[0]?.message?.content || "요약을 생성할 수 없습니다.";

    return { summary, tokenCount: estimatedTokens };
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    return {
      summary: "",
      error: error.message || "요약 생성 중 오류가 발생했습니다.",
    };
  }
}
