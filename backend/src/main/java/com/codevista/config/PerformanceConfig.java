package com.codevista.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.filter.ShallowEtagHeaderFilter;

import java.io.IOException;

@Configuration
public class PerformanceConfig {

    @Bean
    public FilterRegistrationBean<ShallowEtagHeaderFilter> shallowEtagHeaderFilter() {
        FilterRegistrationBean<ShallowEtagHeaderFilter> registration =
                new FilterRegistrationBean<>(new ShallowEtagHeaderFilter());
        registration.addUrlPatterns("/api/*");
        registration.setName("shallowEtagHeaderFilter");
        registration.setOrder(Ordered.LOWEST_PRECEDENCE - 10);
        return registration;
    }

    @Bean
    public FilterRegistrationBean<OncePerRequestFilter> securityHeadersFilter() {
        OncePerRequestFilter filter = new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(
                    HttpServletRequest request,
                    HttpServletResponse response,
                    FilterChain filterChain
            ) throws ServletException, IOException {
                response.setHeader("X-Content-Type-Options", "nosniff");
                response.setHeader("X-Frame-Options", "SAMEORIGIN");
                response.setHeader("X-XSS-Protection", "1; mode=block");
                response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
                filterChain.doFilter(request, response);
            }
        };

        FilterRegistrationBean<OncePerRequestFilter> registration =
                new FilterRegistrationBean<>(filter);
        registration.addUrlPatterns("/api/*");
        registration.setName("securityHeadersFilter");
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE + 1);
        return registration;
    }
}
