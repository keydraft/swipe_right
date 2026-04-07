package com.keydraft.mines.controller;

import com.keydraft.mines.dto.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
public class MinesController {

    @GetMapping("/health")
    public ApiResponse<Map<String, String>> health() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "Up");
        return ApiResponse.success(status, "System health retrieved");
    }
}
