import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface RefinedErrorLog {
  id: number;
  traceLogsId: number;
  profile: string;
  appName: string;
  errCd: string;
  schlCd: string;
  claId: string;
  userId: string;
  url: string;
  hash: string;
  exception: string;
  errMsg: string;
  message: string;
  createdAt: string;
  userSeCd: string;
}

export interface ErrorLogsParams {
  minutes?: number;
  profile?: string;
  appName?: string;
  limit?: number;
}

export interface ErrorLogsRangeParams {
  startDate: string;
  endDate: string;
  profile?: string;
  appName?: string;
  limit?: number;
}

export const errorLogsApi = {
  /**
   * 최근 시간 기준 에러 로그 조회
   */
  getRecentErrorLogs: async (params: ErrorLogsParams = {}): Promise<RefinedErrorLog[]> => {
    const { minutes = 10, profile = "all", appName = "all", limit = 100 } = params;
    const response = await axios.get<RefinedErrorLog[]>(
      `${API_BASE_URL}/api/error-logs/recent`,
      {
        params: { minutes, profile, appName, limit },
      }
    );
    return response.data;
  },

  /**
   * 날짜 구간별 에러 로그 조회
   */
  getErrorLogsByDateRange: async (
    params: ErrorLogsRangeParams
  ): Promise<RefinedErrorLog[]> => {
    const { startDate, endDate, profile = "all", appName = "all", limit = 100 } = params;
    const response = await axios.get<RefinedErrorLog[]>(
      `${API_BASE_URL}/api/error-logs/range`,
      {
        params: { startDate, endDate, profile, appName, limit },
      }
    );
    return response.data;
  },
};
