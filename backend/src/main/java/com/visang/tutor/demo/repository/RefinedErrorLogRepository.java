package com.visang.tutor.demo.repository;

import com.visang.tutor.demo.model.RefinedErrorLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface RefinedErrorLogRepository extends JpaRepository<RefinedErrorLog, Long> {

    /**
     * 필터 조건에 따른 에러 로그 조회
     * @param startDate 시작 날짜/시간
     * @param endDate 종료 날짜/시간
     * @param profile 프로필 (null인 경우 전체)
     * @param appName 앱 이름 (null인 경우 전체)
     * @param pageable 페이징 정보
     * @return RefinedErrorLog 리스트
     */
    @Query("SELECT r FROM RefinedErrorLog r WHERE " +
           "r.createdAt >= :startDate AND r.createdAt <= :endDate " +
           "AND (:profile IS NULL OR r.profile = :profile) " +
           "AND (:appName IS NULL OR r.appName = :appName) " +
           "ORDER BY r.createdAt DESC")
    List<RefinedErrorLog> findByFilters(
            @Param("startDate") OffsetDateTime startDate,
            @Param("endDate") OffsetDateTime endDate,
            @Param("profile") String profile,
            @Param("appName") String appName,
            Pageable pageable
    );

    /**
     * 최근 시간 기준으로 에러 로그 조회
     * @param minutes 최근 n분
     * @param profile 프로필 (null인 경우 전체)
     * @param appName 앱 이름 (null인 경우 전체)
     * @param pageable 페이징 정보
     * @return RefinedErrorLog 리스트
     */
    @Query("SELECT r FROM RefinedErrorLog r WHERE " +
           "r.createdAt >= :startTime " +
           "AND (:profile IS NULL OR r.profile = :profile) " +
           "AND (:appName IS NULL OR r.appName = :appName) " +
           "ORDER BY r.createdAt DESC")
    List<RefinedErrorLog> findRecentByFilters(
            @Param("startTime") OffsetDateTime startTime,
            @Param("profile") String profile,
            @Param("appName") String appName,
            Pageable pageable
    );

    /**
     * 필터 조건에 따른 에러 로그 전체 개수 조회
     */
    @Query("SELECT COUNT(r) FROM RefinedErrorLog r WHERE " +
           "r.createdAt >= :startDate AND r.createdAt <= :endDate " +
           "AND (:profile IS NULL OR r.profile = :profile) " +
           "AND (:appName IS NULL OR r.appName = :appName)")
    long countByFilters(
            @Param("startDate") OffsetDateTime startDate,
            @Param("endDate") OffsetDateTime endDate,
            @Param("profile") String profile,
            @Param("appName") String appName
    );

    /**
     * 최근 시간 기준으로 에러 로그 전체 개수 조회
     */
    @Query("SELECT COUNT(r) FROM RefinedErrorLog r WHERE " +
           "r.createdAt >= :startTime " +
           "AND (:profile IS NULL OR r.profile = :profile) " +
           "AND (:appName IS NULL OR r.appName = :appName)")
    long countRecentByFilters(
            @Param("startTime") OffsetDateTime startTime,
            @Param("profile") String profile,
            @Param("appName") String appName
    );
}
