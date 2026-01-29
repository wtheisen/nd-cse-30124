#!/usr/bin/env python3
"""
Generate 2D embeddings for CIFAR-10 images using PCA, t-SNE, and UMAP.

This script loads CIFAR-10 images, samples 1000 of them (100 per class),
computes PCA, t-SNE, and UMAP projections of the raw 3072-dimensional
pixel vectors, and saves the results to a JSON file for visualization.

Usage:
    python generate_cifar10_embeddings.py

Output:
    static/data/cifar10-embeddings.json
"""

import json
import numpy as np
from pathlib import Path
from datetime import datetime

# Check for required packages
try:
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

try:
    from torchvision import datasets
except ImportError:
    print("Please install torchvision: pip install torchvision")
    exit(1)


# CIFAR-10 class names
CIFAR10_CLASSES = [
    'airplane', 'automobile', 'bird', 'cat', 'deer',
    'dog', 'frog', 'horse', 'ship', 'truck'
]


def load_cifar10_samples(num_samples_per_class=100):
    """
    Load CIFAR-10 and sample evenly from each class.

    Returns:
        images: numpy array of shape (N, 3072) - flattened RGB images
        labels: numpy array of shape (N,) - class labels (0-9)
        images_rgb: numpy array of shape (N, 3072) - RGB values for display
    """
    print("Loading CIFAR-10 dataset...")
    dataset = datasets.CIFAR10(root='./data', train=True, download=True)

    # Convert to numpy
    images = np.array(dataset.data)  # Shape: (50000, 32, 32, 3)
    labels = np.array(dataset.targets)

    print(f"Total images: {len(images)}")
    print(f"Image shape: {images[0].shape}")

    # Sample evenly from each class
    print(f"Sampling {num_samples_per_class} images per class...")
    np.random.seed(42)

    selected_indices = []
    for class_idx in range(10):
        class_indices = np.where(labels == class_idx)[0]
        selected = np.random.choice(class_indices, num_samples_per_class, replace=False)
        selected_indices.extend(selected)

    # Shuffle the selected indices
    np.random.shuffle(selected_indices)

    sampled_images = images[selected_indices]
    sampled_labels = labels[selected_indices]

    # Flatten images: (N, 32, 32, 3) -> (N, 3072)
    sampled_images_flat = sampled_images.reshape(-1, 3072)

    print(f"Sampled {len(sampled_images)} images ({num_samples_per_class} per class)")

    return sampled_images_flat, sampled_labels, sampled_images_flat.copy()


def compute_embeddings(images):
    """
    Compute 2D embeddings using PCA, t-SNE, and UMAP.

    Args:
        images: numpy array of shape (N, 3072)

    Returns:
        dict with 'pca', 'tsne', 'umap' keys, each containing (N, 2) arrays
    """
    # Normalize pixel values to [0, 1]
    images_normalized = images.astype(np.float32) / 255.0

    embeddings = {}

    # PCA
    print("Computing PCA...")
    pca = PCA(n_components=2, random_state=42)
    embeddings['pca'] = pca.fit_transform(images_normalized)
    print(f"  PCA explained variance ratio: {pca.explained_variance_ratio_}")

    # t-SNE
    print("Computing t-SNE (this may take a while)...")
    tsne = TSNE(n_components=2, random_state=42, perplexity=30, max_iter=1000)
    embeddings['tsne'] = tsne.fit_transform(images_normalized)
    print("  t-SNE complete")

    # UMAP
    print("Computing UMAP...")
    umap_reducer = umap.UMAP(n_components=2, random_state=42, n_neighbors=15, min_dist=0.1)
    embeddings['umap'] = umap_reducer.fit_transform(images_normalized)
    print("  UMAP complete")

    return embeddings


def build_json_output(images, labels, embeddings):
    """
    Build the JSON structure for the visualization.

    Args:
        images: numpy array of shape (N, 3072) - RGB pixel values
        labels: numpy array of shape (N,)
        embeddings: dict with 'pca', 'tsne', 'umap' keys

    Returns:
        dict ready for JSON serialization
    """
    samples = []

    for i in range(len(labels)):
        sample = {
            'id': i,
            'label': int(labels[i]),
            'image': images[i].tolist(),  # 3072 RGB values (0-255)
            'embeddings': {
                'pca': [round(float(embeddings['pca'][i, 0]), 4),
                        round(float(embeddings['pca'][i, 1]), 4)],
                'tsne': [round(float(embeddings['tsne'][i, 0]), 4),
                         round(float(embeddings['tsne'][i, 1]), 4)],
                'umap': [round(float(embeddings['umap'][i, 0]), 4),
                         round(float(embeddings['umap'][i, 1]), 4)]
            }
        }
        samples.append(sample)

    output = {
        'metadata': {
            'dataset': 'cifar10',
            'numSamples': len(samples),
            'samplesPerClass': len(samples) // 10,
            'algorithms': ['pca', 'tsne', 'umap'],
            'imageSize': 32,
            'imageChannels': 3,
            'rawDimensions': 3072,
            'generated': datetime.now().isoformat(),
            'classNames': CIFAR10_CLASSES
        },
        'samples': samples
    }

    return output


def main():
    # Load and sample data
    images, labels, images_rgb = load_cifar10_samples(num_samples_per_class=100)

    # Compute embeddings
    embeddings = compute_embeddings(images)

    # Build JSON output
    print("Building JSON output...")
    output = build_json_output(images_rgb, labels, embeddings)

    # Write to file
    output_path = Path(__file__).parent.parent / "static" / "data" / "cifar10-embeddings.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Writing to {output_path}...")
    with open(output_path, 'w') as f:
        json.dump(output, f)

    # Report file size
    file_size = output_path.stat().st_size / (1024 * 1024)
    print(f"Done! File size: {file_size:.2f} MB")

    # Print summary
    print("\nSummary:")
    print(f"  Total samples: {output['metadata']['numSamples']}")
    print(f"  Samples per class: {output['metadata']['samplesPerClass']}")
    print(f"  Algorithms: {output['metadata']['algorithms']}")
    print(f"  Image dimensions: {output['metadata']['imageSize']}x{output['metadata']['imageSize']}x{output['metadata']['imageChannels']}")


if __name__ == "__main__":
    main()
