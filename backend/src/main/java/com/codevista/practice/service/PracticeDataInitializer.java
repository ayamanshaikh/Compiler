package com.codevista.practice.service;

import com.codevista.entity.Difficulty;
import com.codevista.practice.entity.PracticeQuestion;
import com.codevista.practice.entity.QuestionType;
import com.codevista.practice.repository.PracticeQuestionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
public class PracticeDataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(PracticeDataInitializer.class);

    private final PracticeQuestionRepository questionRepository;

    public PracticeDataInitializer(PracticeQuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (questionRepository.count() > 0) {
            log.info("Practice questions already seeded ({} questions). Skipping.", questionRepository.count());
            return;
        }

        log.info("Seeding CodeVista practice questions across all 8 question types...");
        List<PracticeQuestion> questions = buildSeedQuestions();
        questionRepository.saveAll(questions);
        log.info("Successfully seeded {} practice questions.", questions.size());
    }

    public static List<PracticeQuestion> buildSeedQuestions() {
        List<PracticeQuestion> list = new ArrayList<>();

        // 1. MCQ
        PracticeQuestion q1 = new PracticeQuestion(
                "history-of-java",
                QuestionType.MCQ,
                Difficulty.BEGINNER,
                "Java's Original Project Name",
                "What was the original name of the Java programming language when created by James Gosling in 1991 at Sun Microsystems?",
                "A",
                "Java was originally named 'Oak' after an oak tree standing outside James Gosling's office at Sun Microsystems before being renamed Java in 1995."
        );
        q1.setOptions(Arrays.asList("A) Oak", "B) Mocha", "C) C++ Extended", "D) HotJava"));
        q1.setHint("Think of a common hardwood tree in North America.");
        list.add(q1);

        // 2. MCQ
        PracticeQuestion q2 = new PracticeQuestion(
                "arraylist",
                QuestionType.MCQ,
                Difficulty.INTERMEDIATE,
                "ArrayList Growth Strategy",
                "When an ArrayList exceeds its capacity in standard modern OpenJDK, by approximately how much does its backing array grow?",
                "A",
                "ArrayList in OpenJDK grows by approximately 50% (newCapacity = oldCapacity + (oldCapacity >> 1)), balancing memory conservation and reallocation efficiency."
        );
        q2.setOptions(Arrays.asList(
                "A) 50% (oldCapacity + (oldCapacity >> 1))",
                "B) 100% (strictly doubles)",
                "C) Fixed 10 elements",
                "D) 25%"
        ));
        q2.setHint("Bitwise right shift by 1 divides an integer by 2.");
        list.add(q2);

        // 3. PREDICT_OUTPUT
        PracticeQuestion q3 = new PracticeQuestion(
                "loops",
                QuestionType.PREDICT_OUTPUT,
                Difficulty.BEGINNER,
                "Predict Loop Sum with Break",
                "What will be printed to standard output when this code executes?",
                "A",
                "The loop increments sum with i=1 (sum=1), i=2 (sum=3), and i=3 (sum=6). When i reaches 4, break immediately halts the loop, printing 6."
        );
        q3.setCodeSnippet("public class Main {\n    public static void main(String[] args) {\n        int sum = 0;\n        for (int i = 1; i <= 5; i++) {\n            if (i == 4) break;\n            sum += i;\n        }\n        System.out.println(sum);\n    }\n}");
        q3.setOptions(Arrays.asList("A) 6", "B) 10", "C) 15", "D) 4"));
        q3.setExpectedOutput("6");
        list.add(q3);

        // 4. PREDICT_OUTPUT
        PracticeQuestion q4 = new PracticeQuestion(
                "operators",
                QuestionType.PREDICT_OUTPUT,
                Difficulty.BEGINNER,
                "Integer Division & Modulus",
                "What is printed by this program?",
                "A",
                "In Java, integer division 7 / 2 truncates to 3, and modulus 7 % 2 yields the remainder 1."
        );
        q4.setCodeSnippet("public class Main {\n    public static void main(String[] args) {\n        int a = 7, b = 2;\n        System.out.println((a / b) + \" \" + (a % b));\n    }\n}");
        q4.setOptions(Arrays.asList("A) 3 1", "B) 3.5 1", "C) 3 0", "D) 3.5 0.5"));
        q4.setExpectedOutput("3 1");
        list.add(q4);

        // 5. FIND_ERROR
        PracticeQuestion q5 = new PracticeQuestion(
                "methods",
                QuestionType.FIND_ERROR,
                Difficulty.INTERMEDIATE,
                "Static vs Instance Context",
                "Which option correctly identifies the compile-time error in this code?",
                "A",
                "The main method is static and cannot directly access non-static instance fields without an object instance."
        );
        q5.setCodeSnippet("public class Main {\n    int instanceVal = 42;\n    public static void main(String[] args) {\n        System.out.println(instanceVal);\n    }\n}");
        q5.setOptions(Arrays.asList(
                "A) Non-static field instanceVal cannot be referenced from static context",
                "B) Main class cannot contain fields",
                "C) System.out.println requires string literals only",
                "D) instanceVal must be marked final"
        ));
        list.add(q5);

        // 6. FIX_CODE
        PracticeQuestion q6 = new PracticeQuestion(
                "arrays",
                QuestionType.FIX_CODE,
                Difficulty.BEGINNER,
                "Fix Array Bounds Condition",
                "The code throws ArrayIndexOutOfBoundsException at runtime. Fix the loop condition so it prints 100 without crashing.",
                "100",
                "Array indices are 0 to length - 1. Changing i <= numbers.length to i < numbers.length prevents the exception and prints 100."
        );
        q6.setCodeSnippet("public class Main {\n    public static void main(String[] args) {\n        int[] numbers = {10, 20, 30, 40};\n        int sum = 0;\n        for (int i = 0; i <= numbers.length; i++) {\n            sum += numbers[i];\n        }\n        System.out.println(sum);\n    }\n}");
        q6.setStarterCode("public class Main {\n    public static void main(String[] args) {\n        int[] numbers = {10, 20, 30, 40};\n        int sum = 0;\n        for (int i = 0; i < numbers.length; i++) {\n            sum += numbers[i];\n        }\n        System.out.println(sum);\n    }\n}");
        q6.setExpectedOutput("100");
        list.add(q6);

        // 7. WRITE_CODE
        PracticeQuestion q7 = new PracticeQuestion(
                "arrays",
                QuestionType.WRITE_CODE,
                Difficulty.BEGINNER,
                "Compute Array Sum",
                "Complete the Java program in class Main to calculate the sum of numbers {5, 10, 15, 20} and print the result.",
                "50",
                "Summing 5 + 10 + 15 + 20 yields 50."
        );
        q7.setStarterCode("public class Main {\n    public static void main(String[] args) {\n        int[] arr = {5, 10, 15, 20};\n        int sum = 0;\n        for (int n : arr) {\n            sum += n;\n        }\n        System.out.println(sum);\n    }\n}");
        q7.setExpectedOutput("50");
        list.add(q7);

        // 8. DEBUG_CODE
        PracticeQuestion q8 = new PracticeQuestion(
                "exceptions",
                QuestionType.DEBUG_CODE,
                Difficulty.INTERMEDIATE,
                "Prevent NullPointerException",
                "Debug the condition so that when text is null, it avoids NullPointerException and prints 'Safe: default'.",
                "Safe: default",
                "Evaluating text != null before text.length() utilizes short-circuit evaluation to prevent NullPointerException."
        );
        q8.setCodeSnippet("public class Main {\n    public static void main(String[] args) {\n        String text = null;\n        if (text.length() > 0 && text != null) {\n            System.out.println(\"Valid: \" + text);\n        } else {\n            System.out.println(\"Safe: default\");\n        }\n    }\n}");
        q8.setStarterCode("public class Main {\n    public static void main(String[] args) {\n        String text = null;\n        if (text != null && text.length() > 0) {\n            System.out.println(\"Valid: \" + text);\n        } else {\n            System.out.println(\"Safe: default\");\n        }\n    }\n}");
        q8.setExpectedOutput("Safe: default");
        list.add(q8);

        // 9. MATCH_CONCEPT
        PracticeQuestion q9 = new PracticeQuestion(
                "inheritance",
                QuestionType.MATCH_CONCEPT,
                Difficulty.INTERMEDIATE,
                "Match Core OOP Keywords",
                "Match each Java OOP keyword with its primary role:\n1. super  2. final  3. implements  4. abstract",
                "A",
                "super references parent class members; final forbids inheritance or reassignment; implements satisfies interface contracts; abstract designates incomplete class templates."
        );
        q9.setOptions(Arrays.asList(
                "A) 1-Parent Reference, 2-Immutability/No Inheritance, 3-Interface Contract, 4-Incomplete Class",
                "B) 1-Interface Contract, 2-Parent Reference, 3-Immutability, 4-Dynamic Dispatch",
                "C) 1-Incomplete Class, 2-Interface Contract, 3-Parent Reference, 4-Immutability",
                "D) 1-Immutability, 2-Parent Reference, 3-Incomplete Class, 4-Interface Contract"
        ));
        list.add(q9);

        // 10. ALGORITHM
        PracticeQuestion q10 = new PracticeQuestion(
                "arrays",
                QuestionType.ALGORITHM,
                Difficulty.INTERMEDIATE,
                "Linear Search Algorithm",
                "Complete the linear search to find target = 42 in array {10, 25, 42, 67, 89}. Print 'Found at index ' + index.",
                "Found at index 2",
                "Linear search examines each index sequentially. Value 42 is located at index 2."
        );
        q10.setStarterCode("public class Main {\n    public static void main(String[] args) {\n        int[] arr = {10, 25, 42, 67, 89};\n        int target = 42;\n        int foundIndex = -1;\n        for (int i = 0; i < arr.length; i++) {\n            if (arr[i] == target) {\n                foundIndex = i;\n                break;\n            }\n        }\n        if (foundIndex != -1) {\n            System.out.println(\"Found at index \" + foundIndex);\n        } else {\n            System.out.println(\"Not found\");\n        }\n    }\n}");
        q10.setExpectedOutput("Found at index 2");
        list.add(q10);

        return list;
    }
}
