/**
 * KNN Classification Visualizer
 * Interactive visualization of K-Nearest Neighbors algorithm
 */

(function() {
    'use strict';

    // ============================================
    // Constants
    // ============================================
    const CANVAS_WIDTH = 560;
    const CANVAS_HEIGHT = 480;
    const PADDING = 40;
    const POINT_RADIUS = 6;
    const QUERY_RADIUS = 8;

    // Class colors (light theme)
    const CLASS_COLORS_LIGHT = [
        '#e41a1c', // Red
        '#377eb8', // Blue
        '#4daf4a', // Green
        '#984ea3'  // Purple
    ];

    // Class colors (dark theme)
    const CLASS_COLORS_DARK = [
        '#fb4934', // Gruvbox red
        '#83a598', // Gruvbox blue
        '#b8bb26', // Gruvbox green
        '#d3869b'  // Gruvbox purple
    ];

    const NEIGHBOR_COLOR = '#ff7f00';
    const NEIGHBOR_COLOR_DARK = '#fe8019';

    // Dataset descriptions
    const DATASET_DESCRIPTIONS = {
        moons: 'Two interleaving half circles - a classic non-linear classification problem',
        circles: 'Concentric circles - tests ability to learn circular decision boundaries',
        blobs: 'Three Gaussian clusters - simple linearly separable classes',
        linear: 'Two linearly separable clusters with some overlap',
        xor: 'XOR pattern - four clusters requiring non-linear boundaries',
        spiral: 'Two intertwined spirals - a challenging non-linear problem',
        custom: 'Draw your own training points - click Add to place points'
    };

    // Animation step types
    const STEP_TYPES = {
        PLACE_QUERY: 'place_query',
        CALCULATE_DISTANCES: 'calculate_distances',
        HIGHLIGHT_NEIGHBOR: 'highlight_neighbor',
        SHOW_ALL_NEIGHBORS: 'show_all_neighbors',
        VOTE: 'vote',
        CLASSIFY: 'classify'
    };

    // ============================================
    // Dataset Generator
    // ============================================
    const DatasetGenerator = {
        /**
         * Generate two interleaving half circles (moons)
         */
        makeMoons(nSamples = 200, noise = 0.1) {
            const points = [];
            const half = Math.floor(nSamples / 2);

            // Upper moon (class 0)
            for (let i = 0; i < half; i++) {
                const angle = Math.PI * i / half;
                const x = Math.cos(angle) + (Math.random() - 0.5) * noise * 2;
                const y = Math.sin(angle) + (Math.random() - 0.5) * noise * 2;
                points.push({ x, y, label: 0 });
            }

            // Lower moon (class 1)
            for (let i = 0; i < half; i++) {
                const angle = Math.PI * i / half;
                const x = 1 - Math.cos(angle) + (Math.random() - 0.5) * noise * 2;
                const y = 0.5 - Math.sin(angle) + (Math.random() - 0.5) * noise * 2;
                points.push({ x, y, label: 1 });
            }

            return this.normalizePoints(points);
        },

        /**
         * Generate concentric circles
         */
        makeCircles(nSamples = 200, noise = 0.05, factor = 0.5) {
            const points = [];
            const half = Math.floor(nSamples / 2);

            // Outer circle (class 0)
            for (let i = 0; i < half; i++) {
                const angle = 2 * Math.PI * i / half;
                const x = Math.cos(angle) + (Math.random() - 0.5) * noise * 2;
                const y = Math.sin(angle) + (Math.random() - 0.5) * noise * 2;
                points.push({ x, y, label: 0 });
            }

            // Inner circle (class 1)
            for (let i = 0; i < half; i++) {
                const angle = 2 * Math.PI * i / half;
                const x = factor * Math.cos(angle) + (Math.random() - 0.5) * noise * 2;
                const y = factor * Math.sin(angle) + (Math.random() - 0.5) * noise * 2;
                points.push({ x, y, label: 1 });
            }

            return this.normalizePoints(points);
        },

        /**
         * Generate Gaussian blobs
         */
        makeBlobs(nSamples = 150, centers = 3, clusterStd = 0.3) {
            const points = [];
            const perCluster = Math.floor(nSamples / centers);

            // Define cluster centers
            const centerPositions = [
                { x: 0.25, y: 0.75 },
                { x: 0.75, y: 0.75 },
                { x: 0.5, y: 0.25 }
            ];

            for (let c = 0; c < centers; c++) {
                const center = centerPositions[c];
                for (let i = 0; i < perCluster; i++) {
                    const x = center.x + this.gaussianRandom() * clusterStd;
                    const y = center.y + this.gaussianRandom() * clusterStd;
                    points.push({ x, y, label: c });
                }
            }

            return this.normalizePoints(points);
        },

        /**
         * Generate linearly separable data
         */
        makeLinear(nSamples = 150, noise = 0.15) {
            const points = [];
            const half = Math.floor(nSamples / 2);

            // Class 0 - lower left
            for (let i = 0; i < half; i++) {
                const x = Math.random() * 0.8 + (Math.random() - 0.5) * noise;
                const y = Math.random() * 0.8 - 0.1 + (Math.random() - 0.5) * noise;
                // Below the line y = x + 0.1
                if (y < x - 0.1 + (Math.random() - 0.5) * noise * 2) {
                    points.push({ x, y, label: 0 });
                } else {
                    i--; // Retry
                }
            }

            // Class 1 - upper right
            for (let i = 0; i < half; i++) {
                const x = Math.random() * 0.8 + 0.1 + (Math.random() - 0.5) * noise;
                const y = Math.random() * 0.8 + 0.2 + (Math.random() - 0.5) * noise;
                // Above the line y = x + 0.1
                if (y > x + 0.1 + (Math.random() - 0.5) * noise * 2) {
                    points.push({ x, y, label: 1 });
                } else {
                    i--; // Retry
                }
            }

            return this.normalizePoints(points);
        },

        /**
         * Generate XOR pattern
         */
        makeXOR(nSamples = 200, noise = 0.08) {
            const points = [];
            const quarter = Math.floor(nSamples / 4);

            // Bottom-left and top-right (class 0)
            for (let i = 0; i < quarter; i++) {
                points.push({
                    x: 0.25 + (Math.random() - 0.5) * 0.3 + (Math.random() - 0.5) * noise,
                    y: 0.25 + (Math.random() - 0.5) * 0.3 + (Math.random() - 0.5) * noise,
                    label: 0
                });
            }
            for (let i = 0; i < quarter; i++) {
                points.push({
                    x: 0.75 + (Math.random() - 0.5) * 0.3 + (Math.random() - 0.5) * noise,
                    y: 0.75 + (Math.random() - 0.5) * 0.3 + (Math.random() - 0.5) * noise,
                    label: 0
                });
            }

            // Top-left and bottom-right (class 1)
            for (let i = 0; i < quarter; i++) {
                points.push({
                    x: 0.25 + (Math.random() - 0.5) * 0.3 + (Math.random() - 0.5) * noise,
                    y: 0.75 + (Math.random() - 0.5) * 0.3 + (Math.random() - 0.5) * noise,
                    label: 1
                });
            }
            for (let i = 0; i < quarter; i++) {
                points.push({
                    x: 0.75 + (Math.random() - 0.5) * 0.3 + (Math.random() - 0.5) * noise,
                    y: 0.25 + (Math.random() - 0.5) * 0.3 + (Math.random() - 0.5) * noise,
                    label: 1
                });
            }

            return this.normalizePoints(points);
        },

        /**
         * Generate two intertwined spirals
         */
        makeSpiral(nSamples = 200, noise = 0.05) {
            const points = [];
            const half = Math.floor(nSamples / 2);

            // Spiral 1 (class 0)
            for (let i = 0; i < half; i++) {
                const t = i / half * 2 * Math.PI + Math.random() * noise;
                const r = 0.1 + 0.4 * i / half;
                const x = 0.5 + r * Math.cos(t) + (Math.random() - 0.5) * noise;
                const y = 0.5 + r * Math.sin(t) + (Math.random() - 0.5) * noise;
                points.push({ x, y, label: 0 });
            }

            // Spiral 2 (class 1) - offset by PI
            for (let i = 0; i < half; i++) {
                const t = i / half * 2 * Math.PI + Math.PI + Math.random() * noise;
                const r = 0.1 + 0.4 * i / half;
                const x = 0.5 + r * Math.cos(t) + (Math.random() - 0.5) * noise;
                const y = 0.5 + r * Math.sin(t) + (Math.random() - 0.5) * noise;
                points.push({ x, y, label: 1 });
            }

            return this.normalizePoints(points);
        },

        /**
         * Normalize points to fit within [0, 1] with padding
         */
        normalizePoints(points) {
            if (points.length === 0) return points;

            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;

            points.forEach(p => {
                minX = Math.min(minX, p.x);
                maxX = Math.max(maxX, p.x);
                minY = Math.min(minY, p.y);
                maxY = Math.max(maxY, p.y);
            });

            const rangeX = maxX - minX || 1;
            const rangeY = maxY - minY || 1;
            const padding = 0.1;

            return points.map(p => ({
                x: padding + (p.x - minX) / rangeX * (1 - 2 * padding),
                y: padding + (p.y - minY) / rangeY * (1 - 2 * padding),
                label: p.label
            }));
        },

        /**
         * Generate Gaussian random number using Box-Muller transform
         */
        gaussianRandom() {
            let u = 0, v = 0;
            while (u === 0) u = Math.random();
            while (v === 0) v = Math.random();
            return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        }
    };

    // ============================================
    // Distance Functions
    // ============================================
    const DistanceMetrics = {
        euclidean(p1, p2) {
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            return Math.sqrt(dx * dx + dy * dy);
        },

        manhattan(p1, p2) {
            return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
        },

        chebyshev(p1, p2) {
            return Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y));
        }
    };

    // ============================================
    // KNN Classifier
    // ============================================
    class KNNClassifier {
        constructor(k = 3, metric = 'euclidean', weighted = false) {
            this.k = k;
            this.metric = metric;
            this.weighted = weighted;
            this.trainingData = [];
            this.distanceFunc = DistanceMetrics[metric];
        }

        setK(k) {
            this.k = k;
        }

        setMetric(metric) {
            this.metric = metric;
            this.distanceFunc = DistanceMetrics[metric];
        }

        setWeighted(weighted) {
            this.weighted = weighted;
        }

        fit(data) {
            this.trainingData = data;
        }

        /**
         * Predict class for a query point with step recording for animation
         */
        predictWithSteps(query) {
            const steps = [];

            // Step 1: Place query point
            steps.push({
                type: STEP_TYPES.PLACE_QUERY,
                query: query,
                description: `Query point placed at (${query.x.toFixed(2)}, ${query.y.toFixed(2)})`
            });

            // Step 2: Calculate distances to all points
            const distances = this.trainingData.map((point, index) => ({
                index,
                point,
                distance: this.distanceFunc(query, point)
            }));

            steps.push({
                type: STEP_TYPES.CALCULATE_DISTANCES,
                query: query,
                distances: distances.map(d => ({ ...d })),
                description: `Calculated distances to ${distances.length} training points`
            });

            // Sort by distance
            distances.sort((a, b) => a.distance - b.distance);

            // Step 3: Highlight each neighbor one by one
            const neighbors = distances.slice(0, this.k);
            neighbors.forEach((neighbor, i) => {
                steps.push({
                    type: STEP_TYPES.HIGHLIGHT_NEIGHBOR,
                    query: query,
                    neighbors: neighbors.slice(0, i + 1),
                    currentNeighbor: neighbor,
                    rank: i + 1,
                    description: `Neighbor ${i + 1}: Class ${neighbor.point.label + 1}, distance = ${neighbor.distance.toFixed(3)}`
                });
            });

            // Step 4: Show all neighbors
            steps.push({
                type: STEP_TYPES.SHOW_ALL_NEIGHBORS,
                query: query,
                neighbors: neighbors,
                description: `Found ${this.k} nearest neighbors`
            });

            // Step 5: Vote
            const votes = this.countVotes(neighbors);
            steps.push({
                type: STEP_TYPES.VOTE,
                query: query,
                neighbors: neighbors,
                votes: votes,
                description: `Voting: ${Object.entries(votes).map(([c, v]) => `Class ${parseInt(c) + 1}: ${v.toFixed(2)}`).join(', ')}`
            });

            // Step 6: Classify
            const prediction = this.getPrediction(votes);
            const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
            const confidence = (votes[prediction] / totalVotes * 100);

            steps.push({
                type: STEP_TYPES.CLASSIFY,
                query: query,
                neighbors: neighbors,
                votes: votes,
                prediction: prediction,
                confidence: confidence,
                description: `Prediction: Class ${prediction + 1} (${confidence.toFixed(1)}% confidence)`
            });

            return {
                steps,
                prediction,
                confidence,
                neighbors,
                votes
            };
        }

        /**
         * Quick prediction without step recording
         */
        predict(query) {
            if (this.trainingData.length === 0) return null;

            const distances = this.trainingData.map(point => ({
                point,
                distance: this.distanceFunc(query, point)
            }));

            distances.sort((a, b) => a.distance - b.distance);
            const neighbors = distances.slice(0, Math.min(this.k, distances.length));
            const votes = this.countVotes(neighbors);

            return this.getPrediction(votes);
        }

        countVotes(neighbors) {
            const votes = {};

            neighbors.forEach(n => {
                const label = n.point.label;
                if (!(label in votes)) {
                    votes[label] = 0;
                }

                if (this.weighted && n.distance > 0) {
                    votes[label] += 1 / n.distance;
                } else {
                    votes[label] += 1;
                }
            });

            return votes;
        }

        getPrediction(votes) {
            let maxVotes = -Infinity;
            let prediction = 0;

            for (const [label, count] of Object.entries(votes)) {
                if (count > maxVotes) {
                    maxVotes = count;
                    prediction = parseInt(label);
                }
            }

            return prediction;
        }

        /**
         * Compute decision boundary grid
         */
        computeBoundary(resolution = 50) {
            const boundary = [];

            for (let i = 0; i <= resolution; i++) {
                const row = [];
                for (let j = 0; j <= resolution; j++) {
                    const x = j / resolution;
                    const y = i / resolution;
                    const prediction = this.predict({ x, y });
                    row.push(prediction);
                }
                boundary.push(row);
            }

            return boundary;
        }
    }

    // ============================================
    // Renderer
    // ============================================
    class Renderer {
        constructor(canvas, boundaryCanvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.boundaryCanvas = boundaryCanvas;
            this.boundaryCtx = boundaryCanvas.getContext('2d');
            this.isDarkTheme = this.checkDarkTheme();
        }

        checkDarkTheme() {
            return document.documentElement.getAttribute('data-theme') === 'gruvbox-dark';
        }

        getClassColors() {
            return this.isDarkTheme ? CLASS_COLORS_DARK : CLASS_COLORS_LIGHT;
        }

        getNeighborColor() {
            return this.isDarkTheme ? NEIGHBOR_COLOR_DARK : NEIGHBOR_COLOR;
        }

        getBackgroundColor() {
            return this.isDarkTheme ? '#1d2021' : '#fafafa';
        }

        getTextColor() {
            return this.isDarkTheme ? '#ebdbb2' : '#333333';
        }

        getGridColor() {
            return this.isDarkTheme ? '#3c3836' : '#e0e0e0';
        }

        /**
         * Convert normalized coordinates to canvas coordinates
         */
        toCanvas(x, y) {
            return {
                x: PADDING + x * (CANVAS_WIDTH - 2 * PADDING),
                y: CANVAS_HEIGHT - PADDING - y * (CANVAS_HEIGHT - 2 * PADDING)
            };
        }

        /**
         * Convert canvas coordinates to normalized coordinates
         */
        fromCanvas(canvasX, canvasY) {
            return {
                x: (canvasX - PADDING) / (CANVAS_WIDTH - 2 * PADDING),
                y: (CANVAS_HEIGHT - PADDING - canvasY) / (CANVAS_HEIGHT - 2 * PADDING)
            };
        }

        /**
         * Clear the main canvas
         */
        clear() {
            this.ctx.fillStyle = this.getBackgroundColor();
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            this.drawGrid();
        }

        /**
         * Draw background grid
         */
        drawGrid() {
            this.ctx.strokeStyle = this.getGridColor();
            this.ctx.lineWidth = 0.5;

            // Vertical lines
            for (let i = 0; i <= 10; i++) {
                const x = PADDING + i * (CANVAS_WIDTH - 2 * PADDING) / 10;
                this.ctx.beginPath();
                this.ctx.moveTo(x, PADDING);
                this.ctx.lineTo(x, CANVAS_HEIGHT - PADDING);
                this.ctx.stroke();
            }

            // Horizontal lines
            for (let i = 0; i <= 10; i++) {
                const y = PADDING + i * (CANVAS_HEIGHT - 2 * PADDING) / 10;
                this.ctx.beginPath();
                this.ctx.moveTo(PADDING, y);
                this.ctx.lineTo(CANVAS_WIDTH - PADDING, y);
                this.ctx.stroke();
            }
        }

        /**
         * Draw all training points
         */
        drawPoints(points, dimmedPoints = null) {
            const colors = this.getClassColors();

            points.forEach((point, index) => {
                const { x, y } = this.toCanvas(point.x, point.y);
                const isDimmed = dimmedPoints && !dimmedPoints.has(index);

                this.ctx.beginPath();
                this.ctx.arc(x, y, POINT_RADIUS, 0, 2 * Math.PI);
                this.ctx.fillStyle = isDimmed
                    ? this.adjustAlpha(colors[point.label], 0.2)
                    : colors[point.label];
                this.ctx.fill();
                this.ctx.strokeStyle = isDimmed
                    ? this.adjustAlpha('#000', 0.1)
                    : 'rgba(0, 0, 0, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            });
        }

        /**
         * Draw query point
         */
        drawQuery(query, prediction = null) {
            if (!query) return;

            const { x, y } = this.toCanvas(query.x, query.y);
            const colors = this.getClassColors();

            this.ctx.beginPath();
            this.ctx.arc(x, y, QUERY_RADIUS, 0, 2 * Math.PI);

            if (prediction !== null) {
                this.ctx.fillStyle = colors[prediction];
                this.ctx.fill();
            } else {
                this.ctx.fillStyle = this.getBackgroundColor();
                this.ctx.fill();
            }

            this.ctx.strokeStyle = this.isDarkTheme ? '#ebdbb2' : '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        /**
         * Draw lines to neighbors
         */
        drawNeighborLines(query, neighbors, highlightIndex = null) {
            if (!query || !neighbors) return;

            const queryPos = this.toCanvas(query.x, query.y);
            const neighborColor = this.getNeighborColor();

            neighbors.forEach((neighbor, i) => {
                const pointPos = this.toCanvas(neighbor.point.x, neighbor.point.y);
                const isHighlighted = highlightIndex === null || i === highlightIndex;

                this.ctx.beginPath();
                this.ctx.moveTo(queryPos.x, queryPos.y);
                this.ctx.lineTo(pointPos.x, pointPos.y);

                if (isHighlighted) {
                    this.ctx.strokeStyle = neighborColor;
                    this.ctx.lineWidth = 2;
                    this.ctx.setLineDash([]);
                } else {
                    this.ctx.strokeStyle = this.adjustAlpha(neighborColor, 0.3);
                    this.ctx.lineWidth = 1;
                    this.ctx.setLineDash([4, 4]);
                }
                this.ctx.stroke();
                this.ctx.setLineDash([]);

                // Draw distance label for highlighted neighbor
                if (isHighlighted && highlightIndex !== null) {
                    const midX = (queryPos.x + pointPos.x) / 2;
                    const midY = (queryPos.y + pointPos.y) / 2;

                    this.ctx.font = '11px sans-serif';
                    this.ctx.fillStyle = this.getTextColor();
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(neighbor.distance.toFixed(3), midX, midY - 5);
                }
            });
        }

        /**
         * Highlight specific neighbor point
         */
        highlightNeighbor(neighbor) {
            const { x, y } = this.toCanvas(neighbor.point.x, neighbor.point.y);
            const neighborColor = this.getNeighborColor();

            // Draw highlight ring
            this.ctx.beginPath();
            this.ctx.arc(x, y, POINT_RADIUS + 4, 0, 2 * Math.PI);
            this.ctx.strokeStyle = neighborColor;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }

        /**
         * Draw decision boundary
         */
        drawBoundary(boundary, numClasses) {
            if (!boundary) {
                this.clearBoundary();
                return;
            }

            const colors = this.getClassColors();
            const resolution = boundary.length - 1;
            const cellWidth = (CANVAS_WIDTH - 2 * PADDING) / resolution;
            const cellHeight = (CANVAS_HEIGHT - 2 * PADDING) / resolution;

            this.boundaryCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            for (let i = 0; i < resolution; i++) {
                for (let j = 0; j < resolution; j++) {
                    const prediction = boundary[i][j];
                    const x = PADDING + j * cellWidth;
                    const y = CANVAS_HEIGHT - PADDING - (i + 1) * cellHeight;

                    this.boundaryCtx.fillStyle = this.adjustAlpha(colors[prediction], 0.15);
                    this.boundaryCtx.fillRect(x, y, cellWidth + 1, cellHeight + 1);
                }
            }
        }

        /**
         * Clear decision boundary
         */
        clearBoundary() {
            this.boundaryCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }

        /**
         * Adjust color alpha
         */
        adjustAlpha(color, alpha) {
            // Handle hex colors
            if (color.startsWith('#')) {
                const r = parseInt(color.slice(1, 3), 16);
                const g = parseInt(color.slice(3, 5), 16);
                const b = parseInt(color.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            }
            return color;
        }

        /**
         * Update theme
         */
        updateTheme() {
            this.isDarkTheme = this.checkDarkTheme();
        }
    }

    // ============================================
    // Playback Controller
    // ============================================
    class PlaybackController {
        constructor(onStepChange) {
            this.steps = [];
            this.currentStep = -1;
            this.isPlaying = false;
            this.speed = 5;
            this.animationTimer = null;
            this.onStepChange = onStepChange;
        }

        loadSteps(steps) {
            this.steps = steps;
            this.currentStep = -1;
            this.isPlaying = false;
            this.clearTimer();
        }

        play() {
            if (this.currentStep >= this.steps.length - 1) {
                this.currentStep = -1;
            }
            this.isPlaying = true;
            this.scheduleNextStep();
        }

        pause() {
            this.isPlaying = false;
            this.clearTimer();
        }

        stepForward() {
            if (this.currentStep < this.steps.length - 1) {
                this.currentStep++;
                this.onStepChange(this.steps[this.currentStep], this.currentStep, this.steps.length);
            }
        }

        stepBackward() {
            if (this.currentStep > 0) {
                this.currentStep--;
                this.onStepChange(this.steps[this.currentStep], this.currentStep, this.steps.length);
            } else if (this.currentStep === 0) {
                this.currentStep = -1;
                this.onStepChange(null, -1, this.steps.length);
            }
        }

        reset() {
            this.pause();
            this.currentStep = -1;
            this.onStepChange(null, -1, this.steps.length);
        }

        setSpeed(speed) {
            this.speed = speed;
        }

        scheduleNextStep() {
            if (!this.isPlaying) return;

            const delay = 1100 - this.speed * 100; // 100ms to 1000ms

            this.animationTimer = setTimeout(() => {
                if (this.currentStep < this.steps.length - 1) {
                    this.stepForward();
                    this.scheduleNextStep();
                } else {
                    this.isPlaying = false;
                    this.onStepChange(this.steps[this.currentStep], this.currentStep, this.steps.length, true);
                }
            }, delay);
        }

        clearTimer() {
            if (this.animationTimer) {
                clearTimeout(this.animationTimer);
                this.animationTimer = null;
            }
        }

        get hasSteps() {
            return this.steps.length > 0;
        }

        get isAtEnd() {
            return this.currentStep >= this.steps.length - 1;
        }

        get isAtStart() {
            return this.currentStep <= 0;
        }
    }

    // ============================================
    // Main Application
    // ============================================
    class KNNApp {
        constructor() {
            // Canvas elements
            this.canvas = document.getElementById('knn-canvas');
            this.boundaryCanvas = document.getElementById('boundary-canvas');

            // Initialize components
            this.renderer = new Renderer(this.canvas, this.boundaryCanvas);
            this.classifier = new KNNClassifier(3, 'euclidean', false);
            this.playback = new PlaybackController(this.onStepChange.bind(this));

            // State
            this.trainingData = [];
            this.currentDataset = 'moons';
            this.queryPoint = null;
            this.classificationResult = null;
            this.showBoundaries = false;
            this.boundaryCache = null;
            this.editMode = 'classify';
            this.selectedClass = 0;
            this.numClasses = 2;

            // Initialize
            this.bindEvents();
            this.loadDataset('moons');
        }

        bindEvents() {
            // Dataset selection
            document.querySelectorAll('[data-dataset]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('[data-dataset]').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    this.loadDataset(e.target.dataset.dataset);
                });
            });

            // Canvas click
            this.canvas.addEventListener('click', this.onCanvasClick.bind(this));

            // Algorithm options
            document.getElementById('k-slider').addEventListener('input', (e) => {
                const k = parseInt(e.target.value);
                document.getElementById('k-value').textContent = k;
                this.classifier.setK(k);
                this.invalidateBoundary();
                this.reclassify();
            });

            document.getElementById('distance-metric').addEventListener('change', (e) => {
                this.classifier.setMetric(e.target.value);
                this.invalidateBoundary();
                this.reclassify();
            });

            document.getElementById('show-boundaries').addEventListener('change', (e) => {
                this.showBoundaries = e.target.checked;
                this.updateBoundary();
            });

            document.getElementById('weighted-knn').addEventListener('change', (e) => {
                this.classifier.setWeighted(e.target.checked);
                this.invalidateBoundary();
                this.reclassify();
            });

            // Playback controls
            document.getElementById('btn-play').addEventListener('click', () => {
                this.playback.play();
                this.updatePlaybackButtons();
            });

            document.getElementById('btn-pause').addEventListener('click', () => {
                this.playback.pause();
                this.updatePlaybackButtons();
            });

            document.getElementById('btn-step-back').addEventListener('click', () => {
                this.playback.stepBackward();
                this.updatePlaybackButtons();
            });

            document.getElementById('btn-step-forward').addEventListener('click', () => {
                this.playback.stepForward();
                this.updatePlaybackButtons();
            });

            document.getElementById('btn-reset').addEventListener('click', () => {
                this.resetClassification();
            });

            document.getElementById('speed-slider').addEventListener('input', (e) => {
                this.playback.setSpeed(parseInt(e.target.value));
            });

            // Edit mode buttons (for custom dataset)
            document.querySelectorAll('[data-mode]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    this.editMode = e.target.dataset.mode;
                    this.updateCursor();
                });
            });

            // Class selector
            document.querySelectorAll('[data-class]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('[data-class]').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    this.selectedClass = parseInt(e.target.dataset.class);
                });
            });

            // Clear points button
            document.getElementById('btn-clear-points').addEventListener('click', () => {
                this.trainingData = [];
                this.classifier.fit(this.trainingData);
                this.invalidateBoundary();
                this.resetClassification();
                this.render();
            });

            // Tab switching
            document.querySelectorAll('.info-panel-tabs [data-tab]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.info-panel-tabs [data-tab]').forEach(b => b.classList.remove('active'));
                    document.querySelectorAll('.info-tab-content').forEach(t => t.classList.remove('active'));
                    e.target.classList.add('active');
                    document.getElementById('tab-' + e.target.dataset.tab).classList.add('active');
                });
            });

            // Comparison button
            document.getElementById('btn-run-comparison').addEventListener('click', () => {
                this.runComparison();
            });

            // Theme change observer
            const observer = new MutationObserver(() => {
                this.renderer.updateTheme();
                this.render();
                this.updateBoundary();
            });
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        }

        loadDataset(name) {
            this.currentDataset = name;
            this.resetClassification();

            // Update description
            document.getElementById('dataset-description').innerHTML =
                `<i class="fa fa-info-circle"></i> ${DATASET_DESCRIPTIONS[name]}`;

            // Show/hide edit toolbar
            const editToolbar = document.getElementById('edit-toolbar');
            const legendClass2 = document.getElementById('legend-class-2');

            if (name === 'custom') {
                editToolbar.style.display = 'flex';
                this.trainingData = [];
                this.numClasses = 3;
                legendClass2.style.display = 'inline-flex';
            } else {
                editToolbar.style.display = 'none';
                this.editMode = 'classify';

                // Generate dataset
                switch (name) {
                    case 'moons':
                        this.trainingData = DatasetGenerator.makeMoons(200, 0.1);
                        this.numClasses = 2;
                        break;
                    case 'circles':
                        this.trainingData = DatasetGenerator.makeCircles(200, 0.05);
                        this.numClasses = 2;
                        break;
                    case 'blobs':
                        this.trainingData = DatasetGenerator.makeBlobs(150, 3, 0.12);
                        this.numClasses = 3;
                        break;
                    case 'linear':
                        this.trainingData = DatasetGenerator.makeLinear(150, 0.1);
                        this.numClasses = 2;
                        break;
                    case 'xor':
                        this.trainingData = DatasetGenerator.makeXOR(200, 0.08);
                        this.numClasses = 2;
                        break;
                    case 'spiral':
                        this.trainingData = DatasetGenerator.makeSpiral(200, 0.03);
                        this.numClasses = 2;
                        break;
                }

                legendClass2.style.display = this.numClasses > 2 ? 'inline-flex' : 'none';
            }

            this.classifier.fit(this.trainingData);
            this.invalidateBoundary();
            this.updateBoundary();
            this.render();
            this.updateCursor();
        }

        onCanvasClick(e) {
            const rect = this.canvas.getBoundingClientRect();
            const canvasX = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
            const canvasY = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
            const point = this.renderer.fromCanvas(canvasX, canvasY);

            // Clamp to valid range
            point.x = Math.max(0, Math.min(1, point.x));
            point.y = Math.max(0, Math.min(1, point.y));

            if (this.currentDataset === 'custom') {
                if (this.editMode === 'add') {
                    this.addPoint(point);
                    return;
                } else if (this.editMode === 'delete') {
                    this.deletePoint(point);
                    return;
                }
            }

            // Classify mode
            this.classifyPoint(point);
        }

        addPoint(point) {
            this.trainingData.push({
                x: point.x,
                y: point.y,
                label: this.selectedClass
            });
            this.classifier.fit(this.trainingData);
            this.invalidateBoundary();
            this.updateBoundary();
            this.render();
        }

        deletePoint(point) {
            if (this.trainingData.length === 0) return;

            // Find nearest point
            let minDist = Infinity;
            let minIndex = -1;

            this.trainingData.forEach((p, i) => {
                const dist = Math.sqrt((p.x - point.x) ** 2 + (p.y - point.y) ** 2);
                if (dist < minDist) {
                    minDist = dist;
                    minIndex = i;
                }
            });

            // Only delete if close enough (within ~20 pixels)
            const threshold = 0.05;
            if (minDist < threshold) {
                this.trainingData.splice(minIndex, 1);
                this.classifier.fit(this.trainingData);
                this.invalidateBoundary();
                this.updateBoundary();
                this.render();
            }
        }

        classifyPoint(point) {
            if (this.trainingData.length === 0) return;

            this.queryPoint = point;
            this.classificationResult = this.classifier.predictWithSteps(point);
            this.playback.loadSteps(this.classificationResult.steps);

            // Auto-play the animation
            this.playback.play();
            this.updatePlaybackButtons();

            // Enable comparison button
            document.getElementById('btn-run-comparison').disabled = false;
        }

        reclassify() {
            if (this.queryPoint && this.trainingData.length > 0) {
                this.classificationResult = this.classifier.predictWithSteps(this.queryPoint);
                this.playback.loadSteps(this.classificationResult.steps);
                // Jump to end
                while (this.playback.currentStep < this.playback.steps.length - 1) {
                    this.playback.stepForward();
                }
                this.updatePlaybackButtons();
            }
        }

        resetClassification() {
            this.queryPoint = null;
            this.classificationResult = null;
            this.playback.reset();
            this.updatePlaybackButtons();
            this.updateMetrics(null);
            this.updateNeighborsList(null);
            this.clearComparison();
            document.getElementById('btn-run-comparison').disabled = true;
            this.render();
        }

        onStepChange(step, stepIndex, totalSteps, finished = false) {
            this.render(step);
            this.updatePlaybackStatus(step, stepIndex, totalSteps);
            this.updatePlaybackButtons();

            if (step) {
                if (step.type === STEP_TYPES.CLASSIFY) {
                    this.updateMetrics(step);
                    this.updateNeighborsList(step.neighbors);
                } else if (step.type === STEP_TYPES.SHOW_ALL_NEIGHBORS || step.type === STEP_TYPES.VOTE) {
                    this.updateNeighborsList(step.neighbors);
                }
            } else {
                this.updateMetrics(null);
                this.updateNeighborsList(null);
            }
        }

        render(step = null) {
            this.renderer.clear();

            // Determine which points to dim
            let dimmedPoints = null;
            if (step && step.neighbors) {
                dimmedPoints = new Set(step.neighbors.map(n => n.index));
            }

            // Draw training points
            this.renderer.drawPoints(this.trainingData, dimmedPoints);

            // Draw based on current step
            if (step) {
                switch (step.type) {
                    case STEP_TYPES.PLACE_QUERY:
                        this.renderer.drawQuery(step.query);
                        break;

                    case STEP_TYPES.CALCULATE_DISTANCES:
                        this.renderer.drawQuery(step.query);
                        break;

                    case STEP_TYPES.HIGHLIGHT_NEIGHBOR:
                        this.renderer.drawNeighborLines(step.query, step.neighbors, step.neighbors.length - 1);
                        this.renderer.highlightNeighbor(step.currentNeighbor);
                        this.renderer.drawQuery(step.query);
                        break;

                    case STEP_TYPES.SHOW_ALL_NEIGHBORS:
                        this.renderer.drawNeighborLines(step.query, step.neighbors);
                        this.renderer.drawQuery(step.query);
                        break;

                    case STEP_TYPES.VOTE:
                        this.renderer.drawNeighborLines(step.query, step.neighbors);
                        this.renderer.drawQuery(step.query);
                        break;

                    case STEP_TYPES.CLASSIFY:
                        this.renderer.drawNeighborLines(step.query, step.neighbors);
                        this.renderer.drawQuery(step.query, step.prediction);
                        break;
                }
            } else if (this.queryPoint && this.classificationResult) {
                // Show final state
                this.renderer.drawNeighborLines(this.queryPoint, this.classificationResult.neighbors);
                this.renderer.drawQuery(this.queryPoint, this.classificationResult.prediction);
            }
        }

        invalidateBoundary() {
            this.boundaryCache = null;
        }

        updateBoundary() {
            if (!this.showBoundaries || this.trainingData.length === 0) {
                this.renderer.clearBoundary();
                return;
            }

            // Show loading
            document.getElementById('loading-overlay').style.display = 'flex';

            // Compute in next frame to allow UI update
            requestAnimationFrame(() => {
                if (!this.boundaryCache) {
                    this.boundaryCache = this.classifier.computeBoundary(50);
                }
                this.renderer.drawBoundary(this.boundaryCache, this.numClasses);
                document.getElementById('loading-overlay').style.display = 'none';
            });
        }

        updatePlaybackStatus(step, stepIndex, totalSteps) {
            const statusEl = document.getElementById('playback-step');
            if (step) {
                statusEl.textContent = `Step ${stepIndex + 1}/${totalSteps}: ${step.description}`;
            } else {
                statusEl.textContent = 'Click anywhere to classify';
            }
        }

        updatePlaybackButtons() {
            const hasSteps = this.playback.hasSteps;
            const isPlaying = this.playback.isPlaying;

            document.getElementById('btn-play').disabled = !hasSteps || isPlaying;
            document.getElementById('btn-pause').disabled = !isPlaying;
            document.getElementById('btn-step-back').disabled = !hasSteps || this.playback.isAtStart;
            document.getElementById('btn-step-forward').disabled = !hasSteps || this.playback.isAtEnd;
        }

        updateMetrics(step) {
            if (step && step.type === STEP_TYPES.CLASSIFY) {
                document.getElementById('metric-query').textContent =
                    `(${step.query.x.toFixed(2)}, ${step.query.y.toFixed(2)})`;
                document.getElementById('metric-prediction').innerHTML =
                    `<span class="class-${step.prediction}-text">Class ${step.prediction + 1}</span>`;
                document.getElementById('metric-confidence').textContent =
                    `${step.confidence.toFixed(1)}%`;
                document.getElementById('metric-neighbors').textContent =
                    step.neighbors.length;

                // Update vote breakdown
                this.updateVoteBreakdown(step.votes);
            } else {
                document.getElementById('metric-query').textContent = '-';
                document.getElementById('metric-prediction').textContent = '-';
                document.getElementById('metric-confidence').textContent = '-';
                document.getElementById('metric-neighbors').textContent = '-';
                document.getElementById('vote-breakdown').style.display = 'none';
            }
        }

        updateVoteBreakdown(votes) {
            const container = document.getElementById('vote-breakdown');
            const barsContainer = document.getElementById('vote-bars');

            if (!votes) {
                container.style.display = 'none';
                return;
            }

            container.style.display = 'block';
            barsContainer.innerHTML = '';

            const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);

            for (let i = 0; i < this.numClasses; i++) {
                const voteCount = votes[i] || 0;
                const percentage = totalVotes > 0 ? (voteCount / totalVotes * 100) : 0;

                const row = document.createElement('div');
                row.className = 'vote-bar-row';
                row.innerHTML = `
                    <span class="vote-bar-label">Class ${i + 1}</span>
                    <div class="vote-bar-container">
                        <div class="vote-bar class-${i}" style="width: ${percentage}%"></div>
                    </div>
                    <span class="vote-bar-value">${voteCount.toFixed(1)}</span>
                `;
                barsContainer.appendChild(row);
            }
        }

        updateNeighborsList(neighbors) {
            const container = document.getElementById('neighbors-list');
            const countBadge = document.getElementById('neighbors-count');

            if (!neighbors || neighbors.length === 0) {
                container.innerHTML = '<div class="list-empty">Click to classify a point</div>';
                countBadge.textContent = '0';
                return;
            }

            countBadge.textContent = neighbors.length;
            container.innerHTML = neighbors.map((n, i) => `
                <div class="neighbor-item class-${n.point.label}">
                    <span class="neighbor-rank">#${i + 1}</span>
                    <span class="neighbor-class">Class ${n.point.label + 1}</span>
                    <span class="neighbor-distance">${n.distance.toFixed(4)}</span>
                </div>
            `).join('');
        }

        runComparison() {
            if (!this.queryPoint) return;

            const tbody = document.querySelector('#comparison-table tbody');
            tbody.innerHTML = '';

            const kValues = [1, 3, 5, 7];
            const metrics = ['euclidean', 'manhattan', 'chebyshev'];
            const currentK = this.classifier.k;
            const currentMetric = this.classifier.metric;

            const tempClassifier = new KNNClassifier(1, 'euclidean', this.classifier.weighted);
            tempClassifier.fit(this.trainingData);

            kValues.forEach(k => {
                metrics.forEach(metric => {
                    tempClassifier.setK(k);
                    tempClassifier.setMetric(metric);

                    const result = tempClassifier.predictWithSteps(this.queryPoint);
                    const isCurrent = k === currentK && metric === currentMetric;

                    const row = document.createElement('tr');
                    if (isCurrent) row.className = 'current-row';

                    row.innerHTML = `
                        <td>${k}</td>
                        <td>${metric.charAt(0).toUpperCase() + metric.slice(1)}</td>
                        <td><span class="class-${result.prediction}-text">Class ${result.prediction + 1}</span></td>
                        <td>${result.confidence.toFixed(1)}%</td>
                    `;
                    tbody.appendChild(row);
                });
            });
        }

        clearComparison() {
            const tbody = document.querySelector('#comparison-table tbody');
            tbody.innerHTML = '<tr class="compare-empty"><td colspan="4">Classify a point to compare</td></tr>';
        }

        updateCursor() {
            if (this.currentDataset === 'custom') {
                if (this.editMode === 'add') {
                    this.canvas.style.cursor = 'cell';
                } else if (this.editMode === 'delete') {
                    this.canvas.style.cursor = 'not-allowed';
                } else {
                    this.canvas.style.cursor = 'crosshair';
                }
            } else {
                this.canvas.style.cursor = 'crosshair';
            }
        }
    }

    // ============================================
    // Initialize
    // ============================================
    document.addEventListener('DOMContentLoaded', () => {
        window.knnApp = new KNNApp();
    });

})();
