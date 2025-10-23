package com.visang.tutor.demo.controller;

import com.visang.tutor.demo.model.TraceLog;
import com.visang.tutor.demo.service.UserLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/user-logs")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class UserLogController {

    @Autowired
    private UserLogService userLogService;

    /**
     * 사용자 로그 조회 API
     * - 최근 시간 구간 (minutes 파라미터): 10분(기본), 20분, 30분, 1시간(60), 8시간(480), 12시간(720)
     * - 날짜 범위 (startDate, endDate 파라미터)
     * - uuid 검색 (uuid 파라미터): like 검색 지원 (앞부분 와일드카드 불가)
     * - logType 필터 (logType 파라미터): all, debug, ack, stats, error, event
     *
     * @param minutes 최근 N분 이내의 로그 조회 (기본값: 10)
     * @param startDate 시작 날짜/시간 (ISO 8601 형식)
     * @param endDate 종료 날짜/시간 (ISO 8601 형식)
     * @param uuid 사용자 UUID 검색어 (선택, 없으면 모든 uuid)
     * @param logType 로그 타입 필터 (선택, 없으면 모든 타입)
     * @param limit 조회 개수 (기본값: 100)
     * @return TraceLog 리스트
     */
    @GetMapping
    public ResponseEntity<List<TraceLog>> getUserLogs(
            @RequestParam(required = false) Integer minutes,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate,
            @RequestParam(required = false) String uuid,
            @RequestParam(required = false) String logType,
            @RequestParam(defaultValue = "100") int limit
    ) {
        List<TraceLog> logs;

        // 날짜 범위 검색
        if (startDate != null && endDate != null) {
            if (uuid != null && !uuid.isEmpty() && logType != null && !logType.isEmpty()) {
                // uuid + logType + 날짜 범위
                logs = userLogService.getUserLogsByUuidAndDateRangeAndLogType(uuid, startDate, endDate, logType, limit);
            } else if (uuid != null && !uuid.isEmpty()) {
                // uuid + 날짜 범위
                logs = userLogService.getUserLogsByUuidAndDateRange(uuid, startDate, endDate, limit);
            } else if (logType != null && !logType.isEmpty()) {
                // logType + 날짜 범위
                logs = userLogService.getUserLogsByDateRangeAndLogType(startDate, endDate, logType, limit);
            } else {
                // 날짜 범위만
                logs = userLogService.getUserLogsByDateRange(startDate, endDate, limit);
            }
        }
        // 최근 시간 구간 검색
        else {
            // minutes 기본값: 10분
            int minutesToSearch = (minutes != null) ? minutes : 10;
            OffsetDateTime now = OffsetDateTime.now();
            OffsetDateTime from = now.minusMinutes(minutesToSearch);

            if (uuid != null && !uuid.isEmpty() && logType != null && !logType.isEmpty()) {
                // uuid + logType + 최근 시간
                logs = userLogService.getUserLogsByUuidAndDateRangeAndLogType(uuid, from, now, logType, limit);
            } else if (uuid != null && !uuid.isEmpty()) {
                // uuid + 최근 시간
                logs = userLogService.getUserLogsByUuidAndDateRange(uuid, from, now, limit);
            } else if (logType != null && !logType.isEmpty()) {
                // logType + 최근 시간
                logs = userLogService.getUserLogsByDateRangeAndLogType(from, now, logType, limit);
            } else {
                // 최근 시간만
                logs = userLogService.getUserLogsByDateRange(from, now, limit);
            }
        }

        return ResponseEntity.ok(logs);
    }
}
