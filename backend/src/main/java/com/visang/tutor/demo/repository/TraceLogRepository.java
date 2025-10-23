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

    /**
     * logType 필터와 날짜 구간으로 제한된 수량 조회
     * @param startDate 시작 날짜/시간
     * @param endDate 종료 날짜/시간
     * @param logType 필터링할 logType
     * @param pageable 페이징 정보 (limit 포함)
     * @return TraceLog 리스트
     */
    @Query(value = "SELECT * FROM trace_logs WHERE created_at >= :startDate AND created_at <= :endDate AND log_payload->>'logType' = :logType ORDER BY created_at DESC", nativeQuery = true)
    List<TraceLog> findByDateBetweenAndLogType(
            @Param("startDate") OffsetDateTime startDate,
            @Param("endDate") OffsetDateTime endDate,
            @Param("logType") String logType,
            Pageable pageable
    );

    /**
     * appName, logType 필터와 날짜 구간으로 제한된 수량 조회
     * @param startDate 시작 날짜/시간
     * @param endDate 종료 날짜/시간
     * @param appName 필터링할 appName
     * @param logType 필터링할 logType
     * @param pageable 페이징 정보 (limit 포함)
     * @return TraceLog 리스트
     */
    @Query(value = "SELECT * FROM trace_logs WHERE created_at >= :startDate AND created_at <= :endDate AND log_payload->>'appName' = :appName AND log_payload->>'logType' = :logType ORDER BY created_at DESC", nativeQuery = true)
    List<TraceLog> findByDateBetweenAndAppNameAndLogType(
            @Param("startDate") OffsetDateTime startDate,
            @Param("endDate") OffsetDateTime endDate,
            @Param("appName") String appName,
            @Param("logType") String logType,
            Pageable pageable
    );

    /**
     * logType 필터와 함께 최근 시간 기준으로 제한된 수량 조회
     * @param logType 필터링할 logType
     * @param pageable 페이징 정보 (limit 포함)
     * @return TraceLog 리스트
     */
    @Query(value = "SELECT * FROM trace_logs WHERE log_payload->>'logType' = :logType ORDER BY created_at DESC", nativeQuery = true)
    List<TraceLog> findRecentLogsByLogType(@Param("logType") String logType, Pageable pageable);

    /**
     * appName, logType 필터와 함께 최근 시간 기준으로 제한된 수량 조회
     * @param appName 필터링할 appName
     * @param logType 필터링할 logType
     * @param pageable 페이징 정보 (limit 포함)
     * @return TraceLog 리스트
     */
    @Query(value = "SELECT * FROM trace_logs WHERE log_payload->>'appName' = :appName AND log_payload->>'logType' = :logType ORDER BY created_at DESC", nativeQuery = true)
    List<TraceLog> findRecentLogsByAppNameAndLogType(@Param("appName") String appName, @Param("logType") String logType, Pageable pageable);

    /**
     * evtCd가 존재하고 길이가 3 이상인 최근 로그 조회 (Event 필터)
     * @param pageable 페이징 정보 (limit 포함)
     * @return TraceLog 리스트
     */
    @Query(value = "SELECT * FROM trace_logs WHERE log_payload->>'evtCd' IS NOT NULL AND LENGTH(log_payload->>'evtCd') >= 3 ORDER BY created_at DESC", nativeQuery = true)
    List<TraceLog> findRecentLogsByEvtCd(Pageable pageable);

    /**
     * evtCd가 존재하고 길이가 3 이상인 로그를 날짜 구간으로 조회 (Event 필터)
     * @param startDate 시작 날짜/시간
     * @param endDate 종료 날짜/시간
     * @param pageable 페이징 정보 (limit 포함)
     * @return TraceLog 리스트
     */
    @Query(value = "SELECT * FROM trace_logs WHERE created_at >= :startDate AND created_at <= :endDate AND log_payload->>'evtCd' IS NOT NULL AND LENGTH(log_payload->>'evtCd') >= 3 ORDER BY created_at DESC", nativeQuery = true)
    List<TraceLog> findByDateBetweenAndEvtCd(
            @Param("startDate") OffsetDateTime startDate,
            @Param("endDate") OffsetDateTime endDate,
            Pageable pageable
    );

    // ===== User Logs (uuid 필터) =====

    /**
     * uuid로 최근 시간 기준 조회 (모든 uuid - uuid가 null이 아닌 로그)
     * @param pageable 페이징 정보 (limit 포함)
     * @return TraceLog 리스트
     */
    @Query(value = "SELECT * FROM trace_logs WHERE log_payload->>'uuid' IS NOT NULL ORDER BY created_at DESC", nativeQuery = true)
    List<TraceLog> findRecentLogsByUuidExists(Pageable pageable);

    /**
     * uuid로 날짜 구간 조회 (모든 uuid - uuid가 null이 아닌 로그)
     * @param startDate 시작 날짜/시간
     * @param endDate 종료 날짜/시간
     * @param pageable 페이징 정보 (limit 포함)
     * @return TraceLog 리스트
     */
    @Query(value = "SELECT * FROM trace_logs WHERE created_at >= :startDate AND created_at <= :endDate AND log_payload->>'uuid' IS NOT NULL ORDER BY created_at DESC", nativeQuery = true)
    List<TraceLog> findByDateBetweenAndUuidExists(
            @Param("startDate") OffsetDateTime startDate,
            @Param("endDate") OffsetDateTime endDate,
            Pageable pageable
    );

    /**
     * uuid like 검색으로 최근 시간 기준 조회 (앞부분 와일드카드 불가)
     * @param uuid 검색할 uuid 패턴
     * @param pageable 페이징 정보 (limit 포함)
     * @return TraceLog 리스트
     */
    @Query(value = "SELECT * FROM trace_logs WHERE log_payload->>'uuid' LIKE :uuid || '%' ORDER BY created_at DESC", nativeQuery = true)
    List<TraceLog> findRecentLogsByUuidLike(@Param("uuid") String uuid, Pageable pageable);

    /**
     * uuid like 검색으로 날짜 구간 조회 (앞부분 와일드카드 불가)
     * @param startDate 시작 날짜/시간
     * @param endDate 종료 날짜/시간
     * @param uuid 검색할 uuid 패턴
     * @param pageable 페이징 정보 (limit 포함)
     * @return TraceLog 리스트
     */
    @Query(value = "SELECT * FROM trace_logs WHERE created_at >= :startDate AND created_at <= :endDate AND log_payload->>'uuid' LIKE :uuid || '%' ORDER BY created_at DESC", nativeQuery = true)
    List<TraceLog> findByDateBetweenAndUuidLike(
            @Param("startDate") OffsetDateTime startDate,
            @Param("endDate") OffsetDateTime endDate,
            @Param("uuid") String uuid,
            Pageable pageable
    );

    // ===== User Logs with logType 필터 =====

    /**
     * logType 필터와 날짜 구간으로 조회 (uuid 존재)
     * @param startDate 시작 날짜/시간
     * @param endDate 종료 날짜/시간
     * @param logType 필터링할 logType
     * @param pageable 페이징 정보 (limit 포함)
     * @return TraceLog 리스트
     */
    @Query(value = "SELECT * FROM trace_logs WHERE created_at >= :startDate AND created_at <= :endDate AND log_payload->>'uuid' IS NOT NULL AND log_payload->>'logType' = :logType ORDER BY created_at DESC", nativeQuery = true)
    List<TraceLog> findByDateBetweenAndUuidExistsAndLogType(
            @Param("startDate") OffsetDateTime startDate,
            @Param("endDate") OffsetDateTime endDate,
            @Param("logType") String logType,
            Pageable pageable
    );

    /**
     * uuid + logType 필터로 날짜 구간 조회
     * @param startDate 시작 날짜/시간
     * @param endDate 종료 날짜/시간
     * @param uuid 검색할 uuid 패턴
     * @param logType 필터링할 logType
     * @param pageable 페이징 정보 (limit 포함)
     * @return TraceLog 리스트
     */
    @Query(value = "SELECT * FROM trace_logs WHERE created_at >= :startDate AND created_at <= :endDate AND log_payload->>'uuid' LIKE :uuid || '%' AND log_payload->>'logType' = :logType ORDER BY created_at DESC", nativeQuery = true)
    List<TraceLog> findByDateBetweenAndUuidLikeAndLogType(
            @Param("startDate") OffsetDateTime startDate,
            @Param("endDate") OffsetDateTime endDate,
            @Param("uuid") String uuid,
            @Param("logType") String logType,
            Pageable pageable
    );
}
