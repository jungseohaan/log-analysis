"use client";

import { useState, useRef, useEffect } from "react";
import { parseNaturalLanguageQuery, type ApiCallParams } from "@/lib/chatbot/nlp";
import { traceLogsApi } from "@/lib/api/trace-logs";
import { errorLogsApi } from "@/lib/api/error-logs";
import { summarizeLogs, summarizeErrorLogs } from "@/lib/openai";
import { getErrCdDescription } from "@/lib/errCdMapping";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  apiCall?: ApiCallParams;
  data?: any;
  error?: string;
}

interface QueryHistory {
  id: string;
  query: string;
  timestamp: Date;
}

// 예시 질문 목록
const EXAMPLE_QUERIES = [
  "최근 1시간 동안의 에러 로그",
  "최근 10분 런처 로그",
  "최근 1시간 동안의 런처 로그 중 이벤트 로그만 요약",
  "최근 30분 에러 로그",
  "개발 환경 런처 로그",
];

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "system",
      content:
        "안녕하세요! 로그 분석 챗봇입니다. 자연어로 로그 데이터를 조회할 수 있습니다.\n\n오른쪽의 예시 질문을 클릭하거나 직접 질문을 입력해주세요.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 질의 실행 함수
  const executeQuery = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // 히스토리에 추가 (중복 제거)
    setQueryHistory((prev) => {
      const exists = prev.some((h) => h.query === query.trim());
      if (!exists) {
        return [
          {
            id: Date.now().toString(),
            query: query.trim(),
            timestamp: new Date(),
          },
          ...prev,
        ].slice(0, 20); // 최대 20개까지만 저장
      }
      return prev;
    });

    setInput("");
    setIsLoading(true);

    try {
      // OpenAI API 키 가져오기
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || "";
      if (!apiKey) {
        throw new Error("OpenAI API 키가 설정되지 않았습니다.");
      }

      // 자연어 쿼리 파싱
      const nlpResult = await parseNaturalLanguageQuery(userMessage.content, apiKey);

      if (!nlpResult.success) {
        // 에러 또는 추가 정보 필요
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: nlpResult.error || nlpResult.clarificationNeeded || "처리할 수 없는 질문입니다.",
          timestamp: new Date(),
          error: nlpResult.error,
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }

      // API 호출
      if (nlpResult.apiCalls && nlpResult.apiCalls.length > 0) {
        for (const apiCall of nlpResult.apiCalls) {
          await executeApiCall(apiCall);
        }
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `오류가 발생했습니다: ${error.message}`,
        timestamp: new Date(),
        error: error.message,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // API 호출 실행
  const executeApiCall = async (apiCall: ApiCallParams) => {
    try {
      let data: any;
      let logs: any[] = [];

      // API 호출
      switch (apiCall.apiType) {
        case "launcher-logs":
        case "user-logs":
          if (apiCall.endpoint.includes("/recent")) {
            data = await traceLogsApi.getRecentLogs(apiCall.params as any);
          } else {
            data = await traceLogsApi.getLogsByDateRange(apiCall.params as any);
          }
          logs = data || [];
          break;

        case "error-logs":
          if (apiCall.endpoint.includes("/recent")) {
            data = await errorLogsApi.getRecentErrorLogs(apiCall.params as any);
          } else {
            data = await errorLogsApi.getErrorLogsByDateRange(apiCall.params as any);
          }
          logs = data?.logs || [];
          break;

        default:
          throw new Error(`알 수 없는 API 타입: ${apiCall.apiType}`);
      }

      // AI 요약 생성
      let summary = "";
      if (logs.length > 0) {
        if (apiCall.apiType === "error-logs") {
          // 에러 로그 요약
          const summaryResult = await summarizeErrorLogs({
            logs: logs.map((log) => ({
              id: log.id,
              appName: log.appName,
              createdAt: log.createdAt,
              error: getErrCdDescription(log.errCd),
              errMsg: log.errMsg,
              userId: log.userId,
            })),
          });

          if (summaryResult.error) {
            summary = `⚠️ 요약 생성 실패: ${summaryResult.error}\n\n`;
          } else {
            summary = `📝 **AI 요약**\n${summaryResult.summary}\n\n`;
          }
        } else {
          // 런처 로그 / 사용자 로그 요약
          const summaryResult = await summarizeLogs({
            logs: logs.map((log) => ({
              id: log.id,
              createdAt: log.createdAt,
              logPayload: log.logPayload,
            })),
            queryType: apiCall.endpoint.includes("/recent") ? "recent" : "range",
            dateRange: apiCall.params.startDate && apiCall.params.endDate
              ? {
                  startDate: apiCall.params.startDate,
                  endDate: apiCall.params.endDate,
                }
              : undefined,
          });

          if (summaryResult.error) {
            summary = `⚠️ 요약 생성 실패: ${summaryResult.error}\n\n`;
          } else {
            summary = `📝 **AI 요약**\n${summaryResult.summary}\n\n`;
          }
        }
      }

      // 결과 메시지 생성
      const total = data?.total;
      let content = `✅ **${apiCall.description}** 완료\n\n`;
      content += `📊 조회된 로그: ${logs.length}개`;
      if (total !== undefined) {
        content += ` / 전체: ${total}개`;
      }
      content += "\n\n";

      if (logs.length === 0) {
        content += "조회된 로그가 없습니다.";
      } else {
        content += summary;
      }

      const resultMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content,
        timestamp: new Date(),
        apiCall,
        data,
      };

      setMessages((prev) => [...prev, resultMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `API 호출 중 오류가 발생했습니다: ${error.message}`,
        timestamp: new Date(),
        error: error.message,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // 메시지 전송 (input 사용)
  const handleSend = async () => {
    await executeQuery(input);
  };

  // 질의 클릭 핸들러
  const handleQueryClick = async (query: string) => {
    await executeQuery(query);
  };

  // Enter 키 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* 왼쪽: 채팅 영역 */}
      <div className="flex w-2/3 flex-col border-r border-gray-200">
        {/* 헤더 */}
        <div className="border-b border-indigo-200 bg-white/80 backdrop-blur-sm p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">로그 분석 챗봇</h1>
              <p className="text-sm text-gray-600">
                자연어로 로그 데이터를 쉽게 조회하세요
              </p>
            </div>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-md ${
                  message.role === "user"
                    ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                    : message.role === "system"
                    ? "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 border border-gray-300"
                    : message.error
                    ? "bg-gradient-to-br from-red-50 to-red-100 text-red-800 border border-red-200"
                    : "bg-white text-gray-800 border border-gray-200"
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
                <div
                  className={`mt-2 text-xs ${
                    message.role === "user"
                      ? "text-blue-100"
                      : "text-gray-500"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-white px-4 py-3 shadow-md border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500"></div>
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-blue-500"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-blue-500"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                  <span className="ml-2 text-sm text-gray-600">처리 중...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 입력 영역 */}
        <div className="border-t border-indigo-200 bg-white/80 backdrop-blur-sm p-4 shadow-lg">
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="질문을 입력하세요... (Shift+Enter: 줄바꿈, Enter: 전송)"
              className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="flex h-auto items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 px-6 text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 오른쪽: 예시 질문 & 질의 히스토리 */}
      <div className="flex w-1/3 flex-col bg-gray-50">
        {/* 예시 질문 섹션 */}
        <div className="border-b border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-gray-900">📝 예시 질문</h2>
          <div className="space-y-2">
            {EXAMPLE_QUERIES.map((query, index) => (
              <button
                key={index}
                onClick={() => handleQueryClick(query)}
                disabled={isLoading}
                className="w-full text-left rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 text-sm text-gray-700 transition-all hover:from-blue-100 hover:to-indigo-100 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed border border-blue-200"
              >
                <span className="text-blue-600 mr-2">→</span>
                {query}
              </button>
            ))}
          </div>
        </div>

        {/* 질의 히스토리 섹션 */}
        <div className="flex-1 overflow-auto p-6">
          <h2 className="mb-4 text-lg font-bold text-gray-900">🕐 질의 히스토리</h2>
          {queryHistory.length === 0 ? (
            <div className="text-center text-sm text-gray-500 py-8">
              아직 질의한 내역이 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {queryHistory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleQueryClick(item.query)}
                  disabled={isLoading}
                  className="w-full text-left rounded-lg bg-white px-4 py-3 text-sm text-gray-700 shadow-sm transition-all hover:shadow-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex-1 line-clamp-2">{item.query}</span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {item.timestamp.toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
