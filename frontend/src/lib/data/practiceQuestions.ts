import { PracticeQuestion } from "@/lib/api/practice";

export const FALLBACK_PRACTICE_QUESTIONS: PracticeQuestion[] = [
  {
    id: 1,
    topicSlug: "history-and-evolution-of-java",
    questionType: "MCQ",
    difficulty: "BEGINNER",
    title: "Original Project Name of Java",
    prompt: "During the Green Project at Sun Microsystems in 1991 led by James Gosling, what was the initial name of the programming language before it was renamed to Java?",
    options: ["Oak", "GreenTalk", "C++--", "HotJava"],
    hint: "It was named after an impressive tree that stood outside James Gosling's office.",
    createdAt: "2026-10-07T00:00:00Z"
  },
  {
    id: 2,
    topicSlug: "variables-types",
    questionType: "PREDICT_OUTPUT",
    difficulty: "BEGINNER",
    title: "Predict Output: String Concatenation and Addition",
    prompt: "Analyze the Java code snippet below. What exact string will be printed to standard output when this code executes?",
    codeSnippet: `public class Main {
    public static void main(String[] args) {
        int a = 10;
        int b = 20;
        System.out.println("Result: " + a + b);
    }
}`,
    expectedOutput: "Result: 1020",
    starterCode: `public class Main {
    public static void main(String[] args) {
        int a = 10;
        int b = 20;
        System.out.println("Result: " + a + b);
    }
}`,
    options: [],
    hint: "The + operator evaluates from left to right. When one operand is a String, numeric addition converts to string concatenation.",
    createdAt: "2026-10-07T00:00:00Z"
  },
  {
    id: 3,
    topicSlug: "oop-basics",
    questionType: "FIND_ERROR",
    difficulty: "INTERMEDIATE",
    title: "Identify Compilation Error in Static Context",
    prompt: "Which line number in the following Java snippet causes a compiler error, and why?",
    codeSnippet: `public class Counter {
    private int count = 0; // line 2

    public static void increment() { // line 4
        count++; // line 5
    }
}`,
    options: [
        "Line 2: Private field cannot be initialized inline",
        "Line 4: Static method cannot have public access",
        "Line 5: Cannot make a static reference to the non-static field 'count'",
        "Line 6: Missing return statement in increment method"
    ],
    hint: "Static methods belong to the class, not to any individual instance. They cannot directly access instance fields.",
    createdAt: "2026-10-07T00:00:00Z"
  },
  {
    id: 4,
    topicSlug: "strings",
    questionType: "FIX_CODE",
    difficulty: "BEGINNER",
    title: "Prevent NullPointerException in String Method",
    prompt: "Fix the following method so that it returns 0 instead of throwing a NullPointerException when passed a null String.",
    codeSnippet: `public class Main {
    public static int getLength(String str) {
        return str.length();
    }
    public static void main(String[] args) {
        System.out.println(getLength(null));
    }
}`,
    starterCode: `public class Main {
    public static int getLength(String str) {
        // Fix this method to handle null safely
        if (str == null) return 0;
        return str.length();
    }
    public static void main(String[] args) {
        System.out.println(getLength(null));
    }
}`,
    expectedOutput: "0",
    options: [],
    hint: "Add a null check: if (str == null) return 0;",
    createdAt: "2026-10-07T00:00:00Z"
  },
  {
    id: 5,
    topicSlug: "arrays",
    questionType: "DEBUG_CODE",
    difficulty: "INTERMEDIATE",
    title: "Off-by-One Array Index Out of Bounds",
    prompt: "The code below attempts to print all elements of an array, but throws an ArrayIndexOutOfBoundsException at runtime. Correct the loop condition so it prints: 10 20 30",
    codeSnippet: `public class Main {
    public static void main(String[] args) {
        int[] nums = {10, 20, 30};
        for (int i = 0; i <= nums.length; i++) {
            System.out.print(nums[i] + " ");
        }
    }
}`,
    starterCode: `public class Main {
    public static void main(String[] args) {
        int[] nums = {10, 20, 30};
        for (int i = 0; i < nums.length; i++) {
            System.out.print(nums[i] + (i < nums.length - 1 ? " " : ""));
        }
        System.out.println();
    }
}`,
    expectedOutput: "10 20 30",
    options: [],
    hint: "Array indices are zero-based from 0 to length - 1. Using <= nums.length accesses index 3, which is out of bounds.",
    createdAt: "2026-10-07T00:00:00Z"
  },
  {
    id: 6,
    topicSlug: "oop-basics",
    questionType: "MATCH_CONCEPT",
    difficulty: "BEGINNER",
    title: "Match OOP Pillars to Definitions",
    prompt: "Which OOP concept represents hiding internal state and requiring all interaction to be performed through an object's public methods?",
    options: [
        "Inheritance",
        "Encapsulation",
        "Polymorphism",
        "Abstraction"
    ],
    hint: "Think of a protective capsule enclosing data and logic.",
    createdAt: "2026-10-07T00:00:00Z"
  },
  {
    id: 7,
    topicSlug: "arrays",
    questionType: "WRITE_CODE",
    difficulty: "BEGINNER",
    title: "Write Program: Compute Array Sum",
    prompt: "Write a complete Java program in class Main that creates an array containing {5, 10, 15, 20}, calculates the sum of all elements, and prints the sum to standard output.",
    starterCode: `public class Main {
    public static void main(String[] args) {
        int[] arr = {5, 10, 15, 20};
        int sum = 0;
        // Calculate the sum of elements
        for (int num : arr) {
            sum += num;
        }
        System.out.println(sum);
    }
}`,
    expectedOutput: "50",
    options: [],
    hint: "Use an enhanced for loop to accumulate each number into a sum variable.",
    createdAt: "2026-10-07T00:00:00Z"
  },
  {
    id: 8,
    topicSlug: "collections-framework",
    questionType: "ALGORITHM",
    difficulty: "INTERMEDIATE",
    title: "Two Sum Target Pair Finder",
    prompt: "Given the integer array {2, 7, 11, 15} and target 9, write an algorithm that finds the two indices whose values sum to the target and prints them separated by a space (e.g. '0 1').",
    starterCode: `import java.util.HashMap;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        int[] nums = {2, 7, 11, 15};
        int target = 9;
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                System.out.println(map.get(complement) + " " + i);
                return;
            }
            map.put(nums[i], i);
        }
    }
}`,
    expectedOutput: "0 1",
    options: [],
    hint: "Use a Map<Integer, Integer> to store seen values and their indices. For each number, check if target - num exists in the map.",
    createdAt: "2026-10-07T00:00:00Z"
  }
];
