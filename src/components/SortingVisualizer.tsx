import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Sliders,
  Sparkles,
  Info,
  CheckCircle2,
  Zap,
  Activity,
  Code,
  Volume2,
  VolumeX,
  Tv,
  Layers
} from 'lucide-react';

export type AlgorithmType =
  | 'mergesort'
  | 'quicksort'
  | 'heapsort'
  | 'shellsort'
  | 'radixsort'
  | 'insertionsort'
  | 'selectionsort'
  | 'bubblesort'
  | 'cocktailsort';

interface SortingVisualizerProps {
  initialAlgorithm?: AlgorithmType;
  compact?: boolean;
  onSelectVideo?: (youtubeId: string) => void;
}

interface AnimationStep {
  array: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
  pivot?: number;
  message: string;
  comparisonsTotal: number;
  accessesTotal: number;
}

const ALGORITHM_DETAILS: Record<
  AlgorithmType,
  {
    name: string;
    panthemaName: string;
    timeComplexity: string;
    bestTime: string;
    worstTime: string;
    spaceComplexity: string;
    stable: boolean;
    description: string;
    codeSnippet: string;
  }
> = {
  mergesort: {
    name: 'Merge Sort',
    panthemaName: 'std::stable_sort (gcc)',
    timeComplexity: 'O(N log N)',
    bestTime: 'Ω(N log N)',
    worstTime: 'O(N log N)',
    spaceComplexity: 'O(N)',
    stable: true,
    description: 'Divide and conquer algorithm that recursively splits the array in halves, sorts each half, and merges them in linear time.',
    codeSnippet: `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)`
  },
  quicksort: {
    name: 'Quick Sort (Lomuto)',
    panthemaName: 'std::sort (gcc / quicksort)',
    timeComplexity: 'O(N log N)',
    bestTime: 'Ω(N log N)',
    worstTime: 'O(N²)',
    spaceComplexity: 'O(log N)',
    stable: false,
    description: 'Selects a pivot element and partitions array so elements smaller than pivot go left, greater go right, then sorts recursively.',
    codeSnippet: `def quick_sort(arr, low, high):
    if low < high:
        pi = partition(arr, low, high)
        quick_sort(arr, low, pi - 1)
        quick_sort(arr, pi + 1, high)`
  },
  heapsort: {
    name: 'Heap Sort',
    panthemaName: 'std::make_heap / sort_heap',
    timeComplexity: 'O(N log N)',
    bestTime: 'Ω(N log N)',
    worstTime: 'O(N log N)',
    spaceComplexity: 'O(1)',
    stable: false,
    description: 'Transforms array into a Binary Max-Heap, repeatedly extracts maximum element and places it at the end of the array.',
    codeSnippet: `def heap_sort(arr):
    n = len(arr)
    for i in range(n // 2 - 1, -1, -1):
        heapify(arr, n, i)
    for i in range(n - 1, 0, -1):
        arr[i], arr[0] = arr[0], arr[i]
        heapify(arr, i, 0)`
  },
  shellsort: {
    name: 'Shell Sort',
    panthemaName: 'Shell Sort (gap sequence)',
    timeComplexity: 'O(N log² N)',
    bestTime: 'Ω(N log N)',
    worstTime: 'O(N²)',
    spaceComplexity: 'O(1)',
    stable: false,
    description: 'Generalization of insertion sort that allows exchanges of far-apart items using shrinking gap increments.',
    codeSnippet: `def shell_sort(arr):
    n = len(arr)
    gap = n // 2
    while gap > 0:
        for i in range(gap, n):
            temp = arr[i]
            j = i
            while j >= gap and arr[j - gap] > temp:
                arr[j] = arr[j - gap]
                j -= gap
            arr[j] = temp
        gap //= 2`
  },
  radixsort: {
    name: 'Radix Sort (LSD)',
    panthemaName: 'LSD Radix Sort (Base 10)',
    timeComplexity: 'O(N · K)',
    bestTime: 'Ω(N · K)',
    worstTime: 'O(N · K)',
    spaceComplexity: 'O(N + K)',
    stable: true,
    description: 'Non-comparative sorting algorithm that sorts integers digit by digit from least significant digit to most significant digit.',
    codeSnippet: `def radix_sort(arr):
    max_val = max(arr)
    exp = 1
    while max_val // exp > 0:
        counting_sort(arr, exp)
        exp *= 10`
  },
  insertionsort: {
    name: 'Insertion Sort',
    panthemaName: 'Insertion Sort',
    timeComplexity: 'O(N²)',
    bestTime: 'Ω(N)',
    worstTime: 'O(N²)',
    spaceComplexity: 'O(1)',
    stable: true,
    description: 'Builds sorted array one element at a time by repeatedly taking the next element and inserting it into its correct position.',
    codeSnippet: `def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and key < arr[j]:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key`
  },
  selectionsort: {
    name: 'Selection Sort',
    panthemaName: 'Selection Sort',
    timeComplexity: 'O(N²)',
    bestTime: 'Ω(N²)',
    worstTime: 'O(N²)',
    spaceComplexity: 'O(1)',
    stable: false,
    description: 'Repeatedly finds minimum element from unsorted part and puts it at the beginning. Simple with minimal memory writes.',
    codeSnippet: `def selection_sort(arr):
    n = len(arr)
    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]`
  },
  bubblesort: {
    name: 'Bubble Sort',
    panthemaName: 'Bubble Sort',
    timeComplexity: 'O(N²)',
    bestTime: 'Ω(N)',
    worstTime: 'O(N²)',
    spaceComplexity: 'O(1)',
    stable: true,
    description: 'Repeatedly steps through the list, compares adjacent pairs and swaps them if they are in the wrong order until fully sorted.',
    codeSnippet: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]`
  },
  cocktailsort: {
    name: 'Cocktail Shaker Sort',
    panthemaName: 'Bidirectional Bubble Sort',
    timeComplexity: 'O(N²)',
    bestTime: 'Ω(N)',
    worstTime: 'O(N²)',
    spaceComplexity: 'O(1)',
    stable: true,
    description: 'Bidirectional variation of bubble sort that traverses back and forth across the list to eliminate turtles and rabbits.',
    codeSnippet: `def cocktail_sort(arr):
    start, end = 0, len(arr) - 1
    while start < end:
        for i in range(start, end):
            if arr[i] > arr[i + 1]:
                arr[i], arr[i + 1] = arr[i + 1], arr[i]
        end -= 1
        for i in range(end, start, -1):
            if arr[i - 1] > arr[i]:
                arr[i - 1], arr[i] = arr[i], arr[i - 1]
        start += 1`
  }
};

export const SortingVisualizer: React.FC<SortingVisualizerProps> = ({
  initialAlgorithm = 'mergesort',
  compact = false
}) => {
  const [algorithm, setAlgorithm] = useState<AlgorithmType>(initialAlgorithm);
  const [arraySize, setArraySize] = useState<number>(compact ? 32 : 64);
  const [speed, setSpeed] = useState<number>(30); // ms delay per step
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSorted, setIsSorted] = useState<boolean>(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [themeMode, setThemeMode] = useState<'sound-of-sorting' | 'neon'>('sound-of-sorting');

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [steps, setSteps] = useState<AnimationStep[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Play Sound of Sorting Tone
  const playTone = useCallback((value: number, maxVal: number = 100) => {
    if (!audioEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Pitch mapped: 120 Hz to 1200 Hz
      const normalized = Math.max(0, Math.min(1, value / maxVal));
      const freq = 120 + normalized * 1100;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.045);
    } catch {
      // Audio context might be restricted before user interaction
    }
  }, [audioEnabled, getAudioContext]);

  // Generate random array
  const generateRandomArray = useCallback((size: number): number[] => {
    const arr: number[] = [];
    for (let i = 1; i <= size; i++) {
      arr.push(Math.round((i / size) * 92) + 6);
    }
    // Fisher-Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, []);

  // Compute all animation steps based on selected algorithm
  const generateSteps = useCallback((initialArr: number[], algo: AlgorithmType): AnimationStep[] => {
    const stepsList: AnimationStep[] = [];
    const arr = [...initialArr];
    let comparisons = 0;
    let accesses = 0;

    stepsList.push({
      array: [...arr],
      comparing: [],
      swapping: [],
      sorted: [],
      message: `Initial randomized array ready for ${ALGORITHM_DETAILS[algo].panthemaName}.`,
      comparisonsTotal: 0,
      accessesTotal: 0
    });

    if (algo === 'bubblesort') {
      const n = arr.length;
      const sortedIdxs: number[] = [];
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - i - 1; j++) {
          comparisons++;
          accesses += 2;
          stepsList.push({
            array: [...arr],
            comparing: [j, j + 1],
            swapping: [],
            sorted: [...sortedIdxs],
            message: `Comparing arr[${j}] (${arr[j]}) and arr[${j + 1}] (${arr[j + 1]})`,
            comparisonsTotal: comparisons,
            accessesTotal: accesses
          });

          if (arr[j] > arr[j + 1]) {
            accesses += 2;
            const temp = arr[j];
            arr[j] = arr[j + 1];
            arr[j + 1] = temp;

            stepsList.push({
              array: [...arr],
              comparing: [],
              swapping: [j, j + 1],
              sorted: [...sortedIdxs],
              message: `Swapped arr[${j}] and arr[${j + 1}]`,
              comparisonsTotal: comparisons,
              accessesTotal: accesses
            });
          }
        }
        sortedIdxs.push(n - i - 1);
      }
    } else if (algo === 'cocktailsort') {
      let start = 0;
      let end = arr.length - 1;
      let swapped = true;
      const sortedIdxs: number[] = [];

      while (swapped) {
        swapped = false;
        for (let i = start; i < end; i++) {
          comparisons++;
          accesses += 2;
          stepsList.push({
            array: [...arr],
            comparing: [i, i + 1],
            swapping: [],
            sorted: [...sortedIdxs],
            message: `Forward pass: comparing ${arr[i]} and ${arr[i + 1]}`,
            comparisonsTotal: comparisons,
            accessesTotal: accesses
          });

          if (arr[i] > arr[i + 1]) {
            accesses += 2;
            [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
            swapped = true;
            stepsList.push({
              array: [...arr],
              comparing: [],
              swapping: [i, i + 1],
              sorted: [...sortedIdxs],
              message: `Swapped ${arr[i]} and ${arr[i + 1]}`,
              comparisonsTotal: comparisons,
              accessesTotal: accesses
            });
          }
        }

        if (!swapped) break;
        swapped = false;
        sortedIdxs.push(end);
        end--;

        for (let i = end - 1; i >= start; i--) {
          comparisons++;
          accesses += 2;
          stepsList.push({
            array: [...arr],
            comparing: [i, i + 1],
            swapping: [],
            sorted: [...sortedIdxs],
            message: `Backward pass: comparing ${arr[i]} and ${arr[i + 1]}`,
            comparisonsTotal: comparisons,
            accessesTotal: accesses
          });

          if (arr[i] > arr[i + 1]) {
            accesses += 2;
            [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
            swapped = true;
            stepsList.push({
              array: [...arr],
              comparing: [],
              swapping: [i, i + 1],
              sorted: [...sortedIdxs],
              message: `Swapped ${arr[i]} and ${arr[i + 1]}`,
              comparisonsTotal: comparisons,
              accessesTotal: accesses
            });
          }
        }
        sortedIdxs.push(start);
        start++;
      }
    } else if (algo === 'selectionsort') {
      const n = arr.length;
      const sortedIdxs: number[] = [];
      for (let i = 0; i < n; i++) {
        let minIdx = i;
        for (let j = i + 1; j < n; j++) {
          comparisons++;
          accesses += 2;
          stepsList.push({
            array: [...arr],
            comparing: [minIdx, j],
            swapping: [],
            sorted: [...sortedIdxs],
            message: `Scanning min: comparing ${arr[j]} vs ${arr[minIdx]}`,
            comparisonsTotal: comparisons,
            accessesTotal: accesses
          });

          if (arr[j] < arr[minIdx]) {
            minIdx = j;
          }
        }

        if (minIdx !== i) {
          accesses += 4;
          const temp = arr[i];
          arr[i] = arr[minIdx];
          arr[minIdx] = temp;

          stepsList.push({
            array: [...arr],
            comparing: [],
            swapping: [i, minIdx],
            sorted: [...sortedIdxs],
            message: `Swapped minimum (${arr[i]}) to index ${i}`,
            comparisonsTotal: comparisons,
            accessesTotal: accesses
          });
        }
        sortedIdxs.push(i);
      }
    } else if (algo === 'insertionsort') {
      const n = arr.length;
      const sortedIdxs: number[] = [0];
      for (let i = 1; i < n; i++) {
        const key = arr[i];
        let j = i - 1;
        accesses++;
        while (j >= 0 && arr[j] > key) {
          comparisons++;
          accesses += 2;
          arr[j + 1] = arr[j];
          stepsList.push({
            array: [...arr],
            comparing: [j, j + 1],
            swapping: [j + 1],
            sorted: [...sortedIdxs],
            message: `Shifted element ${arr[j]} to position ${j + 1}`,
            comparisonsTotal: comparisons,
            accessesTotal: accesses
          });
          j--;
        }
        if (j >= 0) comparisons++;
        arr[j + 1] = key;
        accesses++;
        sortedIdxs.push(i);
      }
    } else if (algo === 'shellsort') {
      const n = arr.length;
      let gap = Math.floor(n / 2);
      while (gap > 0) {
        for (let i = gap; i < n; i++) {
          const temp = arr[i];
          let j = i;
          accesses++;
          while (j >= gap && arr[j - gap] > temp) {
            comparisons++;
            accesses += 2;
            arr[j] = arr[j - gap];
            stepsList.push({
              array: [...arr],
              comparing: [j - gap, j],
              swapping: [j],
              sorted: [],
              message: `Gap ${gap}: Shifted element ${arr[j]} right`,
              comparisonsTotal: comparisons,
              accessesTotal: accesses
            });
            j -= gap;
          }
          if (j >= gap) comparisons++;
          arr[j] = temp;
          accesses++;
        }
        gap = Math.floor(gap / 2);
      }
    } else if (algo === 'mergesort') {
      const merge = (start: number, mid: number, end: number) => {
        const left = arr.slice(start, mid + 1);
        const right = arr.slice(mid + 1, end + 1);
        accesses += left.length + right.length;
        let i = 0;
        let j = 0;
        let k = start;

        while (i < left.length && j < right.length) {
          comparisons++;
          accesses += 2;
          stepsList.push({
            array: [...arr],
            comparing: [start + i, mid + 1 + j],
            swapping: [k],
            sorted: [],
            message: `Merge: compare left (${left[i]}) vs right (${right[j]})`,
            comparisonsTotal: comparisons,
            accessesTotal: accesses
          });

          if (left[i] <= right[j]) {
            arr[k] = left[i];
            i++;
          } else {
            arr[k] = right[j];
            j++;
          }
          accesses++;
          k++;
        }

        while (i < left.length) {
          arr[k] = left[i];
          accesses++;
          stepsList.push({
            array: [...arr],
            comparing: [k],
            swapping: [k],
            sorted: [],
            message: `Flushed left element (${left[i]})`,
            comparisonsTotal: comparisons,
            accessesTotal: accesses
          });
          i++;
          k++;
        }

        while (j < right.length) {
          arr[k] = right[j];
          accesses++;
          stepsList.push({
            array: [...arr],
            comparing: [k],
            swapping: [k],
            sorted: [],
            message: `Flushed right element (${right[j]})`,
            comparisonsTotal: comparisons,
            accessesTotal: accesses
          });
          j++;
          k++;
        }
      };

      const mergeSortHelper = (start: number, end: number) => {
        if (start >= end) return;
        const mid = Math.floor((start + end) / 2);
        mergeSortHelper(start, mid);
        mergeSortHelper(mid + 1, end);
        merge(start, mid, end);
      };

      mergeSortHelper(0, arr.length - 1);
    } else if (algo === 'quicksort') {
      const partition = (low: number, high: number): number => {
        const pivot = arr[high];
        accesses++;
        let i = low - 1;

        stepsList.push({
          array: [...arr],
          comparing: [],
          swapping: [],
          sorted: [],
          pivot: high,
          message: `Pivot selected: arr[${high}] (${pivot})`,
          comparisonsTotal: comparisons,
          accessesTotal: accesses
        });

        for (let j = low; j < high; j++) {
          comparisons++;
          accesses++;
          stepsList.push({
            array: [...arr],
            comparing: [j, high],
            swapping: [],
            sorted: [],
            pivot: high,
            message: `Partition scan: arr[${j}] (${arr[j]}) vs pivot (${pivot})`,
            comparisonsTotal: comparisons,
            accessesTotal: accesses
          });

          if (arr[j] < pivot) {
            i++;
            if (i !== j) {
              accesses += 4;
              [arr[i], arr[j]] = [arr[j], arr[i]];
              stepsList.push({
                array: [...arr],
                comparing: [],
                swapping: [i, j],
                sorted: [],
                pivot: high,
                message: `Swapped smaller item ${arr[i]} into left partition`,
                comparisonsTotal: comparisons,
                accessesTotal: accesses
              });
            }
          }
        }

        accesses += 4;
        [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
        stepsList.push({
          array: [...arr],
          comparing: [],
          swapping: [i + 1, high],
          sorted: [i + 1],
          message: `Placed pivot at partitioned index ${i + 1}`,
          comparisonsTotal: comparisons,
          accessesTotal: accesses
        });

        return i + 1;
      };

      const quickSortHelper = (low: number, high: number) => {
        if (low < high) {
          const pi = partition(low, high);
          quickSortHelper(low, pi - 1);
          quickSortHelper(pi + 1, high);
        }
      };

      quickSortHelper(0, arr.length - 1);
    } else if (algo === 'heapsort') {
      const n = arr.length;
      const heapify = (size: number, i: number) => {
        let largest = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;

        if (left < size) {
          comparisons++;
          accesses += 2;
          if (arr[left] > arr[largest]) largest = left;
        }
        if (right < size) {
          comparisons++;
          accesses += 2;
          if (arr[right] > arr[largest]) largest = right;
        }

        if (largest !== i) {
          accesses += 4;
          [arr[i], arr[largest]] = [arr[largest], arr[i]];
          stepsList.push({
            array: [...arr],
            comparing: [i, largest],
            swapping: [i, largest],
            sorted: [],
            message: `Heapify: swapped root ${arr[largest]} with child ${arr[i]}`,
            comparisonsTotal: comparisons,
            accessesTotal: accesses
          });
          heapify(size, largest);
        }
      };

      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        heapify(n, i);
      }

      const sortedIdxs: number[] = [];
      for (let i = n - 1; i > 0; i--) {
        accesses += 4;
        [arr[0], arr[i]] = [arr[i], arr[0]];
        sortedIdxs.push(i);
        stepsList.push({
          array: [...arr],
          comparing: [],
          swapping: [0, i],
          sorted: [...sortedIdxs],
          message: `Extracted max ${arr[i]} to sorted position ${i}`,
          comparisonsTotal: comparisons,
          accessesTotal: accesses
        });
        heapify(i, 0);
      }
      sortedIdxs.push(0);
    } else if (algo === 'radixsort') {
      const maxVal = Math.max(...arr);
      let exp = 1;
      while (Math.floor(maxVal / exp) > 0) {
        const output = new Array(arr.length).fill(0);
        const count = new Array(10).fill(0);

        for (let i = 0; i < arr.length; i++) {
          const digit = Math.floor(arr[i] / exp) % 10;
          count[digit]++;
          accesses++;
        }

        for (let i = 1; i < 10; i++) {
          count[i] += count[i - 1];
        }

        for (let i = arr.length - 1; i >= 0; i--) {
          const digit = Math.floor(arr[i] / exp) % 10;
          output[count[digit] - 1] = arr[i];
          count[digit]--;
          accesses += 2;
        }

        for (let i = 0; i < arr.length; i++) {
          arr[i] = output[i];
          accesses++;
          stepsList.push({
            array: [...arr],
            comparing: [i],
            swapping: [i],
            sorted: [],
            message: `Radix sort (digit ${exp}s): placed ${arr[i]} at index ${i}`,
            comparisonsTotal: comparisons,
            accessesTotal: accesses
          });
        }
        exp *= 10;
      }
    }

    // Final sorted step verification sweep
    const finalAllSorted = Array.from({ length: arr.length }, (_, i) => i);
    stepsList.push({
      array: [...arr],
      comparing: [],
      swapping: [],
      sorted: finalAllSorted,
      message: `Array fully verified & sorted! ${ALGORITHM_DETAILS[algo].panthemaName} complete.`,
      comparisonsTotal: comparisons,
      accessesTotal: accesses
    });

    return stepsList;
  }, []);

  // Initialize or reset steps
  const resetArrayAndSteps = useCallback(
    (size: number = arraySize, algo: AlgorithmType = algorithm) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsRunning(false);
      setIsSorted(false);
      setCurrentStepIndex(0);

      const newArr = generateRandomArray(size);
      const computedSteps = generateSteps(newArr, algo);
      setSteps(computedSteps);
    },
    [arraySize, algorithm, generateRandomArray, generateSteps]
  );

  // Initialize on load or algorithm change
  useEffect(() => {
    resetArrayAndSteps(arraySize, algorithm);
  }, [algorithm, arraySize, resetArrayAndSteps]);

  // Step Execution Runner with Sound of Sorting Synthesis
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsRunning(false);
            setIsSorted(true);
            if (timerRef.current) clearInterval(timerRef.current);
            return prev;
          }
          const nextIdx = prev + 1;
          const currentStep = steps[nextIdx];
          
          if (currentStep) {
            // Play frequency tone on active element
            if (currentStep.swapping.length > 0) {
              const activeVal = currentStep.array[currentStep.swapping[0]] || 50;
              playTone(activeVal);
            } else if (currentStep.comparing.length > 0) {
              const activeVal = currentStep.array[currentStep.comparing[0]] || 50;
              playTone(activeVal);
            }
          }
          return nextIdx;
        });
      }, speed);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, steps, speed, playTone]);

  const handlePlayPause = () => {
    getAudioContext(); // Resume audio on click
    if (currentStepIndex >= steps.length - 1) {
      resetArrayAndSteps();
      setTimeout(() => setIsRunning(true), 50);
    } else {
      setIsRunning(!isRunning);
    }
  };

  const handleStepForward = () => {
    getAudioContext();
    if (currentStepIndex < steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const step = steps[nextIdx];
      if (step && (step.swapping[0] !== undefined || step.comparing[0] !== undefined)) {
        const val = step.array[step.swapping[0] ?? step.comparing[0]] || 50;
        playTone(val);
      }
    }
  };

  const currentStep = steps[currentStepIndex] || {
    array: [],
    comparing: [],
    swapping: [],
    sorted: [],
    message: '',
    comparisonsTotal: 0,
    accessesTotal: 0
  };

  const currentDetails = ALGORITHM_DETAILS[algorithm];

  return (
    <div
      className={`rounded-2xl border shadow-2xl transition-colors ${
        themeMode === 'sound-of-sorting'
          ? 'bg-black border-slate-800 text-white'
          : 'bg-slate-900 border-slate-800 text-white'
      } p-4 sm:p-5 space-y-4`}
    >
      {/* Top Header & Mode Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
              <span>{currentDetails.name}</span>
              <span className="font-mono text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                {currentDetails.panthemaName}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Interactive acoustic &amp; visual simulation with real-time frequency synthesis
            </p>
          </div>
        </div>

        {/* Theme & Audio Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              audioEnabled
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400'
            }`}
            title="Toggle Sound of Sorting acoustic tones"
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{audioEnabled ? 'Audio: ON' : 'Audio: OFF'}</span>
          </button>

          <button
            onClick={() =>
              setThemeMode((t) => (t === 'sound-of-sorting' ? 'neon' : 'sound-of-sorting'))
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              themeMode === 'sound-of-sorting'
                ? 'bg-zinc-900 text-zinc-100 border-zinc-700'
                : 'bg-indigo-950 text-indigo-200 border-indigo-700'
            }`}
            title="Switch between Classic Sound-of-Sorting (Black & White) and Modern Neon"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{themeMode === 'sound-of-sorting' ? 'Classic (Timo B.)' : 'Neon Mode'}</span>
          </button>
        </div>
      </div>

      {/* Algorithm Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ['mergesort', 'Merge Sort'],
            ['quicksort', 'Quick Sort'],
            ['heapsort', 'Heap Sort'],
            ['shellsort', 'Shell Sort'],
            ['radixsort', 'Radix Sort'],
            ['insertionsort', 'Insertion Sort'],
            ['selectionsort', 'Selection Sort'],
            ['bubblesort', 'Bubble Sort'],
            ['cocktailsort', 'Cocktail Shaker']
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setAlgorithm(key as AlgorithmType)}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
              algorithm === key
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* THE ICONIC SOUND OF SORTING HUD & CANVAS */}
      <div className="relative w-full bg-black rounded-2xl border border-zinc-800 p-4 overflow-hidden shadow-2xl">
        {/* Panthema Sound of Sorting Style Header Bar */}
        <div className="flex flex-wrap items-center justify-between font-mono text-[11px] sm:text-xs text-zinc-300 border-b border-zinc-800/80 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{currentDetails.panthemaName}</span>
            <span className="text-zinc-500">|</span>
            <span className="text-amber-400 font-semibold">
              {currentStep.comparisonsTotal.toLocaleString()} comparisons
            </span>
            <span className="text-zinc-500">|</span>
            <span className="text-rose-400 font-semibold">
              {currentStep.accessesTotal.toLocaleString()} array accesses
            </span>
          </div>

          <div className="flex items-center gap-3 text-zinc-400">
            <span>{speed} ms delay</span>
            <span className="text-zinc-600">sound-of-sorting</span>
          </div>
        </div>

        {/* Array Bars Display */}
        <div className="w-full h-56 sm:h-72 flex items-end justify-between gap-[1px] bg-black">
          {currentStep.array.map((value, idx) => {
            const isComparing = currentStep.comparing.includes(idx);
            const isSwapping = currentStep.swapping.includes(idx);
            const isSortedItem = currentStep.sorted.includes(idx) || isSorted;
            const isPivot = currentStep.pivot === idx;

            let barColor = '';
            if (themeMode === 'sound-of-sorting') {
              // Exact Timo Bingmann Sound of Sorting aesthetic
              if (isPivot) {
                barColor = 'bg-amber-400';
              } else if (isSwapping || isComparing) {
                barColor = 'bg-red-600'; // Bright Red active marker
              } else if (isSortedItem) {
                barColor = 'bg-white';
              } else {
                barColor = 'bg-zinc-100';
              }
            } else {
              // Neon aesthetic
              if (isPivot) {
                barColor = 'bg-purple-500';
              } else if (isSwapping) {
                barColor = 'bg-rose-500 animate-pulse';
              } else if (isComparing) {
                barColor = 'bg-amber-400';
              } else if (isSortedItem) {
                barColor = 'bg-emerald-400';
              } else {
                barColor = 'bg-indigo-500';
              }
            }

            return (
              <div
                key={idx}
                style={{ height: `${Math.max(value, 4)}%` }}
                className={`flex-1 transition-all duration-75 ${barColor}`}
                title={`Index ${idx}: ${value}`}
              />
            );
          })}
        </div>

        {/* Real-Time Step Caption */}
        <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between font-mono text-[11px] text-zinc-400">
          <div className="flex items-center gap-2 truncate pr-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate text-zinc-200">{currentStep.message}</span>
          </div>
          <span className="shrink-0 text-zinc-500">
            Step {currentStepIndex + 1} / {steps.length}
          </span>
        </div>
      </div>

      {/* Complexity & Control Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Time Complexity
          </span>
          <div className="font-mono font-bold text-indigo-400 text-sm">
            {currentDetails.timeComplexity}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Space Complexity
          </span>
          <div className="font-mono font-bold text-emerald-400 text-sm">
            {currentDetails.spaceComplexity}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Stability
          </span>
          <div className="font-mono font-bold text-amber-400 text-sm">
            {currentDetails.stable ? 'Stable Sort' : 'Unstable Sort'}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Worst Bound
          </span>
          <div className="font-mono font-bold text-rose-400 text-sm">
            {currentDetails.worstTime}
          </div>
        </div>
      </div>

      {/* Playback Controls & Sliders */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePlayPause}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{isRunning ? 'Pause' : currentStepIndex >= steps.length - 1 ? 'Replay' : 'Run / Play Audio'}</span>
          </button>

          <button
            onClick={handleStepForward}
            disabled={isRunning || currentStepIndex >= steps.length - 1}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Step</span>
          </button>

          <button
            onClick={() => resetArrayAndSteps()}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Shuffle New</span>
          </button>
        </div>

        {/* Speed & Array Size Controls */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 text-[11px]">Speed:</span>
            <input
              type="range"
              min="5"
              max="200"
              step="5"
              value={205 - speed}
              onChange={(e) => setSpeed(205 - Number(e.target.value))}
              className="w-20 sm:w-24 accent-indigo-500 cursor-pointer"
            />
            <span className="font-mono text-[10px] text-indigo-300 font-bold">
              {speed <= 15 ? 'Turbo' : speed <= 40 ? 'Fast' : speed <= 100 ? 'Med' : 'Slow'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400 text-[11px]">Bars:</span>
            <input
              type="range"
              min="16"
              max="128"
              step="8"
              value={arraySize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                setArraySize(newSize);
                resetArrayAndSteps(newSize, algorithm);
              }}
              className="w-20 sm:w-24 accent-indigo-500 cursor-pointer"
            />
            <span className="font-mono text-[10px] text-indigo-300 font-bold">{arraySize}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
