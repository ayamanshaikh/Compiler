package com.codevista.service;

import com.codevista.entity.CodeExample;
import com.codevista.entity.Difficulty;
import com.codevista.entity.Topic;
import com.codevista.repository.TopicRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Component
public class TopicSeedDataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(TopicSeedDataInitializer.class);

    private final TopicRepository topicRepository;

    public TopicSeedDataInitializer(TopicRepository topicRepository) {
        this.topicRepository = topicRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<Topic> syllabusTopics = buildSyllabusTopics();
        if (topicRepository.count() == 0) {
            log.info("Initializing CodeVista syllabus topics seed data...");
            topicRepository.saveAll(syllabusTopics);
            log.info("Successfully seeded {} Java curriculum topics.", syllabusTopics.size());
        } else {
            log.info("Checking and synchronizing existing topics with Phase 9 curriculum enrichments...");
            for (Topic seeded : syllabusTopics) {
                topicRepository.findBySlug(seeded.getSlug()).ifPresent(existing -> {
                    if (existing.getWhyItMatters() == null || existing.getWhyItMatters().isBlank()) {
                        existing.setWhyItMatters(seeded.getWhyItMatters());
                        existing.setExplanation(seeded.getExplanation());
                        existing.setSyntax(seeded.getSyntax());
                        existing.setKeyPoints(seeded.getKeyPoints());
                        existing.setCommonMistakes(seeded.getCommonMistakes());
                        existing.setRelatedTopicSlugs(seeded.getRelatedTopicSlugs());
                        if (existing.getCodeExamples() == null || existing.getCodeExamples().isEmpty()) {
                            existing.setCodeExamples(seeded.getCodeExamples());
                        }
                        topicRepository.save(existing);
                    }
                });
            }
            log.info("Topic synchronization complete.");
        }
    }

    private static Topic topic(
            String title, String slug, String desc, Difficulty diff, String unit, int order,
            String whyItMatters, String explanation, String syntax,
            List<String> keyPoints, List<String> commonMistakes, List<String> relatedSlugs,
            List<CodeExample> examples
    ) {
        Topic t = new Topic(title, slug, desc, diff, unit, order);
        t.setWhyItMatters(whyItMatters);
        t.setExplanation(explanation);
        t.setSyntax(syntax);
        t.setKeyPoints(keyPoints);
        t.setCommonMistakes(commonMistakes);
        t.setRelatedTopicSlugs(relatedSlugs);
        t.setCodeExamples(examples);
        return t;
    }

    public static List<Topic> buildSyllabusTopics() {
        List<Topic> list = new ArrayList<>();
        int order = 1;

        // ========================================================
        // Unit 1: Java Basics & OOP Concepts (order 1..19)
        // ========================================================
        String u1 = "Unit 1: Java Basics & OOP Concepts";

        list.add(topic(
                "History of Java", "history-of-java",
                "Origins of Java at Sun Microsystems, James Gosling, Oak, and Write Once Run Anywhere (WORA).",
                Difficulty.BEGINNER, u1, order++,
                "Understanding Java's history explains its architectural design: bytecode, the JVM abstraction, platform independence, and automated memory management that superseded C/C++ memory vulnerabilities.",
                "Java was conceived in 1991 by James Gosling, Mike Sheridan, and Patrick Naughton at Sun Microsystems as part of the 'Green Project'. Initially named 'Oak' after an oak tree outside Gosling's office, it was created for consumer electronic devices. Recognizing the explosion of the World Wide Web, Sun re-targeted Oak for distributed internet computing and renamed it 'Java' in 1995. With its breakthrough Write Once, Run Anywhere (WORA) philosophy, Java bytecode allowed a single compiled binary (.class) to run without recompilation across Windows, Linux, macOS, and enterprise servers.",
                "// Historical timeline milestones of Java\n1991: Green Project initiates Oak\n1995: Java 1.0 released (WORA slogan)\n1998: Java 2 (J2SE 1.2) - Collections Framework\n2004: Java 5 - Generics, Enums, Annotations\n2014: Java 8 - Lambdas, Streams, Functional APIs\n2021: Java 17 LTS - Sealed Classes, Records, Pattern Matching\nPresent: 6-month release cadence with modern LTS editions",
                Arrays.asList(
                        "1991: Project Oak started at Sun Microsystems led by James Gosling",
                        "1995: Java 1.0 officially announced with Write Once, Run Anywhere (WORA)",
                        "1998: Java 2 Platform introduces Swing and Collections Framework",
                        "2004: Java 5 introduces Generics, Enums, and Enhanced For-Loops",
                        "2014: Java 8 revolutionizes Java with Lambdas and Stream API",
                        "2021: Java 17 LTS establishes modern cloud-ready language features"
                ),
                Arrays.asList(
                        "Confusing Java with JavaScript (they are completely unrelated languages with different runtimes)",
                        "Assuming Java is purely interpreted (Java bytecode is compiled by HotSpot JIT into native assembly code)",
                        "Thinking WORA eliminates the need for understanding operating system I/O or memory limits"
                ),
                Arrays.asList("comments", "data-types", "variables", "class"),
                Collections.singletonList(new CodeExample(
                        "Canonical First Java Program",
                        "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, Java Platform!\");\n        System.out.println(\"Write Once, Run Anywhere\");\n    }\n}",
                        "The standard entry point structure for every standalone Java program: a class declaration with public static void main(String[] args)."
                ))
        ));

        list.add(topic(
                "Comments", "comments",
                "Single-line, multi-line, and Javadoc comments for documenting Java code.",
                Difficulty.BEGINNER, u1, order++,
                "Comments maintain codebase clarity for engineering teams and enable automated HTML documentation generation via Javadoc.",
                "Java provides three commenting mechanisms: single-line comments using double slashes (//), multi-line block comments (/* ... */), and Javadoc documentation comments (/** ... */) designed for public API documentation tools.",
                "// Single line comment\n\n/*\n * Multi-line block comment\n */\n\n/**\n * Javadoc comment with @param and @return tags\n */",
                Arrays.asList(
                        "Single-line comments start with // and terminate at the end of the line",
                        "Multi-line comments start with /* and end with */ and cannot be nested",
                        "Javadoc comments start with /** and allow @param, @return, and @throws tags"
                ),
                Arrays.asList(
                        "Nesting multi-line comments inside another multi-line comment causes a syntax error",
                        "Writing redundant comments that restate what the code clearly does rather than why it does it"
                ),
                Arrays.asList("variables", "methods", "data-types"),
                Collections.singletonList(new CodeExample(
                        "Documenting Code with Comments",
                        "public class Main {\n    /**\n     * Entry point of the application.\n     * @param args Command line arguments\n     */\n    public static void main(String[] args) {\n        // Calculate circular radius\n        int radius = 5; /* meters */\n        double area = Math.PI * radius * radius;\n        System.out.println(\"Area: \" + area);\n    }\n}",
                        "Demonstrates single-line, inline multi-line, and Javadoc commenting in a clean Java application."
                ))
        ));

        list.add(topic(
                "Data Types", "data-types",
                "Primitive data types (byte, short, int, long, float, double, char, boolean) and reference types.",
                Difficulty.BEGINNER, u1, order++,
                "Data types govern memory allocation, numeric range, precision, and type-safety throughout the JVM.",
                "Java is a strongly typed language with two categories of data types: Primitive types (byte, short, int, long, float, double, char, boolean) stored directly on the call stack, and Reference types (Classes, Interfaces, Arrays) whose object payloads reside in the heap.",
                "byte b = 127;          // 8-bit signed (-128 to 127)\nshort s = 32000;       // 16-bit signed\nint i = 2147483647;    // 32-bit signed (default integer)\nlong l = 10000000000L; // 64-bit signed (requires L suffix)\nfloat f = 3.14f;       // 32-bit IEEE 754 (requires f suffix)\ndouble d = 3.14159;    // 64-bit IEEE 754 (default float)\nchar c = 'A';          // 16-bit Unicode character\nboolean flag = true;   // true or false",
                Arrays.asList(
                        "Java has exactly 8 primitive types: byte, short, int, long, float, double, char, boolean",
                        "Primitive values are stored directly in memory (stack), unlike references pointing to heap objects",
                        "Default integer literal is int; long literals require an 'L' suffix",
                        "Default floating-point literal is double; float literals require an 'f' suffix"
                ),
                Arrays.asList(
                        "Forgetting the 'L' suffix on large numbers causing integer overflow compiler errors",
                        "Using float or double for currency calculations instead of BigDecimal due to floating-point rounding errors",
                        "Confusing char ('A' single quotes) with String (\"A\" double quotes)"
                ),
                Arrays.asList("variables", "constants", "type-conversion", "type-casting"),
                Collections.singletonList(new CodeExample(
                        "Primitive Types Demonstration",
                        "public class Main {\n    public static void main(String[] args) {\n        int count = 42;\n        double price = 19.99;\n        boolean available = true;\n        char grade = 'A';\n        System.out.println(\"Item Count: \" + count);\n        System.out.println(\"Price: $\" + price);\n        System.out.println(\"Available: \" + available);\n        System.out.println(\"Grade: \" + grade);\n    }\n}",
                        "Declares and prints the most common Java primitive types."
                ))
        ));

        list.add(topic(
                "Variables", "variables",
                "Named memory locations used to store program data in Java.",
                Difficulty.BEGINNER, u1, order++,
                "Variables form the state foundation of all computing, binding symbolic identifiers to memory addresses.",
                "In Java, every variable must be declared with a explicit type before use. Variables are classified as local variables (declared inside methods), instance variables (declared inside classes, unique per object instance), and static variables (shared across all instances of a class).",
                "dataType variableName = initialValue;\nint score = 100;\nString studentName = \"Ada Lovelace\";",
                Arrays.asList(
                        "Java variables must be declared with a data type before assignment",
                        "Local variables inside methods must be initialized before they are read",
                        "Variable names follow camelCase naming conventions and cannot be Java keywords"
                ),
                Arrays.asList(
                        "Attempting to read an uninitialized local variable causing 'variable might not have been initialized'",
                        "Shadowing an instance variable in a method without realizing this.var is needed"
                ),
                Arrays.asList("data-types", "constants", "scope-and-lifetime-of-variables"),
                Collections.singletonList(new CodeExample(
                        "Variable Declaration and Mutation",
                        "public class Main {\n    public static void main(String[] args) {\n        int counter = 0;\n        System.out.println(\"Initial counter: \" + counter);\n        counter += 10;\n        System.out.println(\"Updated counter: \" + counter);\n    }\n}",
                        "Declaring, initializing, and updating a local variable."
                ))
        ));

        list.add(topic(
                "Constants", "constants",
                "Immutable values defined in Java using the final keyword.",
                Difficulty.BEGINNER, u1, order++,
                "Constants ensure immutability, prevent unintentional bugs, and allow compiler optimizations like constant folding.",
                "Constants in Java are variables declared with the 'final' keyword. Once assigned, a final variable cannot be reassigned. Class-level constants are typically declared 'public static final' with UPPER_SNAKE_CASE identifiers.",
                "final int MAX_LIMIT = 100;\npublic static final double PI = 3.141592653589793;",
                Arrays.asList(
                        "The final keyword marks a variable as unmodifiable once assigned",
                        "Compile-time constants are inlined by the Java compiler during optimization",
                        "Constants convention uses uppercase snake_case: e.g., MAX_CAPACITY"
                ),
                Arrays.asList(
                        "Trying to reassign a final variable causes a compiler error: 'cannot assign a value to final variable'",
                        "Confusing a final object reference (reference cannot change) with object immutability (fields may still change)"
                ),
                Arrays.asList("variables", "final-classes", "final-methods"),
                Collections.singletonList(new CodeExample(
                        "Using Constants with Final",
                        "public class Main {\n    public static final int MAX_USERS = 50;\n    public static void main(String[] args) {\n        final double TAX_RATE = 0.08;\n        double subtotal = 150.0;\n        double total = subtotal + (subtotal * TAX_RATE);\n        System.out.println(\"Max Users: \" + MAX_USERS);\n        System.out.println(\"Total with Tax: $\" + total);\n    }\n}",
                        "Demonstrates class-level and method-level final constant usage."
                ))
        ));

        list.add(topic(
                "Scope and Lifetime of Variables", "scope-and-lifetime-of-variables",
                "Local, instance, and static variable visibility, block boundaries, and memory lifecycle.",
                Difficulty.BEGINNER, u1, order++,
                "Understanding variable scope prevents memory leaks, variable collisions, and unintended state mutations.",
                "Variable scope defines the region of code where a variable can be accessed. A local variable lives on the call stack and ceases to exist when its enclosing block {} exits. Instance variables live in heap memory as long as their enclosing object is referenced. Static variables live in the JVM Metaspace for the lifetime of the loaded class.",
                "{\n    int blockScoped = 10;\n    // blockScoped is valid here\n}\n// blockScoped is out of scope here",
                Arrays.asList(
                        "Block scope: Variables declared inside {} are only accessible within those braces",
                        "Method scope: Method parameters and local variables expire when the method returns",
                        "Instance scope: Variables exist in heap memory with the object instance",
                        "Class scope: Static variables exist for the entire application duration"
                ),
                Arrays.asList(
                        "Accessing a loop counter variable outside the for-loop header",
                        "Expecting static variables to be reset per object instance"
                ),
                Arrays.asList("variables", "class", "object"),
                Collections.singletonList(new CodeExample(
                        "Variable Scope Demonstration",
                        "public class Main {\n    static int globalCount = 0;\n    public static void main(String[] args) {\n        int outerVar = 10;\n        {\n            int innerVar = 20;\n            System.out.println(\"Sum inside block: \" + (outerVar + innerVar));\n        }\n        // innerVar is inaccessible here\n        System.out.println(\"Outer var: \" + outerVar);\n    }\n}",
                        "Illustrates block scoping and variable boundaries."
                ))
        ));

        list.add(topic(
                "Operators", "operators",
                "Arithmetic, relational, logical, bitwise, assignment, and ternary operators in Java.",
                Difficulty.BEGINNER, u1, order++,
                "Operators are the fundamental building blocks of mathematical computation and logical branching in programs.",
                "Java includes arithmetic (+, -, *, /, %), relational (==, !=, <, >, <=, >=), logical (&&, ||, !), bitwise (&, |, ^, ~, <<, >>), assignment (=, +=, -=), and the conditional ternary operator (?:). Logical && and || utilize short-circuit evaluation.",
                "int sum = a + b;\nboolean match = (x == y);\nboolean condition = (a > 0 && b < 10);\nint max = (a > b) ? a : b;",
                Arrays.asList(
                        "Arithmetic operators perform standard math; % returns the remainder",
                        "Logical && and || perform short-circuit evaluation (skipping right-hand side if left determines result)",
                        "== compares primitive values, but compares reference addresses for objects (use .equals() for objects)"
                ),
                Arrays.asList(
                        "Using == instead of .equals() for String comparison",
                        "Integer division truncation: 5 / 2 evaluates to 2, not 2.5",
                        "Operator precedence confusion: assuming + evaluates before *"
                ),
                Arrays.asList("data-types", "conditional-statements", "variables"),
                Collections.singletonList(new CodeExample(
                        "Java Operators in Action",
                        "public class Main {\n    public static void main(String[] args) {\n        int a = 15, b = 4;\n        System.out.println(\"Quotient: \" + (a / b));\n        System.out.println(\"Remainder: \" + (a % b));\n        boolean isEven = (a % 2 == 0);\n        System.out.println(\"Is a even? \" + isEven);\n        int larger = (a > b) ? a : b;\n        System.out.println(\"Larger value: \" + larger);\n    }\n}",
                        "Demonstrates arithmetic division, modulus, relational comparison, and the ternary operator."
                ))
        ));

        list.add(topic(
                "Type Conversion", "type-conversion",
                "Widening and automatic type conversion between compatible numeric types.",
                Difficulty.BEGINNER, u1, order++,
                "Widening type conversion allows safe, lossless value assignment across expanding numeric ranges.",
                "Type conversion (widening conversion) occurs automatically when assigning a value of a smaller primitive type to a larger compatible primitive type (e.g., int to long, float to double). Because the target type has a larger memory footprint and range, no precision or magnitude is lost.",
                "int num = 100;\nlong largeNum = num; // Automatic widening (int -> long)\ndouble d = largeNum; // Automatic widening (long -> double)",
                Arrays.asList(
                        "Widening conversion is performed automatically by the Java compiler without an explicit cast",
                        "Order of widening: byte -> short -> int -> long -> float -> double",
                        "char can widen to int, long, float, or double"
                ),
                Arrays.asList(
                        "Assuming boolean can be converted to or from numbers (Java booleans are strictly incompatible with numbers)",
                        "Expecting conversion from double to int to happen automatically (requires explicit type casting)"
                ),
                Arrays.asList("type-casting", "data-types", "operators"),
                Collections.singletonList(new CodeExample(
                        "Automatic Widening Type Conversion",
                        "public class Main {\n    public static void main(String[] args) {\n        int intVal = 42;\n        double doubleVal = intVal; // Automatic widening\n        System.out.println(\"Integer value: \" + intVal);\n        System.out.println(\"Widened double value: \" + doubleVal);\n    }\n}",
                        "Shows automatic lossless conversion from integer to double."
                ))
        ));

        list.add(topic(
                "Type Casting", "type-casting",
                "Explicit narrowing type conversion and potential precision loss in Java.",
                Difficulty.BEGINNER, u1, order++,
                "Explicit type casting gives developers precise control when converting between numeric representations or polymorphic object references.",
                "Type casting (narrowing conversion) requires an explicit prefix cast syntax (targetType) when converting a larger type to a smaller type (e.g., double to int). Because the target type has fewer bits, fractional values are truncated and numeric overflow may occur.",
                "double pi = 3.14159;\nint truncated = (int) pi; // explicit cast, results in 3\nObject obj = \"Hello\";\nString str = (String) obj; // reference downcasting",
                Arrays.asList(
                        "Narrowing conversion requires an explicit cast operator: (type) value",
                        "Floating point to integer casts truncate the fractional part rather than rounding",
                        "Object reference casting requires an instanceof check to prevent ClassCastException"
                ),
                Arrays.asList(
                        "Expecting (int) 3.99 to round to 4 (it truncates to 3)",
                        "Casting an integer larger than 127 to a byte causing silent two's-complement overflow"
                ),
                Arrays.asList("type-conversion", "data-types", "polymorphism"),
                Collections.singletonList(new CodeExample(
                        "Narrowing Type Casts",
                        "public class Main {\n    public static void main(String[] args) {\n        double price = 99.95;\n        int wholeDollars = (int) price;\n        System.out.println(\"Original price: \" + price);\n        System.out.println(\"Truncated integer: \" + wholeDollars);\n    }\n}",
                        "Demonstrates explicit narrowing conversion from double to int."
                ))
        ));

        list.add(topic(
                "Conditional Statements", "conditional-statements",
                "Decision making in Java using if, if-else, else-if ladders, and switch statements.",
                Difficulty.BEGINNER, u1, order++,
                "Conditionals allow programs to execute alternative logical pathways based on dynamic runtime data.",
                "Java provides if, if-else, else-if ladders, and switch statements to control branching execution. Modern Java also supports switch expressions returning values with yield and pattern matching.",
                "if (score >= 90) {\n    grade = 'A';\n} else if (score >= 80) {\n    grade = 'B';\n} else {\n    grade = 'C';\n}",
                Arrays.asList(
                        "if conditions must evaluate to a strictly boolean expression",
                        "else blocks execute only when all preceding if and else-if conditions evaluate to false",
                        "switch evaluates byte, short, char, int, String, and enum values"
                ),
                Arrays.asList(
                        "Using single = (assignment) instead of == (comparison) in conditions",
                        "Forgetting break statements in traditional switch blocks causing accidental fall-through"
                ),
                Arrays.asList("operators", "loops", "break"),
                Collections.singletonList(new CodeExample(
                        "Branching Decision Logic",
                        "public class Main {\n    public static void main(String[] args) {\n        int temperature = 24;\n        if (temperature > 30) {\n            System.out.println(\"Hot day\");\n        } else if (temperature >= 20) {\n            System.out.println(\"Pleasant weather\");\n        } else {\n            System.out.println(\"Cold day\");\n        }\n    }\n}",
                        "Executes conditional branch evaluation based on numeric threshold."
                ))
        ));

        list.add(topic(
                "Loops", "loops",
                "Iterative execution using for, while, do-while, and enhanced for-each loops.",
                Difficulty.BEGINNER, u1, order++,
                "Loops provide the foundation for algorithmic iteration, collection processing, and repeated task automation.",
                "Java provides four primary loop constructs: standard for loop (counter-controlled iteration), enhanced for-each loop (element traversal over arrays and Collections), while loop (pre-tested loop), and do-while loop (post-tested loop guaranteeing at least one execution).",
                "for (int i = 0; i < n; i++) { ... }\nfor (String item : items) { ... }\nwhile (condition) { ... }\ndo { ... } while (condition);",
                Arrays.asList(
                        "for loop is ideal when the iteration count is known in advance",
                        "enhanced for-each loop provides clean syntax for traversing arrays and Iterable collections",
                        "while loop repeats as long as the condition evaluates to true",
                        "do-while loop always executes its body at least once before checking the termination condition"
                ),
                Arrays.asList(
                        "Off-by-one errors (using <= length instead of < length when indexing arrays)",
                        "Creating infinite loops by forgetting to update the loop control variable",
                        "Modifying a collection during an enhanced for-each loop causing ConcurrentModificationException"
                ),
                Arrays.asList("break", "continue", "arrays", "conditional-statements"),
                Collections.singletonList(new CodeExample(
                        "Comparing Java Loop Constructs",
                        "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Standard for loop:\");\n        for (int i = 1; i <= 3; i++) {\n            System.out.println(\"Step \" + i);\n        }\n        \n        System.out.println(\"While loop countdown:\");\n        int count = 3;\n        while (count > 0) {\n            System.out.println(\"T-minus \" + count);\n            count--;\n        }\n    }\n}",
                        "Demonstrates standard for loop iteration and while loop condition testing."
                ))
        ));

        list.add(topic(
                "Break", "break",
                "Terminating loop iterations or exiting switch statements prematurely in Java.",
                Difficulty.BEGINNER, u1, order++,
                "Break allows immediate exit from a loop when a search target is located or an exit condition is reached.",
                "The break statement immediately terminates the innermost enclosing loop or switch statement, transferring execution to the statement immediately following the terminated block. Labeled breaks allow escaping nested outer loops.",
                "for (int i = 0; i < 10; i++) {\n    if (i == 5) break; // Exits loop when i reaches 5\n}",
                Arrays.asList(
                        "break halts loop execution immediately and bypasses any remaining iterations",
                        "Commonly used to terminate search loops once a target element is found",
                        "Labeled break: break labelName; can terminate multiple nested loop levels"
                ),
                Arrays.asList(
                        "Using break outside of a loop or switch causing a compiler error",
                        "Confusing break (exits entire loop) with continue (skips to next iteration)"
                ),
                Arrays.asList("continue", "loops", "conditional-statements"),
                Collections.singletonList(new CodeExample(
                        "Early Loop Exit with Break",
                        "public class Main {\n    public static void main(String[] args) {\n        int target = 7;\n        for (int i = 1; i <= 10; i++) {\n            if (i == target) {\n                System.out.println(\"Found target \" + target + \"! Stopping search.\");\n                break;\n            }\n            System.out.println(\"Checked: \" + i);\n        }\n    }\n}",
                        "Exits the loop immediately once target 7 is reached."
                ))
        ));

        list.add(topic(
                "Continue", "continue",
                "Skipping the current loop iteration and proceeding to the next cycle.",
                Difficulty.BEGINNER, u1, order++,
                "Continue streamlines loop bodies by filtering out unwanted items or edge cases without deep nesting.",
                "The continue statement skips the remainder of the current loop iteration and immediately evaluates the loop condition (or increment step in a for loop) for the next cycle.",
                "for (int i = 0; i < 10; i++) {\n    if (i % 2 == 0) continue; // Skip even numbers\n    System.out.println(i);    // Prints only odd numbers\n}",
                Arrays.asList(
                        "continue skips only the current iteration, continuing with subsequent cycles",
                        "In a for loop, continue transfers control to the increment/update statement",
                        "In a while/do-while loop, continue transfers control directly to the boolean condition"
                ),
                Arrays.asList(
                        "Forgetting to update iteration variables before continue in a while loop, leading to infinite loops",
                        "Using continue outside a loop block"
                ),
                Arrays.asList("break", "loops", "conditional-statements"),
                Collections.singletonList(new CodeExample(
                        "Filtering with Continue",
                        "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Printing odd numbers 1 through 9:\");\n        for (int i = 1; i <= 9; i++) {\n            if (i % 2 == 0) {\n                continue; // Skip even numbers\n            }\n            System.out.println(\"Odd: \" + i);\n        }\n    }\n}",
                        "Skips even numbers using the continue statement."
                ))
        ));

        list.add(topic(
                "Arrays", "arrays",
                "Fixed-size homogeneous data collections in contiguous memory locations.",
                Difficulty.BEGINNER, u1, order++,
                "Arrays offer O(1) indexed lookups and optimal CPU cache locality, serving as the foundational backing store for high-performance collections.",
                "An array in Java is a dynamically created object that stores a fixed number of values of a single type in contiguous memory. Array indices are zero-based from 0 to length - 1. Arrays in Java have an immutable length field (arr.length) and enforce strict bounds checking at runtime.",
                "int[] numbers = new int[5];\nint[] primed = {2, 3, 5, 7, 11};\nint first = numbers[0];\nint count = numbers.length;",
                Arrays.asList(
                        "Arrays have fixed capacity determined at instantiation that cannot be resized",
                        "Array indexing is 0-based: valid indices range from 0 to array.length - 1",
                        "Arrays are heap objects; array variables hold reference pointers",
                        "Accessing invalid indices throws ArrayIndexOutOfBoundsException"
                ),
                Arrays.asList(
                        "Using array.length() with parentheses instead of array.length (length is a field, not a method)",
                        "Attempting to resize an array (must create a new array and use System.arraycopy or Arrays.copyOf)",
                        "Comparing arrays with .equals() instead of java.util.Arrays.equals()"
                ),
                Arrays.asList("arraylist", "loops", "data-types"),
                Collections.singletonList(new CodeExample(
                        "Array Traversal and Summation",
                        "public class Main {\n    public static void main(String[] args) {\n        int[] values = {10, 20, 30, 40, 50};\n        int sum = 0;\n        for (int i = 0; i < values.length; i++) {\n            sum += values[i];\n            System.out.println(\"Element at \" + i + \": \" + values[i]);\n        }\n        System.out.println(\"Total sum: \" + sum);\n    }\n}",
                        "Initializes an array, loops through elements, and computes sum."
                ))
        ));

        list.add(topic(
                "Class", "class",
                "Blueprints and templates for defining objects, state attributes, and behaviors.",
                Difficulty.BEGINNER, u1, order++,
                "Classes are the fundamental units of encapsulation in Java, uniting data fields and operating methods into coherent domain models.",
                "A class in Java is a user-defined blueprint from which individual objects are instantiated. A class specifies member fields (state attributes), methods (behaviors), constructors (initialization routines), and access modifiers.",
                "public class Account {\n    private String id;\n    private double balance;\n    \n    public void deposit(double amount) {\n        this.balance += amount;\n    }\n}",
                Arrays.asList(
                        "A class defines the template; an object is an instantiated instance in heap memory",
                        "Classes encapsulate state with fields and define behavior with methods",
                        "Access modifiers (private, package-private, protected, public) enforce encapsulation boundaries"
                ),
                Arrays.asList(
                        "Making fields public instead of keeping them private with getters/setters",
                        "Forgetting that each .java file can contain at most one public class matching the file name"
                ),
                Arrays.asList("object", "methods", "constructors", "inheritance"),
                Collections.singletonList(new CodeExample(
                        "Defining a Java Class",
                        "class Rectangle {\n    int width;\n    int height;\n    int area() {\n        return width * height;\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Rectangle rect = new Rectangle();\n        rect.width = 5;\n        rect.height = 8;\n        System.out.println(\"Rectangle Area: \" + rect.area());\n    }\n}",
                        "Defines a Rectangle class with fields and a behavior method."
                ))
        ));

        list.add(topic(
                "Object", "object",
                "Instances of classes containing state, identity, and behavior in the heap.",
                Difficulty.BEGINNER, u1, order++,
                "Objects embody real-world software components that collaborate through method calls in an object-oriented architecture.",
                "An object is a concrete runtime instance of a class stored in JVM heap memory. An object possesses state (values stored in instance fields), behavior (methods), and identity (its memory address reference). Objects are created using the 'new' keyword.",
                "Car myCar = new Car(\"Tesla\", \"Model 3\");\nmyCar.drive();",
                Arrays.asList(
                        "The 'new' operator allocates memory on the heap and executes the constructor",
                        "Variables holding objects store references (pointers), not the object itself",
                        "All Java classes inherit from the root java.lang.Object class"
                ),
                Arrays.asList(
                        "Invoking methods on a null object reference causing NullPointerException",
                        "Assuming object assignment (a = b) clones the object (it copies the memory reference)"
                ),
                Arrays.asList("class", "constructors", "methods", "inheritance"),
                Collections.singletonList(new CodeExample(
                        "Instantiating Objects",
                        "class Point {\n    int x, y;\n    Point(int x, int y) {\n        this.x = x;\n        this.y = y;\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Point p1 = new Point(10, 20);\n        Point p2 = new Point(30, 40);\n        System.out.println(\"P1: (\" + p1.x + \", \" + p1.y + \")\");\n        System.out.println(\"P2: (\" + p2.x + \", \" + p2.y + \")\");\n    }\n}",
                        "Instantiates two distinct Point objects in memory and accesses their coordinates."
                ))
        ));

        list.add(topic(
                "Methods", "methods",
                "Named code blocks performing specific actions, supporting arguments and return types.",
                Difficulty.BEGINNER, u1, order++,
                "Methods promote modularity, code reuse, maintainability, and clean abstraction by isolating discrete responsibilities.",
                "A method is a collection of statements grouped together to perform an operation. A method declaration specifies its access modifier, return type (or void), method name, parameter list, and method body. Java passes all arguments strictly by value.",
                "public returnType methodName(ParamType p1) {\n    // Method body\n    return result;\n}",
                Arrays.asList(
                        "Methods declare input parameters and return a value or void",
                        "Java is strictly pass-by-value: primitive values are copied; object references are copied",
                        "Methods can be static (belonging to class) or instance methods (belonging to object)"
                ),
                Arrays.asList(
                        "Forgetting a return statement in non-void methods causing compiler error 'missing return statement'",
                        "Expecting a method to reassign the caller's reference variable"
                ),
                Arrays.asList("class", "constructors", "method-overloading", "method-overriding"),
                Collections.singletonList(new CodeExample(
                        "Creating and Invoking Methods",
                        "public class Main {\n    public static int calculateSum(int a, int b) {\n        return a + b;\n    }\n    public static void main(String[] args) {\n        int result = calculateSum(25, 17);\n        System.out.println(\"Sum is: \" + result);\n    }\n}",
                        "Declares a static computation method and invokes it from main."
                ))
        ));

        list.add(topic(
                "Constructors", "constructors",
                "Special member methods invoked during object creation to initialize state.",
                Difficulty.BEGINNER, u1, order++,
                "Constructors guarantee that objects are instantiated in a valid, fully-initialized state before any method invocation.",
                "A constructor is a special block of code called when an instance of a class is created with 'new'. Constructors have the exact same name as their enclosing class and have no return type (not even void). If no constructor is written, the Java compiler injects an implicit no-argument default constructor.",
                "public class Student {\n    private String name;\n    public Student(String name) {\n        this.name = name;\n    }\n}",
                Arrays.asList(
                        "Constructors must have the identical name as the class and declare no return type",
                        "If you provide any constructor, the compiler does not generate the default no-arg constructor",
                        "The 'this' keyword refers to the current object being constructed"
                ),
                Arrays.asList(
                        "Accidentally adding a return type (e.g. void Student()) turning the constructor into a regular method",
                        "Failing to supply a no-argument constructor when required by frameworks like JPA or Jackson"
                ),
                Arrays.asList("constructor-types", "class", "object", "super-keyword"),
                Collections.singletonList(new CodeExample(
                        "Initializing Objects with Constructors",
                        "class Product {\n    String name;\n    double price;\n    Product(String name, double price) {\n        this.name = name;\n        this.price = price;\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Product item = new Product(\"Mechanical Keyboard\", 89.99);\n        System.out.println(item.name + \" costs $\" + item.price);\n    }\n}",
                        "Initializes product fields during instantiation via a constructor."
                ))
        ));

        list.add(topic(
                "Constructor Types", "constructor-types",
                "Default, no-argument, and parameterized constructors, plus constructor overloading in Java.",
                Difficulty.BEGINNER, u1, order++,
                "Overloaded constructors provide flexible ways to initialize objects with default or custom parameters.",
                "Java supports three main constructor categories: Default Constructor (compiler-generated when no constructors exist), No-Argument Constructor (explicitly written without parameters), and Parameterized Constructor (accepting parameters to initialize specific fields). Constructor chaining is achieved using this(...).",
                "public Book() { this(\"Untitled\", 0.0); }\npublic Book(String title, double price) {\n    this.title = title;\n    this.price = price;\n}",
                Arrays.asList(
                        "Default constructor: Generated by javac only when zero constructors are declared in source",
                        "Parameterized constructor: Accepts parameters to customize object state upon creation",
                        "Constructor chaining: this(...) invokes another constructor in the same class (must be 1st statement)"
                ),
                Arrays.asList(
                        "Placing this(...) anywhere other than the very first statement of the constructor",
                        "Creating recursive constructor invocations causing a compiler error"
                ),
                Arrays.asList("constructors", "class", "object"),
                Collections.singletonList(new CodeExample(
                        "Constructor Overloading & Chaining",
                        "class User {\n    String username;\n    String role;\n    User() {\n        this(\"guest\", \"VIEWER\");\n    }\n    User(String username, String role) {\n        this.username = username;\n        this.role = role;\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        User u1 = new User();\n        User u2 = new User(\"admin\", \"SUPERUSER\");\n        System.out.println(u1.username + \": \" + u1.role);\n        System.out.println(u2.username + \": \" + u2.role);\n    }\n}",
                        "Demonstrates overloaded constructors and this() constructor delegation."
                ))
        ));

        // ========================================================
        // Unit 2: OOP Inheritance, Polymorphism & Interfaces (20..36)
        // ========================================================
        String u2 = "Unit 2: OOP Inheritance, Polymorphism & Interfaces";

        list.add(topic(
                "Inheritance", "inheritance",
                "Mechanisms of deriving new classes from existing classes using extends in Java.",
                Difficulty.INTERMEDIATE, u2, order++,
                "Inheritance establishes is-a relationships, enables clean code reuse, and provides the foundation for dynamic polymorphism.",
                "Inheritance is a fundamental OOP pillar where a subclass inherits fields and non-private methods from a superclass using the 'extends' keyword. Java supports single class inheritance, meaning a class can directly extend only one superclass, avoiding the diamond problem of multiple inheritance.",
                "public class Animal {\n    void speak() { System.out.println(\"Sound\"); }\n}\npublic class Dog extends Animal {\n    void bark() { System.out.println(\"Woof\"); }\n}",
                Arrays.asList(
                        "Subclasses inherit non-private members of their superclass using 'extends'",
                        "Java supports single class inheritance (a class can have only one superclass)",
                        "All Java classes implicitly extend java.lang.Object"
                ),
                Arrays.asList(
                        "Attempting to extend multiple classes (public class C extends A, B is invalid in Java)",
                        "Private fields in superclasses cannot be accessed directly in subclasses (use getters or protected fields)"
                ),
                Arrays.asList("types-of-inheritance", "super-keyword", "polymorphism", "method-overriding"),
                Collections.singletonList(new CodeExample(
                        "Basic Class Inheritance",
                        "class Vehicle {\n    void start() {\n        System.out.println(\"Engine started\");\n    }\n}\nclass Car extends Vehicle {\n    void drive() {\n        System.out.println(\"Car is driving\");\n    }\n}\npublic class Main {\n    public static void main(String[] args) {\n        Car car = new Car();\n        car.start(); // Inherited method\n        car.drive(); // Subclass method\n    }\n}",
                        "Subclass Car inherits behavior from superclass Vehicle."
                ))
        ));

        list.add(topic("Types of Inheritance", "types-of-inheritance",
                "Single, multilevel, and hierarchical inheritance in Java (and multiple inheritance via interfaces).",
                Difficulty.INTERMEDIATE, u2, order++,
                "Understanding permitted inheritance structures avoids multiple inheritance ambiguities.",
                "Java supports Single Inheritance (A extends B), Multilevel Inheritance (C extends B, B extends A), and Hierarchical Inheritance (B extends A, C extends A). Java does not support multiple class inheritance (C extends A, B) to prevent ambiguity, but allows multiple interface implementation.",
                "class A {}\nclass B extends A {}          // Single\nclass C extends B {}          // Multilevel\nclass D extends A {}          // Hierarchical",
                Arrays.asList("Single, Multilevel, and Hierarchical class inheritance are supported", "Multiple class inheritance is disallowed to avoid the diamond problem"),
                Arrays.asList("Trying to extend multiple classes with commas"),
                Arrays.asList("inheritance", "interfaces", "super-keyword"),
                Collections.emptyList()));

        list.add(topic("super Keyword", "super-keyword",
                "Referencing superclass constructors, methods, and fields from within a subclass.",
                Difficulty.INTERMEDIATE, u2, order++,
                "The super keyword ensures proper initialization of superclass state and access to overridden behaviors.",
                "The super keyword is a reference variable used to refer to immediate parent class objects: super(...) calls parent constructors, and super.method() invokes parent methods.",
                "super(); // Call parent constructor\nsuper.display(); // Call parent method",
                Arrays.asList("super() must be the first statement in a subclass constructor", "super allows calling overridden parent methods"),
                Arrays.asList("Calling super() after other statements in a constructor"),
                Arrays.asList("inheritance", "constructors", "method-overriding"),
                Collections.emptyList()));

        list.add(topic("final Classes", "final-classes",
                "Preventing class inheritance and creating immutable architectures using final.",
                Difficulty.INTERMEDIATE, u2, order++,
                "Final classes enforce security and immutability (e.g. String, Integer).",
                "Declaring a class with the final keyword prevents it from being extended by any subclass.",
                "public final class SecurityToken { ... }",
                Arrays.asList("Final classes cannot be extended", "All methods in a final class are implicitly final"),
                Arrays.asList("Trying to create a subclass of a final class like java.lang.String"),
                Arrays.asList("constants", "final-methods", "inheritance"),
                Collections.emptyList()));

        list.add(topic("final Methods", "final-methods",
                "Preventing method overriding to enforce critical algorithm implementations.",
                Difficulty.INTERMEDIATE, u2, order++,
                "Guarantees that sub-classes cannot alter fundamental business logic or security checks.",
                "Declaring a method final prevents subclasses from overriding its implementation.",
                "public final void validateSecurityToken() { ... }",
                Arrays.asList("Final methods cannot be overridden in any subclass", "Allows compiler optimizations like inlining"),
                Arrays.asList("Attempting to override a final method in a subclass causing compilation failure"),
                Arrays.asList("final-classes", "method-overriding", "constants"),
                Collections.emptyList()));

        list.add(topic("Polymorphism", "polymorphism",
                "Ability of objects to take many forms, supporting compile-time and runtime polymorphism.",
                Difficulty.INTERMEDIATE, u2, order++,
                "Polymorphism allows writing decoupled, extensible systems where consumers interact with general interfaces rather than rigid concrete implementations.",
                "Polymorphism allows an entity to take different forms. In Java, compile-time polymorphism is achieved through method overloading, while runtime polymorphism is achieved through method overriding and dynamic method dispatch via virtual calls.",
                "Animal myPet = new Dog(); // Upcasting\nmyPet.makeSound();         // Executes Dog's makeSound() at runtime",
                Arrays.asList(
                        "Compile-time polymorphism: Method Overloading resolved at compile time",
                        "Runtime polymorphism: Method Overriding resolved dynamically at runtime",
                        "Upcasting: Parent reference pointing to child object is safe and automatic"
                ),
                Arrays.asList("Downcasting without checking instanceof causing ClassCastException"),
                Arrays.asList("method-overloading", "method-overriding", "interfaces"),
                Collections.emptyList()));

        list.add(topic("Method Overloading", "method-overloading",
                "Defining multiple methods with the same name but different parameter signatures.",
                Difficulty.INTERMEDIATE, u2, order++,
                "Provides clean APIs that handle diverse argument types without clunky method names.",
                "Method overloading allows a class to have multiple methods with the same name, provided their parameter lists differ in argument count, type, or order. Return type alone is insufficient to overload methods.",
                "int add(int a, int b) { ... }\ndouble add(double a, double b) { ... }",
                Arrays.asList("Overloading requires different parameter types, counts, or order", "Changing only the return type does NOT constitute valid overloading"),
                Arrays.asList("Attempting to overload methods by changing only return type"),
                Arrays.asList("polymorphism", "methods", "method-overriding"),
                Collections.emptyList()));

        list.add(topic("Method Overriding", "method-overriding",
                "Subclasses providing specific implementations for methods defined in superclasses.",
                Difficulty.INTERMEDIATE, u2, order++,
                "Enables dynamic runtime dispatch where child classes tailor inherited behaviors.",
                "Method overriding occurs when a subclass defines a method with the identical name, parameters, and return type (or covariant return) as a method in its superclass. The @Override annotation documents and verifies overriding.",
                "@Override\npublic void execute() { ... }",
                Arrays.asList("Signature must match parent method exactly", "Access level cannot be more restrictive than the parent method", "@Override annotation prevents accidental typos"),
                Arrays.asList("Typo in method name causing accidental overloading instead of overriding (avoid by using @Override)"),
                Arrays.asList("polymorphism", "inheritance", "super-keyword"),
                Collections.emptyList()));

        list.add(topic("Abstract Classes", "abstract-classes",
                "Incomplete class templates that cannot be instantiated directly and define shared contracts.",
                Difficulty.INTERMEDIATE, u2, order++,
                "Provides shared implementation logic alongside contract requirements for related subclasses.",
                "An abstract class is declared with the 'abstract' keyword. It cannot be directly instantiated and may contain both abstract methods (without bodies) and concrete methods (with bodies).",
                "public abstract class Shape {\n    abstract double getArea();\n    void print() { System.out.println(getArea()); }\n}",
                Arrays.asList("Cannot be instantiated with new", "May contain constructors, fields, and concrete methods"),
                Arrays.asList("Attempting new Shape() on an abstract class"),
                Arrays.asList("abstract-methods", "interfaces", "inheritance"),
                Collections.emptyList()));

        list.add(topic("Abstract Methods", "abstract-methods",
                "Methods declared without a body that must be implemented by concrete subclasses.",
                Difficulty.INTERMEDIATE, u2, order++,
                "Forces derived classes to supply domain-specific logic while adhering to a common protocol.",
                "An abstract method is declared with the 'abstract' keyword, ending with a semicolon and no implementation body {}. Any non-abstract subclass must implement all inherited abstract methods.",
                "public abstract void draw();",
                Arrays.asList("Abstract methods have no body", "Can only exist inside abstract classes or interfaces"),
                Arrays.asList("Providing a body {} for an abstract method causing compiler error"),
                Arrays.asList("abstract-classes", "interfaces", "method-overriding"),
                Collections.emptyList()));

        list.add(topic("Interfaces", "interfaces",
                "Pure abstract contracts specifying method declarations that implementing classes must satisfy.",
                Difficulty.INTERMEDIATE, u2, order++,
                "Decouples software contracts from concrete classes, enabling multiple inheritance of types and pluggable enterprise architectures.",
                "An interface in Java is a reference type that defines a contract of abstract methods. Classes implement interfaces using the 'implements' keyword. Modern Java interfaces also support default, static, and private methods.",
                "public interface Flyable {\n    void fly();\n    default void glide() { ... }\n}",
                Arrays.asList("Interfaces declare contracts that classes fulfill using 'implements'", "A class can implement multiple interfaces", "Methods are public and abstract by default"),
                Arrays.asList("Forgetting to declare implemented interface methods as public"),
                Arrays.asList("defining-interfaces", "implementing-interfaces", "interfaces-vs-abstract-classes"),
                Collections.emptyList()));

        list.add(topic("Interfaces vs Abstract Classes", "interfaces-vs-abstract-classes",
                "Architectural comparison: multiple implementation vs single inheritance, state vs contract.",
                Difficulty.INTERMEDIATE, u2, order++,
                "Choosing between interfaces and abstract classes is a core architectural decision in Java design.",
                "Abstract classes represent an 'is-a' relationship with state (instance variables) and single inheritance. Interfaces represent a 'can-do' contract with multiple implementation support and no instance state.",
                "class Dog extends Animal implements Pet, Vaccinated { ... }",
                Arrays.asList("Interface: multiple implementations, no instance state", "Abstract class: single inheritance, supports instance state and constructors"),
                Arrays.asList("Using abstract class when interface contract is all that's required"),
                Arrays.asList("interfaces", "abstract-classes", "inheritance"),
                Collections.emptyList()));

        list.add(topic("Defining Interfaces", "defining-interfaces",
                "Interface syntax, public abstract methods, constants, default methods, and static methods.",
                Difficulty.INTERMEDIATE, u2, order++,
                "Defines clean API boundaries and service contracts across system modules.",
                "Interfaces are declared with the 'interface' keyword. Fields are implicitly public static final constants. Methods without bodies are implicitly public abstract.",
                "public interface Repository<T> {\n    T findById(Long id);\n    void save(T entity);\n}",
                Arrays.asList("Declared with interface keyword", "Fields are implicitly public static final constants"),
                Arrays.asList("Declaring protected or private fields in an interface"),
                Arrays.asList("interfaces", "implementing-interfaces"),
                Collections.emptyList()));

        list.add(topic("Implementing Interfaces", "implementing-interfaces",
                "Using implements to fulfill interface contracts across one or more interfaces.",
                Difficulty.INTERMEDIATE, u2, order++,
                "Allows classes to advertise multiple capabilities to caller components.",
                "A class uses 'implements' to satisfy an interface contract, providing concrete bodies for all abstract methods.",
                "public class Drone implements Flyable, Recordable {\n    public void fly() { ... }\n    public void record() { ... }\n}",
                Arrays.asList("Use 'implements' keyword", "Must implement all abstract methods unless the class is abstract"),
                Arrays.asList("Omitting public modifier when implementing interface methods"),
                Arrays.asList("interfaces", "defining-interfaces"),
                Collections.emptyList()));

        list.add(topic("Accessing Interfaces", "accessing-interfaces",
                "Using interface references to achieve polymorphic decoupling and loose coupling.",
                Difficulty.INTERMEDIATE, u2, order++,
                "Enables loose coupling where clients interact with contracts rather than concrete types.",
                "Clients interact with objects through interface references (e.g. List<String> list = new ArrayList<>()), making implementations easily swappable.",
                "List<String> items = new ArrayList<>(); // Interface reference",
                Arrays.asList("Program to interfaces, not implementations", "Allows changing underlying implementations without affecting callers"),
                Arrays.asList("Binding method signatures to concrete ArrayList rather than List"),
                Arrays.asList("interfaces", "polymorphism"),
                Collections.emptyList()));

        list.add(topic("Extending Interfaces", "extending-interfaces",
                "Inheritance between interfaces where an interface extends one or more parent interfaces.",
                Difficulty.INTERMEDIATE, u2, order++,
                "Allows building composable, hierarchical API contracts.",
                "An interface can extend other interfaces using 'extends'. Unlike classes, an interface can extend multiple interfaces simultaneously.",
                "public interface SortedList<T> extends List<T>, SortedSet<T> { ... }",
                Arrays.asList("Interfaces use 'extends' to inherit other interfaces", "An interface can extend multiple interfaces"),
                Arrays.asList("Using implements keyword between two interfaces"),
                Arrays.asList("interfaces", "defining-interfaces"),
                Collections.emptyList()));

        list.add(topic("Packages", "packages",
                "Namespace organization, package declarations, imports, and access control.",
                Difficulty.BEGINNER, u2, order++,
                "Packages prevent naming conflicts and partition codebases into logical functional modules.",
                "Packages group related classes and interfaces into hierarchical namespaces using reverse-domain conventions (e.g., com.codevista.model).",
                "package com.codevista.model;\nimport java.util.List;",
                Arrays.asList("package statement must be the first line of the file", "import statements bring classes into scope"),
                Arrays.asList("Mismatch between package declaration and physical folder path"),
                Arrays.asList("class", "interfaces"),
                Collections.emptyList()));

        // ========================================================
        // Unit 3: Exceptions & Multithreading (37..51)
        // ========================================================
        String u3 = "Unit 3: Exceptions & Multithreading";

        list.add(topic(
                "Exceptions", "exceptions",
                "Disruptive runtime events and the Java exception handling mechanism.",
                Difficulty.INTERMEDIATE, u3, order++,
                "Robust exception handling prevents program crashes and separates error logic from business flows.",
                "An exception is an event occurring during program execution that disrupts the normal flow of instructions. Java represents errors as Throwable objects thrown and caught across the call stack.",
                "try {\n    int result = 10 / 0;\n} catch (ArithmeticException e) {\n    System.err.println(\"Cannot divide by zero\");\n}",
                Arrays.asList("Exceptions are objects derived from java.lang.Throwable", "Separates normal logic from error handling logic"),
                Arrays.asList("Swallowing exceptions in empty catch blocks without logging"),
                Arrays.asList("try", "catch", "exception-hierarchy"),
                Collections.singletonList(new CodeExample(
                        "Handling Division by Zero",
                        "public class Main {\n    public static void main(String[] args) {\n        try {\n            int x = 10 / 0;\n        } catch (ArithmeticException e) {\n            System.out.println(\"Caught exception: \" + e.getMessage());\n        }\n    }\n}",
                        "Catches arithmetic division by zero."
                ))
        ));

        list.add(topic("Advantages of Exception Handling", "advantages-of-exception-handling",
                "Separation of error logic from regular logic, call stack propagation, and error grouping.",
                Difficulty.BEGINNER, u3, order++,
                "Keeps main code clean and enables centralized failure recovery.",
                "Java exception handling decouples error code from normal code, propagates errors up the call stack, and categorizes failures by type.",
                "// Clean business flow in try, centralized recovery in catch",
                Arrays.asList("Separates error handling code from normal flow", "Propagates errors cleanly up the call stack"),
                Arrays.asList("Using exceptions for normal flow control like loop termination"),
                Arrays.asList("exceptions", "try", "catch"),
                Collections.emptyList()));

        list.add(topic("Exception Classification", "exception-classification",
                "Checked exceptions, unchecked runtime exceptions, and JVM errors.",
                Difficulty.INTERMEDIATE, u3, order++,
                "Classifying errors determines whether compiler forces try-catch handling.",
                "Java categorizes Throwable into: Errors (JVM failures), Checked Exceptions (recoverable external issues required to be declared or caught), and Unchecked RuntimeExceptions (programming bugs).",
                "// Checked: IOException, SQLException\n// Unchecked: NullPointerException, IndexOutOfBoundsException",
                Arrays.asList("Checked: Checked at compile time", "Unchecked: Subclasses of RuntimeException"),
                Arrays.asList("Treating NullPointerException as a checked exception"),
                Arrays.asList("exception-hierarchy", "checked-exceptions", "unchecked-exceptions"),
                Collections.emptyList()));

        list.add(topic("Exception Hierarchy", "exception-hierarchy",
                "The Throwable hierarchy: Error, Exception, RuntimeException and sub-branches.",
                Difficulty.INTERMEDIATE, u3, order++,
                "Clarifies catch-block ordering and polymorphic error capture.",
                "Throwable sits at the root. Subclasses include Error (fatal system failures) and Exception (application conditions). Exception branches into RuntimeException (unchecked) and checked exceptions.",
                "Throwable\n  ├── Error (OutOfMemoryError, StackOverflowError)\n  └── Exception\n        ├── IOException, SQLException (Checked)\n        └── RuntimeException (Unchecked)",
                Arrays.asList("Throwable is root", "Catch subclasses before parent classes"),
                Arrays.asList("Catching generic Throwable or Exception too early, masking specific errors"),
                Arrays.asList("exceptions", "exception-classification"),
                Collections.emptyList()));

        list.add(topic("Checked Exceptions", "checked-exceptions",
                "Compile-time verified exceptions requiring explicit catch or throws declaration.",
                Difficulty.INTERMEDIATE, u3, order++,
                "Enforces recovery planning for anticipated external failures (file I/O, database access).",
                "Checked exceptions are subclasses of Exception (excluding RuntimeException). The compiler enforces that they must either be handled in a try-catch block or declared in the method's throws clause.",
                "void readFile() throws IOException { ... }",
                Arrays.asList("Compiler enforces try-catch or throws clause", "Used for recoverable external issues"),
                Arrays.asList("Failing to declare or catch checked exceptions causing compiler error"),
                Arrays.asList("unchecked-exceptions", "try", "throws"),
                Collections.emptyList()));

        list.add(topic("Unchecked Exceptions", "unchecked-exceptions",
                "Runtime exceptions extending RuntimeException that bypass mandatory compiler verification.",
                Difficulty.INTERMEDIATE, u3, order++,
                "Represents logic flaws (null dereferences, illegal arguments) that should be fixed in code.",
                "Unchecked exceptions inherit from RuntimeException. The compiler does not require them to be caught or declared, as they represent programming logic defects.",
                "throw new IllegalArgumentException(\"Invalid input\");",
                Arrays.asList("Inherits from RuntimeException", "Compiler does not require throws or catch"),
                Arrays.asList("Catching RuntimeExceptions instead of fixing the underlying bug"),
                Arrays.asList("checked-exceptions", "exceptions"),
                Collections.emptyList()));

        list.add(topic("try", "try",
                "Guarding code blocks that might throw exceptions during execution.",
                Difficulty.BEGINNER, u3, order++,
                "Defines the boundary of risky operations to protect application stability.",
                "The try block encloses code that may produce an exception. It must be followed by at least one catch block or a finally block.",
                "try {\n    // Code that might fail\n}",
                Arrays.asList("Monitors code for thrown exceptions", "Must be paired with catch, finally, or try-with-resources"),
                Arrays.asList("Writing empty try blocks or try blocks without catch or finally"),
                Arrays.asList("catch", "finally", "exceptions"),
                Collections.emptyList()));

        list.add(topic("catch", "catch",
                "Handling specific exception types and recovery logic.",
                Difficulty.BEGINNER, u3, order++,
                "Allows graceful recovery and descriptive error logging when exceptions occur.",
                "The catch block receives and handles exceptions thrown inside its corresponding try block. Multiple catch blocks can handle different exception types in order from most specific to most general.",
                "catch (IOException | SQLException e) { ... }",
                Arrays.asList("Receives thrown exception object", "Multiple catch blocks must be ordered from subclass to superclass"),
                Arrays.asList("Catching parent class before child class causing unreachable code error"),
                Arrays.asList("try", "finally", "exceptions"),
                Collections.emptyList()));

        list.add(topic("throw", "throw",
                "Explicitly instantiating and throwing an exception instance.",
                Difficulty.INTERMEDIATE, u3, order++,
                "Allows custom validation and signalling unexpected conditions to callers.",
                "The throw keyword explicitly raises an exception object, transferring control immediately out of the current method to the nearest matching catch block.",
                "if (age < 0) throw new IllegalArgumentException(\"Age cannot be negative\");",
                Arrays.asList("throw keyword throws an exception instance", "Bypasses subsequent statements in the method"),
                Arrays.asList("Confusing throw (throws an instance) with throws (declares method exceptions)"),
                Arrays.asList("throws", "exceptions"),
                Collections.emptyList()));

        list.add(topic("throws", "throws",
                "Declaring that a method may raise specified exceptions to its callers.",
                Difficulty.INTERMEDIATE, u3, order++,
                "Documents and propagates exception handling obligations to callers.",
                "The throws keyword appears in a method signature to notify callers that the method may throw the listed checked exceptions.",
                "public void loadData() throws IOException, SQLException { ... }",
                Arrays.asList("Appears in method signature", "Mandatory for unhandled checked exceptions"),
                Arrays.asList("Confusing throws (in signature) with throw (in body)"),
                Arrays.asList("throw", "checked-exceptions"),
                Collections.emptyList()));

        list.add(topic("finally", "finally",
                "Guaranteed execution blocks for cleanup, stream closure, and resource releasing.",
                Difficulty.BEGINNER, u3, order++,
                "Ensures resources (connections, files, locks) are released regardless of failure.",
                "The finally block always executes after try and catch blocks finish, regardless of whether an exception was thrown or caught. Modern Java prefers try-with-resources for AutoCloseable resources.",
                "try { ... } catch (Exception e) { ... } finally { closeResources(); }",
                Arrays.asList("Executes unconditionally whether exception occurs or not", "Standard for manual resource cleanup"),
                Arrays.asList("Writing return statements inside finally (overrides try block return values)"),
                Arrays.asList("try", "catch"),
                Collections.emptyList()));

        list.add(topic("Thread", "thread",
                "Java Thread class, independent execution paths, and concurrency fundamentals.",
                Difficulty.INTERMEDIATE, u3, order++,
                "Enables parallel computing, background processing, and responsive user interfaces.",
                "A thread is a lightweight process executing code independently within a shared memory space. Java encapsulates threads in java.lang.Thread.",
                "Thread t = new Thread(() -> System.out.println(\"Running\"));\nt.start();",
                Arrays.asList("Thread provides an independent execution path", "Threads share JVM heap memory"),
                Arrays.asList("Calling t.run() instead of t.start() (run executes synchronously on current thread)"),
                Arrays.asList("multithreading", "creating-threads", "thread-lifecycle"),
                Collections.emptyList()));

        list.add(topic("Multithreading", "multithreading",
                "Simultaneous execution of multiple threads to maximize CPU utilization.",
                Difficulty.ADVANCED, u3, order++,
                "Crucial for high-throughput server backends and multi-core CPU architectures.",
                "Multithreading enables concurrent execution of two or more parts of a program. It maximizes CPU core utilization but introduces synchronization challenges like race conditions and deadlocks.",
                "// Concurrent execution across available CPU cores",
                Arrays.asList("Improves throughput and resource utilization", "Requires synchronization to protect shared mutable state"),
                Arrays.asList("Assuming multithreading always speeds up code (context switching has overhead)"),
                Arrays.asList("thread", "thread-lifecycle"),
                Collections.emptyList()));

        list.add(topic("Thread Lifecycle", "thread-lifecycle",
                "Thread states: NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, and TERMINATED.",
                Difficulty.INTERMEDIATE, u3, order++,
                "Essential for diagnosing thread deadlocks, starvation, and bottlenecks.",
                "A Java thread moves through defined lifecycle states in Thread.State: NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, and TERMINATED.",
                "Thread.State state = thread.getState();",
                Arrays.asList("NEW: created but not started", "RUNNABLE: executing in JVM", "BLOCKED: waiting for monitor lock", "TERMINATED: finished execution"),
                Arrays.asList("Calling start() twice on the same thread causing IllegalThreadStateException"),
                Arrays.asList("thread", "creating-threads"),
                Collections.emptyList()));

        list.add(topic("Creating Threads", "creating-threads",
                "Extending Thread vs implementing Runnable (and Callable with Executors).",
                Difficulty.INTERMEDIATE, u3, order++,
                "Implementing Runnable is best practice as it preserves inheritance for domain classes.",
                "Threads can be created by extending Thread or implementing Runnable. Implementing Runnable is preferred because Java only allows single class inheritance and decouples tasks from execution mechanisms.",
                "Runnable task = () -> System.out.println(\"Work\");\nnew Thread(task).start();",
                Arrays.asList("Implementing Runnable is preferred over extending Thread", "Decouples task from thread execution"),
                Arrays.asList("Calling run() directly instead of start()"),
                Arrays.asList("thread", "multithreading"),
                Collections.emptyList()));

        // ========================================================
        // Unit 4: Collections & File I/O (52..65)
        // ========================================================
        String u4 = "Unit 4: Collections & File I/O";

        list.add(topic("Java Collections", "java-collections",
                "Overview of dynamic data structures, algorithms, and container utilities.",
                Difficulty.INTERMEDIATE, u4, order++,
                "Replaces rigid static arrays with dynamic, high-performance data structures.",
                "The Java Collections Framework provides an architecture to store and manipulate groups of objects, including lists, sets, queues, and maps.",
                "Collection<String> items = new ArrayList<>();",
                Arrays.asList("Provides standardized interfaces for lists, sets, queues, and maps", "Includes sorting and search algorithms in java.util.Collections"),
                Arrays.asList("Using legacy collections like Vector or Hashtable in modern code"),
                Arrays.asList("collection-framework", "arraylist"),
                Collections.emptyList()));

        list.add(topic("Collection Framework", "collection-framework",
                "Core interfaces: Collection, List, Set, Queue, Map and implementation classes.",
                Difficulty.INTERMEDIATE, u4, order++,
                "Defines the unified data manipulation contracts across all Java applications.",
                "The framework is organized into two main interface trees: Collection (List, Set, Queue) and Map (Key-Value associations).",
                "Collection ── List, Set, Queue\nMap ── HashMap, TreeMap",
                Arrays.asList("List: ordered, duplicates allowed", "Set: unique elements", "Map: key-value pairs"),
                Arrays.asList("Assuming Map is a subtype of Collection (it is an independent hierarchy)"),
                Arrays.asList("java-collections", "arraylist"),
                Collections.emptyList()));

        list.add(topic(
                "ArrayList", "arraylist",
                "Resizable array implementation of List providing fast random access.",
                Difficulty.INTERMEDIATE, u4, order++,
                "The most ubiquitous data structure in Java programming, combining array speed with dynamic resizing.",
                "ArrayList is a resizable array implementation of the List interface in java.util. Unlike fixed-size arrays, an ArrayList dynamically expands its internal backing array when elements exceed current capacity. It offers O(1) random access via index, but O(n) element shifting for arbitrary insertions and deletions.",
                "List<T> list = new ArrayList<>();\nlist.add(element);\nT item = list.get(index);\nlist.set(index, element);\nlist.remove(index);\nint size = list.size();",
                Arrays.asList(
                        "Dynamic resizing: increases capacity by 50% when full",
                        "O(1) amortized add() and O(1) random get(index) access",
                        "Maintains insertion order and permits duplicates",
                        "Not thread-safe; use CopyOnWriteArrayList in concurrent environments"
                ),
                Arrays.asList(
                        "Using raw List instead of generic List<String>",
                        "Modifying an ArrayList during an enhanced for-loop causing ConcurrentModificationException",
                        "Using ArrayList when frequent head insertions are required (use LinkedList or ArrayDeque)"
                ),
                Arrays.asList("collection-framework", "arrays", "vector", "stack"),
                Collections.singletonList(new CodeExample(
                        "ArrayList Operations & Traversal",
                        "import java.util.ArrayList;\nimport java.util.List;\n\npublic class Main {\n    public static void main(String[] args) {\n        List<String> list = new ArrayList<>();\n        list.add(\"Java\");\n        list.add(\"Kotlin\");\n        list.add(\"Scala\");\n        System.out.println(\"Size: \" + list.size());\n        System.out.println(\"First element: \" + list.get(0));\n        for (String lang : list) {\n            System.out.println(\"Language: \" + lang);\n        }\n    }\n}",
                        "Adds elements, prints size, accesses by index, and iterates over an ArrayList."
                ))
        ));

        list.add(topic("Vector", "vector",
                "Synchronized legacy resizable array with thread-safe operations.",
                Difficulty.INTERMEDIATE, u4, order++,
                "Understanding legacy synchronized collections compared to modern ArrayList.",
                "Vector is a legacy resizable array similar to ArrayList, but its methods are synchronized. In modern code, ArrayList with explicit synchronization or concurrent collections is preferred.",
                "Vector<String> vec = new Vector<>();",
                Arrays.asList("Synchronized (thread-safe) legacy collection", "Doubles capacity when full (unlike ArrayList's 50% growth)"),
                Arrays.asList("Using Vector in single-threaded code where synchronization causes unnecessary overhead"),
                Arrays.asList("arraylist", "collection-framework"),
                Collections.emptyList()));

        list.add(topic("Hashtable", "hashtable",
                "Synchronized legacy hash-table mapping keys to values.",
                Difficulty.INTERMEDIATE, u4, order++,
                "Contrasts synchronized legacy hash tables with modern ConcurrentHashMap.",
                "Hashtable is a legacy synchronized key-value dictionary. It does not permit null keys or null values.",
                "Hashtable<String, Integer> table = new Hashtable<>();",
                Arrays.asList("Legacy synchronized map", "Does not allow null keys or null values"),
                Arrays.asList("Passing null into Hashtable throwing NullPointerException"),
                Arrays.asList("collection-framework", "arraylist"),
                Collections.emptyList()));

        list.add(topic("Stack", "stack",
                "Last-In-First-Out (LIFO) stack data structure extending Vector.",
                Difficulty.INTERMEDIATE, u4, order++,
                "Classic LIFO data structure for expression parsing, backtracking, and undo stacks.",
                "Stack implements LIFO with push(), pop(), and peek(). It extends Vector. In modern Java, Deque (such as ArrayDeque) is recommended for stacks.",
                "Stack<Integer> s = new Stack<>();\ns.push(10);\nint val = s.pop();",
                Arrays.asList("LIFO: Last-In, First-Out", "push() adds to top; pop() removes from top; peek() inspects top"),
                Arrays.asList("Calling pop() on an empty stack throwing EmptyStackException"),
                Arrays.asList("arraylist", "collection-framework"),
                Collections.emptyList()));

        list.add(topic("StringTokenizer", "stringtokenizer",
                "Legacy string parsing utility for splitting strings into tokens.",
                Difficulty.BEGINNER, u4, order++,
                "Useful for legacy text parsing, replaced by String.split() and Scanner.",
                "StringTokenizer breaks strings into tokens based on delimiters. It is largely superseded by String.split() and regex.",
                "StringTokenizer st = new StringTokenizer(\"apple,banana,orange\", \",\");\nwhile (st.hasMoreTokens()) System.out.println(st.nextToken());",
                Arrays.asList("Extracts tokens by delimiter", "Does not support regular expressions"),
                Arrays.asList("Using StringTokenizer when regex String.split() is needed"),
                Arrays.asList("data-types", "text-io"),
                Collections.emptyList()));

        list.add(topic("Files", "files",
                "java.io.File fundamentals and modern java.nio.file.Files utility methods.",
                Difficulty.INTERMEDIATE, u4, order++,
                "Enables reading, writing, and querying filesystem directories and metadata.",
                "Java manages filesystem interaction via classic java.io.File and modern NIO java.nio.file.Files / java.nio.file.Path.",
                "Path path = Path.of(\"data.txt\");\nFiles.writeString(path, \"Hello\");",
                Arrays.asList("NIO java.nio.file.Files provides efficient methods", "Paths represent filesystem locations"),
                Arrays.asList("Hardcoding platform-specific file path separators (use File.separator or Path)"),
                Arrays.asList("streams", "text-io", "binary-io"),
                Collections.emptyList()));

        list.add(topic("Streams", "streams",
                "Input and output stream abstractions for sequential byte and character data.",
                Difficulty.INTERMEDIATE, u4, order++,
                "Unified abstraction for moving data across disk, memory buffers, and network sockets.",
                "A stream in Java I/O represents an ordered sequence of data flowing from a source to a destination. InputStreams read; OutputStreams write.",
                "try (InputStream in = new FileInputStream(\"file.bin\")) { ... }",
                Arrays.asList("Streams process data sequentially", "Must be closed using try-with-resources"),
                Arrays.asList("Forgetting to close streams leading to file descriptor leaks"),
                Arrays.asList("byte-streams", "character-streams", "files"),
                Collections.emptyList()));

        list.add(topic("Byte Streams", "byte-streams",
                "InputStream and OutputStream hierarchies for handling raw 8-bit binary data.",
                Difficulty.INTERMEDIATE, u4, order++,
                "Standard for images, audio, video, compiled classes, and serialized objects.",
                "Byte streams read and write raw 8-bit bytes. Roots are InputStream and OutputStream. Used for binary files like images and videos.",
                "InputStream in = new FileInputStream(\"pic.png\");",
                Arrays.asList("Processes raw 8-bit binary bytes", "Roots are InputStream and OutputStream"),
                Arrays.asList("Using byte streams to read text files with multi-byte Unicode encodings"),
                Arrays.asList("streams", "character-streams", "binary-io"),
                Collections.emptyList()));

        list.add(topic("Character Streams", "character-streams",
                "Reader and Writer hierarchies for handling 16-bit Unicode character data.",
                Difficulty.INTERMEDIATE, u4, order++,
                "Ensures correct international character encoding translation across platforms.",
                "Character streams handle 16-bit Unicode characters. Roots are Reader and Writer, translating between raw bytes and character sets.",
                "Reader reader = new FileReader(\"notes.txt\", StandardCharsets.UTF_8);",
                Arrays.asList("Handles 16-bit Unicode characters", "Roots are Reader and Writer"),
                Arrays.asList("Ignoring character encoding causing garbled text on international characters"),
                Arrays.asList("streams", "byte-streams", "text-io"),
                Collections.emptyList()));

        list.add(topic("Text I/O", "text-io",
                "Writing human-readable text and parsing formatted input using PrintWriter and Scanner.",
                Difficulty.BEGINNER, u4, order++,
                "Foundational for console input, logging, CSV parsing, and configuration files.",
                "Text I/O involves reading and writing human-readable text using Scanner, BufferedReader, and PrintWriter.",
                "Scanner sc = new Scanner(System.in);\nPrintWriter pw = new PrintWriter(\"output.txt\");",
                Arrays.asList("Reads and writes human-readable strings", "BufferedReader provides fast buffered line-by-line reading"),
                Arrays.asList("Using Scanner for large gigabyte files (BufferedReader is much faster)"),
                Arrays.asList("character-streams", "files"),
                Collections.emptyList()));

        list.add(topic("Binary I/O", "binary-io",
                "Reading and writing raw primitive data types using DataInputStream and DataOutputStream.",
                Difficulty.INTERMEDIATE, u4, order++,
                "Efficient, compact file storage format for numbers and binary protocols.",
                "Binary I/O writes raw machine-readable data without text formatting, using DataInputStream and DataOutputStream.",
                "DataOutputStream out = new DataOutputStream(new FileOutputStream(\"data.bin\"));\nout.writeInt(42);",
                Arrays.asList("Writes primitives directly in binary format", "More compact and faster than text I/O"),
                Arrays.asList("Trying to read binary files with text readers"),
                Arrays.asList("byte-streams", "files"),
                Collections.emptyList()));

        list.add(topic("Random Access File Operations", "random-access-file-operations",
                "Non-sequential file reading and writing at arbitrary positions using RandomAccessFile.",
                Difficulty.ADVANCED, u4, order++,
                "Enables database storage engines, index files, and large file seeking.",
                "RandomAccessFile allows reading and writing anywhere in a file by moving an internal file pointer with seek().",
                "RandomAccessFile raf = new RandomAccessFile(\"db.dat\", \"rw\");\nraf.seek(1024);\nint val = raf.readInt();",
                Arrays.asList("Non-sequential access via seek()", "Supports both reading and writing simultaneously"),
                Arrays.asList("Seeking beyond file boundaries or miscalculating byte offsets"),
                Arrays.asList("files", "binary-io"),
                Collections.emptyList()));

        // ========================================================
        // Unit 5: Enterprise Java - Servlets & Hibernate (66..78)
        // ========================================================
        String u5 = "Unit 5: Enterprise Java - Servlets & Hibernate";

        list.add(topic("Servlet", "servlet",
                "Server-side Java components that handle client requests and dynamically generate web responses.",
                Difficulty.ADVANCED, u5, order++,
                "The foundational web technology powering Spring MVC, Jakarta EE, and modern Java web servers.",
                "A Servlet is a Java class that extends the capabilities of servers that host applications accessed by a request-response programming model.",
                "public class HelloServlet extends HttpServlet {\n    protected void doGet(HttpServletRequest req, HttpServletResponse resp) { ... }\n}",
                Arrays.asList("Server-side component handling HTTP requests", "Managed by a Servlet container like Tomcat"),
                Arrays.asList("Storing user-specific state in Servlet instance variables (Servlets are singletons shared across threads)"),
                Arrays.asList("servlet-overview", "servlet-architecture", "servlet-lifecycle"),
                Collections.emptyList()));

        list.add(topic("Servlet Overview", "servlet-overview",
                "Role of Java Servlets in web architectures, comparing Servlets with CGI.",
                Difficulty.INTERMEDIATE, u5, order++,
                "Explains why thread-based servlet models outperformed process-heavy CGI.",
                "Unlike CGI which spawned a heavy OS process per request, Servlets execute inside a single JVM process using lightweight threads.",
                "// Multi-threaded single-process container model",
                Arrays.asList("Thread per request model beats process per request (CGI)", "Platform-independent server components"),
                Arrays.asList("Confusing Web Server (static assets) with Servlet Container (dynamic bytecode)"),
                Arrays.asList("servlet", "servlet-architecture"),
                Collections.emptyList()));

        list.add(topic("Servlet Architecture", "servlet-architecture",
                "Servlet container model, thread pooling, request dispatcher, and servlet context.",
                Difficulty.ADVANCED, u5, order++,
                "Crucial for building scalable, thread-safe web services.",
                "The servlet container coordinates network sockets, thread pools, request/response wrapping, session management, and routing.",
                "Client ── HTTP Request ──► Container ── ThreadPool ──► Servlet.service()",
                Arrays.asList("Container manages lifecycle and thread pooling", "Request and response objects encapsulate HTTP data"),
                Arrays.asList("Blocking container threads with long-running synchronous computations"),
                Arrays.asList("servlet", "servlet-lifecycle"),
                Collections.emptyList()));

        list.add(topic("Servlet Lifecycle", "servlet-lifecycle",
                "The init(), service(), and destroy() phases managed by the servlet container.",
                Difficulty.ADVANCED, u5, order++,
                "Ensures understanding of component initialization, request dispatching, and graceful shutdown.",
                "The Servlet lifecycle comprises three phases: init() (called once on startup/first request), service() (dispatches doGet/doPost per request), and destroy() (called on shutdown).",
                "public void init(ServletConfig config) throws ServletException { ... }\npublic void service(ServletRequest req, ServletResponse res) { ... }\npublic void destroy() { ... }",
                Arrays.asList("init(): called once on loading", "service(): executed concurrently per HTTP request", "destroy(): called once on server shutdown"),
                Arrays.asList("Re-initializing resources in doGet() instead of init()"),
                Arrays.asList("servlet", "http-get", "http-post"),
                Collections.emptyList()));

        list.add(topic("HTTP GET", "http-get",
                "Processing idempotent retrieval requests using HttpServlet.doGet() and reading query parameters.",
                Difficulty.INTERMEDIATE, u5, order++,
                "Standard HTTP method for safe, cacheable data retrieval.",
                "doGet() handles HTTP GET requests. Parameters are passed in the URL query string and retrieved using req.getParameter().",
                "protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {\n    String name = req.getParameter(\"name\");\n    resp.getWriter().println(\"Hello \" + name);\n}",
                Arrays.asList("Idempotent and safe for reading data", "Parameters passed in URL query string"),
                Arrays.asList("Using GET for mutations like deleting or updating database records"),
                Arrays.asList("http-post", "servlet-lifecycle"),
                Collections.emptyList()));

        list.add(topic("HTTP POST", "http-post",
                "Handling payload-bearing mutation requests using HttpServlet.doPost() and parsing form/JSON data.",
                Difficulty.INTERMEDIATE, u5, order++,
                "Standard HTTP method for mutations, submissions, and large payloads.",
                "doPost() handles HTTP POST requests. Data is transmitted in the HTTP request body and is suitable for form submissions and mutations.",
                "protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException { ... }",
                Arrays.asList("Used for non-idempotent updates and mutations", "Payload transmitted in request body, not URL"),
                Arrays.asList("Forgetting to set character encoding or content type on response"),
                Arrays.asList("http-get", "servlet-lifecycle"),
                Collections.emptyList()));

        list.add(topic("Deploying Servlets", "deploying-servlets",
                "Packaging WAR files, web.xml deployment descriptors, and @WebServlet annotation configurations.",
                Difficulty.ADVANCED, u5, order++,
                "Essential for packaging and shipping Java web applications to production servers.",
                "Servlets are deployed in WAR (Web Application Archive) files, configured either through @WebServlet annotations or web.xml deployment descriptors.",
                "@WebServlet(name = \"ApiServlet\", urlPatterns = {\"/api/*\"})\npublic class ApiServlet extends HttpServlet { ... }",
                Arrays.asList("Configured via @WebServlet or web.xml", "Packaged into standard WAR file structure"),
                Arrays.asList("Conflicting URL patterns between web.xml and @WebServlet"),
                Arrays.asList("servlet", "application-server"),
                Collections.emptyList()));

        list.add(topic("Application Server", "application-server",
                "Web servers vs Servlet containers (Tomcat, Jetty) vs full Java EE / Jakarta EE application servers.",
                Difficulty.ADVANCED, u5, order++,
                "Guides enterprise deployment decisions across lightweight containers and full Jakarta EE servers.",
                "A Web Server delivers static content. A Servlet Container (Tomcat, Jetty) executes Java Servlets. An Application Server (WildFly, Payara) provides full Jakarta EE specifications including JMS, EJB, and transactions.",
                "// Static (Nginx) vs Container (Tomcat) vs Full EE (WildFly)",
                Arrays.asList("Tomcat is a Servlet Container", "Full EE servers support complete Jakarta specifications"),
                Arrays.asList("Deploying lightweight microservices to heavy full application servers when Tomcat or embedded Jetty suffices"),
                Arrays.asList("servlet", "deploying-servlets"),
                Collections.emptyList()));

        list.add(topic("Hibernate", "hibernate",
                "Object-Relational Mapping (ORM) framework bridging Java domain models and relational databases.",
                Difficulty.ADVANCED, u5, order++,
                "Eliminates boilerplate JDBC code and translates Java objects into relational database rows.",
                "Hibernate is an Object-Relational Mapping (ORM) framework that automates persistence of Java objects to relational database tables, managing SQL generation, caching, and transactions.",
                "Session session = sessionFactory.openSession();\nStudent student = session.get(Student.class, 1L);",
                Arrays.asList("ORM framework mapping Java objects to database tables", "Implements the JPA (Jakarta Persistence API) standard"),
                Arrays.asList("Ignoring lazy loading leading to LazyInitializationException or N+1 query problem"),
                Arrays.asList("hibernate-introduction", "hibernate-annotations", "hibernate-crud"),
                Collections.emptyList()));

        list.add(topic("Hibernate Introduction", "hibernate-introduction",
                "Core architecture, SessionFactory, Session, Transaction, and solving Impedance Mismatch.",
                Difficulty.INTERMEDIATE, u5, order++,
                "Understanding the core Hibernate architectural components ensures proper resource management.",
                "Hibernate solves the object-relational impedance mismatch using SessionFactory (thread-safe, expensive factory) and Session (short-lived, non-thread-safe database handle).",
                "Configuration cfg = new Configuration().configure();\nSessionFactory sf = cfg.buildSessionFactory();",
                Arrays.asList("SessionFactory is heavy and created once per application", "Session is lightweight and opened per transaction"),
                Arrays.asList("Sharing a Hibernate Session across multiple threads"),
                Arrays.asList("hibernate", "hibernate-crud"),
                Collections.emptyList()));

        list.add(topic("Hibernate Annotations", "hibernate-annotations",
                "Mapping JPA annotations: @Entity, @Table, @Id, @GeneratedValue, @Column, and relationships.",
                Difficulty.ADVANCED, u5, order++,
                "Declarative database schema mapping using standard JPA annotations.",
                "Hibernate uses standard JPA annotations to map Java classes to database tables: @Entity, @Table, @Id, @GeneratedValue, @Column, @ManyToOne, and @OneToMany.",
                "@Entity\n@Table(name = \"users\")\npublic class User {\n    @Id @GeneratedValue\n    private Long id;\n    @Column(nullable = false)\n    private String name;\n}",
                Arrays.asList("@Entity marks class as a persistent database entity", "@Id marks the primary key field"),
                Arrays.asList("Forgetting the default no-argument constructor in entity classes"),
                Arrays.asList("hibernate", "hibernate-crud"),
                Collections.emptyList()));

        list.add(topic("Hibernate CRUD", "hibernate-crud",
                "Executing Create, Read, Update, and Delete operations using Hibernate sessions.",
                Difficulty.ADVANCED, u5, order++,
                "Standard database operations without writing repetitive raw SQL queries.",
                "Hibernate provides persist() for Create, find() or get() for Read, merge() for Update, and remove() for Delete, managed within a Transaction.",
                "Transaction tx = session.beginTransaction();\nsession.persist(newStudent);\ntx.commit();",
                Arrays.asList("persist() inserts; get()/find() reads; merge() updates; remove() deletes", "Mutations must occur inside an active Transaction"),
                Arrays.asList("Modifying entities without committing the transaction (changes are rolled back)"),
                Arrays.asList("hibernate", "database-connectivity"),
                Collections.emptyList()));

        list.add(topic("Database Connectivity", "database-connectivity",
                "JDBC fundamentals, DriverManagers, Connection pools (HikariCP), and transactional isolation.",
                Difficulty.INTERMEDIATE, u5, order++,
                "The low-level foundation underneath all Java database frameworks.",
                "Java Database Connectivity (JDBC) is the core Java API for connecting to relational databases. In production, connection pools like HikariCP manage reusable database connections.",
                "Connection conn = DriverManager.getConnection(url, user, pass);\nPreparedStatement ps = conn.prepareStatement(\"SELECT * FROM users WHERE id = ?\");",
                Arrays.asList("JDBC provides standard SQL execution across database engines", "HikariCP provides high-performance connection pooling"),
                Arrays.asList("Concatenating strings into SQL queries leading to SQL injection (always use PreparedStatement)"),
                Arrays.asList("hibernate", "hibernate-introduction"),
                Collections.emptyList()));

        return list;
    }
}
