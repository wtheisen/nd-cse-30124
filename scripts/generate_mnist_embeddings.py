#!/usr/bin/env python3
"""
Generate pre-computed MNIST embeddings for the visualization.
Creates a JSON file with 1000 samples (100 per digit) and their
PCA, t-SNE, and UMAP 2D embeddings.

Usage:
    python generate_mnist_embeddings.py

Output:
    static/data/mnist-embeddings.json
"""

import json
import numpy as np
from pathlib import Path

# Check for required packages
try:
    from sklearn.datasets import fetch_openml
    from sklearn.decomposition import PCA
    from sklearn.manifold import TSNE
except ImportError:
    print("Please install scikit-learn: pip install scikit-learn")
    exit(1)

try:
    import umap
except ImportError:
    print("Please install umap-learn: pip install umap-learn")
    exit(1)


def main():
    print("Loading MNIST dataset...")
    mnist = fetch_openml('mnist_784', version=1, as_frame=False, parser='auto')
    X, y = mnist.data, mnist.target.astype(int)

    print(f"Dataset loaded: {X.shape[0]} samples, {X.shape[1]} features")

    # Sample 100 per digit (1000 total) for balanced representation
    np.random.seed(42)
    indices = []
    samples_per_digit = 100

    for digit in range(10):
        digit_indices = np.where(y == digit)[0]
        selected = np.random.choice(digit_indices, samples_per_digit, replace=False)
        indices.extend(selected)

    # Shuffle the indices
    np.random.shuffle(indices)
    indices = np.array(indices)

    X_sample = X[indices]
    y_sample = y[indices]

    print(f"Sampled {len(indices)} digits ({samples_per_digit} per class)")

    # Normalize pixel values to [0, 1] for dimensionality reduction
    X_normalized = X_sample / 255.0

    # Compute PCA embeddings
    print("Computing PCA embeddings...")
    pca = PCA(n_components=2, random_state=42)
    pca_embeddings = pca.fit_transform(X_normalized)
    print(f"  PCA explained variance: {pca.explained_variance_ratio_.sum():.2%}")

    # Compute t-SNE embeddings
    print("Computing t-SNE embeddings (this may take a while)...")
    tsne = TSNE(n_components=2, random_state=42, perplexity=30, n_iter=1000)
    tsne_embeddings = tsne.fit_transform(X_normalized)

    # Compute UMAP embeddings
    print("Computing UMAP embeddings...")
    umap_reducer = umap.UMAP(n_components=2, random_state=42, n_neighbors=15, min_dist=0.1)
    umap_embeddings = umap_reducer.fit_transform(X_normalized)

    # Build the JSON structure
    print("Building JSON output...")
    samples = []

    for i in range(len(indices)):
        # Store image as list of integers (0-255)
        image_pixels = X_sample[i].astype(int).tolist()

        samples.append({
            "id": i,
            "label": int(y_sample[i]),
            "image": image_pixels,
            "embeddings": {
                "pca": [round(float(pca_embeddings[i, 0]), 4),
                        round(float(pca_embeddings[i, 1]), 4)],
                "tsne": [round(float(tsne_embeddings[i, 0]), 4),
                         round(float(tsne_embeddings[i, 1]), 4)],
                "umap": [round(float(umap_embeddings[i, 0]), 4),
                         round(float(umap_embeddings[i, 1]), 4)]
            }
        })

    data = {
        "metadata": {
            "numSamples": len(samples),
            "algorithms": ["pca", "tsne", "umap"],
            "imageSize": 28,
            "samplesPerDigit": samples_per_digit,
            "pcaExplainedVariance": round(float(pca.explained_variance_ratio_.sum()), 4)
        },
        "samples": samples
    }

    # Write to file
    output_path = Path(__file__).parent.parent / "static" / "data" / "mnist-embeddings.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Writing to {output_path}...")
    with open(output_path, 'w') as f:
        json.dump(data, f)

    # Report file size
    file_size = output_path.stat().st_size / (1024 * 1024)
    print(f"Done! File size: {file_size:.2f} MB")

    # Print sample distribution
    print("\nSample distribution:")
    for digit in range(10):
        count = sum(1 for s in samples if s['label'] == digit)
        print(f"  Digit {digit}: {count} samples")


if __name__ == "__main__":
    main()
