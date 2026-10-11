# CodeVista AI — Adaptive Code Visualization & Explanation Engine
## Complete User Manual and Engine Technical Specification

Welcome to the **CodeVista AI Adaptive Code Visualization + Explanation Engine**. This guide details how the visualization system translates user source code into meaningful, authentic execution models and educational narratives without fabricating runtime states or relying on empty animations.

---

## 1. Architectural Philosophy & Dual-Mode System

CodeVista AI is designed under a foundational premise: **Meaningful visualization is more important than flashy animation.**

When code executes, the system analyzes the program trace and determines the optimal strategy:

```
           SOURCE CODE (Java 25)
                     ↓
        COMPILATION & INSTRUMENTATION
                     ↓
        ISOLATED SANDBOX EXECUTION (Child JVM)
                     ↓
        AUTHENTIC EXECUTION EVENT STREAM
                     ↓
         NORMALIZATION & CONCEPT MAPPING
                     ↓
      ADAPTIVE STRATEGY DECISION MATRIX
                     ↓
      ┌──────────────────────────────┐
      │  Is Step Visually Mappable?  │
      └──────────────┬───────────────┘
                     │
          YES        │        NO / PARTIAL
           ↓         │             ↓
   [MODE A: VISUAL]  │   [MODE B: EXPLANATION]
   Concept-Driven    │   7-Part Educational
   Interactive UI    │   Step-by-Step Narrative
           ↓         │             ↓
           └─────────┬─────────────┘
                     ↓
        USER DEEP UNDERSTANDING
```

### Mode A: Visual Execution
When the program contains concepts that have a clear, structural, and intuitive mental model (e.g., variables changing, arrays swapping, call stacks deepening, matrices indexing), the engine activates a specialized **Concept Renderer**.

### Mode B: Educational Explanation Fallback
When a step involves non-visual logic (e.g., imports, class headers, boilerplate setup, complex system routines), the engine never fails or shows blank screens. Instead, it activates the **Mode B Explanation Engine**, presenting:
1. **Source Line**: Exact code line executed.
2. **What Happened**: Clear, plain-language description of the runtime event.
3. **Current State**: Exact variable snapshots from the JVM.
4. **Why It Happened**: Pedagogical explanation of the language semantics.
5. **Result / Impact**: Concrete side effect of the instruction.
6. **Next Step Hint**: Foreshadowing what control flow occurs next.
7. **Learn More**: Expandable deep-dive into compiler or JVM behavior.

---

## 2. Concept Renderers Reference (14 Specialized Renderers)

The visualization engine includes 14 dedicated concept visualizers ordered by priority:

| Priority | Concept Renderer | Target Constructs | Visual Representation |
|:---:|:---|:---|:---|
| **120** | `EXCEPTION` | Exceptions, runtime errors | Throw banner, error class, error message, stack trace frames, and catch handler status. |
| **110** | `MATRIX_2D` | Multi-dimensional arrays `int[][]` | Dynamic 2D grid matrix highlighting active row `r` and column `c` with coordinates. |
| **105** | `ARRAY_OPERATION` | Element swaps, binary search | Swap directional arrows, target partition indices, search range sliders `[low..mid..high]`. |
| **104** | `COLLECTION` | `ArrayList`, lists, dynamic buffers | Linear dynamic buffer with tracked length, element pills, and ghost capacity headroom cells. |
| **100** | `ARRAY` | 1D arrays `int[]` | Memory cell blocks, array index tags `0..N-1`, and mutating value pulses. |
| **92** | `COMPARISON` | Relational expressions `<`, `>=`, `==` | Left operand card vs Right operand card with comparison operator badge and evaluated boolean pill. |
| **90** | `CONDITION` | If, Else-if, Else branches | Condition test banner, evaluated truth value (`TRUE` / `FALSE`), and branch path indicator. |
| **85** | `RECURSION` | Recursive functions | Interactive call stack ladder showing frame depth, active arguments, and unwinding return values. |
| **80** | `LOOP` | `for`, `while`, `do-while` | Cyclical iteration ring, current iteration index, and loop state progression. |
| **78** | `STRING_OPERATION` | Strings, char sequences | Indexed character sequence tape, string length indicator, and immutability notice. |
| **72** | `PARAMETER_BIND` | Function call argument passing | Caller arguments mapping into callee parameter slots with return value bubbling. |
| **70** | `OBJECT` | Classes, constructors, heap | Conceptual heap instance card with field-value table and object reference arrows. |
| **60** | `EXPRESSION` | Arithmetic expressions `a + b` | Input operands flowing through operator node to produce computed result. |
| **50** | `VARIABLE` | Scalar variables (`int`, `double`) | Memory cell showing previous value transitioning to new value with type badge. |

---

## 3. Interactive Playback Controls

CodeVista AI provides fine-grained control over execution simulation:

- **Play / Pause**: Start or stop automated step playback (`Space`).
- **Step Forward / Backward**: Scrub execution forward (`Right Arrow`) or backward (`Left Arrow`).
- **Jump to Extremes**: Instantly jump to Step 1 (`Home`) or the final result (`End`).
- **Playback Speed**: Adjustable simulation interval:
  - `0.25x` (Very slow, 2000ms / step)
  - `0.5x` (Slow, 1200ms / step)
  - `1.0x` (Default, 600ms / step)
  - `2.0x` (Fast, 300ms / step)
  - `5.0x` (Super fast, 120ms / step)
- **Continuous Loop Mode**: Toggle continuous looping (`L` key) to cycle seamlessly between start and end.

---

## 4. State Diff Inspector

The **State Diff Inspector** (`StateDiffInspector.tsx`) monitors execution deltas between step $t$ and step $t-1$:
- **Added Variables**: Displayed with green badges showing initialization.
- **Modified Variables**: Shows prior value $\to$ new value with blue change indicators.
- **Unchanged Variables**: Dimmed out to reduce cognitive overhead and focus attention on active mutations.

---

## 5. Visual Density & High Contrast Modes

Users can tailor the visual interface to their screen size and accessibility needs:
- **Compact**: Tightly packed memory cells for dense algorithms with dozens of variables.
- **Comfortable**: Default spacious layout optimized for desktop and tablet screens.
- **Spacious**: High-padding cards ideal for presentations, lectures, and classroom projectors.
- **High Contrast Toggle**: High-visibility borders, stark contrasts, and enhanced color coding for bright environments or low-vision users.

---

## 6. Keyframe Bookmarks & Navigation Rail

Save and review critical algorithmic moments:
- **Toggle Bookmark (`B` key)**: Bookmark the active step.
- **Bookmark Rail**: Quick-jump chips at the top of the timeline let you leap directly to pivotal execution states (e.g., initial condition check, mid-loop sort pivot, exception throw).

---

## 7. Offline Trace Export & Import

CodeVista AI supports full session serialization:
- **Export Session (`traceExport.ts`)**: Downloads a standalone, formatted JSON trace document containing source code, step counts, variables, heap snapshots, and execution timestamps.
- **Import Session**: Drag and drop any `.json` trace file into the visualizer to replay execution completely offline without contacting the compiler backend.

---

## 8. Instant URL State Sharing

Collaborate and share code states with teammates or teachers:
- **URL Hash Fragment (`#share=...`)**: Compresses the source code and active step position into a URL hash fragment.
- **Direct Link Replay**: Anyone opening the shared link immediately opens the exact step, variables, and visualizer tab.

---

## 9. Accessibility (ARIA Screen Reader Support)

CodeVista AI incorporates a dedicated **ARIA Live Region Announcer** (`TraceAriaLiveAnnouncer.tsx`):
- Uses `aria-live="polite"` to dynamically narrate variable assignments, branch decisions, and output lines to assistive technologies without stealing keyboard focus.

---

## 10. Hardware Keyboard Shortcuts Reference

Press `?` anywhere in the visualizer to open the interactive keyboard reference modal:

| Shortcut | Action | Description |
|:---:|:---|:---|
| <kbd>Space</kbd> | Play / Pause | Toggle automated step playback |
| <kbd>→</kbd> | Next Step | Step forward one execution instruction |
| <kbd>←</kbd> | Previous Step | Step backward one execution instruction |
| <kbd>Home</kbd> | Jump to Start | Return to the very first step |
| <kbd>End</kbd> | Jump to End | Leap directly to final program outcome |
| <kbd>B</kbd> | Toggle Bookmark | Pin or unpin the current step on the bookmark rail |
| <kbd>L</kbd> | Toggle Loop Mode | Repeat playback from start upon reaching end |
| <kbd>?</kbd> | Shortcuts Guide | Open or close the shortcuts modal |

---

*CodeVista AI — Empowering developers, students, and educators with authentic code comprehension.*
