package com.codevista.compiler.exception;

import com.codevista.exception.ApiException;
import org.springframework.http.HttpStatus;

public class CompilationSecurityException extends ApiException {

    public CompilationSecurityException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
