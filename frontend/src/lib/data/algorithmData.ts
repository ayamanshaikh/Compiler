import { AlgorithmMetadata } from "@/lib/api/algorithm";

export const FALLBACK_ALGORITHMS: AlgorithmMetadata[] = [
  {
    slug: "bubble-sort",
    name: "Bubble Sort",
    category: "SORTING",
    description: "Repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order. Larger elements bubble up to the end of the array after each pass.",
    timeComplexityBest: "O(n)",
    timeComplexityAverage: "O(n²)",
    timeComplexityWorst: "O(n²)",
    spaceComplexity: "O(1)",
    javaCode: `public class BubbleSort {
    public static void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }
}`,
    defaultInput: [45, 22, 89, 14, 67, 33, 50],
  },
  {
    slug: "selection-sort",
    name: "Selection Sort",
    category: "SORTING",
    description: "Divides the array into a sorted and unsorted region. Repeatedly finds the smallest element from the unsorted region and swaps it to the front.",
    timeComplexityBest: "O(n²)",
    timeComplexityAverage: "O(n²)",
    timeComplexityWorst: "O(n²)",
    spaceComplexity: "O(1)",
    javaCode: `public class SelectionSort {
    public static void selectionSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            int minIdx = i;
            for (int j = i + 1; j < n; j++) {
                if (arr[j] < arr[minIdx]) {
                    minIdx = j;
                }
            }
            int temp = arr[minIdx];
            arr[minIdx] = arr[i];
            arr[i] = temp;
        }
    }
}`,
    defaultInput: [64, 25, 12, 22, 11],
  },
  {
    slug: "insertion-sort",
    name: "Insertion Sort",
    category: "SORTING",
    description: "Builds the sorted array one element at a time by picking the next element and shifting larger elements in the sorted partition to make room.",
    timeComplexityBest: "O(n)",
    timeComplexityAverage: "O(n²)",
    timeComplexityWorst: "O(n²)",
    spaceComplexity: "O(1)",
    javaCode: `public class InsertionSort {
    public static void insertionSort(int[] arr) {
        int n = arr.length;
        for (int i = 1; i < n; i++) {
            int key = arr[i];
            int j = i - 1;
            while (j >= 0 && arr[j] > key) {
                arr[j + 1] = arr[j];
                j = j - 1;
            }
            arr[j + 1] = key;
        }
    }
}`,
    defaultInput: [31, 41, 59, 26, 41, 58],
  },
  {
    slug: "quick-sort",
    name: "Quick Sort",
    category: "SORTING",
    description: "Picks a pivot element and partitions the array around the pivot such that elements less than pivot precede elements greater than pivot, then recurses on subarrays.",
    timeComplexityBest: "O(n log n)",
    timeComplexityAverage: "O(n log n)",
    timeComplexityWorst: "O(n²)",
    spaceComplexity: "O(log n)",
    javaCode: `public class QuickSort {
    public static void quickSort(int[] arr, int low, int high) {
        if (low < high) {
            int pi = partition(arr, low, high);
            quickSort(arr, low, pi - 1);
            quickSort(arr, pi + 1, high);
        }
    }
    private static int partition(int[] arr, int low, int high) {
        int pivot = arr[high];
        int i = low - 1;
        for (int j = low; j < high; j++) {
            if (arr[j] < pivot) {
                i++;
                swap(arr, i, j);
            }
        }
        swap(arr, i + 1, high);
        return i + 1;
    }
}`,
    defaultInput: [50, 23, 9, 18, 61, 32],
  },
  {
    slug: "binary-search",
    name: "Binary Search",
    category: "SEARCHING",
    description: "Finds the position of a target value within a sorted array by repeatedly halving the search interval.",
    timeComplexityBest: "O(1)",
    timeComplexityAverage: "O(log n)",
    timeComplexityWorst: "O(log n)",
    spaceComplexity: "O(1)",
    javaCode: `public class BinarySearch {
    public static int binarySearch(int[] arr, int target) {
        int left = 0;
        int right = arr.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (arr[mid] == target) return mid;
            if (arr[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
}`,
    defaultInput: [12, 24, 32, 45, 57, 68, 79, 90],
    defaultTarget: 57,
  },
  {
    slug: "linear-search",
    name: "Linear Search",
    category: "SEARCHING",
    description: "Sequentially checks each element of the list until a match is found or the whole list has been searched.",
    timeComplexityBest: "O(1)",
    timeComplexityAverage: "O(n)",
    timeComplexityWorst: "O(n)",
    spaceComplexity: "O(1)",
    javaCode: `public class LinearSearch {
    public static int linearSearch(int[] arr, int target) {
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                return i;
            }
        }
        return -1;
    }
}`,
    defaultInput: [40, 10, 80, 50, 70, 30, 90],
    defaultTarget: 70,
  },
  {
    slug: "two-sum-sorted",
    name: "Two Sum (Two Pointers)",
    category: "TWO_POINTERS",
    description: "Given a sorted array of numbers, finds two indices whose values sum to a specific target using two inward-moving pointers.",
    timeComplexityBest: "O(1)",
    timeComplexityAverage: "O(n)",
    timeComplexityWorst: "O(n)",
    spaceComplexity: "O(1)",
    javaCode: `public class TwoSumTwoPointers {
    public static int[] twoSum(int[] numbers, int target) {
        int left = 0;
        int right = numbers.length - 1;
        while (left < right) {
            int sum = numbers[left] + numbers[right];
            if (sum == target) return new int[]{left, right};
            if (sum < target) left++;
            else right--;
        }
        return new int[]{-1, -1};
    }
}`,
    defaultInput: [2, 7, 11, 15, 20, 28],
    defaultTarget: 26,
  },
  {
    slug: "stack-visualizer",
    name: "Stack (LIFO Operations)",
    category: "DATA_STRUCTURES",
    description: "Visualizes Last-In First-Out (LIFO) stack operations: Push to top, Peek current top, and Pop off the stack.",
    timeComplexityBest: "O(1)",
    timeComplexityAverage: "O(1)",
    timeComplexityWorst: "O(1)",
    spaceComplexity: "O(n)",
    javaCode: `public class StackVisualizer {
    private int[] stack = new int[10];
    private int top = -1;
    public void push(int val) { stack[++top] = val; }
    public int pop() { return stack[top--]; }
    public int peek() { return stack[top]; }
}`,
    defaultInput: [10, 20, 30, 40],
  },
];
