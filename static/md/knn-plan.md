# KNN Visualization Plan

## Overview

A 2D interactive K-Nearest Neighbors visualization that allows users to explore how KNN classification works with various sample datasets and parameters.

---

## Sample Datasets

Following the sklearn pattern, we'll include these classic 2D datasets:

| Dataset | Description | Classes | Points |
|---------|-------------|---------|--------|
| **Two Moons** | Two interleaving half circles | 2 | 200 |
| **Circles** | Large circle containing a smaller circle | 2 | 200 |
| **Blobs** | Isotropic Gaussian blobs | 3 | 150 |
| **Linear** | Linearly separable clusters | 2 | 150 |
| **XOR** | Four clusters in XOR pattern | 2 | 200 |
| **Spiral** | Two intertwined spirals | 2 | 200 |
| **Custom** | User draws their own points | 2-4 | User-defined |

Each dataset will have a noise parameter baked in to make classification non-trivial.

---

## Features

### Core Functionality

1. **Training Data Display**
   - Colored points for each class
   - Clear visual distinction between classes

2. **Interactive Classification**
   - Click anywhere on canvas to classify a new point
   - Show the k nearest neighbors with connecting lines
   - Display distance values on hover
   - Animate the neighbor-finding process

3. **Step-by-Step Playback**
   - Record steps: calculate all distances → sort → select k nearest → vote → classify
   - Playback controls: Play, Pause, Step Forward, Step Back, Reset
   - Speed control slider

4. **Decision Boundary Visualization**
   - Toggle to show/hide decision boundaries
   - Render classification regions as a colored background
   - Update when K or distance metric changes

### Parameters

| Parameter | Options | Default |
|-----------|---------|---------|
| **K Value** | 1-15 (slider) | 3 |
| **Distance Metric** | Euclidean, Manhattan, Chebyshev | Euclidean |
| **Show Boundaries** | Toggle on/off | Off |
| **Weighted KNN** | Toggle on/off | Off |

### Edit Mode (for Custom dataset)

- **Add Point**: Click to add point of selected class
- **Delete Point**: Click existing point to remove
- **Clear All**: Remove all training points
- **Class Selector**: Choose which class to add (2-4 classes)

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Dataset: [Moons] [Circles] [Blobs] [Linear] [XOR] [Spiral] [Custom]  │
└─────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────┬────────────────────────────┐
│                                    │  Algorithm                 │
│                                    │  ├─ K Value: [━━●━━━] 3    │
│                                    │  ├─ Distance: [Euclidean▼] │
│                                    │  ├─ [ ] Show Boundaries    │
│                                    │  └─ [ ] Weighted KNN       │
│         Main Canvas                │                            │
│    (Training points + query)       │  Edit Mode (Custom only)   │
│                                    │  ├─ Mode: [Add] [Delete]   │
│                                    │  ├─ Class: [●1] [●2] [●3]  │
│                                    │  └─ [Clear All]            │
│                                    │                            │
│                                    ├────────────────────────────┤
│                                    │  Metrics                   │
├────────────────────────────────────┤  ├─ Query Point: (x, y)    │
│  Legend                            │  ├─ Prediction: Class N    │
│  ● Class 1  ● Class 2  ● Class 3   │  ├─ Confidence: 66.7%      │
│  ○ Query    ─ Neighbor connection  │  ├─ K Neighbors: 3         │
│                                    │  └─ Distances: [list]      │
├────────────────────────────────────┤                            │
│  [▶ Play] [⏸] [⏮] [⏭] [↺ Reset]   ├────────────────────────────┤
│  Speed: [━━━━●━━━━━━]              │  ┌─────────────────────────┐│
│                                    │  │[About][Algorithm][Compare]│
└────────────────────────────────────┤  ├─────────────────────────┤│
                                     │  │                         ││
                                     │  │  Tab content area       ││
                                     │  │                         ││
                                     │  └─────────────────────────┘│
                                     └────────────────────────────┘
```

---

## Step-by-Step Visualization

When user clicks to classify a point, the algorithm executes in visualized steps:

| Step | Visual | Description |
|------|--------|-------------|
| 1. **Place Query** | Query point appears (hollow circle) | User clicks location |
| 2. **Calculate Distances** | Lines drawn to all points, labeled with distance | Animate sequentially or show all |
| 3. **Sort Distances** | Highlight lines in order | Brief flash for each |
| 4. **Select K Nearest** | K nearest lines stay solid, others fade | Clear visual distinction |
| 5. **Vote** | Neighbor points pulse by class | Show vote count |
| 6. **Classify** | Query point fills with predicted class color | Final result |

---

## Tabbed Information Panel

### About Tab
- Brief explanation of KNN algorithm
- How to use the visualization
- Keyboard shortcuts (if any)

### Algorithm Tab
- Distance metric formulas with mathematical notation
- Weighted vs unweighted voting explanation
- Complexity analysis: O(n) for classification

### Comparison Tab
Compare classification results across different parameters:

| K | Metric | Prediction | Confidence |
|---|--------|------------|------------|
| 1 | Euclidean | Class 1 | 100% |
| 3 | Euclidean | Class 2 | 66.7% |
| 5 | Euclidean | Class 2 | 60% |
| 3 | Manhattan | Class 1 | 66.7% |
| 3 | Chebyshev | Class 2 | 100% |

Auto-populated when user classifies a point.

---

## Color Scheme

Following the existing visualizations' patterns:

| Element | Light Theme | Dark Theme |
|---------|-------------|------------|
| Class 1 | `#e41a1c` (red) | `#fb4934` |
| Class 2 | `#377eb8` (blue) | `#83a598` |
| Class 3 | `#4daf4a` (green) | `#b8bb26` |
| Class 4 | `#984ea3` (purple) | `#d3869b` |
| Query Point | `#000000` stroke | `#ebdbb2` stroke |
| Neighbor Line | `#666666` | `#928374` |
| Selected Neighbor | `#ff7f00` (orange) | `#fe8019` |
| Decision Boundary | 20% opacity class colors | 15% opacity |

---

## File Structure

```
src/knn.njk                 # Page template
static/js/knn.js            # Main JavaScript (~1500 lines)
static/css/knn.css          # Styles (~800 lines)
```

---

## JavaScript Architecture

```javascript
// ============================================
// Constants
// ============================================
const DATASETS = { MOONS, CIRCLES, BLOBS, LINEAR, XOR, SPIRAL, CUSTOM };
const METRICS = { EUCLIDEAN, MANHATTAN, CHEBYSHEV };
const CLASS_COLORS = [...];

// ============================================
// Dataset Generator
// ============================================
class DatasetGenerator {
    static makeMoons(nSamples, noise) { }
    static makeCircles(nSamples, noise) { }
    static makeBlobs(nSamples, centers) { }
    static makeLinear(nSamples, noise) { }
    static makeXOR(nSamples, noise) { }
    static makeSpiral(nSamples, noise) { }
}

// ============================================
// KNN Classifier
// ============================================
class KNNClassifier {
    constructor(k, metric, weighted) { }
    fit(X, y) { }
    predictWithSteps(point) { }  // Returns array of steps for playback
    predict(point) { }           // Returns just the prediction
    getDecisionBoundary(resolution) { }  // For boundary visualization
}

// ============================================
// UI Controller
// ============================================
class UIController {
    // Handle all DOM interactions
    // Dataset selection, parameter changes, edit mode
}

// ============================================
// Canvas Renderer
// ============================================
class Renderer {
    constructor(canvas) { }
    render(state) { }
    renderPoints(points) { }
    renderQuery(point, neighbors) { }
    renderDecisionBoundary(boundary) { }
    renderNeighborLines(query, neighbors, step) { }
}

// ============================================
// Playback Controller
// ============================================
class PlaybackController {
    loadSteps(steps) { }
    play() { }
    pause() { }
    stepForward() { }
    stepBackward() { }
    reset() { }
}

// ============================================
// Main Application
// ============================================
class KNNApp {
    constructor() { }
    init() { }
    loadDataset(name) { }
    classifyPoint(x, y) { }
    updateParameters() { }
}
```

---

## Dataset Generation Algorithms

### Make Moons
```
For each point i in [0, n_samples/2]:
    angle = π * i / (n_samples/2)
    x = cos(angle) + noise
    y = sin(angle) + noise
    class = 0

For each point i in [0, n_samples/2]:
    angle = π * i / (n_samples/2)
    x = 1 - cos(angle) + noise
    y = 1 - sin(angle) - 0.5 + noise
    class = 1
```

### Make Circles
```
For each point i in [0, n_samples/2]:
    angle = 2π * i / (n_samples/2)
    x = cos(angle) * outer_radius + noise
    y = sin(angle) * outer_radius + noise
    class = 0

For each point i in [0, n_samples/2]:
    angle = 2π * i / (n_samples/2)
    x = cos(angle) * inner_radius + noise
    y = sin(angle) * inner_radius + noise
    class = 1
```

### Make Blobs
```
For each center c in centers:
    For each point i in [0, n_samples/n_centers]:
        x = c.x + gaussian_noise * std
        y = c.y + gaussian_noise * std
        class = c.index
```

### Make Spiral
```
For each point i in [0, n_samples/2]:
    angle = i / (n_samples/2) * 2π + noise
    radius = i / (n_samples/2)
    x = radius * cos(angle)
    y = radius * sin(angle)
    class = 0

For each point i in [0, n_samples/2]:
    angle = i / (n_samples/2) * 2π + π + noise  // offset by π
    radius = i / (n_samples/2)
    x = radius * cos(angle)
    y = radius * sin(angle)
    class = 1
```

---

## Interaction Flow

1. **Page Load**
   - Default to "Moons" dataset
   - K=3, Euclidean distance, boundaries off
   - Render training points

2. **User Clicks Canvas**
   - If in Custom + Add mode: Add training point
   - If in Custom + Delete mode: Remove nearest point
   - Otherwise: Classify clicked point
     - Generate classification steps
     - Load into playback controller
     - Auto-play animation

3. **Parameter Change**
   - Update classifier settings
   - If query point exists, re-classify with new params
   - If boundaries enabled, re-render boundaries

4. **Dataset Change**
   - Generate new dataset
   - Clear any existing query
   - Render new training points

---

## Performance Considerations

1. **Decision Boundary Rendering**
   - Compute on lower resolution grid (e.g., 50x50)
   - Use offscreen canvas for boundary, composite with main
   - Only recompute when K, metric, or data changes

2. **Large Datasets**
   - Cap at 500 training points
   - Use spatial indexing if needed (quadtree)

3. **Animation**
   - Use requestAnimationFrame
   - Batch similar operations

---

## Accessibility

- Keyboard shortcuts for playback (Space=play/pause, Arrow keys=step)
- High contrast mode support via theme
- Screen reader labels for controls
- Focus indicators on interactive elements

---

## Future Enhancements (Not in initial scope)

- [ ] Regression mode (KNN for continuous values)
- [ ] Cross-validation visualization
- [ ] Curse of dimensionality demo (add dimensions slider)
- [ ] Compare with other classifiers (SVM, Decision Tree)
- [ ] Export/import custom datasets

---

## Implementation Order

1. Basic HTML template with layout
2. Dataset generators (moons, circles, blobs)
3. Canvas renderer for points
4. KNN classifier core
5. Click-to-classify with neighbor visualization
6. Playback controller and step animation
7. Remaining datasets (linear, XOR, spiral)
8. Decision boundary rendering
9. Custom edit mode
10. Comparison tab
11. Polish and theming
