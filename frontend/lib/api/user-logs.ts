import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface TraceLog {
  id: number;
  createdAt: string;
  logPayload: string;
}

export interface UserLogsParams {
  minutes?: number;
  startDate?: string;
  endDate?: string;
  uuid?: string;
  logType?: string;
  limit?: number;
}

export const userLogsApi = {
  /**
   * 사용자 로그 조회
   * @param params 조회 파라미터 (minutes, startDate, endDate, uuid, logType, limit)
   * @returns TraceLog 배열
   */
  getUserLogs: async (params: UserLogsParams = {}): Promise<TraceLog[]> => {
    const { minutes, startDate, endDate, uuid, logType, limit = 100 } = params;

    const queryParams: Record<string, any> = { limit };

    if (startDate && endDate) {
      queryParams.startDate = startDate;
      queryParams.endDate = endDate;
    } else if (minutes !== undefined) {
      queryParams.minutes = minutes;
    }

    if (uuid && uuid.trim() !== "") {
      queryParams.uuid = uuid.trim();
    }

    if (logType && logType.trim() !== "") {
      queryParams.logType = logType.trim();
    }

    const response = await axios.get<TraceLog[]>(
      `${API_BASE_URL}/api/user-logs`,
      { params: queryParams }
    );

    return response.data;
  },
};
