package com.codevista.algorithm.service;

import com.codevista.algorithm.model.AlgorithmCategory;
import com.codevista.algorithm.model.AlgorithmMetadata;
import com.codevista.algorithm.model.AlgorithmStep;
import com.codevista.algorithm.model.HighlightType;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class AlgorithmRegistry {

    private final Map<String, AlgorithmMetadata> algorithms = new LinkedHashMap<>();

    public AlgorithmRegistry() {
        registerAlgorithms();
    }

    public List<AlgorithmMetadata> getAllAlgorithms() {
        return new ArrayList<>(algorithms.values());
    }

    public AlgorithmMetadata getAlgorithm(String slug) {
        return algorithms.get(slug);
    }

    private void registerAlgorithms() {
        // 1. Bubble Sort
        algorithms.put("bubble-sort", new AlgorithmMetadata(
                "bubble-sort",
                "Bubble Sort",
                AlgorithmCategory.SORTING,
                "Repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order. Larger elements bubble up to the end of the array after each pass.",
                "O(n)",
                "O(n²)",
                "O(n²)",
                "O(1)",
                """
                public class BubbleSort {
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
                }
                """.stripIndent(),
                List.of(45, 22, 89, 14, 67, 33, 50),
                null
        ));

        // 2. Selection Sort
        algorithms.put("selection-sort", new AlgorithmMetadata(
                "selection-sort",
                "Selection Sort",
                AlgorithmCategory.SORTING,
                "Divides the array into a sorted and unsorted region. Repeatedly finds the smallest element from the unsorted region and swaps it to the front.",
                "O(n²)",
                "O(n²)",
                "O(n²)",
                "O(1)",
                """
                public class SelectionSort {
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
                }
                """.stripIndent(),
                List.of(64, 25, 12, 22, 11),
                null
        ));

        // 3. Insertion Sort
        algorithms.put("insertion-sort", new AlgorithmMetadata(
                "insertion-sort",
                "Insertion Sort",
                AlgorithmCategory.SORTING,
                "Builds the sorted array one element at a time by picking the next element and shifting larger elements in the sorted partition to make room.",
                "O(n)",
                "O(n²)",
                "O(n²)",
                "O(1)",
                """
                public class InsertionSort {
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
                }
                """.stripIndent(),
                List.of(31, 41, 59, 26, 41, 58),
                null
        ));

        // 4. Quick Sort
        algorithms.put("quick-sort", new AlgorithmMetadata(
                "quick-sort",
                "Quick Sort",
                AlgorithmCategory.SORTING,
                "Picks a pivot element and partitions the array around the pivot such that elements less than pivot precede elements greater than pivot, then recurses on subarrays.",
                "O(n log n)",
                "O(n log n)",
                "O(n²)",
                "O(log n)",
                """
                public class QuickSort {
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
                }
                """.stripIndent(),
                List.of(50, 23, 9, 18, 61, 32),
                null
        ));

        // 5. Binary Search
        algorithms.put("binary-search", new AlgorithmMetadata(
                "binary-search",
                "Binary Search",
                AlgorithmCategory.SEARCHING,
                "Finds the position of a target value within a sorted array by repeatedly halving the search interval.",
                "O(1)",
                "O(log n)",
                "O(log n)",
                "O(1)",
                """
                public class BinarySearch {
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
                }
                """.stripIndent(),
                List.of(12, 24, 32, 45, 57, 68, 79, 90),
                57
        ));

        // 6. Linear Search
        algorithms.put("linear-search", new AlgorithmMetadata(
                "linear-search",
                "Linear Search",
                AlgorithmCategory.SEARCHING,
                "Sequentially checks each element of the list until a match is found or the whole list has been searched.",
                "O(1)",
                "O(n)",
                "O(n)",
                "O(1)",
                """
                public class LinearSearch {
                    public static int linearSearch(int[] arr, int target) {
                        for (int i = 0; i < arr.length; i++) {
                            if (arr[i] == target) {
                                return i;
                            }
                        }
                        return -1;
                    }
                }
                """.stripIndent(),
                List.of(40, 10, 80, 50, 70, 30, 90),
                70
        ));

        // 7. Two Sum (Two-Pointer Technique)
        algorithms.put("two-sum-sorted", new AlgorithmMetadata(
                "two-sum-sorted",
                "Two Sum (Two Pointers)",
                AlgorithmCategory.TWO_POINTERS,
                "Given a sorted array of numbers, finds two indices whose values sum to a specific target using two inward-moving pointers.",
                "O(1)",
                "O(n)",
                "O(n)",
                "O(1)",
                """
                public class TwoSumTwoPointers {
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
                }
                """.stripIndent(),
                List.of(2, 7, 11, 15, 20, 28),
                26
        ));

        // 8. Stack Visualizer
        algorithms.put("stack-visualizer", new AlgorithmMetadata(
                "stack-visualizer",
                "Stack (LIFO Operations)",
                AlgorithmCategory.DATA_STRUCTURES,
                "Visualizes Last-In First-Out (LIFO) stack operations: Push to top, Peek current top, and Pop off the stack.",
                "O(1)",
                "O(1)",
                "O(1)",
                "O(n)",
                """
                public class StackVisualizer {
                    private int[] stack = new int[10];
                    private int top = -1;
                    public void push(int val) { stack[++top] = val; }
                    public int pop() { return stack[top--]; }
                    public int peek() { return stack[top]; }
                }
                """.stripIndent(),
                List.of(10, 20, 30, 40),
                null
        ));
    }

    // -------------------------------------------------------------
    // Trace Simulation Generators
    // -------------------------------------------------------------

    public List<AlgorithmStep> traceBubbleSort(List<Integer> initial) {
        List<AlgorithmStep> steps = new ArrayList<>();
        List<Integer> arr = new ArrayList<>(initial);
        int comparisons = 0;
        int swaps = 0;
        int n = arr.size();

        // Initial state
        steps.add(new AlgorithmStep(steps.size(), 4, "Initial array before Bubble Sort passes.", arr, Map.of(), comparisons, swaps));

        for (int i = 0; i < n - 1; i++) {
            boolean swappedInPass = false;
            for (int j = 0; j < n - i - 1; j++) {
                comparisons++;
                Map<Integer, HighlightType> hl = new HashMap<>();
                hl.put(j, HighlightType.COMPARING);
                hl.put(j + 1, HighlightType.COMPARING);
                // Mark already sorted tail
                for (int s = n - i; s < n; s++) hl.put(s, HighlightType.SORTED);

                steps.add(new AlgorithmStep(steps.size(), 6,
                        "Comparing arr[" + j + "]=" + arr.get(j) + " and arr[" + (j + 1) + "]=" + arr.get(j + 1),
                        arr, hl, comparisons, swaps));

                if (arr.get(j) > arr.get(j + 1)) {
                    swaps++;
                    int temp = arr.get(j);
                    arr.set(j, arr.get(j + 1));
                    arr.set(j + 1, temp);
                    swappedInPass = true;

                    Map<Integer, HighlightType> swapHl = new HashMap<>();
                    swapHl.put(j, HighlightType.SWAPPING);
                    swapHl.put(j + 1, HighlightType.SWAPPING);
                    for (int s = n - i; s < n; s++) swapHl.put(s, HighlightType.SORTED);

                    steps.add(new AlgorithmStep(steps.size(), 7,
                            "Swapped arr[" + j + "] (" + arr.get(j + 1) + ") with arr[" + (j + 1) + "] (" + arr.get(j) + ")",
                            arr, swapHl, comparisons, swaps));
                }
            }
            // Mark n - i - 1 as sorted
            Map<Integer, HighlightType> passDone = new HashMap<>();
            for (int s = n - i - 1; s < n; s++) passDone.put(s, HighlightType.SORTED);
            steps.add(new AlgorithmStep(steps.size(), 5,
                    "Pass " + (i + 1) + " complete. Element at index " + (n - i - 1) + " is in its final sorted position.",
                    arr, passDone, comparisons, swaps));

            if (!swappedInPass) break;
        }

        // Final sorted
        Map<Integer, HighlightType> allSorted = new HashMap<>();
        for (int k = 0; k < n; k++) allSorted.put(k, HighlightType.SORTED);
        steps.add(new AlgorithmStep(steps.size(), 14, "Bubble sort completed! All elements sorted.", arr, allSorted, comparisons, swaps));

        return steps;
    }

    public List<AlgorithmStep> traceSelectionSort(List<Integer> initial) {
        List<AlgorithmStep> steps = new ArrayList<>();
        List<Integer> arr = new ArrayList<>(initial);
        int comparisons = 0;
        int swaps = 0;
        int n = arr.size();

        steps.add(new AlgorithmStep(steps.size(), 4, "Initial array before Selection Sort.", arr, Map.of(), comparisons, swaps));

        for (int i = 0; i < n - 1; i++) {
            int minIdx = i;
            Map<Integer, HighlightType> initMinHl = new HashMap<>();
            initMinHl.put(minIdx, HighlightType.PIVOT);
            for (int s = 0; s < i; s++) initMinHl.put(s, HighlightType.SORTED);

            steps.add(new AlgorithmStep(steps.size(), 6,
                    "Assume minimum at index " + minIdx + " (value " + arr.get(minIdx) + ") for current unsorted partition.",
                    arr, initMinHl, comparisons, swaps));

            for (int j = i + 1; j < n; j++) {
                comparisons++;
                Map<Integer, HighlightType> scanHl = new HashMap<>();
                scanHl.put(minIdx, HighlightType.PIVOT);
                scanHl.put(j, HighlightType.COMPARING);
                for (int s = 0; s < i; s++) scanHl.put(s, HighlightType.SORTED);

                steps.add(new AlgorithmStep(steps.size(), 7,
                        "Comparing candidate arr[" + j + "]=" + arr.get(j) + " with current minimum arr[" + minIdx + "]=" + arr.get(minIdx),
                        arr, scanHl, comparisons, swaps));

                if (arr.get(j) < arr.get(minIdx)) {
                    minIdx = j;
                    Map<Integer, HighlightType> newMinHl = new HashMap<>();
                    newMinHl.put(minIdx, HighlightType.PIVOT);
                    for (int s = 0; s < i; s++) newMinHl.put(s, HighlightType.SORTED);
                    steps.add(new AlgorithmStep(steps.size(), 8,
                            "New minimum found at index " + minIdx + " with value " + arr.get(minIdx),
                            arr, newMinHl, comparisons, swaps));
                }
            }

            if (minIdx != i) {
                swaps++;
                int temp = arr.get(minIdx);
                arr.set(minIdx, arr.get(i));
                arr.set(i, temp);

                Map<Integer, HighlightType> swapHl = new HashMap<>();
                swapHl.put(i, HighlightType.SWAPPING);
                swapHl.put(minIdx, HighlightType.SWAPPING);
                for (int s = 0; s < i; s++) swapHl.put(s, HighlightType.SORTED);

                steps.add(new AlgorithmStep(steps.size(), 12,
                        "Swapped minimum element " + temp + " into sorted index " + i,
                        arr, swapHl, comparisons, swaps));
            }

            Map<Integer, HighlightType> stepSorted = new HashMap<>();
            for (int s = 0; s <= i; s++) stepSorted.put(s, HighlightType.SORTED);
            steps.add(new AlgorithmStep(steps.size(), 5,
                    "Element at index " + i + " is now sorted in its final position.",
                    arr, stepSorted, comparisons, swaps));
        }

        Map<Integer, HighlightType> allSorted = new HashMap<>();
        for (int k = 0; k < n; k++) allSorted.put(k, HighlightType.SORTED);
        steps.add(new AlgorithmStep(steps.size(), 16, "Selection sort finished! Array is fully ordered.", arr, allSorted, comparisons, swaps));

        return steps;
    }

    public List<AlgorithmStep> traceInsertionSort(List<Integer> initial) {
        List<AlgorithmStep> steps = new ArrayList<>();
        List<Integer> arr = new ArrayList<>(initial);
        int comparisons = 0;
        int swaps = 0;
        int n = arr.size();

        steps.add(new AlgorithmStep(steps.size(), 4, "Initial array before Insertion Sort.", arr, Map.of(0, HighlightType.SORTED), comparisons, swaps));

        for (int i = 1; i < n; i++) {
            int key = arr.get(i);
            int j = i - 1;

            Map<Integer, HighlightType> keyHl = new HashMap<>();
            keyHl.put(i, HighlightType.ACTIVE);
            for (int s = 0; s < i; s++) keyHl.put(s, HighlightType.SORTED);

            steps.add(new AlgorithmStep(steps.size(), 5,
                    "Selecting key = " + key + " at index " + i + " to insert into sorted subarray.",
                    arr, keyHl, comparisons, swaps));

            while (j >= 0) {
                comparisons++;
                Map<Integer, HighlightType> compHl = new HashMap<>();
                compHl.put(j, HighlightType.COMPARING);
                compHl.put(j + 1, HighlightType.ACTIVE);

                steps.add(new AlgorithmStep(steps.size(), 7,
                        "Comparing sorted element arr[" + j + "]=" + arr.get(j) + " with key " + key,
                        arr, compHl, comparisons, swaps));

                if (arr.get(j) > key) {
                    swaps++;
                    arr.set(j + 1, arr.get(j));

                    Map<Integer, HighlightType> shiftHl = new HashMap<>();
                    shiftHl.put(j + 1, HighlightType.SWAPPING);

                    steps.add(new AlgorithmStep(steps.size(), 8,
                            "Shifted arr[" + j + "] (" + arr.get(j) + ") right to index " + (j + 1),
                            arr, shiftHl, comparisons, swaps));
                    j = j - 1;
                } else {
                    break;
                }
            }

            arr.set(j + 1, key);
            Map<Integer, HighlightType> insertedHl = new HashMap<>();
            for (int s = 0; s <= i; s++) insertedHl.put(s, HighlightType.SORTED);

            steps.add(new AlgorithmStep(steps.size(), 11,
                    "Inserted key " + key + " at position " + (j + 1) + ". Subarray [0.." + i + "] is sorted.",
                    arr, insertedHl, comparisons, swaps));
        }

        Map<Integer, HighlightType> allSorted = new HashMap<>();
        for (int k = 0; k < n; k++) allSorted.put(k, HighlightType.SORTED);
        steps.add(new AlgorithmStep(steps.size(), 14, "Insertion sort complete! All elements placed.", arr, allSorted, comparisons, swaps));

        return steps;
    }

    public List<AlgorithmStep> traceQuickSort(List<Integer> initial) {
        List<AlgorithmStep> steps = new ArrayList<>();
        List<Integer> arr = new ArrayList<>(initial);
        int[] counters = new int[]{0, 0}; // [comparisons, swaps]

        steps.add(new AlgorithmStep(steps.size(), 3, "Initial array before QuickSort recursion.", arr, Map.of(), counters[0], counters[1]));
        quickSortRecursive(arr, 0, arr.size() - 1, steps, counters);

        Map<Integer, HighlightType> allSorted = new HashMap<>();
        for (int k = 0; k < arr.size(); k++) allSorted.put(k, HighlightType.SORTED);
        steps.add(new AlgorithmStep(steps.size(), 8, "Quick Sort complete! Array fully partitioned and sorted.", arr, allSorted, counters[0], counters[1]));

        return steps;
    }

    private void quickSortRecursive(List<Integer> arr, int low, int high, List<AlgorithmStep> steps, int[] counters) {
        if (low < high) {
            int pi = partition(arr, low, high, steps, counters);
            quickSortRecursive(arr, low, pi - 1, steps, counters);
            quickSortRecursive(arr, pi + 1, high, steps, counters);
        } else if (low == high && low >= 0 && low < arr.size()) {
            Map<Integer, HighlightType> singleHl = new HashMap<>();
            singleHl.put(low, HighlightType.SORTED);
            steps.add(new AlgorithmStep(steps.size(), 4, "Single element at index " + low + " is sorted.", arr, singleHl, counters[0], counters[1]));
        }
    }

    private int partition(List<Integer> arr, int low, int high, List<AlgorithmStep> steps, int[] counters) {
        int pivot = arr.get(high);
        int i = low - 1;

        Map<Integer, HighlightType> pivotHl = new HashMap<>();
        pivotHl.put(high, HighlightType.PIVOT);
        for (int k = low; k < high; k++) pivotHl.put(k, HighlightType.ACTIVE);

        steps.add(new AlgorithmStep(steps.size(), 10,
                "Partitioning range [" + low + ".." + high + "] with pivot " + pivot + " at index " + high,
                arr, pivotHl, counters[0], counters[1]));

        for (int j = low; j < high; j++) {
            counters[0]++;
            Map<Integer, HighlightType> compHl = new HashMap<>();
            compHl.put(high, HighlightType.PIVOT);
            compHl.put(j, HighlightType.COMPARING);
            if (i >= low) compHl.put(i, HighlightType.POINTER_LEFT);

            steps.add(new AlgorithmStep(steps.size(), 13,
                    "Comparing arr[" + j + "]=" + arr.get(j) + " against pivot " + pivot,
                    arr, compHl, counters[0], counters[1]));

            if (arr.get(j) < pivot) {
                i++;
                counters[1]++;
                int temp = arr.get(i);
                arr.set(i, arr.get(j));
                arr.set(j, temp);

                Map<Integer, HighlightType> swapHl = new HashMap<>();
                swapHl.put(i, HighlightType.SWAPPING);
                swapHl.put(j, HighlightType.SWAPPING);
                swapHl.put(high, HighlightType.PIVOT);

                steps.add(new AlgorithmStep(steps.size(), 15,
                        "Swapped arr[" + i + "] with arr[" + j + "] (element < pivot)",
                        arr, swapHl, counters[0], counters[1]));
            }
        }

        counters[1]++;
        int temp = arr.get(i + 1);
        arr.set(i + 1, arr.get(high));
        arr.set(high, temp);

        Map<Integer, HighlightType> pivotDone = new HashMap<>();
        pivotDone.put(i + 1, HighlightType.SORTED);

        steps.add(new AlgorithmStep(steps.size(), 18,
                "Placed pivot " + pivot + " into final sorted partition index " + (i + 1),
                arr, pivotDone, counters[0], counters[1]));

        return i + 1;
    }

    public List<AlgorithmStep> traceBinarySearch(List<Integer> initial, int target) {
        List<AlgorithmStep> steps = new ArrayList<>();
        // Binary search requires sorted array
        List<Integer> arr = new ArrayList<>(initial);
        Collections.sort(arr);

        int comparisons = 0;
        int left = 0;
        int right = arr.size() - 1;
        boolean found = false;

        steps.add(new AlgorithmStep(steps.size(), 3,
                "Binary Search starting on sorted array. Target: " + target + ", Left: 0, Right: " + right,
                arr, Map.of(), comparisons, 0));

        while (left <= right) {
            int mid = left + (right - left) / 2;
            comparisons++;

            Map<Integer, HighlightType> ptrHl = new HashMap<>();
            ptrHl.put(left, HighlightType.POINTER_LEFT);
            ptrHl.put(right, HighlightType.POINTER_RIGHT);
            ptrHl.put(mid, HighlightType.POINTER_MID);

            // Gray out excluded ranges
            for (int k = 0; k < left; k++) ptrHl.put(k, HighlightType.DISCARDED);
            for (int k = right + 1; k < arr.size(); k++) ptrHl.put(k, HighlightType.DISCARDED);

            AlgorithmStep step = new AlgorithmStep(steps.size(), 6,
                    "Search window [" + left + ".." + right + "]. Computed mid=" + mid + " (value " + arr.get(mid) + "). Comparing with target " + target,
                    arr, ptrHl, comparisons, 0);
            step.getExtra().put("left", left);
            step.getExtra().put("right", right);
            step.getExtra().put("mid", mid);
            step.getExtra().put("target", target);
            steps.add(step);

            if (arr.get(mid) == target) {
                found = true;
                Map<Integer, HighlightType> foundHl = new HashMap<>();
                foundHl.put(mid, HighlightType.FOUND);
                AlgorithmStep fStep = new AlgorithmStep(steps.size(), 7,
                        "Target " + target + " found at index " + mid + "!",
                        arr, foundHl, comparisons, 0);
                fStep.getExtra().put("foundIndex", mid);
                steps.add(fStep);
                break;
            } else if (arr.get(mid) < target) {
                left = mid + 1;
                Map<Integer, HighlightType> moveLeft = new HashMap<>();
                moveLeft.put(mid, HighlightType.DISCARDED);
                AlgorithmStep mStep = new AlgorithmStep(steps.size(), 8,
                        "arr[" + mid + "]=" + arr.get(mid) + " < " + target + ". Discarding left half; updating left = " + left,
                        arr, moveLeft, comparisons, 0);
                mStep.getExtra().put("left", left);
                steps.add(mStep);
            } else {
                right = mid - 1;
                Map<Integer, HighlightType> moveRight = new HashMap<>();
                moveRight.put(mid, HighlightType.DISCARDED);
                AlgorithmStep mStep = new AlgorithmStep(steps.size(), 9,
                        "arr[" + mid + "]=" + arr.get(mid) + " > " + target + ". Discarding right half; updating right = " + right,
                        arr, moveRight, comparisons, 0);
                mStep.getExtra().put("right", right);
                steps.add(mStep);
            }
        }

        if (!found) {
            Map<Integer, HighlightType> notFoundHl = new HashMap<>();
            for (int k = 0; k < arr.size(); k++) notFoundHl.put(k, HighlightType.DISCARDED);
            steps.add(new AlgorithmStep(steps.size(), 11,
                    "Target " + target + " not found in array (left > right). Returned -1.",
                    arr, notFoundHl, comparisons, 0));
        }

        return steps;
    }

    public List<AlgorithmStep> traceLinearSearch(List<Integer> arr, int target) {
        List<AlgorithmStep> steps = new ArrayList<>();
        int comparisons = 0;
        boolean found = false;

        steps.add(new AlgorithmStep(steps.size(), 3,
                "Linear Search initialized. Target: " + target + ". Scanning from index 0 to " + (arr.size() - 1),
                arr, Map.of(), comparisons, 0));

        for (int i = 0; i < arr.size(); i++) {
            comparisons++;
            Map<Integer, HighlightType> scanHl = new HashMap<>();
            scanHl.put(i, HighlightType.COMPARING);
            for (int k = 0; k < i; k++) scanHl.put(k, HighlightType.DISCARDED);

            steps.add(new AlgorithmStep(steps.size(), 4,
                    "Inspecting element at index " + i + ": arr[" + i + "]=" + arr.get(i) + ". Is it equal to " + target + "?",
                    arr, scanHl, comparisons, 0));

            if (arr.get(i) == target) {
                found = true;
                Map<Integer, HighlightType> foundHl = new HashMap<>();
                foundHl.put(i, HighlightType.FOUND);
                steps.add(new AlgorithmStep(steps.size(), 5,
                        "Match found! Target " + target + " is located at index " + i,
                        arr, foundHl, comparisons, 0));
                break;
            }
        }

        if (!found) {
            Map<Integer, HighlightType> notFoundHl = new HashMap<>();
            for (int k = 0; k < arr.size(); k++) notFoundHl.put(k, HighlightType.DISCARDED);
            steps.add(new AlgorithmStep(steps.size(), 8,
                    "End of array reached without match. Target " + target + " not found. Returned -1.",
                    arr, notFoundHl, comparisons, 0));
        }

        return steps;
    }

    public List<AlgorithmStep> traceTwoSumTwoPointers(List<Integer> initial, int target) {
        List<AlgorithmStep> steps = new ArrayList<>();
        List<Integer> arr = new ArrayList<>(initial);
        Collections.sort(arr);

        int left = 0;
        int right = arr.size() - 1;
        int comparisons = 0;
        boolean found = false;

        steps.add(new AlgorithmStep(steps.size(), 3,
                "Two-Pointer search on sorted array for pair summing to target: " + target,
                arr, Map.of(left, HighlightType.POINTER_LEFT, right, HighlightType.POINTER_RIGHT), comparisons, 0));

        while (left < right) {
            comparisons++;
            int sum = arr.get(left) + arr.get(right);

            Map<Integer, HighlightType> ptrHl = new HashMap<>();
            ptrHl.put(left, HighlightType.POINTER_LEFT);
            ptrHl.put(right, HighlightType.POINTER_RIGHT);

            AlgorithmStep step = new AlgorithmStep(steps.size(), 6,
                    "Evaluating pair: arr[" + left + "]=" + arr.get(left) + " + arr[" + right + "]=" + arr.get(right) +
                            " = " + sum + " (Target: " + target + ")",
                    arr, ptrHl, comparisons, 0);
            step.getExtra().put("left", left);
            step.getExtra().put("right", right);
            step.getExtra().put("sum", sum);
            step.getExtra().put("target", target);
            steps.add(step);

            if (sum == target) {
                found = true;
                Map<Integer, HighlightType> foundHl = new HashMap<>();
                foundHl.put(left, HighlightType.FOUND);
                foundHl.put(right, HighlightType.FOUND);
                steps.add(new AlgorithmStep(steps.size(), 7,
                        "Target pair found! Indices: [" + left + ", " + right + "] with values " + arr.get(left) + " + " + arr.get(right) + " = " + target,
                        arr, foundHl, comparisons, 0));
                break;
            } else if (sum < target) {
                left++;
                Map<Integer, HighlightType> moveL = new HashMap<>();
                moveL.put(left, HighlightType.POINTER_LEFT);
                moveL.put(right, HighlightType.POINTER_RIGHT);
                steps.add(new AlgorithmStep(steps.size(), 8,
                        "Sum " + sum + " < target " + target + ". Incrementing left pointer to " + left + " to increase sum.",
                        arr, moveL, comparisons, 0));
            } else {
                right--;
                Map<Integer, HighlightType> moveR = new HashMap<>();
                moveR.put(left, HighlightType.POINTER_LEFT);
                moveR.put(right, HighlightType.POINTER_RIGHT);
                steps.add(new AlgorithmStep(steps.size(), 9,
                        "Sum " + sum + " > target " + target + ". Decrementing right pointer to " + right + " to decrease sum.",
                        arr, moveR, comparisons, 0));
            }
        }

        if (!found) {
            steps.add(new AlgorithmStep(steps.size(), 11,
                    "No two numbers sum to " + target + " in this array. Returned [-1, -1].",
                    arr, Map.of(), comparisons, 0));
        }

        return steps;
    }

    public List<AlgorithmStep> traceStackVisualizer(List<Integer> initial) {
        List<AlgorithmStep> steps = new ArrayList<>();
        List<Integer> stackState = new ArrayList<>();

        steps.add(new AlgorithmStep(steps.size(), 2, "Stack initialized empty. Top = -1.", stackState, Map.of(), 0, 0));

        // Push items
        for (int val : initial) {
            stackState.add(val);
            int top = stackState.size() - 1;
            Map<Integer, HighlightType> pushHl = new HashMap<>();
            pushHl.put(top, HighlightType.ACTIVE);
            steps.add(new AlgorithmStep(steps.size(), 5,
                    "PUSH(" + val + "): Inserted element at top index " + top + ".",
                    stackState, pushHl, 0, 0));
        }

        // Peek
        if (!stackState.isEmpty()) {
            int top = stackState.size() - 1;
            Map<Integer, HighlightType> peekHl = new HashMap<>();
            peekHl.put(top, HighlightType.POINTER_MID);
            steps.add(new AlgorithmStep(steps.size(), 7,
                    "PEEK(): Top element is " + stackState.get(top) + " at index " + top + ".",
                    stackState, peekHl, 0, 0));
        }

        // Pop one
        if (!stackState.isEmpty()) {
            int popped = stackState.remove(stackState.size() - 1);
            int newTop = stackState.size() - 1;
            Map<Integer, HighlightType> popHl = new HashMap<>();
            if (newTop >= 0) popHl.put(newTop, HighlightType.ACTIVE);
            steps.add(new AlgorithmStep(steps.size(), 6,
                    "POP(): Removed top element " + popped + ". New top is index " + newTop + ".",
                    stackState, popHl, 0, 0));
        }

        return steps;
    }
}
