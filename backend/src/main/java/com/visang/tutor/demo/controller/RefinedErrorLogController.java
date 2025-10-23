package com.visang.tutor.demo.controller;

import com.visang.tutor.demo.model.RefinedErrorLog;
import com.visang.tutor.demo.service.RefinedErrorLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/error-logs")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class RefinedErrorLogController {

    @Autowired
    private RefinedErrorLogService refinedErrorLogService;

    /**
     * 날짜 구간과 필터로 에러 로그 조회
     *
     * GET /api/error-logs/range?startDate=...&endDate=...&profile=dev&appName=vlmsapi&limit=100
     *
     * @param startDate 시작 날짜/시간
     * @param endDate 종료 날짜/시간
     * @param profile 프로필 (all, dev, stg, access, r-engl, r-math)
     * @param appName 앱 이름 (all, vlmsapi, launcher, socket, tool, VIEWER)
     * @param limit 조회할 개수 (기본값: 100, 최대: 1000)
     * @return RefinedErrorLog 리스트
     */
    @GetMapping("/range")
    public ResponseEntity<List<RefinedErrorLog>> getErrorLogsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate,
            @RequestParam(required = false, defaultValue = "all") String profile,
            @RequestParam(required = false, defaultValue = "all") String appName,
            @RequestParam(defaultValue = "100") int limit) {

        if (limit > 1000) {
            limit = 1000;
        }

        List<RefinedErrorLog> logs = refinedErrorLogService.getErrorLogsByDateRange(
                startDate, endDate, profile, appName, limit
        );
        return ResponseEntity.ok(logs);
    }

    /**
     * 최근 시간 기준으로 에러 로그 조회
     *
     * GET /api/error-logs/recent?minutes=10&profile=dev&appName=vlmsapi&limit=100
     *
     * @param minutes 최근 몇 분 (10, 30, 60)
     * @param profile 프로필 (all, dev, stg, access, r-engl, r-math)
     * @param appName 앱 이름 (all, vlmsapi, launcher, socket, tool, VIEWER)
     * @param limit 조회할 개수 (기본값: 100, 최대: 1000)
     * @return RefinedErrorLog 리스트
     */
    @GetMapping("/recent")
    public ResponseEntity<List<RefinedErrorLog>> getRecentErrorLogs(
            @RequestParam(defaultValue = "10") int minutes,
            @RequestParam(required = false, defaultValue = "all") String profile,
            @RequestParam(required = false, defaultValue = "all") String appName,
            @RequestParam(defaultValue = "100") int limit) {

        if (limit > 1000) {
            limit = 1000;
        }

        if (minutes != 10 && minutes != 30 && minutes != 60) {
            return ResponseEntity.badRequest().build();
        }

        List<RefinedErrorLog> logs = refinedErrorLogService.getRecentErrorLogs(
                minutes, profile, appName, limit
        );
        return ResponseEntity.ok(logs);
    }
}
