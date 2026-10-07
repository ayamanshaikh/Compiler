import {
  ServletScenarioResponse,
  HibernateScenarioResponse,
} from "@/lib/api/enterprise";

export const FALLBACK_SERVLET_SCENARIOS: ServletScenarioResponse[] = [
  {
    id: "hello-get",
    name: "HelloServlet (HTTP GET)",
    description: "Basic HttpServlet handling GET requests, extracting query parameters, setting response content types, and writing HTML to PrintWriter.",
    servletCode: `import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;

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
}`,
    webXmlConfig: `<servlet>
    <servlet-name>HelloServlet</servlet-name>
    <servlet-class>com.example.HelloServlet</servlet-class>
</servlet>
<servlet-mapping>
    <servlet-name>HelloServlet</servlet-name>
    <url-pattern>/hello</url-pattern>
</servlet-mapping>`,
    defaultMethod: "GET",
    defaultPath: "/hello",
    defaultHeaders: { Accept: "text/html" },
    defaultParams: { name: "Alice" },
  },
  {
    id: "user-post",
    name: "UserRegistrationServlet (HTTP POST)",
    description: "Processes mutation payloads via doPost(), validates required fields, returns 201 Created status with Location header, or 400 Bad Request.",
    servletCode: `import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.util.stream.Collectors;

@WebServlet(name = "UserRegistrationServlet", urlPatterns = {"/api/users"})
public class UserRegistrationServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        BufferedReader reader = req.getReader();
        String jsonBody = reader.lines().collect(Collectors.joining());

        if (!jsonBody.contains("username") || !jsonBody.contains("email")) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.setContentType("application/json");
            resp.getWriter().write("{\\"error\\": \\"Missing required fields\\"}");
            return;
        }

        resp.setStatus(HttpServletResponse.SC_CREATED);
        resp.setHeader("Location", "/api/users/101");
        resp.setContentType("application/json");
        resp.getWriter().write("{\\"status\\": \\"success\\", \\"userId\\": 101}");
    }
}`,
    webXmlConfig: `<servlet-mapping>
    <servlet-name>UserRegistrationServlet</servlet-name>
    <url-pattern>/api/users</url-pattern>
</servlet-mapping>`,
    defaultMethod: "POST",
    defaultPath: "/api/users",
    defaultHeaders: { "Content-Type": "application/json" },
    defaultParams: {},
    defaultBody: '{"username": "alice_dev", "email": "alice@codevista.edu"}',
  },
  {
    id: "session-cart",
    name: "SessionCartServlet (HttpSession)",
    description: "Demonstrates stateful HTTP sessions using req.getSession(), reading/writing session attributes across requests, and tracking JSESSIONID cookie.",
    servletCode: `import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

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
}`,
    webXmlConfig: `<session-config>
    <session-timeout>30</session-timeout>
    <cookie-config>
        <http-only>true</http-only>
    </cookie-config>
</session-config>`,
    defaultMethod: "GET",
    defaultPath: "/cart",
    defaultHeaders: {},
    defaultParams: { item: "Java_Concurrency_Book" },
  },
  {
    id: "auth-filter",
    name: "AuthenticationFilter (Filter Chaining)",
    description: "Demonstrates Servlet Filters intercepting requests before reaching servlets, inspecting HTTP headers, and aborting unauthorized requests.",
    servletCode: `import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

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

        chain.doFilter(request, response);
    }
}`,
    webXmlConfig: `<filter>
    <filter-name>AuthenticationFilter</filter-name>
    <filter-class>com.example.AuthenticationFilter</filter-class>
</filter>
<filter-mapping>
    <filter-name>AuthenticationFilter</filter-name>
    <url-pattern>/protected/*</url-pattern>
</filter-mapping>`,
    defaultMethod: "GET",
    defaultPath: "/protected/data",
    defaultHeaders: { Authorization: "Bearer valid-token-12345" },
    defaultParams: {},
  },
  {
    id: "redirect-forward",
    name: "RequestDispatcher Forward vs SendRedirect",
    description: "Contrasts server-side internal forwarding via RequestDispatcher.forward() with client-side redirection via HttpServletResponse.sendRedirect().",
    servletCode: `import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet(name = "DispatcherServlet", urlPatterns = {"/dispatch"})
public class DispatcherServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        String action = req.getParameter("action");
        if ("redirect".equalsIgnoreCase(action)) {
            resp.sendRedirect("/login.html");
        } else {
            RequestDispatcher dispatcher = req.getRequestDispatcher("/home.jsp");
            dispatcher.forward(req, resp);
        }
    }
}`,
    webXmlConfig: `<servlet-mapping>
    <servlet-name>DispatcherServlet</servlet-name>
    <url-pattern>/dispatch</url-pattern>
</servlet-mapping>`,
    defaultMethod: "GET",
    defaultPath: "/dispatch",
    defaultHeaders: {},
    defaultParams: { action: "forward" },
  },
];

export const FALLBACK_HIBERNATE_SCENARIOS: HibernateScenarioResponse[] = [
  {
    id: "entity-lifecycle",
    name: "Entity Lifecycle States (Transient, Persistent, Detached, Removed)",
    description: "Visualizes the 4 states of a Hibernate Entity as it moves through Session operations: persist(), detach(), merge(), and remove().",
    entityJavaCode: `@Entity
@Table(name = "students")
public class Student {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String email;

    public Student(String name, String email) {
        this.name = name;
        this.email = email;
    }
}`,
    operationCode: `// 1. Transient
Student s = new Student("Alex", "alex@codevista.edu");

// 2. Persistent
session.persist(s);

// 3. Detached
session.detach(s);

// 4. Persistent (re-attached)
s = session.merge(s);

// 5. Removed
session.remove(s);`,
  },
  {
    id: "first-level-cache",
    name: "First-Level Cache & Identity Map (Deduplication)",
    description: "Demonstrates how the Hibernate Persistence Context acts as an identity map, avoiding duplicate SQL queries when fetching the same entity multiple times in a session.",
    entityJavaCode: `@Entity
@Table(name = "students")
public class Student {
    @Id private Long id;
    private String name;
    private String email;
}`,
    operationCode: `// First call: Cache miss -> Executes SQL SELECT
Student s1 = session.get(Student.class, 1L);

// Second call: Cache hit -> ZERO SQL queries!
Student s2 = session.get(Student.class, 1L);

assert s1 == s2; // Exact same memory reference`,
  },
  {
    id: "dirty-checking",
    name: "Automatic Dirty Checking & Automatic Flush",
    description: "Shows that modifying properties on a managed persistent entity automatically triggers SQL UPDATE on commit without calling session.update().",
    entityJavaCode: `@Entity
@Table(name = "students")
public class Student {
    @Id private Long id;
    private String name;
    private String email;
    public void setEmail(String email) { this.email = email; }
}`,
    operationCode: `Transaction tx = session.beginTransaction();
Student s = session.get(Student.class, 1L);

// In-memory mutation (no session.update() called)
s.setEmail("alice.updated@codevista.edu");

// Hibernate compares current state against snapshot
tx.commit(); // Automatically fires SQL UPDATE!`,
  },
  {
    id: "n-plus-one-problem",
    name: "The N+1 Query Problem (Lazy Loading Anti-Pattern)",
    description: "Exposes the performance flaw where loading N parent entities causes N individual queries to be fired when accessing lazy relationships.",
    entityJavaCode: `@Entity
public class Student {
    @Id private Long id;
    private String name;

    @OneToMany(mappedBy = "student", fetch = FetchType.LAZY)
    private List<Enrollment> enrollments = new ArrayList<>();
}`,
    operationCode: `// Query 1: Fetches 4 students
List<Student> students = session.createQuery("FROM Student", Student.class).list();

// Queries 2, 3, 4, 5: Fired individually for each student!
for (Student s : students) {
    System.out.println(s.getEnrollments().size());
}
// Total queries = 1 + 4 = 5 (N + 1)!`,
  },
  {
    id: "join-fetch-solution",
    name: "JOIN FETCH Optimization (Solving N+1 Queries)",
    description: "Shows how HQL / JPQL JOIN FETCH collapses N+1 queries into 1 single high-performance SQL query with an outer join.",
    entityJavaCode: `@Entity
public class Student {
    @Id private Long id;
    private String name;

    @OneToMany(mappedBy = "student", fetch = FetchType.LAZY)
    private List<Enrollment> enrollments;
}`,
    operationCode: `// Solves N+1 in a single query!
List<Student> students = session.createQuery(
    "SELECT s FROM Student s JOIN FETCH s.enrollments",
    Student.class
).list();

for (Student s : students) {
    System.out.println(s.getEnrollments().size()); // 0 additional queries!
}`,
  },
];
