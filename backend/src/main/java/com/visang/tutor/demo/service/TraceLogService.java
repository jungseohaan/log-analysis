package com.visang.tutor.demo.service;

import com.visang.tutor.demo.model.TraceLog;
import com.visang.tutor.demo.repository.TraceLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class TraceLogService {

    @Autowired
    private TraceLogRepository traceLogRepository;

    /**
     * 날짜와 시간 구간별로 일정한 수량 조회
     * @param startDate 시작 날짜/시간
     * @param endDate 종료 날짜/시간
     * @param limit 조회할 개수 (100, 200, 300, 1000)
     * @return TraceLog 리스트
     */
    public List<TraceLog> getLogsByDateRange(OffsetDateTime startDate, OffsetDateTime endDate, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return traceLogRepository.findByDateBetween(startDate, endDate, pageable);
    }

    /**
     * 최근 시간 기준으로 일정한 수량 조회
     * @param limit 조회할 개수 (100, 200, 300, 1000)
     * @return TraceLog 리스트
     */
    public List<TraceLog> getRecentLogs(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return traceLogRepository.findRecentLogs(pageable);
    }

    /**
     * 최근 시간 기준으로 일정한 수량 조회 (appName 필터 적용)
     * @param limit 조회할 개수
     * @param appName 필터링할 appName
     * @return TraceLog 리스트
     */
    public List<TraceLog> getRecentLogsByAppName(int limit, String appName) {
        Pageable pageable = PageRequest.of(0, limit);
        return traceLogRepository.findRecentLogsByAppName(appName, pageable);
    }

    /**
     * 날짜와 시간 구간별로 일정한 수량 조회 (appName 필터 적용)
     * @param startDate 시작 날짜/시간
     * @param endDate 종료 날짜/시간
     * @param limit 조회할 개수
     * @param appName 필터링할 appName
     * @return TraceLog 리스트
     */
    public List<TraceLog> getLogsByDateRangeAndAppName(OffsetDateTime startDate, OffsetDateTime endDate, int limit, String appName) {
        Pageable pageable = PageRequest.of(0, limit);
        return traceLogRepository.findByDateBetweenAndAppName(startDate, endDate, appName, pageable);
    }
}
