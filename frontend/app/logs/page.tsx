"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { traceLogsApi, type TraceLog } from "@/lib/api/trace-logs";
import { getEvtCdDescription } from "@/lib/evtCdMapping";
import { summarizeLogs } from "@/lib/openai";

type QueryType = "recent" | "range";

export default function LogsPage() {
  const router = useRouter();
  const [queryType, setQueryType] = useState<QueryType>("recent");
  const [limit, setLimit] = useState<100 | 200 | 300 | 1000>(100);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [profile, setProfile] = useState<string>("dev");
  const [logType, setLogType] = useState<string>("event");
  const [selectedLog, setSelectedLog] = useState<TraceLog | null>(null);
  const [enableAutoRefresh, setEnableAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [enableSummary, setEnableSummary] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string>("");
  const [tokenCount, setTokenCount] = useState<number>(0);

  // 최근 로그 조회 - 자동 조회 및 1분마다 자동 갱신
  const recentQuery = useQuery({
    queryKey: ["trace-logs-launcher", "recent", limit, logType, profile],
    queryFn: async () => {
      const data = await traceLogsApi.getRecentLogs({
        limit,
        logType: logType === "all" ? undefined : logType,
        profile: profile === "all" ? undefined : profile,
      });
      setLastUpdated(new Date());
      return data;
    },
    enabled: queryType === "recent", // recent 모드일 때 자동 조회
    refetchInterval: enableAutoRefresh && queryType === "recent" ? 60000 : false, // 1분마다
    refetchIntervalInBackground: false, // 백그라운드 탭에서는 폴링 중지
    gcTime: 0,
    staleTime: 0,
  });

  // 날짜 범위 로그 조회 - 수동 조회만
  const rangeQuery = useQuery({
    queryKey: ["trace-logs-launcher", "range", startDate, endDate, limit, logType, profile],
    queryFn: async () => {
      const data = await traceLogsApi.getLogsByDateRange({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        limit,
        logType: logType === "all" ? undefined : logType,
        profile: profile === "all" ? undefined : profile,
      });
      setLastUpdated(new Date());
      return data;
    },
    enabled: false, // 수동 조회만 가능
    gcTime: 0,
    staleTime: 0,
  });

  const currentQuery = queryType === "recent" ? recentQuery : rangeQuery;
  const currentLogs = currentQuery.data || [];

  // queryType이 변경되면 자동 갱신도 초기화
  useEffect(() => {
    if (queryType === "range") {
      setEnableAutoRefresh(false);
    }
  }, [queryType]);

  const generateSummary = async () => {
    if (currentLogs.length === 0) return;

    setIsSummarizing(true);
    setSummaryError("");
    setSummary("");
    setTokenCount(0);

    const result = await summarizeLogs({
      logs: currentLogs,
      queryType,
      dateRange:
        queryType === "range"
          ? { startDate, endDate }
          : undefined,
    });

    setIsSummarizing(false);

    if (result.error) {
      setSummaryError(result.error);
    } else if (result.tokenCount) {
      // 토큰 수 저장
      setTokenCount(result.tokenCount);

      // 50K 토큰 이상일 때 확인
      if (result.tokenCount > 50000) {
        const confirmed = window.confirm(
          `API로 전송할 데이터가 ${result.tokenCount.toLocaleString()} 토큰으로 예상됩니다.\n` +
          `(약 $${((result.tokenCount / 1000) * 0.0005).toFixed(4)} 비용 예상)\n\n` +
          `계속 진행하시겠습니까?`
        );

        if (!confirmed) {
          setEnableSummary(false);
          setSummary("");
          setSummaryError("");
          setTokenCount(0);
          return;
        }
      }

      setSummary(result.summary);
    } else {
      setSummary(result.summary);
    }
  };

  const handleSearch = async () => {
    if (queryType === "recent") {
      await recentQuery.refetch();
    } else {
      await rangeQuery.refetch();
    }

    // 요약 버튼이 활성화되어 있으면 자동으로 요약 생성
    if (enableSummary) {
      // 데이터 로드 후 요약 생성을 위해 약간의 지연
      setTimeout(() => {
        generateSummary();
      }, 100);
    }
  };

  const handleToggleAutoRefresh = () => {
    setEnableAutoRefresh(!enableAutoRefresh);
  };

  const handleToggleSummary = async () => {
    const newEnableSummary = !enableSummary;
    setEnableSummary(newEnableSummary);

    if (newEnableSummary && currentLogs.length > 0) {
      // 요약 활성화 시 OpenAI API 호출
      await generateSummary();
    } else {
      // 요약 비활성화 시 초기화
      setSummary("");
      setSummaryError("");
      setTokenCount(0);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatPayload = (payload: string) => {
    try {
      return JSON.stringify(JSON.parse(payload), null, 2);
    } catch {
      return payload;
    }
  };

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return "없음";
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const parseLogPayload = (payload: string) => {
    try {
      return JSON.parse(payload);
    } catch {
      return {};
    }
  };

  const formatLogItem = (log: TraceLog) => {
    const data = parseLogPayload(log.logPayload);
    const schlNum = data.schlNum || "";

    // 선생님인데 이름이 없으면 '아무개'로 표시
    let uName = data.uName || "";
    if (data.uType === "T" && !uName) {
      uName = "아무개";
    }

    const uType = data.uType === "S" ? "학생" : data.uType === "T" ? "선생님" : "";
    const evtCd = data.evtCd || "";

    // evtCd를 설명으로 변환
    const evtCdDescription = evtCd ? getEvtCdDescription(evtCd) : "";

    return `${schlNum} ${uName} ${uType}${evtCdDescription ? " : " + evtCdDescription : ""}`.trim();
  };

  // UUID 클릭 시 사용자 로그 페이지로 이동 (생성 시간 포함)
  const handleUuidClick = (uuid: string, createdAt: string) => {
    if (uuid) {
      const params = new URLSearchParams({
        uuid: uuid,
        timestamp: createdAt,
      });
      router.push(`/user-logs?${params.toString()}`);
    }
  };

  return (
    <div className="flex h-full">
      {/* 로그 목록 영역 */}
      <div className="flex w-2/3 flex-col border-r border-gray-200">
        {/* 헤더 */}
        <div className="border-b border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              런처 로그분석 (LAUNCHER LOG ANALYSIS)
            </h1>
            <div className="flex items-center gap-3">
              {/* 요약 토글 */}
              <label className="flex items-center gap-2 rounded-lg bg-purple-100 px-4 py-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSummary}
                  onChange={handleToggleSummary}
                  className="h-4 w-4 accent-purple-600"
                  disabled={currentLogs.length === 0 || isSummarizing}
                />
                <span className="text-sm font-medium text-purple-700">
                  {isSummarizing ? "요약 생성 중..." : "요약"}
                </span>
              </label>
              {/* 자동 갱신 토글 */}
              {queryType === "recent" && (
                <label className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2">
                  <input
                    type="checkbox"
                    checked={enableAutoRefresh}
                    onChange={handleToggleAutoRefresh}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    1분마다 자동 갱신
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* 마지막 업데이트 시간 */}
          {lastUpdated && (
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              <span>마지막 업데이트:</span>
              <span className="font-medium">{formatLastUpdated(lastUpdated)}</span>
              {currentQuery.isFetching && (
                <span className="ml-2 flex items-center gap-1 text-blue-600">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  갱신 중...
                </span>
              )}
            </div>
          )}

          {/* 조회 타입 선택 */}
          <div className="mb-4 flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="recent"
                checked={queryType === "recent"}
                onChange={(e) => setQueryType(e.target.value as QueryType)}
                className="h-4 w-4"
              />
              <span className="font-medium">최근 로그</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="range"
                checked={queryType === "range"}
                onChange={(e) => setQueryType(e.target.value as QueryType)}
                className="h-4 w-4"
              />
              <span className="font-medium">날짜 범위</span>
            </label>
          </div>

          {/* 날짜 범위 입력 */}
          {queryType === "range" && (
            <div className="mb-4 flex gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  시작 날짜/시간
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  종료 날짜/시간
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>
          )}

          {/* 서버 필터 */}
          <div className="mb-4 flex items-center gap-4">
            <label className="font-medium text-gray-700">서버:</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="all"
                  checked={profile === "all"}
                  onChange={(e) => setProfile(e.target.value)}
                  className="h-4 w-4"
                />
                <span>All</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="stg"
                  checked={profile === "stg"}
                  onChange={(e) => setProfile(e.target.value)}
                  className="h-4 w-4"
                />
                <span>stg</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="dev"
                  checked={profile === "dev"}
                  onChange={(e) => setProfile(e.target.value)}
                  className="h-4 w-4"
                />
                <span>dev</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="stg1"
                  checked={profile === "stg1"}
                  onChange={(e) => setProfile(e.target.value)}
                  className="h-4 w-4"
                />
                <span>stg1</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="r-math"
                  checked={profile === "r-math"}
                  onChange={(e) => setProfile(e.target.value)}
                  className="h-4 w-4"
                />
                <span>r-math</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="r-engl"
                  checked={profile === "r-engl"}
                  onChange={(e) => setProfile(e.target.value)}
                  className="h-4 w-4"
                />
                <span>r-engl</span>
              </label>
            </div>
          </div>

          {/* logType 필터 */}
          <div className="mb-4 flex items-center gap-4">
            <label className="font-medium text-gray-700">Log Type:</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="all"
                  checked={logType === "all"}
                  onChange={(e) => setLogType(e.target.value)}
                  className="h-4 w-4"
                />
                <span>All</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="debug"
                  checked={logType === "debug"}
                  onChange={(e) => setLogType(e.target.value)}
                  className="h-4 w-4"
                />
                <span>debug</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="ack"
                  checked={logType === "ack"}
                  onChange={(e) => setLogType(e.target.value)}
                  className="h-4 w-4"
                />
                <span>ack</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="stats"
                  checked={logType === "stats"}
                  onChange={(e) => setLogType(e.target.value)}
                  className="h-4 w-4"
                />
                <span>stats</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="error"
                  checked={logType === "error"}
                  onChange={(e) => setLogType(e.target.value)}
                  className="h-4 w-4"
                />
                <span>error</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="event"
                  checked={logType === "event"}
                  onChange={(e) => setLogType(e.target.value)}
                  className="h-4 w-4"
                />
                <span>event</span>
              </label>
            </div>
          </div>

          {/* 조회 개수 선택 */}
          <div className="flex items-center gap-4">
            <label className="font-medium text-gray-700">조회 개수:</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value) as any)}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={300}>300</option>
              <option value={1000}>1000</option>
            </select>
            <button
              onClick={handleSearch}
              disabled={
                (queryType === "range" && (!startDate || !endDate)) ||
                currentQuery.isFetching
              }
              className="rounded-md bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {currentQuery.isFetching ? "조회 중..." : "조회"}
            </button>
          </div>
        </div>

        {/* 로그 목록 */}
        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          {currentQuery.isError ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-red-500">
                오류가 발생했습니다: {String(currentQuery.error)}
              </div>
            </div>
          ) : currentLogs.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-gray-500">조회된 로그가 없습니다</div>
            </div>
          ) : (
            <div className="space-y-2">
              {currentLogs.map((log) => {
                const logData = parseLogPayload(log.logPayload);
                const isTeacher = logData.uType === "T";

                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`cursor-pointer rounded-lg border bg-white p-4 transition hover:shadow-md ${
                      selectedLog?.id === log.id
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : isTeacher
                        ? "border-gray-400 border-2"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-mono text-gray-500">
                        {(() => {
                          const data = parseLogPayload(log.logPayload);
                          const appName = data.appName || "";
                          const profile = data.profile || "";
                          return `${appName} / ${profile}`;
                        })()}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 font-medium">
                      {formatLogItem(log)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {currentLogs.length > 0 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              총 {currentLogs.length}개의 로그
            </div>
          )}
        </div>
      </div>

      {/* 로그 상세 영역 */}
      <div className="flex w-1/3 flex-col bg-gray-50">
        <div className="border-b border-gray-200 bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900">
            {enableSummary ? "AI 요약 / 로그 상세" : "로그 상세"}
          </h2>
        </div>
        <div className="flex-1 overflow-auto p-6">
          {/* AI 요약 결과 */}
          {enableSummary && (summary || summaryError || isSummarizing) && (
            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-purple-900">
                  AI 요약
                </h3>
                {tokenCount > 0 && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">{tokenCount.toLocaleString()}</span> 토큰
                    <span className="ml-2 text-gray-500">
                      (약 ${((tokenCount / 1000) * 0.0005).toFixed(4)})
                    </span>
                  </div>
                )}
              </div>
              {isSummarizing ? (
                <div className="flex items-center gap-2 text-purple-600">
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>OpenAI로 로그 분석 중...</span>
                </div>
              ) : summaryError ? (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                  {summaryError}
                </div>
              ) : (
                <div className="prose prose-sm max-w-none rounded-md bg-purple-50 p-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">
                    {summary}
                  </pre>
                </div>
              )}
              <div className="my-6 border-t border-gray-300"></div>
            </div>
          )}

          {/* 로그 상세 정보 */}
          {selectedLog ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                선택된 로그
              </h3>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  ID
                </label>
                <div className="rounded-md bg-white p-3 font-mono text-sm">
                  {selectedLog.id}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  생성 시간
                </label>
                <div className="rounded-md bg-white p-3 text-sm">
                  {formatDate(selectedLog.createdAt)}
                </div>
              </div>
              {(() => {
                try {
                  const payload = JSON.parse(selectedLog.logPayload);
                  const uuid = payload.uuid;
                  if (uuid) {
                    return (
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          UUID
                        </label>
                        <div
                          onClick={() => handleUuidClick(uuid, selectedLog.createdAt)}
                          className="rounded-md bg-white p-3 font-mono text-sm text-blue-600 hover:text-blue-800 cursor-pointer hover:bg-blue-50 transition-colors"
                          title="클릭하여 사용자 로그 조회"
                        >
                          {uuid}
                        </div>
                      </div>
                    );
                  }
                } catch {
                  return null;
                }
              })()}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Log Payload (JSON)
                </label>
                <pre className="overflow-auto rounded-md bg-gray-900 p-4 text-xs text-green-400">
                  {formatPayload(selectedLog.logPayload)}
                </pre>
              </div>
            </div>
          ) : !enableSummary || (!summary && !summaryError && !isSummarizing) ? (
            <div className="flex h-full items-center justify-center text-gray-500">
              로그를 선택하세요
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
