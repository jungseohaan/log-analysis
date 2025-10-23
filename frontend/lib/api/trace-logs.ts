import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface TraceLog {
  id: number;
  logPayload: string;
  createdAt: string;
}

export interface TraceLogsParams {
  limit?: 100 | 200 | 300 | 1000;
  appName?: string;
  logType?: string;
}

export interface TraceLogsRangeParams extends TraceLogsParams {
  startDate: string; // ISO 8601 format with timezone
  endDate: string; // ISO 8601 format with timezone
}

export const traceLogsApi = {
  /**
   * 최근 로그 조회
   */
  getRecentLogs: async (params: TraceLogsParams = {}): Promise<TraceLog[]> => {
    const { limit = 100, appName, logType } = params;
    const response = await axios.get<TraceLog[]>(
      `${API_BASE_URL}/api/trace-logs-launcher/recent`,
      {
        params: { limit, appName, logType },
      }
    );
    return response.data;
  },

  /**
   * 날짜/시간 구간별 로그 조회
   */
  getLogsByDateRange: async (
    params: TraceLogsRangeParams
  ): Promise<TraceLog[]> => {
    const { startDate, endDate, limit = 100, appName, logType } = params;
    const response = await axios.get<TraceLog[]>(
      `${API_BASE_URL}/api/trace-logs-launcher/range`,
      {
        params: { startDate, endDate, limit, appName, logType },
      }
    );
    return response.data;
  },
};
