export interface AlgorithmExample {
  name: string;
  description: string;
  category: string;
  code: string;
}

export const ALGORITHM_EXAMPLES: AlgorithmExample[] = [
  {
    name: "Bubble Sort",
    description: "Repeatedly swap adjacent elements if they are in wrong order.",
    category: "Sorting",
    code: `public class Main {
    public static void main(String[] args) {
        int[] arr = {5, 3, 8, 1};

        for (int i = 0; i < arr.length - 1; i++) {
            for (int j = 0; j < arr.length - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }

        System.out.print("Sorted: ");
        for (int i = 0; i < arr.length; i++) {
            System.out.print(arr[i] + " ");
        }
        System.out.println();
    }
}`,
  },
  {
    name: "Selection Sort",
    description: "Find the minimum and place it at the beginning.",
    category: "Sorting",
    code: `public class Main {
    public static void main(String[] args) {
        int[] arr = {64, 25, 12, 22, 11};

        for (int i = 0; i < arr.length - 1; i++) {
            int minIdx = i;
            for (int j = i + 1; j < arr.length; j++) {
                if (arr[j] < arr[minIdx]) {
                    minIdx = j;
                }
            }
            int temp = arr[minIdx];
            arr[minIdx] = arr[i];
            arr[i] = temp;
        }

        System.out.print("Sorted: ");
        for (int i = 0; i < arr.length; i++) {
            System.out.print(arr[i] + " ");
        }
        System.out.println();
    }
}`,
  },
  {
    name: "Linear Search",
    description: "Search each element one by one until found.",
    category: "Search",
    code: `public class Main {
    public static void main(String[] args) {
        int[] arr = {10, 23, 45, 70, 11, 15};
        int target = 70;
        int foundIndex = -1;

        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                foundIndex = i;
                break;
            }
        }

        if (foundIndex != -1) {
            System.out.println("Found " + target + " at index " + foundIndex);
        } else {
            System.out.println(target + " not found in the array");
        }
    }
}`,
  },
  {
    name: "Binary Search",
    description: "Efficiently find a value in a sorted array.",
    category: "Search",
    code: `public class Main {
    public static void main(String[] args) {
        int[] arr = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
        int target = 23;
        int low = 0;
        int high = arr.length - 1;
        int foundIndex = -1;

        while (low <= high) {
            int mid = (low + high) / 2;
            if (arr[mid] == target) {
                foundIndex = mid;
                break;
            } else if (arr[mid] < target) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        if (foundIndex != -1) {
            System.out.println("Found " + target + " at index " + foundIndex);
        } else {
            System.out.println(target + " not found");
        }
    }
}`,
  },
  {
    name: "Factorial (Recursion)",
    description: "Calculate n! using recursive calls.",
    category: "Recursion",
    code: `public class Main {
    public static int factorial(int n) {
        if (n <= 1) {
            return 1;
        }
        return n * factorial(n - 1);
    }

    public static void main(String[] args) {
        int n = 5;
        int result = factorial(n);
        System.out.println("factorial(" + n + ") = " + result);
    }
}`,
  },
  {
    name: "Fibonacci (Recursion)",
    description: "Generate Fibonacci numbers recursively.",
    category: "Recursion",
    code: `public class Main {
    public static int fibonacci(int n) {
        if (n <= 0) {
            return 0;
        }
        if (n == 1) {
            return 1;
        }
        return fibonacci(n - 1) + fibonacci(n - 2);
    }

    public static void main(String[] args) {
        System.out.print("Fibonacci: ");
        for (int i = 0; i < 8; i++) {
            System.out.print(fibonacci(i) + " ");
        }
        System.out.println();
    }
}`,
  },
  {
    name: "Stack Operations",
    description: "Push, pop, and peek on a stack.",
    category: "Data Structures",
    code: `public class Main {
    public static void main(String[] args) {
        int[] stack = new int[10];
        int top = -1;

        // Push
        stack[++top] = 10;
        stack[++top] = 20;
        stack[++top] = 30;

        System.out.println("Pushed: 10, 20, 30");
        System.out.println("Top element: " + stack[top]);

        // Pop
        System.out.println("Popped: " + stack[top--]);
        System.out.println("Popped: " + stack[top--]);

        System.out.println("New top: " + stack[top]);
    }
}`,
  },
  {
    name: "Queue Operations",
    description: "Enqueue and dequeue from a circular queue.",
    category: "Data Structures",
    code: `public class Main {
    public static void main(String[] args) {
        int[] queue = new int[5];
        int front = 0;
        int rear = -1;
        int size = 0;

        // Enqueue
        queue[++rear % queue.length] = 100;
        size++;
        queue[++rear % queue.length] = 200;
        size++;
        queue[++rear % queue.length] = 300;
        size++;

        System.out.println("Enqueued: 100, 200, 300");
        System.out.println("Queue size: " + size);

        // Dequeue
        System.out.println("Dequeued: " + queue[front]);
        front = (front + 1) % queue.length;
        size--;

        System.out.println("Dequeued: " + queue[front]);
        front = (front + 1) % queue.length;
        size--;

        System.out.println("Front element: " + queue[front]);
        System.out.println("Queue size: " + size);
    }
}`,
  },
];
