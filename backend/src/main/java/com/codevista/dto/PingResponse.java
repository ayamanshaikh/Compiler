package com.codevista.dto;

import java.time.Instant;

public record PingResponse(
        String echo,
        Instant timestamp
) {}
