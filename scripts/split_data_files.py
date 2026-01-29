#!/usr/bin/env python3
"""
Split embedding data files into separate files for lazy loading.

Creates:
1. *-embeddings.json - metadata + embeddings (small, loaded immediately)
2. *-images.json - sample images only (large, loaded on first hover)

This allows the visualization to start quickly by loading only the embeddings,
then fetching images in the background when needed.
"""

import json
from pathlib import Path


def split_file(input_path, output_dir):
    """Split a single data file into embeddings and images."""
    print(f"Processing {input_path.name}...")

    with open(input_path) as f:
        data = json.load(f)

    base_name = input_path.stem  # e.g., "mnist-embeddings" or "mnist-training-embeddings"

    # Extract images from samples
    images = []
    samples_without_images = []

    for sample in data.get('samples', []):
        images.append(sample.get('image'))
        # Keep label but not image
        samples_without_images.append({'label': sample['label']})

    # Create embeddings file (metadata + samples without images + snapshots)
    embeddings_data = {
        'metadata': data.get('metadata', {}),
        'samples': samples_without_images,
    }

    # Add snapshots if present (CNN training data)
    if 'snapshots' in data:
        embeddings_data['snapshots'] = data['snapshots']
    else:
        # Raw data has embeddings in samples
        for i, sample in enumerate(data.get('samples', [])):
            if 'embeddings' in sample:
                embeddings_data['samples'][i]['embeddings'] = sample['embeddings']

    # Create images file (just a list of images, indexed by sample order)
    images_data = images

    # Write embeddings file
    embeddings_path = output_dir / f"{base_name}.json"
    with open(embeddings_path, 'w') as f:
        json.dump(embeddings_data, f, separators=(',', ':'))

    # Write images file
    images_path = output_dir / f"{base_name}-images.json"
    with open(images_path, 'w') as f:
        json.dump(images_data, f, separators=(',', ':'))

    # Report sizes
    original_size = input_path.stat().st_size
    embeddings_size = embeddings_path.stat().st_size
    images_size = images_path.stat().st_size

    print(f"  Original: {original_size/1024:.1f} KB")
    print(f"  Embeddings: {embeddings_size/1024:.1f} KB ({100*embeddings_size/original_size:.1f}%)")
    print(f"  Images: {images_size/1024:.1f} KB ({100*images_size/original_size:.1f}%)")
    print()


def main():
    data_dir = Path(__file__).parent.parent / "static" / "data"

    files_to_split = [
        'mnist-embeddings.json',
        'mnist-training-embeddings.json',
        'cifar10-embeddings.json',
        'cifar10-training-embeddings.json',
    ]

    for filename in files_to_split:
        input_path = data_dir / filename
        if input_path.exists():
            split_file(input_path, data_dir)


if __name__ == '__main__':
    main()
