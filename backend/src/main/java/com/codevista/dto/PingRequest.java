package com.codevista.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PingRequest(
        @NotBlank(message = "Message must not be blank")
        @Size(max = 255, message = "Message must not exceed 255 characters")
        String message
) {}
