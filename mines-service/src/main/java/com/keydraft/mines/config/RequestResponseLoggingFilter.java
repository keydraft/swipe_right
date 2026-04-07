package com.keydraft.mines.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.Enumeration;

/**
 * Industry-standard filter for logging incoming HTTP requests and outgoing responses,
 * including bodies. Uses Spring's ContentCaching wrappers.
 */
@Slf4j
@Component
public class RequestResponseLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Skip binary or heavy requests if needed (e.g., multipart/form-data)
        if (isAsyncDispatch(request) || isBinaryContent(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);

        try {
            filterChain.doFilter(wrappedRequest, wrappedResponse);
        } finally {
            logRequestResponse(wrappedRequest, wrappedResponse);
            wrappedResponse.copyBodyToResponse();
        }
    }

    private void logRequestResponse(ContentCachingRequestWrapper request, ContentCachingResponseWrapper response) {
        String method = request.getMethod();
        String uri = request.getRequestURI();
        String queryParams = request.getQueryString() != null ? "?" + request.getQueryString() : "";
        int status = response.getStatus();

        // 1. Log Request Info
        log.info("===> REQUEST: {} {}{} [IP: {}]", method, uri, queryParams, request.getRemoteAddr());
        logHeaders(request);
        logBody(request.getContentAsByteArray(), request.getCharacterEncoding(), "REQUEST BODY");

        // 2. Log Response Info
        log.info("<=== RESPONSE: {} {} - Status: {}", method, uri, status);
        logBody(response.getContentAsByteArray(), response.getCharacterEncoding(), "RESPONSE BODY");
        log.info("--------------------------------------------------------------------------------");
    }

    private void logHeaders(HttpServletRequest request) {
        if (log.isDebugEnabled()) {
            Enumeration<String> headerNames = request.getHeaderNames();
            while (headerNames.hasMoreElements()) {
                String headerName = headerNames.nextElement();
                log.debug("Header: {} = {}", headerName, request.getHeader(headerName));
            }
        }
    }

    private void logBody(byte[] content, String encoding, String label) {
        if (content.length > 0) {
            String body = getBodyString(content, encoding);
            log.info("{}: {}", label, body);
        }
    }

    private String getBodyString(byte[] content, String encoding) {
        try {
            return new String(content, encoding != null ? encoding : "UTF-8");
        } catch (UnsupportedEncodingException e) {
            return "[Binary Data]";
        }
    }

    private boolean isBinaryContent(HttpServletRequest request) {
        String contentType = request.getContentType();
        return contentType != null && (contentType.startsWith("image/") || contentType.startsWith("video/") || contentType.startsWith("audio/") || contentType.contains("multipart/form-data"));
    }
}
