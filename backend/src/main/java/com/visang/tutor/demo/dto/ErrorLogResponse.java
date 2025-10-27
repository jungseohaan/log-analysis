package com.visang.tutor.demo.dto;

import com.visang.tutor.demo.model.RefinedErrorLog;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ErrorLogResponse {
    private List<RefinedErrorLog> logs;
    private long total;
}
