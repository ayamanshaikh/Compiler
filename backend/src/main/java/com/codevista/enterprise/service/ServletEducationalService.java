package com.codevista.enterprise.service;

import com.codevista.enterprise.dto.ServletExecuteRequest;
import com.codevista.enterprise.dto.ServletExecuteResponse;
import com.codevista.enterprise.dto.ServletScenarioResponse;
import com.codevista.enterprise.model.ServletLifecycleStep;
import com.codevista.enterprise.model.ServletResponseModel;
import com.codevista.enterprise.model.ServletScenario;
import com.codevista.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ServletEducationalService {

    private final Map<String, ServletScenario> scenarios = new LinkedHashMap<>();

    // In-memory educational session store
    private final Map<String, Map<String, Object>> sessionStore = new HashMap<>();

    public ServletEducationalService() {
        registerScenarios();
    }

    public List<ServletScenarioResponse> getAllScenarios() {
        return scenarios.values().stream()
                .map(ServletScenarioResponse::new)
                .collect(Collectors.toList());
    }

    public ServletScenarioResponse getScenario(String id) {
        ServletScenario scenario = scenarios.get(id);
        if (scenario == null) {
            throw new ResourceNotFoundException("Servlet scenario not found with id: " + id);
        }
        return new ServletScenarioResponse(scenario);
    }

    public ServletExecuteResponse execute(ServletExecuteRequest request) {
        ServletScenario scenario = scenarios.get(request.getScenarioId());
        if (scenario == null) {
            throw new ResourceNotFoundException("Servlet scenario not found with id: " + request.getScenarioId());
        }

        String method = (request.getMethod() != null && !request.getMethod().isBlank())
                ? request.getMethod().toUpperCase()
                : scenario.getDefaultMethod();

        String path = (request.getPath() != null && !request.getPath().isBlank())
                ? request.getPath()
                : scenario.getDefaultPath();

        Map<String, String> headers = request.getHeaders() != null ? new HashMap<>(request.getHeaders()) : new HashMap<>();
        Map<String, String> queryParams = request.getQueryParams() != null ? new HashMap<>(request.getQueryParams()) : new HashMap<>();
        String body = request.getBody() != null ? request.getBody() : scenario.getDefaultBody();

        List<ServletLifecycleStep> steps = new ArrayList<>();
        int stepIdx = 0;

        // Step 1: HTTP Request Parsing
        ServletLifecycleStep parseStep = new ServletLifecycleStep(
                ++stepIdx,
                "REQUEST_PARSING",
                "Servlet Container (Catalina/Tomcat) parsed incoming HTTP " + method + " request to path '" + path + "'.",
                "ServletContainer"
        );
        parseStep.getDetails().put("method", method);
        parseStep.getDetails().put("path", path);
        parseStep.getDetails().put("queryParams", queryParams);
        parseStep.getDetails().put("headers", headers);
        steps.add(parseStep);

        // Step 2: Session Extraction / Allocation
        String cookieHeader = headers.getOrDefault("Cookie", headers.get("cookie"));
        String sessionId = null;
        if (cookieHeader != null && cookieHeader.contains("JSESSIONID=")) {
            for (String cookie : cookieHeader.split(";")) {
                if (cookie.trim().startsWith("JSESSIONID=")) {
                    sessionId = cookie.trim().substring("JSESSIONID=".length());
                    break;
                }
            }
        }
        if (sessionId == null) {
            sessionId = "CV_SESS_" + UUID.randomUUID().toString().substring(0, 8);
        }
        sessionStore.putIfAbsent(sessionId, new HashMap<>());
        Map<String, Object> currentSession = sessionStore.get(sessionId);

        // Step 3: Filter Chain Check (for auth-filter scenario or generic filters)
        if ("auth-filter".equals(scenario.getId())) {
            ServletLifecycleStep filterPre = new ServletLifecycleStep(
                    ++stepIdx,
                    "FILTER_PRE_HANDLE",
                    "AuthenticationFilter intercepted request. Inspecting Authorization header.",
                    "AuthenticationFilter"
            );
            String authHeader = headers.getOrDefault("Authorization", headers.get("authorization"));
            if (authHeader == null || !authHeader.startsWith("Bearer valid-token")) {
                filterPre.getDetails().put("status", "BLOCKED");
                filterPre.getDetails().put("reason", "Missing or invalid Bearer token. Request short-circuited.");
                steps.add(filterPre);

                ServletResponseModel errorResp = new ServletResponseModel(
                        401,
                        "Unauthorized",
                        Map.of("Content-Type", "application/json", "WWW-Authenticate", "Bearer"),
                        "{\"error\": \"Unauthorized\", \"message\": \"AuthenticationFilter blocked the request before reaching Servlet.\"}",
                        currentSession,
                        sessionId
                );
                return new ServletExecuteResponse(true, errorResp, steps, "Request rejected by AuthenticationFilter.");
            } else {
                filterPre.getDetails().put("status", "AUTHORIZED");
                filterPre.getDetails().put("reason", "Valid bearer token provided. Invoking chain.doFilter(req, resp).");
                steps.add(filterPre);
            }
        }

        // Step 4: Servlet Container Routing & Lifecycle
        ServletLifecycleStep routingStep = new ServletLifecycleStep(
                ++stepIdx,
                "CONTAINER_ROUTING",
                "Mapped request path '" + path + "' to Servlet class '" + scenario.getName() + "'.",
                "ServletContainer"
        );
        steps.add(routingStep);

        ServletLifecycleStep initStep = new ServletLifecycleStep(
                ++stepIdx,
                "SERVLET_INIT",
                scenario.getName() + ".init(ServletConfig config) called once during servlet lifecycle.",
                scenario.getName()
        );
        steps.add(initStep);

        // Step 5: service(req, resp) Dispatch
        ServletLifecycleStep dispatchStep = new ServletLifecycleStep(
                ++stepIdx,
                "SERVICE_DISPATCH",
                "HttpServlet.service(req, resp) evaluated HTTP " + method + " and delegated to do" +
                        method.substring(0, 1) + method.substring(1).toLowerCase() + "(req, resp).",
                scenario.getName()
        );
        steps.add(dispatchStep);

        // Step 6: Servlet Execution (Scenario specific)
        ServletResponseModel responseModel = executeScenarioLogic(scenario.getId(), method, path, queryParams, headers, body, currentSession, sessionId, steps, ++stepIdx);

        // Step 7: Response Serialization
        ServletLifecycleStep responseStep = new ServletLifecycleStep(
                ++stepIdx,
                "RESPONSE_SERIALIZATION",
                "Container committed HTTP " + responseModel.getStatusCode() + " " + responseModel.getStatusText() + " response to client socket.",
                "ServletContainer"
        );
        responseStep.getDetails().put("statusCode", responseModel.getStatusCode());
        responseStep.getDetails().put("headers", responseModel.getHeaders());
        steps.add(responseStep);

        return new ServletExecuteResponse(true, responseModel, steps, "Servlet executed successfully.");
    }

    private ServletResponseModel executeScenarioLogic(String scenarioId, String method, String path,
                                                      Map<String, String> queryParams, Map<String, String> headers,
                                                      String body, Map<String, Object> session, String sessionId,
                                                      List<ServletLifecycleStep> steps, int stepIdx) {
        Map<String, String> respHeaders = new HashMap<>();
        respHeaders.put("X-Powered-By", "CodeVista-ServletEngine/4.0");

        switch (scenarioId) {
            case "hello-get": {
                String name = queryParams.getOrDefault("name", "World");
                respHeaders.put("Content-Type", "text/html; charset=UTF-8");

                ServletLifecycleStep exec = new ServletLifecycleStep(
                        stepIdx,
                        "SERVLET_EXECUTION",
                        "HelloServlet.doGet() read query parameter 'name'='" + name + "' and generated HTML greeting.",
                        "HelloServlet"
                );
                steps.add(exec);

                String html = """
                        <!DOCTYPE html>
                        <html>
                        <head><title>Hello Servlet</title></head>
                        <body>
                            <h2>Welcome to CodeVista Servlet Environment!</h2>
                            <p>Hello, <strong>%s</strong>! Generated dynamically at runtime.</p>
                            <small>Protocol: HTTP/1.1 | Container: Jakarta Servlet 6.0</small>
                        </body>
                        </html>
                        """.formatted(name);

                return new ServletResponseModel(200, "OK", respHeaders, html, session, sessionId);
            }

            case "user-post": {
                respHeaders.put("Content-Type", "application/json; charset=UTF-8");

                if (!"POST".equalsIgnoreCase(method)) {
                    return new ServletResponseModel(405, "Method Not Allowed", respHeaders,
                            "{\"error\": \"Method Not Allowed\", \"expected\": \"POST\"}", session, sessionId);
                }

                boolean hasUsername = body != null && body.contains("\"username\"");
                boolean hasEmail = body != null && body.contains("\"email\"");

                ServletLifecycleStep exec = new ServletLifecycleStep(
                        stepIdx,
                        "SERVLET_EXECUTION",
                        "UserRegistrationServlet.doPost() read request payload stream and parsed JSON body.",
                        "UserRegistrationServlet"
                );
                steps.add(exec);

                if (!hasUsername || !hasEmail) {
                    return new ServletResponseModel(400, "Bad Request", respHeaders,
                            "{\"error\": \"Validation Failed\", \"details\": \"Both username and email fields are required.\"}",
                            session, sessionId);
                }

                respHeaders.put("Location", "/api/users/101");
                return new ServletResponseModel(201, "Created", respHeaders,
                        "{\"status\": \"success\", \"userId\": 101, \"message\": \"User successfully registered in database.\"}",
                        session, sessionId);
            }

            case "session-cart": {
                respHeaders.put("Content-Type", "application/json; charset=UTF-8");
                respHeaders.put("Set-Cookie", "JSESSIONID=" + sessionId + "; Path=/; HttpOnly");

                @SuppressWarnings("unchecked")
                List<String> cart = (List<String>) session.computeIfAbsent("cartItems", k -> new ArrayList<String>());

                String itemToAdd = queryParams.get("item");
                if (itemToAdd != null && !itemToAdd.isBlank()) {
                    cart.add(itemToAdd);
                }

                ServletLifecycleStep exec = new ServletLifecycleStep(
                        stepIdx,
                        "SESSION_MUTATION",
                        "SessionCartServlet called req.getSession(true). Cart has " + cart.size() + " items.",
                        "HttpSession"
                );
                exec.getDetails().put("sessionId", sessionId);
                exec.getDetails().put("cartItems", new ArrayList<>(cart));
                steps.add(exec);

                String json = "{\"sessionId\": \"" + sessionId + "\", \"cartItems\": " +
                        cart.stream().map(i -> "\"" + i + "\"").collect(Collectors.joining(", ", "[", "]")) +
                        ", \"totalItems\": " + cart.size() + "}";

                return new ServletResponseModel(200, "OK", respHeaders, json, session, sessionId);
            }

            case "auth-filter": {
                respHeaders.put("Content-Type", "application/json; charset=UTF-8");
                ServletLifecycleStep exec = new ServletLifecycleStep(
                        stepIdx,
                        "SERVLET_EXECUTION",
                        "ProtectedResourceServlet executed securely after passing AuthenticationFilter verification.",
                        "ProtectedResourceServlet"
                );
                steps.add(exec);

                return new ServletResponseModel(200, "OK", respHeaders,
                        "{\"secureData\": \"Confidential enterprise report unlocked.\", \"authenticated\": true}",
                        session, sessionId);
            }

            case "redirect-forward": {
                String action = queryParams.getOrDefault("action", "forward");
                if ("redirect".equalsIgnoreCase(action)) {
                    respHeaders.put("Location", "/login.html");
                    ServletLifecycleStep exec = new ServletLifecycleStep(
                            stepIdx,
                            "SERVLET_EXECUTION",
                            "DispatcherServlet invoked resp.sendRedirect(\"/login.html\"). Client instructed to perform new HTTP request.",
                            "DispatcherServlet"
                    );
                    steps.add(exec);
                    return new ServletResponseModel(302, "Found", respHeaders, "", session, sessionId);
                } else {
                    respHeaders.put("Content-Type", "text/html; charset=UTF-8");
                    ServletLifecycleStep exec = new ServletLifecycleStep(
                            stepIdx,
                            "SERVLET_EXECUTION",
                            "DispatcherServlet invoked RequestDispatcher.forward(req, resp) to '/home.jsp'. Internal server-side routing.",
                            "RequestDispatcher"
                    );
                    steps.add(exec);
                    return new ServletResponseModel(200, "OK", respHeaders,
                            "<h1>Home View (Forwarded)</h1><p>Processed internally by RequestDispatcher without changing browser URL.</p>",
                            session, sessionId);
                }
            }

            default: {
                respHeaders.put("Content-Type", "text/plain");
                return new ServletResponseModel(200, "OK", respHeaders, "Generic Servlet Response", session, sessionId);
            }
        }
    }

    private void registerScenarios() {
        // 1. HelloServlet (GET)
        scenarios.put("hello-get", new ServletScenario(
                "hello-get",
                "HelloServlet (HTTP GET)",
                "Basic HttpServlet handling GET requests, extracting query parameters, setting response content types, and writing HTML to PrintWriter.",
                """
                @WebServlet(name = "HelloServlet", urlPatterns = {"/hello"})
                public class HelloServlet extends HttpServlet {
                    @Override
                    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
                            throws ServletException, IOException {
                        String name = req.getParameter("name");
                        if (name == null || name.isBlank()) {
                            name = "World";
                        }
                        resp.setContentType("text/html; charset=UTF-8");
                        PrintWriter out = resp.getWriter();
                        out.println("<h1>Hello, " + name + "!</h1>");
                    }
                }
                """.stripIndent(),
                """
                <servlet>
                    <servlet-name>HelloServlet</servlet-name>
                    <servlet-class>com.example.HelloServlet</servlet-class>
                </servlet>
                <servlet-mapping>
                    <servlet-name>HelloServlet</servlet-name>
                    <url-pattern>/hello</url-pattern>
                </servlet-mapping>
                """.stripIndent(),
                "GET",
                "/hello",
                Map.of("Accept", "text/html"),
                Map.of("name", "Alice"),
                null
        ));

        // 2. UserRegistrationServlet (POST)
        scenarios.put("user-post", new ServletScenario(
                "user-post",
                "UserRegistrationServlet (HTTP POST)",
                "Processes mutation payloads via doPost(), validates required fields, returns 201 Created status with Location header, or 400 Bad Request.",
                """
                @WebServlet(name = "UserRegistrationServlet", urlPatterns = {"/api/users"})
                public class UserRegistrationServlet extends HttpServlet {
                    @Override
                    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
                            throws ServletException, IOException {
                        BufferedReader reader = req.getReader();
                        String jsonBody = reader.lines().collect(Collectors.joining());

                        // Validate payload
                        if (!jsonBody.contains("username") || !jsonBody.contains("email")) {
                            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                            resp.setContentType("application/json");
                            resp.getWriter().write("{\\"error\\": \\"Missing required fields\\"}");
                            return;
                        }

                        // Save user and return 201 Created
                        resp.setStatus(HttpServletResponse.SC_CREATED);
                        resp.setHeader("Location", "/api/users/101");
                        resp.setContentType("application/json");
                        resp.getWriter().write("{\\"status\\": \\"success\\", \\"userId\\": 101}");
                    }
                }
                """.stripIndent(),
                """
                <servlet-mapping>
                    <servlet-name>UserRegistrationServlet</servlet-name>
                    <url-pattern>/api/users</url-pattern>
                </servlet-mapping>
                """.stripIndent(),
                "POST",
                "/api/users",
                Map.of("Content-Type", "application/json"),
                Map.of(),
                "{\"username\": \"alice_dev\", \"email\": \"alice@codevista.edu\"}"
        ));

        // 3. SessionCartServlet (Session Management)
        scenarios.put("session-cart", new ServletScenario(
                "session-cart",
                "SessionCartServlet (HttpSession)",
                "Demonstrates stateful HTTP sessions using req.getSession(), reading/writing session attributes across requests, and tracking JSESSIONID cookie.",
                """
                @WebServlet(name = "SessionCartServlet", urlPatterns = {"/cart"})
                public class SessionCartServlet extends HttpServlet {
                    @Override
                    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
                            throws ServletException, IOException {
                        HttpSession session = req.getSession(true);
                        List<String> items = (List<String>) session.getAttribute("cartItems");
                        if (items == null) {
                            items = new ArrayList<>();
                            session.setAttribute("cartItems", items);
                        }

                        String newItem = req.getParameter("item");
                        if (newItem != null && !newItem.isBlank()) {
                            items.add(newItem);
                        }

                        resp.setContentType("application/json");
                        resp.getWriter().write("{\\"totalItems\\": " + items.size() + "}");
                    }
                }
                """.stripIndent(),
                """
                <session-config>
                    <session-timeout>30</session-timeout>
                    <cookie-config>
                        <http-only>true</http-only>
                    </cookie-config>
                </session-config>
                """.stripIndent(),
                "GET",
                "/cart",
                Map.of(),
                Map.of("item", "Java_Concurrency_Book"),
                null
        ));

        // 4. AuthFilter (Servlet Filter Chaining)
        scenarios.put("auth-filter", new ServletScenario(
                "auth-filter",
                "AuthenticationFilter (Filter Chaining)",
                "Demonstrates Servlet Filters intercepting requests before reaching servlets, inspecting HTTP headers, and aborting unauthorized requests.",
                """
                @WebFilter(urlPatterns = {"/protected/*"})
                public class AuthenticationFilter implements Filter {
                    @Override
                    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
                            throws IOException, ServletException {
                        HttpServletRequest req = (HttpServletRequest) request;
                        HttpServletResponse resp = (HttpServletResponse) response;

                        String auth = req.getHeader("Authorization");
                        if (auth == null || !auth.startsWith("Bearer valid-token")) {
                            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            resp.getWriter().write("{\\"error\\": \\"Unauthorized access\\"}");
                            return; // Short-circuit, do NOT call chain.doFilter
                        }

                        // Token is valid, proceed along filter chain
                        chain.doFilter(request, response);
                    }
                }
                """.stripIndent(),
                """
                <filter>
                    <filter-name>AuthenticationFilter</filter-name>
                    <filter-class>com.example.AuthenticationFilter</filter-class>
                </filter>
                <filter-mapping>
                    <filter-name>AuthenticationFilter</filter-name>
                    <url-pattern>/protected/*</url-pattern>
                </filter-mapping>
                """.stripIndent(),
                "GET",
                "/protected/data",
                Map.of("Authorization", "Bearer valid-token-12345"),
                Map.of(),
                null
        ));

        // 5. RequestDispatcher Forward vs SendRedirect
        scenarios.put("redirect-forward", new ServletScenario(
                "redirect-forward",
                "RequestDispatcher Forward vs SendRedirect",
                "Contrasts server-side internal forwarding via RequestDispatcher.forward() with client-side redirection via HttpServletResponse.sendRedirect().",
                """
                @WebServlet(name = "DispatcherServlet", urlPatterns = {"/dispatch"})
                public class DispatcherServlet extends HttpServlet {
                    @Override
                    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
                            throws ServletException, IOException {
                        String action = req.getParameter("action");
                        if ("redirect".equalsIgnoreCase(action)) {
                            // Client-side 302 redirect: browser initiates new request
                            resp.sendRedirect("/login.html");
                        } else {
                            // Server-side forward: URL stays same, fast internal dispatch
                            RequestDispatcher dispatcher = req.getRequestDispatcher("/home.jsp");
                            dispatcher.forward(req, resp);
                        }
                    }
                }
                """.stripIndent(),
                """
                <servlet-mapping>
                    <servlet-name>DispatcherServlet</servlet-name>
                    <url-pattern>/dispatch</url-pattern>
                </servlet-mapping>
                """.stripIndent(),
                "GET",
                "/dispatch",
                Map.of(),
                Map.of("action", "forward"),
                null
        ));
    }
}
