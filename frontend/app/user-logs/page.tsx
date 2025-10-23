"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { userLogsApi, type TraceLog } from "@/lib/api/user-logs";

type QueryType = "recent" | "range";

export default function UserLogsPage() {
  // 필터 타입: "recent" 또는 "range"
  const [queryType, setQueryType] = useState<QueryType>("recent");

  // 최근 시간 필터 (분 단위)
  const [recentMinutes, setRecentMinutes] = useState<number>(10);

  // 날짜 범위 필터
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // UUID 검색
  const [uuid, setUuid] = useState<string>("");

  // 로그 타입 필터
  const [logType, setLogType] = useState<string>("all");

  // 조회 개수
  const [limit, setLimit] = useState<100 | 200 | 300 | 1000>(100);

  // 현재 표시 중인 로그 (필터 변경 시에도 유지)
  const [currentLogs, setCurrentLogs] = useState<TraceLog[]>([]);

  // 선택된 로그 (상세 보기용)
  const [selectedLog, setSelectedLog] = useState<TraceLog | null>(null);

  // 로딩 및 취소 상태
  const [isSearching, setIsSearching] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  // React Query 설정 (수동 조회)
  const logsQuery = useQuery({
    queryKey: ["user-logs", queryType, recentMinutes, startDate, endDate, uuid, logType, limit],
    queryFn: () => {
      if (queryType === "recent") {
        return userLogsApi.getUserLogs({
          minutes: recentMinutes,
          uuid: uuid || undefined,
          logType: logType === "all" ? undefined : logType,
          limit,
        });
      } else {
        return userLogsApi.getUserLogs({
          startDate,
          endDate,
          uuid: uuid || undefined,
          logType: logType === "all" ? undefined : logType,
          limit,
        });
      }
    },
    enabled: false, // 수동 조회
    gcTime: 0,
    staleTime: 0,
  });

  // 조회 버튼 클릭
  const handleSearch = async () => {
    // 기존 요청 취소
    if (abortController) {
      abortController.abort();
    }

    const controller = new AbortController();
    setAbortController(controller);
    setIsSearching(true);

    try {
      const result = await logsQuery.refetch();
      if (result.data && !controller.signal.aborted) {
        setCurrentLogs(result.data);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsSearching(false);
        setAbortController(null);
      }
    }
  };

  // 조회 취소
  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsSearching(false);
  };

  // 날짜/시간 초기화 (시작: 12시간 전, 종료: 현재)
  const initializeDateRange = () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12시간 전

    // ISO 8601 형식 (YYYY-MM-DDTHH:mm)
    const formatDateTime = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setStartDate(formatDateTime(pastDate));
    setEndDate(formatDateTime(now));
  };

  // 컴포넌트 마운트 시 날짜 범위 초기화
  useState(() => {
    initializeDateRange();
  });

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
            사용자 로그 (USER LOGS)
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
              <span className="font-medium">최근</span>
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

          {/* 최근 시간 필터 */}
          {queryType === "recent" && (
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                최근 시간
              </label>
              <select
                value={recentMinutes}
                onChange={(e) => setRecentMinutes(Number(e.target.value))}
                className="rounded-md border border-gray-300 px-3 py-2"
              >
                <option value={10}>10분</option>
                <option value={20}>20분</option>
                <option value={30}>30분</option>
                <option value={60}>1시간</option>
                <option value={480}>8시간</option>
                <option value={720}>12시간</option>
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

          {/* UUID 검색 */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              사용자 ID (UUID)
            </label>
            <input
              type="text"
              value={uuid}
              onChange={(e) => setUuid(e.target.value)}
              placeholder="UUID 입력 (비워두면 모두 조회)"
              className="rounded-md border border-gray-300 px-3 py-2 w-96"
            />
            <p className="text-xs text-gray-500 mt-1">
              * 앞부분 와일드카드(*) 불가, LIKE 검색 지원
            </p>
          </div>

          {/* Log Type 필터 */}
          <div className="mb-4 flex items-center gap-4">
            <label className="font-medium text-gray-700">Log Type:</label>
            <select
              value={logType}
              onChange={(e) => setLogType(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="all">All</option>
              <option value="debug">debug</option>
              <option value="ack">ack</option>
              <option value="stats">stats</option>
              <option value="error">error</option>
              <option value="event">event</option>
            </select>
          </div>

          {/* 조회 개수 선택 */}
          <div className="flex items-center gap-4">
            <label className="font-medium text-gray-700">조회 개수:</label>
            <select
              value={limit}
              onChange={(e) =>
                setLimit(Number(e.target.value) as 100 | 200 | 300 | 1000)
              }
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={300}>300</option>
              <option value={1000}>1000</option>
            </select>
            {!isSearching ? (
              <button
                onClick={handleSearch}
                className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
              >
                조회
              </button>
            ) : (
              <button
                onClick={handleCancel}
                className="rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
              >
                취소
              </button>
            )}
          </div>

          {/* 로딩 바 */}
          {isSearching && (
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div className="h-full w-full animate-pulse bg-blue-600"></div>
              </div>
            </div>
          )}
        </div>

        {/* 로그 목록 */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {currentLogs.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-500">
              조회된 로그가 없습니다
            </div>
          ) : (
            <div className="p-4">
              <div className="mb-2 text-sm text-gray-600">
                총 {currentLogs.length}개의 로그
              </div>
              <div className="space-y-2">
                {currentLogs.map((log) => {
                  let payload;
                  try {
                    payload = JSON.parse(log.logPayload);
                  } catch {
                    payload = {};
                  }

                  const isSelected = selectedLog?.id === log.id;

                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="font-mono text-sm text-gray-500">
                              #{log.id}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatDate(log.createdAt)}
                            </span>
                          </div>
                          <div className="font-medium text-gray-900">
                            UUID: {payload.uuid || "N/A"}
                          </div>
                          {payload.appName && (
                            <div className="text-sm text-gray-600">
                              App: {payload.appName}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 로그 상세 영역 */}
      <div className="flex w-1/3 flex-col bg-white">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900">로그 상세</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {selectedLog ? (
            <div>
              <div className="mb-4">
                <h3 className="mb-2 font-medium text-gray-700">기본 정보</h3>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="font-medium">ID:</span> {selectedLog.id}
                  </div>
                  <div>
                    <span className="font-medium">생성 시간:</span>{" "}
                    {formatDate(selectedLog.createdAt)}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-gray-700">로그 내용</h3>
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
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
