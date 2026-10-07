package com.codevista.compiler.exception;

import com.codevista.exception.ApiException;
import org.springframework.http.HttpStatus;

public class UnsupportedLanguageException extends ApiException {

    public UnsupportedLanguageException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
