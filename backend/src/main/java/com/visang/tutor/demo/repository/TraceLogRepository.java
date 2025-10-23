package com.visang.tutor.demo.repository;

import com.visang.tutor.demo.model.TraceLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface TraceLogRepository extends JpaRepository<TraceLog, Long> {

    /**
     * 날짜와 시간 구간별로 제한된 수량 조회
     * @param startDate 시작 날짜/시간
     * @param endDate 종료 날짜/시간
     * @param pageable 페이징 정보 (limit 포함)
     * @return TraceLog 리스트
     */
    @Query("SELECT t FROM TraceLog t WHERE t.createdAt >= :startDate AND t.createdAt <= :endDate ORDER BY t.createdAt DESC")
    List<TraceLog> findByDateBetween(
            @Param("startDate") OffsetDateTime startDate,
            @Param("endDate") OffsetDateTime endDate,
            Pageable pageable
    );

    /**
     * 최근 시간 기준으로 제한된 수량 조회
     * @param pageable 페이징 정보 (limit 포함)
     * @return TraceLog 리스트
     */
    @Query("SELECT t FROM TraceLog t ORDER BY t.createdAt DESC")
    List<TraceLog> findRecentLogs(Pageable pageable);

    /**
     * appName 필터와 함께 최근 시간 기준으로 제한된 수량 조회
     * @param appName 필터링할 appName
     * @param pageable 페이징 정보 (limit 포함)
     * @return TraceLog 리스트
     */
    @Query(value = "SELECT * FROM trace_logs WHERE log_payload->>'appName' = :appName ORDER BY created_at DESC", nativeQuery = true)
    List<TraceLog> findRecentLogsByAppName(@Param("appName") String appName, Pageable pageable);

    /**
     * appName 필터와 날짜 구간으로 제한된 수량 조회
     * @param startDate 시작 날짜/시간
     * @param endDate 종료 날짜/시간
     * @param appName 필터링할 appName
     * @param pageable 페이징 정보 (limit 포함)
     * @return TraceLog 리스트
     */
    @Query(value = "SELECT * FROM trace_logs WHERE created_at >= :startDate AND created_at <= :endDate AND log_payload->>'appName' = :appName ORDER BY created_at DESC", nativeQuery = true)
    List<TraceLog> findByDateBetweenAndAppName(
            @Param("startDate") OffsetDateTime startDate,
            @Param("endDate") OffsetDateTime endDate,
            @Param("appName") String appName,
            Pageable pageable
    );
}
