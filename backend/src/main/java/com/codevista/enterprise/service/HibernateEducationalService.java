package com.codevista.enterprise.service;

import com.codevista.enterprise.dto.HibernateExecuteRequest;
import com.codevista.enterprise.dto.HibernateExecuteResponse;
import com.codevista.enterprise.dto.HibernateScenarioResponse;
import com.codevista.enterprise.model.EntityLifecycleState;
import com.codevista.enterprise.model.HibernateScenario;
import com.codevista.enterprise.model.HibernateStep;
import com.codevista.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class HibernateEducationalService {

    private final Map<String, HibernateScenario> scenarios = new LinkedHashMap<>();

    public HibernateEducationalService() {
        registerScenarios();
    }

    public List<HibernateScenarioResponse> getAllScenarios() {
        return scenarios.values().stream()
                .map(HibernateScenarioResponse::new)
                .collect(Collectors.toList());
    }

    public HibernateScenarioResponse getScenario(String id) {
        HibernateScenario scenario = scenarios.get(id);
        if (scenario == null) {
            throw new ResourceNotFoundException("Hibernate scenario not found with id: " + id);
        }
        return new HibernateScenarioResponse(scenario);
    }

    public HibernateExecuteResponse execute(HibernateExecuteRequest request) {
        HibernateScenario scenario = scenarios.get(request.getScenarioId());
        if (scenario == null) {
            throw new ResourceNotFoundException("Hibernate scenario not found with id: " + request.getScenarioId());
        }

        switch (scenario.getId()) {
            case "entity-lifecycle":
                return simulateEntityLifecycle(scenario);
            case "first-level-cache":
                return simulateFirstLevelCache(scenario);
            case "dirty-checking":
                return simulateDirtyChecking(scenario);
            case "n-plus-one-problem":
                return simulateNPlusOneProblem(scenario);
            case "join-fetch-solution":
                return simulateJoinFetchSolution(scenario);
            default:
                throw new ResourceNotFoundException("No simulator implemented for scenario: " + scenario.getId());
        }
    }

    private HibernateExecuteResponse simulateEntityLifecycle(HibernateScenario scenario) {
        List<HibernateStep> steps = new ArrayList<>();
        List<String> allSql = new ArrayList<>();
        int stepIdx = 0;

        // Step 1: Instantiation -> Transient
        HibernateStep step1 = new HibernateStep(
                ++stepIdx,
                "1. Entity Instantiation (Transient)",
                "New Student object instantiated via 'new Student(\"Alex\", \"alex@codevista.edu\")'. Entity is not associated with any Session and has no database identity (id is null).",
                "Student",
                EntityLifecycleState.TRANSIENT,
                List.of(),
                Map.of(),
                List.of(
                        Map.of("id", 1, "name", "John Doe", "email", "john@example.com"),
                        Map.of("id", 2, "name", "Jane Smith", "email", "jane@example.com")
                )
        );
        steps.add(step1);

        // Step 2: session.persist() -> Persistent
        String insertSql = "INSERT INTO students (id, name, email) VALUES (101, 'Alex', 'alex@codevista.edu');";
        allSql.add(insertSql);
        HibernateStep step2 = new HibernateStep(
                ++stepIdx,
                "2. session.persist(student) (Persistent / Managed)",
                "Entity transitions to PERSISTENT state. Session generates primary key (id=101) and places student inside Persistence Context (First-Level Cache). SQL INSERT queued or executed.",
                "Student",
                EntityLifecycleState.PERSISTENT,
                List.of(insertSql),
                Map.of("Student#101", Map.of("id", 101, "name", "Alex", "email", "alex@codevista.edu")),
                List.of(
                        Map.of("id", 1, "name", "John Doe", "email", "john@example.com"),
                        Map.of("id", 2, "name", "Jane Smith", "email", "jane@example.com"),
                        Map.of("id", 101, "name", "Alex", "email", "alex@codevista.edu")
                )
        );
        steps.add(step2);

        // Step 3: session.detach() -> Detached
        HibernateStep step3 = new HibernateStep(
                ++stepIdx,
                "3. session.detach(student) (Detached)",
                "Entity transitions to DETACHED state. It still retains its primary key (id=101) and database row, but Hibernate stops tracking its state in the First-Level Cache.",
                "Student",
                EntityLifecycleState.DETACHED,
                List.of(),
                Map.of(), // Evicted from 1st-level cache
                List.of(
                        Map.of("id", 1, "name", "John Doe", "email", "john@example.com"),
                        Map.of("id", 2, "name", "Jane Smith", "email", "jane@example.com"),
                        Map.of("id", 101, "name", "Alex", "email", "alex@codevista.edu")
                )
        );
        steps.add(step3);

        // Step 4: session.merge() -> Persistent
        HibernateStep step4 = new HibernateStep(
                ++stepIdx,
                "4. session.merge(detachedStudent) (Re-attached / Persistent)",
                "Session copies detached state into a new managed entity instance inside the Persistence Context. Changes are tracked again.",
                "Student",
                EntityLifecycleState.PERSISTENT,
                List.of(),
                Map.of("Student#101", Map.of("id", 101, "name", "Alex", "email", "alex@codevista.edu")),
                List.of(
                        Map.of("id", 1, "name", "John Doe", "email", "john@example.com"),
                        Map.of("id", 2, "name", "Jane Smith", "email", "jane@example.com"),
                        Map.of("id", 101, "name", "Alex", "email", "alex@codevista.edu")
                )
        );
        steps.add(step4);

        // Step 5: session.remove() -> Removed
        String deleteSql = "DELETE FROM students WHERE id = 101;";
        allSql.add(deleteSql);
        HibernateStep step5 = new HibernateStep(
                ++stepIdx,
                "5. session.remove(managedStudent) (Removed)",
                "Entity transitions to REMOVED state. Session schedules SQL DELETE statement. On transaction commit/flush, database row is deleted.",
                "Student",
                EntityLifecycleState.REMOVED,
                List.of(deleteSql),
                Map.of(),
                List.of(
                        Map.of("id", 1, "name", "John Doe", "email", "john@example.com"),
                        Map.of("id", 2, "name", "Jane Smith", "email", "jane@example.com")
                )
        );
        steps.add(step5);

        return new HibernateExecuteResponse(
                true,
                scenario.getId(),
                scenario.getName(),
                steps,
                allSql,
                allSql.size(),
                "Visualized all 4 core entity lifecycle states: Transient -> Persistent -> Detached -> Persistent -> Removed."
        );
    }

    private HibernateExecuteResponse simulateFirstLevelCache(HibernateScenario scenario) {
        List<HibernateStep> steps = new ArrayList<>();
        List<String> allSql = new ArrayList<>();
        int stepIdx = 0;

        String selectSql = "SELECT id, name, email FROM students WHERE id = 1;";
        allSql.add(selectSql);

        // Step 1: 1st find() -> Cache Miss
        HibernateStep step1 = new HibernateStep(
                ++stepIdx,
                "1. First call: session.get(Student.class, 1L) [CACHE MISS]",
                "Persistence Context checked: entity not found in First-Level Cache. Hibernate executes SQL SELECT to fetch row from database and caches it.",
                "Student",
                EntityLifecycleState.PERSISTENT,
                List.of(selectSql),
                Map.of("Student#1", Map.of("id", 1, "name", "Alice Martin", "email", "alice@codevista.edu")),
                List.of(Map.of("id", 1, "name", "Alice Martin", "email", "alice@codevista.edu"))
        );
        steps.add(step1);

        // Step 2: 2nd find() -> Cache Hit (0 SQL queries!)
        HibernateStep step2 = new HibernateStep(
                ++stepIdx,
                "2. Second call: session.get(Student.class, 1L) [CACHE HIT - ZERO SQL!]",
                "Persistence Context checked: entity found in First-Level Cache! Hibernate immediately returns the cached instance. EXACTLY 0 SQL QUERIES FIRED. Identity check (s1 == s2) evaluates to true.",
                "Student",
                EntityLifecycleState.PERSISTENT,
                List.of(), // ZERO SQL
                Map.of("Student#1", Map.of("id", 1, "name", "Alice Martin", "email", "alice@codevista.edu")),
                List.of(Map.of("id", 1, "name", "Alice Martin", "email", "alice@codevista.edu"))
        );
        steps.add(step2);

        return new HibernateExecuteResponse(
                true,
                scenario.getId(),
                scenario.getName(),
                steps,
                allSql,
                1,
                "Demonstrated First-Level Cache deduplication: 2 queries in code resulted in only 1 SQL query sent to database."
        );
    }

    private HibernateExecuteResponse simulateDirtyChecking(HibernateScenario scenario) {
        List<HibernateStep> steps = new ArrayList<>();
        List<String> allSql = new ArrayList<>();
        int stepIdx = 0;

        String selectSql = "SELECT id, name, email FROM students WHERE id = 1;";
        allSql.add(selectSql);

        // Step 1: Load entity
        HibernateStep step1 = new HibernateStep(
                ++stepIdx,
                "1. session.get(Student.class, 1L) (Loaded & Snapshot Recorded)",
                "Entity loaded into Persistence Context. Hibernate stores an internal snapshot of the entity's initial column values for later comparison.",
                "Student",
                EntityLifecycleState.PERSISTENT,
                List.of(selectSql),
                Map.of("Student#1", Map.of("id", 1, "name", "Alice Martin", "email", "alice@codevista.edu", "_snapshotEmail", "alice@codevista.edu")),
                List.of(Map.of("id", 1, "name", "Alice Martin", "email", "alice@codevista.edu"))
        );
        steps.add(step1);

        // Step 2: Modify in memory
        HibernateStep step2 = new HibernateStep(
                ++stepIdx,
                "2. student.setEmail(\"alice.updated@codevista.edu\") (In-Memory Mutation)",
                "Field mutated in Java memory. Notice that session.update() was NEVER called. Entity remains PERSISTENT.",
                "Student",
                EntityLifecycleState.PERSISTENT,
                List.of(),
                Map.of("Student#1", Map.of("id", 1, "name", "Alice Martin", "email", "alice.updated@codevista.edu", "_snapshotEmail", "alice@codevista.edu")),
                List.of(Map.of("id", 1, "name", "Alice Martin", "email", "alice@codevista.edu")) // DB not yet updated
        );
        steps.add(step2);

        // Step 3: Automatic Dirty Check & Flush
        String updateSql = "UPDATE students SET email = 'alice.updated@codevista.edu' WHERE id = 1;";
        allSql.add(updateSql);
        HibernateStep step3 = new HibernateStep(
                ++stepIdx,
                "3. tx.commit() / session.flush() (Automatic Dirty Checking)",
                "During flush, Hibernate compares the entity's current state with the initial snapshot. Detecting that 'email' changed, it automatically generates and executes an SQL UPDATE without manual intervention.",
                "Student",
                EntityLifecycleState.PERSISTENT,
                List.of(updateSql),
                Map.of("Student#1", Map.of("id", 1, "name", "Alice Martin", "email", "alice.updated@codevista.edu")),
                List.of(Map.of("id", 1, "name", "Alice Martin", "email", "alice.updated@codevista.edu"))
        );
        steps.add(step3);

        return new HibernateExecuteResponse(
                true,
                scenario.getId(),
                scenario.getName(),
                steps,
                allSql,
                2,
                "Demonstrated Hibernate automatic dirty checking: changes made to managed entities automatically flush SQL UPDATEs upon transaction commit."
        );
    }

    private HibernateExecuteResponse simulateNPlusOneProblem(HibernateScenario scenario) {
        List<HibernateStep> steps = new ArrayList<>();
        List<String> allSql = new ArrayList<>();
        int stepIdx = 0;

        // Query 1: Initial load
        String q1 = "SELECT id, name, email FROM students;";
        allSql.add(q1);

        HibernateStep step1 = new HibernateStep(
                ++stepIdx,
                "1. Initial Query: SELECT * FROM students (Fetches 4 Students)",
                "Query executed to fetch student entities. Enrollments collection is configured as FetchType.LAZY and initialized as empty proxies.",
                "Student",
                EntityLifecycleState.PERSISTENT,
                List.of(q1),
                Map.of("StudentsCount", 4),
                List.of(
                        Map.of("id", 1, "name", "Alice", "enrollments", "Proxy(Uninitialized)"),
                        Map.of("id", 2, "name", "Bob", "enrollments", "Proxy(Uninitialized)"),
                        Map.of("id", 3, "name", "Charlie", "enrollments", "Proxy(Uninitialized)"),
                        Map.of("id", 4, "name", "Diana", "enrollments", "Proxy(Uninitialized)")
                )
        );
        steps.add(step1);

        // Queries 2, 3, 4, 5: N queries triggered when accessing lazy collection
        for (int i = 1; i <= 4; i++) {
            String qN = "SELECT id, course_id, grade FROM enrollments WHERE student_id = " + i + ";";
            allSql.add(qN);

            HibernateStep stepN = new HibernateStep(
                    ++stepIdx,
                    (i + 1) + ". student[" + i + "].getEnrollments().size() [N+" + i + " QUERY TRIGGERED]",
                    "Accessing the uninitialized lazy collection forced Hibernate to fire an individual query for student ID " + i + "!",
                    "Enrollment",
                    EntityLifecycleState.PERSISTENT,
                    List.of(qN),
                    Map.of("LoadedStudentId", i),
                    List.of(Map.of("studentId", i, "enrollmentStatus", "Initialized via secondary query"))
            );
            steps.add(stepN);
        }

        return new HibernateExecuteResponse(
                true,
                scenario.getId(),
                scenario.getName(),
                steps,
                allSql,
                allSql.size(), // 1 + 4 = 5 queries
                "Demonstrated the N+1 Query Problem: 1 initial query + 4 individual child queries = 5 total queries for only 4 records!"
        );
    }

    private HibernateExecuteResponse simulateJoinFetchSolution(HibernateScenario scenario) {
        List<HibernateStep> steps = new ArrayList<>();
        List<String> allSql = new ArrayList<>();
        int stepIdx = 0;

        String joinFetchSql = """
                SELECT s.id, s.name, s.email, e.id AS enroll_id, e.course_id, e.grade
                FROM students s
                LEFT OUTER JOIN enrollments e ON s.id = e.student_id;
                """.stripIndent().trim();
        allSql.add(joinFetchSql);

        HibernateStep step1 = new HibernateStep(
                ++stepIdx,
                "1. Single Query with JOIN FETCH: SELECT s FROM Student s JOIN FETCH s.enrollments",
                "HQL JOIN FETCH instructs Hibernate to execute a single SQL SELECT with an OUTER JOIN, populating students and their enrollments simultaneously.",
                "Student + Enrollment",
                EntityLifecycleState.PERSISTENT,
                List.of(joinFetchSql),
                Map.of("StudentsCount", 4, "TotalQueries", 1),
                List.of(
                        Map.of("id", 1, "name", "Alice", "courses", List.of("CS101", "MATH201")),
                        Map.of("id", 2, "name", "Bob", "courses", List.of("CS101")),
                        Map.of("id", 3, "name", "Charlie", "courses", List.of("ENG102", "CS101")),
                        Map.of("id", 4, "name", "Diana", "courses", List.of("PHYS301"))
                )
        );
        steps.add(step1);

        HibernateStep step2 = new HibernateStep(
                ++stepIdx,
                "2. Accessing student.getEnrollments() (ZERO ADDITIONAL QUERIES!)",
                "Because enrollments were eagerly initialized in the single initial query, accessing them incurs ZERO database roundtrips. Latency reduced from O(N) to O(1).",
                "Student + Enrollment",
                EntityLifecycleState.PERSISTENT,
                List.of(),
                Map.of("AdditionalQueries", 0),
                List.of(Map.of("performance", "Optimal (Single query resolution)"))
        );
        steps.add(step2);

        return new HibernateExecuteResponse(
                true,
                scenario.getId(),
                scenario.getName(),
                steps,
                allSql,
                1,
                "Optimized with JOIN FETCH: Replaced 5 queries from the N+1 problem with EXACTLY 1 single high-performance SQL query!"
        );
    }

    private void registerScenarios() {
        // 1. Entity Lifecycle
        scenarios.put("entity-lifecycle", new HibernateScenario(
                "entity-lifecycle",
                "Entity Lifecycle States (Transient, Persistent, Detached, Removed)",
                "Visualizes the 4 states of a Hibernate Entity as it moves through Session operations: persist(), detach(), merge(), and remove().",
                """
                @Entity
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
                }
                """.stripIndent(),
                """
                // 1. Transient
                Student s = new Student("Alex", "alex@codevista.edu");

                // 2. Persistent
                session.persist(s);

                // 3. Detached
                session.detach(s);

                // 4. Persistent (re-attached)
                s = session.merge(s);

                // 5. Removed
                session.remove(s);
                """.stripIndent()
        ));

        // 2. First-Level Cache
        scenarios.put("first-level-cache", new HibernateScenario(
                "first-level-cache",
                "First-Level Cache & Identity Map (Deduplication)",
                "Demonstrates how the Hibernate Persistence Context acts as an identity map, avoiding duplicate SQL queries when fetching the same entity multiple times in a session.",
                """
                @Entity
                @Table(name = "students")
                public class Student {
                    @Id private Long id;
                    private String name;
                    private String email;
                }
                """.stripIndent(),
                """
                // First call: Cache miss -> Executes SQL SELECT
                Student s1 = session.get(Student.class, 1L);

                // Second call: Cache hit -> ZERO SQL queries!
                Student s2 = session.get(Student.class, 1L);

                assert s1 == s2; // Exact same memory reference
                """.stripIndent()
        ));

        // 3. Dirty Checking
        scenarios.put("dirty-checking", new HibernateScenario(
                "dirty-checking",
                "Automatic Dirty Checking & Automatic Flush",
                "Shows that modifying properties on a managed persistent entity automatically triggers SQL UPDATE on commit without calling session.update().",
                """
                @Entity
                @Table(name = "students")
                public class Student {
                    @Id private Long id;
                    private String name;
                    private String email;
                    public void setEmail(String email) { this.email = email; }
                }
                """.stripIndent(),
                """
                Transaction tx = session.beginTransaction();
                Student s = session.get(Student.class, 1L);

                // In-memory mutation (no session.update() called)
                s.setEmail("alice.updated@codevista.edu");

                // Hibernate compares current state against snapshot
                tx.commit(); // Automatically fires SQL UPDATE!
                """.stripIndent()
        ));

        // 4. N+1 Query Problem
        scenarios.put("n-plus-one-problem", new HibernateScenario(
                "n-plus-one-problem",
                "The N+1 Query Problem (Lazy Loading Anti-Pattern)",
                "Exposes the performance flaw where loading N parent entities causes N individual queries to be fired when accessing lazy relationships.",
                """
                @Entity
                public class Student {
                    @Id private Long id;
                    private String name;

                    @OneToMany(mappedBy = "student", fetch = FetchType.LAZY)
                    private List<Enrollment> enrollments = new ArrayList<>();
                }
                """.stripIndent(),
                """
                // Query 1: Fetches 4 students
                List<Student> students = session.createQuery("FROM Student", Student.class).list();

                // Queries 2, 3, 4, 5: Fired individually for each student!
                for (Student s : students) {
                    System.out.println(s.getEnrollments().size());
                }
                // Total queries = 1 + 4 = 5 (N + 1)!
                """.stripIndent()
        ));

        // 5. JOIN FETCH Solution
        scenarios.put("join-fetch-solution", new HibernateScenario(
                "join-fetch-solution",
                "JOIN FETCH Optimization (Solving N+1 Queries)",
                "Shows how HQL / JPQL JOIN FETCH collapses N+1 queries into 1 single high-performance SQL query with an outer join.",
                """
                @Entity
                public class Student {
                    @Id private Long id;
                    private String name;

                    @OneToMany(mappedBy = "student", fetch = FetchType.LAZY)
                    private List<Enrollment> enrollments;
                }
                """.stripIndent(),
                """
                // Solves N+1 in a single query!
                List<Student> students = session.createQuery(
                    "SELECT s FROM Student s JOIN FETCH s.enrollments",
                    Student.class
                ).list();

                for (Student s : students) {
                    System.out.println(s.getEnrollments().size()); // 0 additional queries!
                }
                """.stripIndent()
        ));
    }
}
