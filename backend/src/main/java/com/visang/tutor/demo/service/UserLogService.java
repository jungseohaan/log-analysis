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
public class UserLogService {

    @Autowired
    private TraceLogRepository traceLogRepository;

    /**
     * 최근 로그 조회 (uuid가 있는 모든 로그)
     * @param limit 조회 개수
     * @return TraceLog 리스트
     */
    public List<TraceLog> getRecentUserLogs(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return traceLogRepository.findRecentLogsByUuidExists(pageable);
    }

    /**
     * 날짜 구간으로 로그 조회 (uuid가 있는 모든 로그)
     * @param startDate 시작 날짜/시간
     * @param endDate 종료 날짜/시간
     * @param limit 조회 개수
     * @return TraceLog 리스트
     */
    public List<TraceLog> getUserLogsByDateRange(OffsetDateTime startDate, OffsetDateTime endDate, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return traceLogRepository.findByDateBetweenAndUuidExists(startDate, endDate, pageable);
    }

    /**
     * uuid로 최근 로그 검색 (like 검색, 앞부분 와일드카드 불가)
     * @param uuid 검색할 uuid
     * @param limit 조회 개수
     * @return TraceLog 리스트
     */
    public List<TraceLog> getRecentUserLogsByUuid(String uuid, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return traceLogRepository.findRecentLogsByUuidLike(uuid, pageable);
    }

    /**
     * uuid와 날짜 구간으로 로그 검색 (like 검색, 앞부분 와일드카드 불가)
     * @param uuid 검색할 uuid
     * @param startDate 시작 날짜/시간
     * @param endDate 종료 날짜/시간
     * @param limit 조회 개수
     * @return TraceLog 리스트
     */
    public List<TraceLog> getUserLogsByUuidAndDateRange(String uuid, OffsetDateTime startDate, OffsetDateTime endDate, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return traceLogRepository.findByDateBetweenAndUuidLike(startDate, endDate, uuid, pageable);
    }

    /**
     * logType 필터와 날짜 구간으로 로그 조회 (uuid 존재)
     * @param startDate 시작 날짜/시간
     * @param endDate 종료 날짜/시간
     * @param logType 필터링할 logType
     * @param limit 조회 개수
     * @return TraceLog 리스트
     */
    public List<TraceLog> getUserLogsByDateRangeAndLogType(OffsetDateTime startDate, OffsetDateTime endDate, String logType, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return traceLogRepository.findByDateBetweenAndUuidExistsAndLogType(startDate, endDate, logType, pageable);
    }

    /**
     * uuid + logType 필터로 날짜 구간 조회
     * @param uuid 검색할 uuid
     * @param startDate 시작 날짜/시간
     * @param endDate 종료 날짜/시간
     * @param logType 필터링할 logType
     * @param limit 조회 개수
     * @return TraceLog 리스트
     */
    public List<TraceLog> getUserLogsByUuidAndDateRangeAndLogType(String uuid, OffsetDateTime startDate, OffsetDateTime endDate, String logType, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return traceLogRepository.findByDateBetweenAndUuidLikeAndLogType(startDate, endDate, uuid, logType, pageable);
    }
}
