package com.visang.tutor.demo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.visang.tutor.demo.model.TraceLog;
import com.visang.tutor.demo.repository.TraceLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

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

    /**
     * 날짜와 시간 구간별로 일정한 수량 조회 (logType 필터 적용)
     * @param startDate 시작 날짜/시간
     * @param endDate 종료 날짜/시간
     * @param limit 조회할 개수
     * @param logType 필터링할 logType
     * @return TraceLog 리스트
     */
    public List<TraceLog> getLogsByDateRangeAndLogType(OffsetDateTime startDate, OffsetDateTime endDate, int limit, String logType) {
        Pageable pageable = PageRequest.of(0, limit);
        return traceLogRepository.findByDateBetweenAndLogType(startDate, endDate, logType, pageable);
    }

    /**
     * 날짜와 시간 구간별로 일정한 수량 조회 (appName, logType 필터 적용)
     * @param startDate 시작 날짜/시간
     * @param endDate 종료 날짜/시간
     * @param limit 조회할 개수
     * @param appName 필터링할 appName
     * @param logType 필터링할 logType
     * @return TraceLog 리스트
     */
    public List<TraceLog> getLogsByDateRangeAndAppNameAndLogType(OffsetDateTime startDate, OffsetDateTime endDate, int limit, String appName, String logType) {
        Pageable pageable = PageRequest.of(0, limit);
        return traceLogRepository.findByDateBetweenAndAppNameAndLogType(startDate, endDate, appName, logType, pageable);
    }

    /**
     * 최근 시간 기준으로 일정한 수량 조회 (logType 필터 적용)
     * @param limit 조회할 개수
     * @param logType 필터링할 logType
     * @return TraceLog 리스트
     */
    public List<TraceLog> getRecentLogsByLogType(int limit, String logType) {
        Pageable pageable = PageRequest.of(0, limit);
        return traceLogRepository.findRecentLogsByLogType(logType, pageable);
    }

    /**
     * 최근 시간 기준으로 일정한 수량 조회 (appName, logType 필터 적용)
     * @param limit 조회할 개수
     * @param appName 필터링할 appName
     * @param logType 필터링할 logType
     * @return TraceLog 리스트
     */
    public List<TraceLog> getRecentLogsByAppNameAndLogType(int limit, String appName, String logType) {
        Pageable pageable = PageRequest.of(0, limit);
        return traceLogRepository.findRecentLogsByAppNameAndLogType(appName, logType, pageable);
    }

    /**
     * evtCd가 존재하고 길이가 3 이상인 최근 로그 조회 (Event 필터)
     * @param limit 조회할 개수
     * @return TraceLog 리스트
     */
    public List<TraceLog> getRecentLogsByEvtCd(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return traceLogRepository.findRecentLogsByEvtCd(pageable);
    }

    /**
     * evtCd가 존재하고 길이가 3 이상인 로그를 날짜 구간으로 조회 (Event 필터)
     * @param startDate 시작 날짜/시간
     * @param endDate 종료 날짜/시간
     * @param limit 조회할 개수
     * @return TraceLog 리스트
     */
    public List<TraceLog> getLogsByDateRangeAndEvtCd(OffsetDateTime startDate, OffsetDateTime endDate, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return traceLogRepository.findByDateBetweenAndEvtCd(startDate, endDate, pageable);
    }

    /**
     * profile 필드로 로그 필터링 (메모리에서 처리)
     * @param logs 필터링할 로그 리스트
     * @param profile 필터링할 profile 값
     * @return 필터링된 TraceLog 리스트
     */
    public List<TraceLog> filterByProfile(List<TraceLog> logs, String profile) {
        ObjectMapper objectMapper = new ObjectMapper();

        return logs.stream()
                .filter(log -> {
                    try {
                        JsonNode jsonNode = objectMapper.readTree(log.getLogPayload());
                        JsonNode profileNode = jsonNode.get("profile");

                        if (profileNode != null && profileNode.isTextual()) {
                            String logProfile = profileNode.asText();
                            return profile.equalsIgnoreCase(logProfile);
                        }
                        return false;
                    } catch (Exception e) {
                        return false;
                    }
                })
                .collect(Collectors.toList());
    }
}
