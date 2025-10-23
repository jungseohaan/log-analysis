"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { errorLogsApi, type RefinedErrorLog } from "@/lib/api/error-logs";

type QueryType = "recent" | "range";

export default function ErrorLogsPage() {
  const [queryType, setQueryType] = useState<QueryType>("recent");
  const [minutes, setMinutes] = useState<10 | 30 | 60>(10);
  const [profile, setProfile] = useState<string>("all");
  const [appName, setAppName] = useState<string>("all");
  const [limit, setLimit] = useState<100 | 200 | 300 | 500 | 1000>(100);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedLog, setSelectedLog] = useState<RefinedErrorLog | null>(null);

  // 최근 시간 기준 에러 로그 조회
  const recentQuery = useQuery({
    queryKey: ["error-logs", "recent", minutes, profile, appName, limit],
    queryFn: () =>
      errorLogsApi.getRecentErrorLogs({ minutes, profile, appName, limit }),
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
        limit,
      }),
    enabled: queryType === "range" && !!startDate && !!endDate,
  });

  const currentQuery = queryType === "recent" ? recentQuery : rangeQuery;
  const logs = currentQuery.data || [];

  const handleSearch = () => {
    if (queryType === "recent") {
      recentQuery.refetch();
    } else {
      rangeQuery.refetch();
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
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            에러로그 검색
          </h1>

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
                        {log.errMsg || "에러 메시지 없음"}
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
              총 {logs.length}개의 에러 로그
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
                    Error Code
                  </label>
                  <div className="rounded-md bg-white p-3 font-mono text-sm">
                    {selectedLog.errCd}
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
