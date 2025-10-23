"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { traceLogsApi, type TraceLog } from "@/lib/api/trace-logs";

type QueryType = "recent" | "range";

export default function LogsPage() {
  const [queryType, setQueryType] = useState<QueryType>("recent");
  const [limit, setLimit] = useState<100 | 200 | 300 | 1000>(100);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appName, setAppName] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<TraceLog | null>(null);

  // 최근 로그 조회
  const recentQuery = useQuery({
    queryKey: ["trace-logs-launcher", "recent", limit, appName],
    queryFn: () => traceLogsApi.getRecentLogs({
      limit,
      appName: appName === "all" ? undefined : appName,
    }),
    enabled: queryType === "recent",
  });

  // 날짜 범위 로그 조회
  const rangeQuery = useQuery({
    queryKey: ["trace-logs-launcher", "range", startDate, endDate, limit, appName],
    queryFn: () =>
      traceLogsApi.getLogsByDateRange({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        limit,
        appName: appName === "all" ? undefined : appName,
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

  const formatPayload = (payload: string) => {
    try {
      return JSON.stringify(JSON.parse(payload), null, 2);
    } catch {
      return payload;
    }
  };

  return (
    <div className="flex h-full">
      {/* 로그 목록 영역 */}
      <div className="flex w-2/3 flex-col border-r border-gray-200">
        {/* 헤더 */}
        <div className="border-b border-gray-200 bg-white p-6">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            로그분석 (LOG ANALYSIS)
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

          {/* appName 필터 */}
          <div className="mb-4 flex items-center gap-4">
            <label className="font-medium text-gray-700">App Name:</label>
            <select
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="all">All</option>
              <option value="vlmsapi">vlmsapi</option>
              <option value="socket">socket</option>
              <option value="lcmsapi">lcmsapi</option>
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

        {/* 로그 목록 */}
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
              <div className="text-gray-500">조회된 로그가 없습니다</div>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`cursor-pointer rounded-lg border bg-white p-4 transition hover:shadow-md ${
                    selectedLog?.id === log.id
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-200"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-mono text-gray-500">
                      ID: {log.id}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-gray-700">
                    {log.logPayload.substring(0, 150)}...
                  </div>
                </div>
              ))}
            </div>
          )}
          {logs.length > 0 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              총 {logs.length}개의 로그
            </div>
          )}
        </div>
      </div>

      {/* 로그 상세 영역 */}
      <div className="flex w-1/3 flex-col bg-gray-50">
        <div className="border-b border-gray-200 bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900">로그 상세</h2>
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
                  생성 시간
                </label>
                <div className="rounded-md bg-white p-3 text-sm">
                  {formatDate(selectedLog.createdAt)}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Log Payload (JSON)
                </label>
                <pre className="overflow-auto rounded-md bg-gray-900 p-4 text-xs text-green-400">
                  {formatPayload(selectedLog.logPayload)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">
              로그를 선택하세요
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
