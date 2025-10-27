"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { errorLogsApi, type RefinedErrorLog } from "@/lib/api/error-logs";
import { getErrCdDescription } from "@/lib/errCdMapping";
import { summarizeErrorLogs } from "@/lib/openai";

type QueryType = "recent" | "range";

export default function ErrorLogsPage() {
  const [queryType, setQueryType] = useState<QueryType>("recent");
  const [minutes, setMinutes] = useState<10 | 30 | 60 | 360 | 720 | 1440>(10);
  const [profile, setProfile] = useState<string>("all");
  const [appName, setAppName] = useState<string>("all");
  const [limit, setLimit] = useState<100 | 200 | 300 | 500 | 1000 | null>(100);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedLog, setSelectedLog] = useState<RefinedErrorLog | null>(null);
  const [enableSummary, setEnableSummary] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string>("");
  const [tokenCount, setTokenCount] = useState<number>(0);

  // 최근 시간 기준 에러 로그 조회
  const recentQuery = useQuery({
    queryKey: ["error-logs", "recent", minutes, profile, appName, limit],
    queryFn: () =>
      errorLogsApi.getRecentErrorLogs({
        minutes,
        profile,
        appName,
        ...(limit !== null && { limit })
      }),
    enabled: queryType === "recent",
  });

  // 날짜 범위 에러 로그 조회
  const rangeQuery = useQuery({
    queryKey: ["error-logs", "range", startDate, endDate, profile, appName, limit],
    queryFn: () =>
      errorLogsApi.getErrorLogsByDateRange({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        profile,
        appName,
        ...(limit !== null && { limit })
      }),
    enabled: queryType === "range" && !!startDate && !!endDate,
  });

  const currentQuery = queryType === "recent" ? recentQuery : rangeQuery;
  const logs = currentQuery.data?.logs || [];
  const total = currentQuery.data?.total || 0;

  const handleSearch = () => {
    if (queryType === "recent") {
      recentQuery.refetch();
    } else {
      rangeQuery.refetch();
    }
  };

  const generateSummary = async () => {
    if (logs.length === 0) return;

    setIsSummarizing(true);
    setSummaryError("");
    setSummary("");
    setTokenCount(0);

    const result = await summarizeErrorLogs({
      logs: logs.map((log) => ({
        id: log.id,
        appName: log.appName,
        createdAt: log.createdAt,
        error: getErrCdDescription(log.errCd),
        errMsg: log.errMsg,
        userId: log.userId,
      })),
    });

    setIsSummarizing(false);

    if (result.error) {
      setSummaryError(result.error);
    } else if (result.tokenCount) {
      setTokenCount(result.tokenCount);

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

  const handleToggleSummary = async () => {
    const newEnableSummary = !enableSummary;
    setEnableSummary(newEnableSummary);

    if (newEnableSummary && logs.length > 0) {
      await generateSummary();
    } else {
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

  return (
    <div className="flex h-full">
      {/* 에러 로그 목록 영역 */}
      <div className="flex w-2/3 flex-col border-r border-gray-200">
        {/* 헤더 */}
        <div className="border-b border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                에러로그 검색
              </h1>
              <span className="text-xs text-gray-500">from refined_error_logs</span>
            </div>
            {/* 요약 토글 */}
            <label className="flex items-center gap-2 rounded-lg bg-purple-100 px-4 py-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableSummary}
                onChange={handleToggleSummary}
                className="h-4 w-4 accent-purple-600"
                disabled={logs.length === 0 || isSummarizing}
              />
              <span className="text-sm font-medium text-purple-700">
                {isSummarizing ? "요약 생성 중..." : "요약"}
              </span>
            </label>
          </div>

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
              <span className="font-medium">최근 시간대</span>
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

          {/* 최근 시간대 선택 */}
          {queryType === "recent" && (
            <div className="mb-4 flex items-center gap-4">
              <label className="font-medium text-gray-700">최근:</label>
              <select
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value) as any)}
                className="rounded-md border border-gray-300 px-3 py-2"
              >
                <option value={10}>10분</option>
                <option value={30}>30분</option>
                <option value={60}>1시간</option>
                <option value={360}>6시간</option>
                <option value={720}>12시간</option>
                <option value={1440}>24시간</option>
              </select>
            </div>
          )}

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

          {/* Profile 및 App Name 필터 */}
          <div className="mb-4 flex items-center gap-4">
            <label className="font-medium text-gray-700">Profile:</label>
            <select
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="all">All</option>
              <option value="dev">dev</option>
              <option value="stg">stg</option>
              <option value="access">access</option>
              <option value="r-engl">r-engl</option>
              <option value="r-math">r-math</option>
            </select>

            <label className="font-medium text-gray-700">App Name:</label>
            <select
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="all">All</option>
              <option value="vlmsapi">vlmsapi</option>
              <option value="launcher">launcher</option>
              <option value="socket">socket</option>
              <option value="tool">tool</option>
              <option value="VIEWER">VIEWER</option>
            </select>
          </div>

          {/* 최대 조회 수 선택 */}
          <div className="flex items-center gap-4">
            <label className="font-medium text-gray-700">최대 조회 수:</label>
            <select
              value={limit === null ? "" : limit}
              onChange={(e) => {
                const val = e.target.value;
                setLimit(val === "" ? null : Number(val) as any);
              }}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">제한 없음</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={300}>300</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
            </select>
            <button
              onClick={handleSearch}
              disabled={
                currentQuery.isFetching ||
                (queryType === "range" && (!startDate || !endDate))
              }
              className="rounded-md bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700 disabled:bg-gray-300"
            >
              {currentQuery.isFetching ? "조회 중..." : "조회"}
            </button>
          </div>
        </div>

        {/* 에러 로그 목록 */}
        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          {currentQuery.isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          ) : currentQuery.isError ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-red-500">
                오류가 발생했습니다: {String(currentQuery.error)}
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-gray-500">조회된 에러 로그가 없습니다</div>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`cursor-pointer rounded-lg border bg-white p-4 transition hover:shadow-md ${
                    selectedLog?.id === log.id
                      ? "border-red-500 ring-2 ring-red-200"
                      : "border-gray-200"
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                          {log.profile}
                        </span>
                        <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                          {log.appName}
                        </span>
                        {log.exception && (
                          <span className="rounded bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
                            {log.exception}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {log.errMsg || "-"}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    <span>ID: {log.id}</span>
                    {log.userId && <span className="ml-3">User: {log.userId}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {logs.length > 0 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              총 {logs.length}/{total}개의 에러 로그
            </div>
          )}
        </div>
      </div>

      {/* 에러 로그 상세 영역 */}
      <div className="flex w-1/3 flex-col bg-gray-50">
        <div className="border-b border-gray-200 bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900">에러 로그 상세</h2>
        </div>
        <div className="flex-1 overflow-auto p-6">
          {/* AI 요약 섹션 */}
          {enableSummary && (
            <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-4">
              <h3 className="mb-3 text-lg font-semibold text-purple-900">
                AI 요약
              </h3>
              {isSummarizing ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
                  <span className="ml-3 text-sm text-purple-700">
                    요약을 생성하는 중...
                  </span>
                </div>
              ) : summaryError ? (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                  {summaryError}
                </div>
              ) : summary ? (
                <div className="space-y-3">
                  {tokenCount > 0 && (
                    <div className="text-xs text-purple-600">
                      예상 토큰 수: ~{tokenCount.toLocaleString()}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap rounded-md bg-white p-4 text-sm text-gray-800 shadow-sm">
                    {summary}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-purple-600">
                  요약을 활성화하려면 위의 요약 버튼을 클릭하세요.
                </div>
              )}
            </div>
          )}

          {selectedLog ? (
            <div className="space-y-4">
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
                  Profile / App Name
                </label>
                <div className="flex gap-2">
                  <span className="rounded bg-red-100 px-3 py-2 text-sm font-medium text-red-800">
                    {selectedLog.profile}
                  </span>
                  <span className="rounded bg-blue-100 px-3 py-2 text-sm font-medium text-blue-800">
                    {selectedLog.appName}
                  </span>
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
              {selectedLog.exception && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Exception
                  </label>
                  <div className="rounded-md bg-white p-3 font-mono text-sm text-red-600">
                    {selectedLog.exception}
                  </div>
                </div>
              )}
              {selectedLog.errCd && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Error
                  </label>
                  <div className="rounded-md bg-white p-3 text-sm">
                    <div className="mb-1">
                      {getErrCdDescription(selectedLog.errCd)}
                    </div>
                    <div className="font-mono text-xs text-gray-500">
                      ({selectedLog.errCd})
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Error Message
                </label>
                <div className="max-h-40 overflow-auto rounded-md bg-white p-3 text-sm">
                  {selectedLog.errMsg || "N/A"}
                </div>
              </div>
              {selectedLog.message && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <div className="max-h-40 overflow-auto rounded-md bg-white p-3 text-sm">
                    {selectedLog.message}
                  </div>
                </div>
              )}
              {selectedLog.url && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    URL
                  </label>
                  <div className="overflow-auto rounded-md bg-white p-3 text-xs break-all">
                    {selectedLog.url}
                  </div>
                </div>
              )}
              {selectedLog.userId && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    User ID
                  </label>
                  <div className="rounded-md bg-white p-3 font-mono text-sm">
                    {selectedLog.userId}
                  </div>
                </div>
              )}
              {selectedLog.schlCd && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    School Code
                  </label>
                  <div className="rounded-md bg-white p-3 font-mono text-sm">
                    {selectedLog.schlCd}
                  </div>
                </div>
              )}
              {selectedLog.claId && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Class ID
                  </label>
                  <div className="rounded-md bg-white p-3 font-mono text-sm">
                    {selectedLog.claId}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">
              에러 로그를 선택하세요
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
