package com.codevista.algorithm.service;

import com.codevista.algorithm.dto.AlgorithmInfoResponse;
import com.codevista.algorithm.dto.AlgorithmTraceRequest;
import com.codevista.algorithm.dto.AlgorithmTraceResponse;
import com.codevista.algorithm.model.AlgorithmMetadata;
import com.codevista.algorithm.model.AlgorithmStep;
import com.codevista.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AlgorithmService {

    private final AlgorithmRegistry registry;

    public AlgorithmService(AlgorithmRegistry registry) {
        this.registry = registry;
    }

    public List<AlgorithmInfoResponse> getAllAlgorithms() {
        return registry.getAllAlgorithms().stream()
                .map(AlgorithmInfoResponse::new)
                .collect(Collectors.toList());
    }

    public AlgorithmInfoResponse getAlgorithm(String slug) {
        AlgorithmMetadata meta = registry.getAlgorithm(slug);
        if (meta == null) {
            throw new ResourceNotFoundException("Algorithm not found with slug: " + slug);
        }
        return new AlgorithmInfoResponse(meta);
    }

    public AlgorithmTraceResponse generateTrace(String slug, AlgorithmTraceRequest request) {
        AlgorithmMetadata meta = registry.getAlgorithm(slug);
        if (meta == null) {
            throw new ResourceNotFoundException("Algorithm not found with slug: " + slug);
        }

        List<Integer> input = (request != null && request.getInput() != null && !request.getInput().isEmpty())
                ? new ArrayList<>(request.getInput())
                : new ArrayList<>(meta.getDefaultInput());

        // Cap input size for responsive educational execution
        if (input.size() > 25) {
            input = input.subList(0, 25);
        }

        Integer target = (request != null && request.getTarget() != null)
                ? request.getTarget()
                : (meta.getDefaultTarget() != null ? meta.getDefaultTarget() : 0);

        List<AlgorithmStep> steps;

        switch (slug) {
            case "bubble-sort":
                steps = registry.traceBubbleSort(input);
                break;
            case "selection-sort":
                steps = registry.traceSelectionSort(input);
                break;
            case "insertion-sort":
                steps = registry.traceInsertionSort(input);
                break;
            case "quick-sort":
                steps = registry.traceQuickSort(input);
                break;
            case "binary-search":
                steps = registry.traceBinarySearch(input, target);
                break;
            case "linear-search":
                steps = registry.traceLinearSearch(input, target);
                break;
            case "two-sum-sorted":
                steps = registry.traceTwoSumTwoPointers(input, target);
                break;
            case "stack-visualizer":
                steps = registry.traceStackVisualizer(input);
                break;
            default:
                throw new ResourceNotFoundException("No simulation engine implemented for algorithm: " + slug);
        }

        int totalComparisons = steps.isEmpty() ? 0 : steps.get(steps.size() - 1).getComparisons();
        int totalSwaps = steps.isEmpty() ? 0 : steps.get(steps.size() - 1).getSwaps();

        return new AlgorithmTraceResponse(
                meta.getSlug(),
                meta.getName(),
                steps,
                totalComparisons,
                totalSwaps,
                true
        );
    }
}
