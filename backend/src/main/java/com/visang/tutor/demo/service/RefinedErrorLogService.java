package com.visang.tutor.demo.service;

import com.visang.tutor.demo.model.RefinedErrorLog;
import com.visang.tutor.demo.repository.RefinedErrorLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class RefinedErrorLogService {

    @Autowired
    private RefinedErrorLogRepository refinedErrorLogRepository;

    /**
     * 날짜 구간과 필터로 에러 로그 조회
     * @param startDate 시작 날짜/시간
     * @param endDate 종료 날짜/시간
     * @param profile 프로필 필터 (all인 경우 null 처리)
     * @param appName 앱 이름 필터 (all인 경우 null 처리)
     * @param limit 조회할 개수
     * @return RefinedErrorLog 리스트
     */
    public List<RefinedErrorLog> getErrorLogsByDateRange(
            OffsetDateTime startDate,
            OffsetDateTime endDate,
            String profile,
            String appName,
            int limit) {

        String profileFilter = (profile == null || "all".equalsIgnoreCase(profile)) ? null : profile;
        String appNameFilter = (appName == null || "all".equalsIgnoreCase(appName)) ? null : appName;

        Pageable pageable = PageRequest.of(0, limit);
        return refinedErrorLogRepository.findByFilters(startDate, endDate, profileFilter, appNameFilter, pageable);
    }

    /**
     * 최근 시간 기준으로 에러 로그 조회
     * @param minutes 최근 몇 분 (10, 30, 60)
     * @param profile 프로필 필터 (all인 경우 null 처리)
     * @param appName 앱 이름 필터 (all인 경우 null 처리)
     * @param limit 조회할 개수
     * @return RefinedErrorLog 리스트
     */
    public List<RefinedErrorLog> getRecentErrorLogs(
            int minutes,
            String profile,
            String appName,
            int limit) {

        OffsetDateTime startTime = OffsetDateTime.now().minusMinutes(minutes);
        String profileFilter = (profile == null || "all".equalsIgnoreCase(profile)) ? null : profile;
        String appNameFilter = (appName == null || "all".equalsIgnoreCase(appName)) ? null : appName;

        Pageable pageable = PageRequest.of(0, limit);
        return refinedErrorLogRepository.findRecentByFilters(startTime, profileFilter, appNameFilter, pageable);
    }

    /**
     * 날짜 구간과 필터로 전체 에러 로그 개수 조회
     */
    public long countByFilters(
            OffsetDateTime startDate,
            OffsetDateTime endDate,
            String profile,
            String appName) {

        String profileFilter = (profile == null || "all".equalsIgnoreCase(profile)) ? null : profile;
        String appNameFilter = (appName == null || "all".equalsIgnoreCase(appName)) ? null : appName;

        return refinedErrorLogRepository.countByFilters(startDate, endDate, profileFilter, appNameFilter);
    }

    /**
     * 최근 시간 기준으로 전체 에러 로그 개수 조회
     */
    public long countRecentByFilters(
            int minutes,
            String profile,
            String appName) {

        OffsetDateTime startTime = OffsetDateTime.now().minusMinutes(minutes);
        String profileFilter = (profile == null || "all".equalsIgnoreCase(profile)) ? null : profile;
        String appNameFilter = (appName == null || "all".equalsIgnoreCase(appName)) ? null : appName;

        return refinedErrorLogRepository.countRecentByFilters(startTime, profileFilter, appNameFilter);
    }
}
