package com.visang.tutor.demo.controller;

import com.visang.tutor.demo.model.TraceLog;
import com.visang.tutor.demo.service.TraceLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/trace-logs-launcher")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class TraceLogController {

    @Autowired
    private TraceLogService traceLogService;

    /**
     * 날짜와 시간 구간별로 일정한 수량 조회
     *
     * GET /api/trace-logs-launcher/range?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z&limit=100&appName=vlmsapi&logType=debug
     *
     * @param startDate 시작 날짜/시간 (ISO 8601 형식 with timezone: yyyy-MM-ddTHH:mm:ssZ)
     * @param endDate 종료 날짜/시간 (ISO 8601 형식 with timezone: yyyy-MM-ddTHH:mm:ssZ)
     * @param limit 조회할 개수 (기본값: 100, 허용값: 100, 200, 300, 1000)
     * @param appName 필터링할 appName (선택 사항)
     * @param logType 필터링할 logType (선택 사항, 예: debug, ack, stats, error)
     * @return TraceLog 리스트
     */
    @GetMapping("/range")
    public ResponseEntity<List<TraceLog>> getLogsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate,
            @RequestParam(defaultValue = "100") int limit,
            @RequestParam(required = false) String appName,
            @RequestParam(required = false) String logType) {

        // limit 값 검증
        if (!isValidLimit(limit)) {
            return ResponseEntity.badRequest().build();
        }

        List<TraceLog> logs;
        if ("event".equalsIgnoreCase(logType)) {
            // evtCd 필드가 존재하고 길이가 3 이상인 로그 조회
            logs = traceLogService.getLogsByDateRangeAndEvtCd(startDate, endDate, limit);
        } else if (appName != null && !appName.isEmpty() && logType != null && !logType.isEmpty()) {
            logs = traceLogService.getLogsByDateRangeAndAppNameAndLogType(startDate, endDate, limit, appName, logType);
        } else if (appName != null && !appName.isEmpty()) {
            logs = traceLogService.getLogsByDateRangeAndAppName(startDate, endDate, limit, appName);
        } else if (logType != null && !logType.isEmpty()) {
            logs = traceLogService.getLogsByDateRangeAndLogType(startDate, endDate, limit, logType);
        } else {
            logs = traceLogService.getLogsByDateRange(startDate, endDate, limit);
        }
        return ResponseEntity.ok(logs);
    }

    /**
     * 최근 시간 기준으로 일정한 수량 조회
     *
     * GET /api/trace-logs-launcher/recent?limit=100&appName=vlmsapi&logType=debug
     *
     * @param limit 조회할 개수 (기본값: 100, 허용값: 100, 200, 300, 1000)
     * @param appName 필터링할 appName (선택 사항)
     * @param logType 필터링할 logType (선택 사항, 예: debug, ack, stats, error)
     * @return TraceLog 리스트
     */
    @GetMapping("/recent")
    public ResponseEntity<List<TraceLog>> getRecentLogs(
            @RequestParam(defaultValue = "100") int limit,
            @RequestParam(required = false) String appName,
            @RequestParam(required = false) String logType) {

        // limit 값 검증
        if (!isValidLimit(limit)) {
            return ResponseEntity.badRequest().build();
        }

        List<TraceLog> logs;
        if ("event".equalsIgnoreCase(logType)) {
            // evtCd 필드가 존재하고 길이가 3 이상인 로그 조회
            logs = traceLogService.getRecentLogsByEvtCd(limit);
        } else if (appName != null && !appName.isEmpty() && logType != null && !logType.isEmpty()) {
            logs = traceLogService.getRecentLogsByAppNameAndLogType(limit, appName, logType);
        } else if (appName != null && !appName.isEmpty()) {
            logs = traceLogService.getRecentLogsByAppName(limit, appName);
        } else if (logType != null && !logType.isEmpty()) {
            logs = traceLogService.getRecentLogsByLogType(limit, logType);
        } else {
            logs = traceLogService.getRecentLogs(limit);
        }
        return ResponseEntity.ok(logs);
    }

    /**
     * limit 값이 허용된 값인지 검증
     * @param limit 검증할 limit 값
     * @return 유효하면 true, 그렇지 않으면 false
     */
    private boolean isValidLimit(int limit) {
        return limit == 100 || limit == 200 || limit == 300 || limit == 1000 || limit == 10000;
    }
}
