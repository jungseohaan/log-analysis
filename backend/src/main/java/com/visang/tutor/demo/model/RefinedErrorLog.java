package com.visang.tutor.demo.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "refined_error_logs")
@Getter
@Setter
public class RefinedErrorLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "trace_logs_id")
    private Long traceLogsId;

    @Column(name = "profile", length = 20)
    private String profile;

    @Column(name = "app_name", length = 20)
    private String appName;

    @Column(name = "err_cd", length = 20)
    private String errCd;

    @Column(name = "schl_cd", length = 50)
    private String schlCd;

    @Column(name = "cla_id", length = 128)
    private String claId;

    @Column(name = "user_id", length = 64)
    private String userId;

    @Column(name = "url", length = 500)
    private String url;

    @Column(name = "hash", length = 20)
    private String hash;

    @Column(name = "exception", length = 50)
    private String exception;

    @Column(name = "err_msg", columnDefinition = "text")
    private String errMsg;

    @Column(name = "message", columnDefinition = "text")
    private String message;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "user_se_cd", length = 1)
    private String userSeCd;
}
