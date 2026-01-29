#!/usr/bin/env python3
"""
Compress embedding JSON files for faster loading.

Optimizations:
1. Convert image arrays to base64-encoded PNG (much smaller)
2. Round embedding coordinates to fewer decimal places
3. Output as compressed JSON
"""

import json
import base64
import io
import gzip
from pathlib import Path
from PIL import Image
import numpy as np

def array_to_base64_png(pixels, size, channels):
    """Convert pixel array to base64-encoded PNG."""
    if channels == 1:
        # Grayscale
        img_array = np.array(pixels, dtype=np.uint8).reshape(size, size)
        img = Image.fromarray(img_array, mode='L')
    else:
        # RGB
        img_array = np.array(pixels, dtype=np.uint8).reshape(size, size, 3)
        img = Image.fromarray(img_array, mode='RGB')

    # Save as PNG to buffer
    buffer = io.BytesIO()
    img.save(buffer, format='PNG', optimize=True)

    # Encode as base64
    return base64.b64encode(buffer.getvalue()).decode('ascii')


def compress_file(input_path, output_path):
    """Compress a single embedding file."""
    print(f"Processing {input_path.name}...")

    with open(input_path) as f:
        data = json.load(f)

    metadata = data.get('metadata', {})
    image_size = metadata.get('imageSize', 28)
    channels = metadata.get('imageChannels', 1)

    # Compress samples (convert images to base64 PNG)
    if 'samples' in data:
        for sample in data['samples']:
            if 'image' in sample:
                sample['image'] = array_to_base64_png(
                    sample['image'], image_size, channels
                )

    # For raw embeddings files that have samples with embeddings
    if 'samples' in data and 'embeddings' in data.get('samples', [{}])[0]:
        for sample in data['samples']:
            # Round embedding coordinates
            for algo, coords in sample.get('embeddings', {}).items():
                sample['embeddings'][algo] = [round(c, 3) for c in coords]

    # For training files, round snapshot embeddings
    if 'snapshots' in data:
        for snapshot in data['snapshots']:
            if 'embeddings' in snapshot:
                for emb in snapshot['embeddings']:
                    for algo, coords in emb.items():
                        emb[algo] = [round(c, 3) for c in coords]

    # Write compressed JSON (gzipped)
    output_json = json.dumps(data, separators=(',', ':'))  # Compact JSON

    with gzip.open(output_path, 'wt', encoding='utf-8') as f:
        f.write(output_json)

    # Also write uncompressed for comparison
    uncompressed_path = output_path.with_suffix('.json')
    with open(uncompressed_path, 'w') as f:
        f.write(output_json)

    original_size = input_path.stat().st_size
    compressed_size = output_path.stat().st_size
    uncompressed_size = uncompressed_path.stat().st_size

    print(f"  Original: {original_size/1024:.1f} KB")
    print(f"  Optimized JSON: {uncompressed_size/1024:.1f} KB ({100*uncompressed_size/original_size:.1f}%)")
    print(f"  Gzipped: {compressed_size/1024:.1f} KB ({100*compressed_size/original_size:.1f}%)")


def main():
    data_dir = Path(__file__).parent.parent / "static" / "data"

    files_to_compress = [
        'mnist-embeddings.json',
        'mnist-training-embeddings.json',
        'cifar10-embeddings.json',
        'cifar10-training-embeddings.json',
    ]

    for filename in files_to_compress:
        input_path = data_dir / filename
        if input_path.exists():
            output_path = data_dir / (filename + '.gz')
            compress_file(input_path, output_path)
            print()


if __name__ == '__main__':
    main()
