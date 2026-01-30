/**
 * Decision Tree Visualizer
 * Interactive visualization of Decision Tree classification algorithm
 */

(function() {
    'use strict';

    // ============================================
    // Constants
    // ============================================
    const CANVAS_WIDTH = 560;
    const CANVAS_HEIGHT = 400;
    const PADDING = 40;
    const POINT_RADIUS = 5;
    const QUERY_RADIUS = 7;

    // Class colors (light theme)
    const CLASS_COLORS_LIGHT = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3'];
    // Class colors (dark theme)
    const CLASS_COLORS_DARK = ['#fb4934', '#83a598', '#b8bb26', '#d3869b'];

    const SPLIT_COLOR = '#666666';
    const SPLIT_COLOR_DARK = '#928374';
    const HIGHLIGHT_COLOR = '#ff7f00';

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

    // ============================================
    // Dataset Generator (same as KNN)
    // ============================================
    const DatasetGenerator = {
        makeMoons(nSamples = 200, noise = 0.1) {
            const points = [];
            const half = Math.floor(nSamples / 2);
            for (let i = 0; i < half; i++) {
                const angle = Math.PI * i / half;
                points.push({
                    x: Math.cos(angle) + (Math.random() - 0.5) * noise * 2,
                    y: Math.sin(angle) + (Math.random() - 0.5) * noise * 2,
                    label: 0
                });
            }
            for (let i = 0; i < half; i++) {
                const angle = Math.PI * i / half;
                points.push({
                    x: 1 - Math.cos(angle) + (Math.random() - 0.5) * noise * 2,
                    y: 0.5 - Math.sin(angle) + (Math.random() - 0.5) * noise * 2,
                    label: 1
                });
            }
            return this.normalizePoints(points);
        },

        makeCircles(nSamples = 200, noise = 0.05, factor = 0.5) {
            const points = [];
            const half = Math.floor(nSamples / 2);
            for (let i = 0; i < half; i++) {
                const angle = 2 * Math.PI * i / half;
                points.push({
                    x: Math.cos(angle) + (Math.random() - 0.5) * noise * 2,
                    y: Math.sin(angle) + (Math.random() - 0.5) * noise * 2,
                    label: 0
                });
            }
            for (let i = 0; i < half; i++) {
                const angle = 2 * Math.PI * i / half;
                points.push({
                    x: factor * Math.cos(angle) + (Math.random() - 0.5) * noise * 2,
                    y: factor * Math.sin(angle) + (Math.random() - 0.5) * noise * 2,
                    label: 1
                });
            }
            return this.normalizePoints(points);
        },

        makeBlobs(nSamples = 150, centers = 3, clusterStd = 0.3) {
            const points = [];
            const perCluster = Math.floor(nSamples / centers);
            const centerPositions = [
                { x: 0.25, y: 0.75 },
                { x: 0.75, y: 0.75 },
                { x: 0.5, y: 0.25 }
            ];
            for (let c = 0; c < centers; c++) {
                const center = centerPositions[c];
                for (let i = 0; i < perCluster; i++) {
                    points.push({
                        x: center.x + this.gaussianRandom() * clusterStd,
                        y: center.y + this.gaussianRandom() * clusterStd,
                        label: c
                    });
                }
            }
            return this.normalizePoints(points);
        },

        makeLinear(nSamples = 150, noise = 0.15) {
            const points = [];
            const half = Math.floor(nSamples / 2);
            for (let i = 0; i < half; i++) {
                const x = Math.random() * 0.8 + (Math.random() - 0.5) * noise;
                const y = Math.random() * 0.8 - 0.1 + (Math.random() - 0.5) * noise;
                if (y < x - 0.1 + (Math.random() - 0.5) * noise * 2) {
                    points.push({ x, y, label: 0 });
                } else {
                    i--;
                }
            }
            for (let i = 0; i < half; i++) {
                const x = Math.random() * 0.8 + 0.1 + (Math.random() - 0.5) * noise;
                const y = Math.random() * 0.8 + 0.2 + (Math.random() - 0.5) * noise;
                if (y > x + 0.1 + (Math.random() - 0.5) * noise * 2) {
                    points.push({ x, y, label: 1 });
                } else {
                    i--;
                }
            }
            return this.normalizePoints(points);
        },

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

        makeSpiral(nSamples = 200, noise = 0.05) {
            const points = [];
            const half = Math.floor(nSamples / 2);
            for (let i = 0; i < half; i++) {
                const t = i / half * 2 * Math.PI + Math.random() * noise;
                const r = 0.1 + 0.4 * i / half;
                points.push({
                    x: 0.5 + r * Math.cos(t) + (Math.random() - 0.5) * noise,
                    y: 0.5 + r * Math.sin(t) + (Math.random() - 0.5) * noise,
                    label: 0
                });
            }
            for (let i = 0; i < half; i++) {
                const t = i / half * 2 * Math.PI + Math.PI + Math.random() * noise;
                const r = 0.1 + 0.4 * i / half;
                points.push({
                    x: 0.5 + r * Math.cos(t) + (Math.random() - 0.5) * noise,
                    y: 0.5 + r * Math.sin(t) + (Math.random() - 0.5) * noise,
                    label: 1
                });
            }
            return this.normalizePoints(points);
        },

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

        gaussianRandom() {
            let u = 0, v = 0;
            while (u === 0) u = Math.random();
            while (v === 0) v = Math.random();
            return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        }
    };

    // ============================================
    // Decision Tree Node
    // ============================================
    class TreeNode {
        constructor() {
            this.isLeaf = false;
            this.feature = null;      // 'x' or 'y'
            this.threshold = null;
            this.left = null;
            this.right = null;
            this.prediction = null;
            this.samples = [];
            this.classCounts = {};
            this.impurity = 0;
            this.depth = 0;
            this.id = null;
        }
    }

    // ============================================
    // Decision Tree Classifier
    // ============================================
    class DecisionTreeClassifier {
        constructor(maxDepth = 5, minSamplesSplit = 2, criterion = 'gini') {
            this.maxDepth = maxDepth;
            this.minSamplesSplit = minSamplesSplit;
            this.criterion = criterion;
            this.root = null;
            this.nodeCount = 0;
            this.leafCount = 0;
            this.maxTreeDepth = 0;
        }

        setMaxDepth(depth) {
            this.maxDepth = depth;
        }

        setMinSamplesSplit(minSamples) {
            this.minSamplesSplit = minSamples;
        }

        setCriterion(criterion) {
            this.criterion = criterion;
        }

        fit(data) {
            this.nodeCount = 0;
            this.leafCount = 0;
            this.maxTreeDepth = 0;
            this.root = this.buildTree(data, 0);
            return this;
        }

        buildTree(samples, depth) {
            const node = new TreeNode();
            node.id = this.nodeCount++;
            node.samples = samples;
            node.depth = depth;
            node.classCounts = this.countClasses(samples);
            node.impurity = this.calculateImpurity(samples);

            this.maxTreeDepth = Math.max(this.maxTreeDepth, depth);

            // Check stopping criteria
            const uniqueClasses = Object.keys(node.classCounts).length;
            if (depth >= this.maxDepth ||
                samples.length < this.minSamplesSplit ||
                uniqueClasses <= 1) {
                node.isLeaf = true;
                node.prediction = this.getMajorityClass(node.classCounts);
                this.leafCount++;
                return node;
            }

            // Find best split
            const bestSplit = this.findBestSplit(samples);
            if (!bestSplit) {
                node.isLeaf = true;
                node.prediction = this.getMajorityClass(node.classCounts);
                this.leafCount++;
                return node;
            }

            node.feature = bestSplit.feature;
            node.threshold = bestSplit.threshold;

            // Split data
            const { left, right } = this.splitData(samples, bestSplit.feature, bestSplit.threshold);

            if (left.length === 0 || right.length === 0) {
                node.isLeaf = true;
                node.prediction = this.getMajorityClass(node.classCounts);
                this.leafCount++;
                return node;
            }

            node.left = this.buildTree(left, depth + 1);
            node.right = this.buildTree(right, depth + 1);

            return node;
        }

        findBestSplit(samples) {
            let bestGain = -Infinity;
            let bestSplit = null;
            const parentImpurity = this.calculateImpurity(samples);

            for (const feature of ['x', 'y']) {
                // Get unique values and sort
                const values = [...new Set(samples.map(s => s[feature]))].sort((a, b) => a - b);

                // Try midpoints between consecutive values
                for (let i = 0; i < values.length - 1; i++) {
                    const threshold = (values[i] + values[i + 1]) / 2;
                    const { left, right } = this.splitData(samples, feature, threshold);

                    if (left.length === 0 || right.length === 0) continue;

                    const leftImpurity = this.calculateImpurity(left);
                    const rightImpurity = this.calculateImpurity(right);

                    const weightedImpurity = (left.length * leftImpurity + right.length * rightImpurity) / samples.length;
                    const gain = parentImpurity - weightedImpurity;

                    if (gain > bestGain) {
                        bestGain = gain;
                        bestSplit = { feature, threshold, gain };
                    }
                }
            }

            return bestGain > 0 ? bestSplit : null;
        }

        splitData(samples, feature, threshold) {
            const left = samples.filter(s => s[feature] <= threshold);
            const right = samples.filter(s => s[feature] > threshold);
            return { left, right };
        }

        calculateImpurity(samples) {
            if (samples.length === 0) return 0;

            const counts = this.countClasses(samples);
            const total = samples.length;

            if (this.criterion === 'gini') {
                let gini = 1;
                for (const count of Object.values(counts)) {
                    const p = count / total;
                    gini -= p * p;
                }
                return gini;
            } else {
                // Entropy
                let entropy = 0;
                for (const count of Object.values(counts)) {
                    if (count > 0) {
                        const p = count / total;
                        entropy -= p * Math.log2(p);
                    }
                }
                return entropy;
            }
        }

        countClasses(samples) {
            const counts = {};
            samples.forEach(s => {
                counts[s.label] = (counts[s.label] || 0) + 1;
            });
            return counts;
        }

        getMajorityClass(counts) {
            let maxCount = -1;
            let majority = 0;
            for (const [label, count] of Object.entries(counts)) {
                if (count > maxCount) {
                    maxCount = count;
                    majority = parseInt(label);
                }
            }
            return majority;
        }

        predict(point) {
            if (!this.root) return null;
            return this.traverse(this.root, point).prediction;
        }

        predictWithPath(point) {
            if (!this.root) return { prediction: null, path: [] };

            const path = [];
            let node = this.root;

            while (!node.isLeaf) {
                path.push({
                    nodeId: node.id,
                    feature: node.feature,
                    threshold: node.threshold,
                    value: point[node.feature],
                    direction: point[node.feature] <= node.threshold ? 'left' : 'right',
                    depth: node.depth
                });

                if (point[node.feature] <= node.threshold) {
                    node = node.left;
                } else {
                    node = node.right;
                }
            }

            // Add leaf node
            path.push({
                nodeId: node.id,
                isLeaf: true,
                prediction: node.prediction,
                classCounts: node.classCounts,
                samples: node.samples.length,
                depth: node.depth
            });

            return {
                prediction: node.prediction,
                path: path,
                leafNode: node
            };
        }

        traverse(node, point) {
            if (node.isLeaf) return node;
            if (point[node.feature] <= node.threshold) {
                return this.traverse(node.left, point);
            } else {
                return this.traverse(node.right, point);
            }
        }

        getStats() {
            return {
                depth: this.maxTreeDepth,
                nodes: this.nodeCount,
                leaves: this.leafCount
            };
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

        getSplitColor() {
            return this.isDarkTheme ? SPLIT_COLOR_DARK : SPLIT_COLOR;
        }

        getBackgroundColor() {
            return this.isDarkTheme ? '#1d2021' : '#fafafa';
        }

        getGridColor() {
            return this.isDarkTheme ? '#3c3836' : '#e0e0e0';
        }

        toCanvas(x, y) {
            return {
                x: PADDING + x * (CANVAS_WIDTH - 2 * PADDING),
                y: CANVAS_HEIGHT - PADDING - y * (CANVAS_HEIGHT - 2 * PADDING)
            };
        }

        fromCanvas(canvasX, canvasY) {
            return {
                x: (canvasX - PADDING) / (CANVAS_WIDTH - 2 * PADDING),
                y: (CANVAS_HEIGHT - PADDING - canvasY) / (CANVAS_HEIGHT - 2 * PADDING)
            };
        }

        clear() {
            this.ctx.fillStyle = this.getBackgroundColor();
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            this.drawGrid();
        }

        drawGrid() {
            this.ctx.strokeStyle = this.getGridColor();
            this.ctx.lineWidth = 0.5;
            for (let i = 0; i <= 10; i++) {
                const x = PADDING + i * (CANVAS_WIDTH - 2 * PADDING) / 10;
                this.ctx.beginPath();
                this.ctx.moveTo(x, PADDING);
                this.ctx.lineTo(x, CANVAS_HEIGHT - PADDING);
                this.ctx.stroke();
            }
            for (let i = 0; i <= 10; i++) {
                const y = PADDING + i * (CANVAS_HEIGHT - 2 * PADDING) / 10;
                this.ctx.beginPath();
                this.ctx.moveTo(PADDING, y);
                this.ctx.lineTo(CANVAS_WIDTH - PADDING, y);
                this.ctx.stroke();
            }
        }

        drawPoints(points) {
            const colors = this.getClassColors();
            points.forEach(point => {
                const { x, y } = this.toCanvas(point.x, point.y);
                this.ctx.beginPath();
                this.ctx.arc(x, y, POINT_RADIUS, 0, 2 * Math.PI);
                this.ctx.fillStyle = colors[point.label];
                this.ctx.fill();
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            });
        }

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

        drawDecisionBoundary(tree, numClasses) {
            if (!tree || !tree.root) {
                this.clearBoundary();
                return;
            }

            const colors = this.getClassColors();
            const resolution = 100;
            const cellWidth = (CANVAS_WIDTH - 2 * PADDING) / resolution;
            const cellHeight = (CANVAS_HEIGHT - 2 * PADDING) / resolution;

            this.boundaryCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            for (let i = 0; i < resolution; i++) {
                for (let j = 0; j < resolution; j++) {
                    const x = j / resolution;
                    const y = i / resolution;
                    const prediction = tree.predict({ x, y });

                    if (prediction !== null) {
                        const canvasX = PADDING + j * cellWidth;
                        const canvasY = CANVAS_HEIGHT - PADDING - (i + 1) * cellHeight;

                        this.boundaryCtx.fillStyle = this.adjustAlpha(colors[prediction], 0.2);
                        this.boundaryCtx.fillRect(canvasX, canvasY, cellWidth + 1, cellHeight + 1);
                    }
                }
            }

            // Draw split lines
            this.drawSplitLines(tree.root, 0, 1, 0, 1);
        }

        drawSplitLines(node, xMin, xMax, yMin, yMax) {
            if (!node || node.isLeaf) return;

            const splitColor = this.getSplitColor();
            this.boundaryCtx.strokeStyle = splitColor;
            this.boundaryCtx.lineWidth = 1;

            if (node.feature === 'x') {
                const x = this.toCanvas(node.threshold, 0).x;
                const y1 = this.toCanvas(0, yMin).y;
                const y2 = this.toCanvas(0, yMax).y;

                this.boundaryCtx.beginPath();
                this.boundaryCtx.moveTo(x, y1);
                this.boundaryCtx.lineTo(x, y2);
                this.boundaryCtx.stroke();

                this.drawSplitLines(node.left, xMin, node.threshold, yMin, yMax);
                this.drawSplitLines(node.right, node.threshold, xMax, yMin, yMax);
            } else {
                const y = this.toCanvas(0, node.threshold).y;
                const x1 = this.toCanvas(xMin, 0).x;
                const x2 = this.toCanvas(xMax, 0).x;

                this.boundaryCtx.beginPath();
                this.boundaryCtx.moveTo(x1, y);
                this.boundaryCtx.lineTo(x2, y);
                this.boundaryCtx.stroke();

                this.drawSplitLines(node.left, xMin, xMax, yMin, node.threshold);
                this.drawSplitLines(node.right, xMin, xMax, node.threshold, yMax);
            }
        }

        clearBoundary() {
            this.boundaryCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }

        adjustAlpha(color, alpha) {
            if (color.startsWith('#')) {
                const r = parseInt(color.slice(1, 3), 16);
                const g = parseInt(color.slice(3, 5), 16);
                const b = parseInt(color.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            }
            return color;
        }

        updateTheme() {
            this.isDarkTheme = this.checkDarkTheme();
        }
    }

    // ============================================
    // Tree Visualizer (SVG)
    // ============================================
    class TreeVisualizer {
        constructor(svg) {
            this.svg = svg;
            this.width = 560;
            this.height = 200;
            this.nodeRadius = 18;
            this.levelHeight = 50;
            this.highlightedPath = new Set();
            this.isDarkTheme = this.checkDarkTheme();
            this.isClickable = false;
        }

        checkDarkTheme() {
            return document.documentElement.getAttribute('data-theme') === 'gruvbox-dark';
        }

        getClassColors() {
            return this.isDarkTheme ? CLASS_COLORS_DARK : CLASS_COLORS_LIGHT;
        }

        render(tree) {
            if (!tree || !tree.root) {
                this.svg.innerHTML = '<text x="280" y="100" text-anchor="middle" fill="#999">No tree to display</text>';
                return;
            }

            // Calculate positions
            this.calculatePositions(tree.root, 0, this.width, 0);

            // Adjust SVG height based on tree depth
            const newHeight = Math.max(200, (tree.maxTreeDepth + 1) * this.levelHeight + 40);
            this.svg.setAttribute('height', newHeight);
            this.height = newHeight;

            // Clear and render
            this.svg.innerHTML = '';

            // Create groups for proper layering
            const linksGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            linksGroup.setAttribute('class', 'links');
            nodesGroup.setAttribute('class', 'nodes');

            this.renderLinks(tree.root, linksGroup);
            this.renderNodes(tree.root, nodesGroup);

            this.svg.appendChild(linksGroup);
            this.svg.appendChild(nodesGroup);
        }

        calculatePositions(node, xMin, xMax, depth) {
            if (!node) return;

            node.x = (xMin + xMax) / 2;
            node.y = depth * this.levelHeight + 30;

            if (!node.isLeaf) {
                const mid = (xMin + xMax) / 2;
                this.calculatePositions(node.left, xMin, mid, depth + 1);
                this.calculatePositions(node.right, mid, xMax, depth + 1);
            }
        }

        renderLinks(node, group) {
            if (!node || node.isLeaf) return;

            const colors = this.getClassColors();

            if (node.left) {
                const link = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const path = `M ${node.x} ${node.y + this.nodeRadius}
                              Q ${node.x} ${(node.y + node.left.y) / 2} ${node.left.x} ${node.left.y - this.nodeRadius}`;
                link.setAttribute('d', path);
                link.setAttribute('class', 'tree-link' + (this.highlightedPath.has(node.left.id) ? ' highlighted' : ''));
                link.setAttribute('data-node-id', node.left.id);
                group.appendChild(link);

                // Add label
                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('x', (node.x + node.left.x) / 2 - 10);
                label.setAttribute('y', (node.y + node.left.y) / 2);
                label.setAttribute('class', 'tree-link-label');
                label.textContent = '≤';
                group.appendChild(label);

                this.renderLinks(node.left, group);
            }

            if (node.right) {
                const link = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const path = `M ${node.x} ${node.y + this.nodeRadius}
                              Q ${node.x} ${(node.y + node.right.y) / 2} ${node.right.x} ${node.right.y - this.nodeRadius}`;
                link.setAttribute('d', path);
                link.setAttribute('class', 'tree-link' + (this.highlightedPath.has(node.right.id) ? ' highlighted' : ''));
                link.setAttribute('data-node-id', node.right.id);
                group.appendChild(link);

                // Add label
                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('x', (node.x + node.right.x) / 2 + 5);
                label.setAttribute('y', (node.y + node.right.y) / 2);
                label.setAttribute('class', 'tree-link-label');
                label.textContent = '>';
                group.appendChild(label);

                this.renderLinks(node.right, group);
            }
        }

        renderNodes(node, group) {
            if (!node) return;

            const colors = this.getClassColors();
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            let nodeClass = `tree-node ${node.isLeaf ? 'leaf class-' + node.prediction : 'internal'}`;
            if (this.highlightedPath.has(node.id)) nodeClass += ' highlighted';
            if (this.isClickable && node.isLeaf) nodeClass += ' clickable';
            g.setAttribute('class', nodeClass);
            g.setAttribute('data-node-id', node.id);
            g.setAttribute('transform', `translate(${node.x}, ${node.y})`);

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('r', this.nodeRadius);
            if (node.isLeaf) {
                circle.setAttribute('fill', colors[node.prediction]);
            }
            g.appendChild(circle);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('y', 3);

            if (node.isLeaf) {
                text.textContent = `C${node.prediction + 1}`;
            } else {
                text.textContent = `${node.feature}≤${node.threshold.toFixed(2)}`;
            }
            g.appendChild(text);

            group.appendChild(g);

            if (!node.isLeaf) {
                this.renderNodes(node.left, group);
                this.renderNodes(node.right, group);
            }
        }

        highlightPath(path) {
            this.highlightedPath.clear();
            if (path) {
                path.forEach(step => {
                    this.highlightedPath.add(step.nodeId);
                });
            }
        }

        setClickable(enabled) {
            this.isClickable = enabled;
        }

        updateTheme() {
            this.isDarkTheme = this.checkDarkTheme();
        }
    }

    // ============================================
    // Manual Tree Builder (for Design Mode)
    // ============================================
    class ManualTreeBuilder {
        constructor() {
            this.root = null;
            this.nodeCount = 0;
            this.leafCount = 0;
            this.maxTreeDepth = 0;
        }

        createInitialTree(defaultClass = 0) {
            this.nodeCount = 0;
            this.leafCount = 0;
            this.maxTreeDepth = 0;

            this.root = new TreeNode();
            this.root.id = this.nodeCount++;
            this.root.isLeaf = true;
            this.root.prediction = defaultClass;
            this.root.depth = 0;
            this.root.samples = [];
            this.root.classCounts = {};
            this.leafCount = 1;

            return this.root;
        }

        splitNode(node, feature, threshold) {
            if (node.isLeaf) {
                node.isLeaf = false;
                node.feature = feature;
                node.threshold = threshold;
                this.leafCount--;

                // Create left child
                node.left = new TreeNode();
                node.left.id = this.nodeCount++;
                node.left.isLeaf = true;
                node.left.prediction = node.prediction || 0;
                node.left.depth = node.depth + 1;
                node.left.samples = [];
                node.left.classCounts = {};
                this.leafCount++;

                // Create right child
                node.right = new TreeNode();
                node.right.id = this.nodeCount++;
                node.right.isLeaf = true;
                node.right.prediction = node.prediction || 0;
                node.right.depth = node.depth + 1;
                node.right.samples = [];
                node.right.classCounts = {};
                this.leafCount++;

                this.maxTreeDepth = Math.max(this.maxTreeDepth, node.depth + 1);

                // Clear node's own prediction since it's now internal
                node.prediction = null;
            }
        }

        setLeafClass(node, classLabel) {
            if (node.isLeaf) {
                node.prediction = classLabel;
            }
        }

        findNodeById(nodeId, node = this.root) {
            if (!node) return null;
            if (node.id === nodeId) return node;
            if (node.isLeaf) return null;

            const leftResult = this.findNodeById(nodeId, node.left);
            if (leftResult) return leftResult;

            return this.findNodeById(nodeId, node.right);
        }

        predict(point) {
            if (!this.root) return null;
            return this.traverse(this.root, point).prediction;
        }

        predictWithPath(point) {
            if (!this.root) return { prediction: null, path: [] };

            const path = [];
            let node = this.root;

            while (!node.isLeaf) {
                path.push({
                    nodeId: node.id,
                    feature: node.feature,
                    threshold: node.threshold,
                    value: point[node.feature],
                    direction: point[node.feature] <= node.threshold ? 'left' : 'right',
                    depth: node.depth
                });

                if (point[node.feature] <= node.threshold) {
                    node = node.left;
                } else {
                    node = node.right;
                }
            }

            path.push({
                nodeId: node.id,
                isLeaf: true,
                prediction: node.prediction,
                classCounts: node.classCounts,
                samples: 0,
                depth: node.depth
            });

            return {
                prediction: node.prediction,
                path: path,
                leafNode: node
            };
        }

        traverse(node, point) {
            if (node.isLeaf) return node;
            if (point[node.feature] <= node.threshold) {
                return this.traverse(node.left, point);
            } else {
                return this.traverse(node.right, point);
            }
        }

        getStats() {
            this.recalculateStats();
            return {
                depth: this.maxTreeDepth,
                nodes: this.nodeCount,
                leaves: this.leafCount
            };
        }

        recalculateStats() {
            this.nodeCount = 0;
            this.leafCount = 0;
            this.maxTreeDepth = 0;
            this.countNodes(this.root);
        }

        countNodes(node) {
            if (!node) return;
            this.nodeCount++;
            this.maxTreeDepth = Math.max(this.maxTreeDepth, node.depth);
            if (node.isLeaf) {
                this.leafCount++;
            } else {
                this.countNodes(node.left);
                this.countNodes(node.right);
            }
        }

        clear() {
            this.root = null;
            this.nodeCount = 0;
            this.leafCount = 0;
            this.maxTreeDepth = 0;
        }
    }

    // ============================================
    // Main Application
    // ============================================
    class DecisionTreeApp {
        constructor() {
            this.canvas = document.getElementById('dtree-canvas');
            this.boundaryCanvas = document.getElementById('boundary-canvas');
            this.treeSvg = document.getElementById('tree-svg');

            this.renderer = new Renderer(this.canvas, this.boundaryCanvas);
            this.treeViz = new TreeVisualizer(this.treeSvg);
            this.classifier = new DecisionTreeClassifier(5, 2, 'gini');
            this.manualTree = new ManualTreeBuilder();

            this.trainingData = [];
            this.currentDataset = 'moons';
            this.queryPoint = null;
            this.classificationResult = null;
            this.showBoundaries = true;
            this.editMode = 'classify';
            this.selectedClass = 0;
            this.numClasses = 2;

            // Design mode state
            this.isDesignMode = false;
            this.selectedNode = null;
            this.splitFeature = 'x';
            this.splitThreshold = 0.5;
            this.leafClassPicker = null;

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
            this.canvas.addEventListener('mousemove', this.onCanvasMouseMove.bind(this));

            // Algorithm options
            document.getElementById('max-depth-slider').addEventListener('input', (e) => {
                const depth = parseInt(e.target.value);
                document.getElementById('max-depth-value').textContent = depth;
                this.classifier.setMaxDepth(depth);
                if (!this.isDesignMode) this.rebuildTree();
            });

            document.getElementById('min-samples-slider').addEventListener('input', (e) => {
                const minSamples = parseInt(e.target.value);
                document.getElementById('min-samples-value').textContent = minSamples;
                this.classifier.setMinSamplesSplit(minSamples);
                if (!this.isDesignMode) this.rebuildTree();
            });

            document.getElementById('criterion-select').addEventListener('change', (e) => {
                this.classifier.setCriterion(e.target.value);
                if (!this.isDesignMode) this.rebuildTree();
            });

            document.getElementById('show-boundaries').addEventListener('change', (e) => {
                this.showBoundaries = e.target.checked;
                this.updateBoundary();
            });

            // Rebuild button
            document.getElementById('btn-rebuild-tree').addEventListener('click', () => {
                if (!this.isDesignMode) {
                    this.rebuildTree();
                }
            });

            // Design mode toggle
            document.getElementById('btn-auto-mode').addEventListener('click', () => {
                this.setDesignMode(false);
            });

            document.getElementById('btn-design-mode').addEventListener('click', () => {
                this.setDesignMode(true);
            });

            // Clear tree button (design mode)
            document.getElementById('btn-clear-tree').addEventListener('click', () => {
                this.manualTree.createInitialTree(0);
                this.updateDesignModeTree();
            });

            // Edit mode buttons
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

            // Clear points
            document.getElementById('btn-clear-points').addEventListener('click', () => {
                this.trainingData = [];
                this.rebuildTree();
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

            // Split dialog events
            this.bindSplitDialogEvents();

            // Tree SVG click (for design mode)
            this.treeSvg.addEventListener('click', this.onTreeNodeClick.bind(this));

            // Close picker when clicking outside
            document.addEventListener('click', (e) => {
                if (this.leafClassPicker && !e.target.closest('.leaf-class-picker') && !e.target.closest('.tree-node')) {
                    this.closeLeafClassPicker();
                }
            });

            // Theme observer
            const observer = new MutationObserver(() => {
                this.renderer.updateTheme();
                this.treeViz.updateTheme();
                this.render();
                this.updateBoundary();
                if (this.isDesignMode) {
                    this.treeViz.render(this.manualTree);
                } else {
                    this.treeViz.render(this.classifier);
                }
            });
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        }

        bindSplitDialogEvents() {
            // Feature selection
            document.querySelectorAll('[data-feature]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('[data-feature]').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    this.splitFeature = e.target.dataset.feature;
                    this.updateSplitPreview();
                });
            });

            // Threshold slider
            document.getElementById('threshold-slider').addEventListener('input', (e) => {
                this.splitThreshold = parseInt(e.target.value) / 100;
                this.updateSplitPreview();
            });

            // Cancel button
            document.getElementById('btn-cancel-split').addEventListener('click', () => {
                this.closeSplitDialog();
            });

            // Close button
            document.getElementById('btn-close-split-dialog').addEventListener('click', () => {
                this.closeSplitDialog();
            });

            // Apply button
            document.getElementById('btn-apply-split').addEventListener('click', () => {
                this.applySplit();
            });
        }

        setDesignMode(enabled) {
            this.isDesignMode = enabled;

            // Update UI
            document.getElementById('btn-auto-mode').classList.toggle('active', !enabled);
            document.getElementById('btn-design-mode').classList.toggle('active', enabled);
            document.getElementById('btn-rebuild-tree').style.display = enabled ? 'none' : 'inline-block';
            document.getElementById('btn-clear-tree').style.display = enabled ? 'inline-block' : 'none';
            document.getElementById('design-instructions').style.display = enabled ? 'block' : 'none';

            // Disable algorithm options in design mode
            document.getElementById('max-depth-slider').disabled = enabled;
            document.getElementById('min-samples-slider').disabled = enabled;
            document.getElementById('criterion-select').disabled = enabled;

            if (enabled) {
                // Switch to design mode
                this.manualTree.createInitialTree(0);
                this.treeViz.setClickable(true);
                this.updateDesignModeTree();
            } else {
                // Switch to auto mode
                this.treeViz.setClickable(false);
                this.closeLeafClassPicker();
                this.rebuildTree();
            }
        }

        updateDesignModeTree() {
            this.treeViz.render(this.manualTree);
            this.updateTreeStats();
            this.updateBoundaryFromManualTree();
            this.render();
        }

        updateBoundaryFromManualTree() {
            if (this.showBoundaries && this.manualTree.root) {
                this.renderer.drawDecisionBoundary(this.manualTree, this.numClasses);
            } else {
                this.renderer.clearBoundary();
            }
        }

        onTreeNodeClick(e) {
            if (!this.isDesignMode) return;

            const nodeElement = e.target.closest('.tree-node');
            if (!nodeElement) return;

            const nodeId = parseInt(nodeElement.getAttribute('data-node-id'));
            const node = this.manualTree.findNodeById(nodeId);

            if (!node) return;

            if (node.isLeaf) {
                // Show picker for leaf: change class or split
                this.showLeafClassPicker(node, nodeElement);
            }
            // For internal nodes, we could add edit functionality later
        }

        showLeafClassPicker(node, element) {
            this.closeLeafClassPicker();

            const rect = element.getBoundingClientRect();
            const svgRect = this.treeSvg.getBoundingClientRect();

            const picker = document.createElement('div');
            picker.className = 'leaf-class-picker';
            picker.style.left = (rect.left - svgRect.left + rect.width / 2 - 60) + 'px';
            picker.style.top = (rect.bottom - svgRect.top + 5) + 'px';

            picker.innerHTML = `
                <div class="picker-title">Set class or split:</div>
                <div class="picker-options">
                    <div class="picker-option class-0" data-action="class" data-class="0" title="Class 1">1</div>
                    <div class="picker-option class-1" data-action="class" data-class="1" title="Class 2">2</div>
                    <div class="picker-option class-2" data-action="class" data-class="2" title="Class 3">3</div>
                    <div class="picker-option split-option" data-action="split" title="Split node"><i class="fa fa-code-fork"></i></div>
                </div>
            `;

            picker.querySelectorAll('.picker-option').forEach(opt => {
                opt.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = opt.dataset.action;

                    if (action === 'class') {
                        const classLabel = parseInt(opt.dataset.class);
                        this.manualTree.setLeafClass(node, classLabel);
                        this.updateDesignModeTree();
                    } else if (action === 'split') {
                        this.selectedNode = node;
                        this.openSplitDialog();
                    }

                    this.closeLeafClassPicker();
                });
            });

            this.treeSvg.parentElement.style.position = 'relative';
            this.treeSvg.parentElement.appendChild(picker);
            this.leafClassPicker = picker;
        }

        closeLeafClassPicker() {
            if (this.leafClassPicker) {
                this.leafClassPicker.remove();
                this.leafClassPicker = null;
            }
        }

        openSplitDialog() {
            this.splitFeature = 'x';
            this.splitThreshold = 0.5;

            document.querySelectorAll('[data-feature]').forEach(b => b.classList.remove('active'));
            document.querySelector('[data-feature="x"]').classList.add('active');
            document.getElementById('threshold-slider').value = 50;

            this.updateSplitPreview();
            document.getElementById('split-dialog').style.display = 'flex';
        }

        closeSplitDialog() {
            document.getElementById('split-dialog').style.display = 'none';
            this.selectedNode = null;
        }

        updateSplitPreview() {
            document.getElementById('threshold-value').textContent = this.splitThreshold.toFixed(2);
            document.getElementById('split-preview-text').textContent =
                `${this.splitFeature} ≤ ${this.splitThreshold.toFixed(2)}`;
        }

        applySplit() {
            if (this.selectedNode) {
                this.manualTree.splitNode(this.selectedNode, this.splitFeature, this.splitThreshold);
                this.updateDesignModeTree();
            }
            this.closeSplitDialog();
        }

        onCanvasMouseMove(e) {
            // Could add live threshold preview line here in the future
        }

        loadDataset(name) {
            this.currentDataset = name;
            this.queryPoint = null;
            this.classificationResult = null;

            document.getElementById('dataset-description').innerHTML =
                `<i class="fa fa-info-circle"></i> ${DATASET_DESCRIPTIONS[name]}`;

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

            this.rebuildTree();
            this.updateCursor();
        }

        rebuildTree() {
            if (this.trainingData.length > 0) {
                this.classifier.fit(this.trainingData);
            } else {
                this.classifier.root = null;
            }

            this.updateTreeStats();
            this.treeViz.highlightPath(null);
            this.treeViz.render(this.classifier);
            this.updateBoundary();
            this.render();
            this.updateMetrics(null);
            this.updatePathList(null);
        }

        onCanvasClick(e) {
            const rect = this.canvas.getBoundingClientRect();
            const canvasX = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
            const canvasY = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
            const point = this.renderer.fromCanvas(canvasX, canvasY);

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

            this.classifyPoint(point);
        }

        addPoint(point) {
            this.trainingData.push({
                x: point.x,
                y: point.y,
                label: this.selectedClass
            });
            this.rebuildTree();
        }

        deletePoint(point) {
            if (this.trainingData.length === 0) return;

            let minDist = Infinity;
            let minIndex = -1;

            this.trainingData.forEach((p, i) => {
                const dist = Math.sqrt((p.x - point.x) ** 2 + (p.y - point.y) ** 2);
                if (dist < minDist) {
                    minDist = dist;
                    minIndex = i;
                }
            });

            if (minDist < 0.05) {
                this.trainingData.splice(minIndex, 1);
                this.rebuildTree();
            }
        }

        classifyPoint(point) {
            if (!this.classifier.root) return;

            this.queryPoint = point;
            this.classificationResult = this.classifier.predictWithPath(point);

            this.treeViz.highlightPath(this.classificationResult.path);
            this.treeViz.render(this.classifier);

            this.updateMetrics(this.classificationResult);
            this.updatePathList(this.classificationResult.path);
            this.render();
        }

        render() {
            this.renderer.clear();
            this.renderer.drawPoints(this.trainingData);

            if (this.queryPoint && this.classificationResult) {
                this.renderer.drawQuery(this.queryPoint, this.classificationResult.prediction);
            }
        }

        updateBoundary() {
            if (this.showBoundaries && this.classifier.root) {
                this.renderer.drawDecisionBoundary(this.classifier, this.numClasses);
            } else {
                this.renderer.clearBoundary();
            }
        }

        updateTreeStats() {
            const stats = this.classifier.getStats();
            document.getElementById('stat-depth').textContent = stats.depth;
            document.getElementById('stat-leaves').textContent = stats.leaves;
            document.getElementById('stat-nodes').textContent = stats.nodes;
        }

        updateMetrics(result) {
            if (result) {
                const leaf = result.leafNode;
                document.getElementById('metric-query').textContent =
                    `(${this.queryPoint.x.toFixed(2)}, ${this.queryPoint.y.toFixed(2)})`;
                document.getElementById('metric-prediction').innerHTML =
                    `<span class="class-${result.prediction}-text">Class ${result.prediction + 1}</span>`;
                document.getElementById('metric-path').textContent = result.path.length;
                document.getElementById('metric-samples').textContent = leaf.samples.length;

                this.updateDistribution(leaf.classCounts);
            } else {
                document.getElementById('metric-query').textContent = '-';
                document.getElementById('metric-prediction').textContent = '-';
                document.getElementById('metric-path').textContent = '-';
                document.getElementById('metric-samples').textContent = '-';
                document.getElementById('class-distribution').style.display = 'none';
            }
        }

        updateDistribution(classCounts) {
            const container = document.getElementById('class-distribution');
            const barsContainer = document.getElementById('distribution-bars');

            const total = Object.values(classCounts).reduce((a, b) => a + b, 0);
            if (total === 0) {
                container.style.display = 'none';
                return;
            }

            container.style.display = 'block';
            barsContainer.innerHTML = '';

            for (let i = 0; i < this.numClasses; i++) {
                const count = classCounts[i] || 0;
                const percentage = (count / total * 100);

                const row = document.createElement('div');
                row.className = 'distribution-bar-row';
                row.innerHTML = `
                    <span class="distribution-bar-label">Class ${i + 1}</span>
                    <div class="distribution-bar-container">
                        <div class="distribution-bar class-${i}" style="width: ${percentage}%"></div>
                    </div>
                    <span class="distribution-bar-value">${count}</span>
                `;
                barsContainer.appendChild(row);
            }
        }

        updatePathList(path) {
            const container = document.getElementById('path-list');
            const badge = document.getElementById('path-length');

            if (!path || path.length === 0) {
                container.innerHTML = '<div class="list-empty">Click to classify a point</div>';
                badge.textContent = '0';
                return;
            }

            badge.textContent = path.length;
            container.innerHTML = path.map((step, i) => {
                if (step.isLeaf) {
                    return `
                        <div class="path-item leaf class-${step.prediction}">
                            <span class="path-depth">${step.depth}</span>
                            <span class="path-content">
                                <strong>Leaf:</strong> Class ${step.prediction + 1} (${step.samples} samples)
                            </span>
                        </div>
                    `;
                } else {
                    const direction = step.direction === 'left' ? '≤' : '>';
                    return `
                        <div class="path-item decision">
                            <span class="path-depth">${step.depth}</span>
                            <span class="path-content">
                                ${step.feature} = ${step.value.toFixed(3)} ${direction} ${step.threshold.toFixed(3)}
                            </span>
                            <span class="path-direction">${step.direction === 'left' ? '← Left' : '→ Right'}</span>
                        </div>
                    `;
                }
            }).join('');
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
        window.dtreeApp = new DecisionTreeApp();
    });

})();
