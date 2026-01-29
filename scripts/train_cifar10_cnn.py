#!/usr/bin/env python3
"""
Train a simple CNN on CIFAR-10 and extract embeddings at various training stages.

This script:
1. Trains a simple CNN classifier on CIFAR-10
2. Extracts embeddings from the penultimate layer at regular intervals
3. Projects those embeddings to 2D using t-SNE, PCA, and UMAP
4. Saves snapshots to a JSON file for visualization

Usage:
    python train_cifar10_cnn.py

Output:
    static/data/cifar10-training-embeddings.json
"""

import json
import numpy as np
from pathlib import Path
from datetime import datetime

# Check for required packages
try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    import torch.optim as optim
    from torch.utils.data import DataLoader, Subset
    from torchvision import datasets, transforms
except ImportError:
    print("Please install PyTorch: pip install torch torchvision")
    exit(1)

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


# CIFAR-10 class names
CIFAR10_CLASSES = [
    'airplane', 'automobile', 'bird', 'cat', 'deer',
    'dog', 'frog', 'horse', 'ship', 'truck'
]


# ============================================
# Simple CNN Model for CIFAR-10
# ============================================

class SimpleCNN(nn.Module):
    """
    A simple CNN for CIFAR-10 classification.

    Architecture:
        Conv2d(3, 32, 3) -> ReLU -> Conv2d(32, 32, 3) -> ReLU -> MaxPool -> Dropout
        Conv2d(32, 64, 3) -> ReLU -> Conv2d(64, 64, 3) -> ReLU -> MaxPool -> Dropout
        Conv2d(64, 128, 3) -> ReLU -> Conv2d(128, 128, 3) -> ReLU -> MaxPool -> Dropout
        Flatten -> Linear(512, 128) -> ReLU  <-- embeddings extracted here
        Linear(128, 10) -> output
    """

    def __init__(self):
        super(SimpleCNN, self).__init__()
        # First conv block: 32x32 -> 16x16
        self.conv1a = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.conv1b = nn.Conv2d(32, 32, kernel_size=3, padding=1)
        self.pool1 = nn.MaxPool2d(2, 2)
        self.drop1 = nn.Dropout(0.25)

        # Second conv block: 16x16 -> 8x8
        self.conv2a = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.conv2b = nn.Conv2d(64, 64, kernel_size=3, padding=1)
        self.pool2 = nn.MaxPool2d(2, 2)
        self.drop2 = nn.Dropout(0.25)

        # Third conv block: 8x8 -> 4x4
        self.conv3a = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.conv3b = nn.Conv2d(128, 128, kernel_size=3, padding=1)
        self.pool3 = nn.MaxPool2d(2, 2)
        self.drop3 = nn.Dropout(0.25)

        # Fully connected layers
        self.fc1 = nn.Linear(128 * 4 * 4, 128)  # Embedding layer
        self.drop4 = nn.Dropout(0.5)
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        # First block
        x = F.relu(self.conv1a(x))
        x = F.relu(self.conv1b(x))
        x = self.pool1(x)
        x = self.drop1(x)

        # Second block
        x = F.relu(self.conv2a(x))
        x = F.relu(self.conv2b(x))
        x = self.pool2(x)
        x = self.drop2(x)

        # Third block
        x = F.relu(self.conv3a(x))
        x = F.relu(self.conv3b(x))
        x = self.pool3(x)
        x = self.drop3(x)

        # Flatten and FC
        x = x.view(-1, 128 * 4 * 4)
        x = F.relu(self.fc1(x))
        x = self.drop4(x)
        x = self.fc2(x)
        return x

    def get_embedding(self, x):
        """Extract the 128-dimensional embedding before the final layer."""
        # First block
        x = F.relu(self.conv1a(x))
        x = F.relu(self.conv1b(x))
        x = self.pool1(x)

        # Second block
        x = F.relu(self.conv2a(x))
        x = F.relu(self.conv2b(x))
        x = self.pool2(x)

        # Third block
        x = F.relu(self.conv3a(x))
        x = F.relu(self.conv3b(x))
        x = self.pool3(x)

        # Flatten and embedding
        x = x.view(-1, 128 * 4 * 4)
        x = F.relu(self.fc1(x))
        return x


# ============================================
# Embedding Extraction and Projection
# ============================================

def extract_embeddings(model, data_loader, device):
    """Extract embeddings for all samples in the data loader."""
    model.eval()
    embeddings = []
    labels = []
    images = []

    with torch.no_grad():
        for data, target in data_loader:
            data = data.to(device)
            emb = model.get_embedding(data)
            embeddings.append(emb.cpu().numpy())
            labels.append(target.numpy())
            # Store images as RGB values (0-255 range)
            # CIFAR images are 32x32x3, we'll flatten to 3072
            img_data = data.cpu().numpy()
            # Denormalize: reverse the normalization
            mean = np.array([0.4914, 0.4822, 0.4465]).reshape(1, 3, 1, 1)
            std = np.array([0.2470, 0.2435, 0.2616]).reshape(1, 3, 1, 1)
            img_data = img_data * std + mean
            img_data = (img_data * 255).clip(0, 255).astype(np.uint8)
            # Reshape from (N, 3, 32, 32) to (N, 32, 32, 3) then flatten
            img_data = img_data.transpose(0, 2, 3, 1)
            images.append(img_data.reshape(-1, 3072))

    embeddings = np.vstack(embeddings)
    labels = np.concatenate(labels)
    images = np.vstack(images)

    return embeddings, labels, images


def project_embeddings(embeddings, method='tsne'):
    """Project high-dimensional embeddings to 2D."""
    if method == 'pca':
        reducer = PCA(n_components=2, random_state=42)
        return reducer.fit_transform(embeddings)
    elif method == 'tsne':
        reducer = TSNE(n_components=2, random_state=42, perplexity=30, max_iter=1000)
        return reducer.fit_transform(embeddings)
    elif method == 'umap':
        reducer = umap.UMAP(n_components=2, random_state=42, n_neighbors=15, min_dist=0.1)
        return reducer.fit_transform(embeddings)
    else:
        raise ValueError(f"Unknown method: {method}")


# ============================================
# Training Loop with Snapshots
# ============================================

def train_with_snapshots(
    model,
    train_loader,
    viz_loader,
    device,
    epochs=20,
    snapshot_intervals=None,
    lr=0.001
):
    """
    Train the model and capture embedding snapshots at specified intervals.

    Args:
        model: The CNN model
        train_loader: DataLoader for training data
        viz_loader: DataLoader for the fixed visualization subset
        device: torch device
        epochs: Number of training epochs
        snapshot_intervals: List of (epoch, batch) tuples to capture snapshots
                          If None, captures at start and end of each epoch
        lr: Learning rate

    Returns:
        List of snapshot dictionaries
    """
    optimizer = optim.Adam(model.parameters(), lr=lr)
    criterion = nn.CrossEntropyLoss()

    snapshots = []
    sample_images = None  # Store images only once
    sample_labels = None
    total_batches = len(train_loader)

    # Default snapshot intervals: start, and after each epoch
    if snapshot_intervals is None:
        snapshot_intervals = [(0, 0)]  # Before any training
        for e in range(epochs):
            snapshot_intervals.append((e + 1, 0))  # After each epoch

    def capture_snapshot(epoch, batch, train_loss=None, train_acc=None):
        """Capture current embeddings and project to 2D."""
        nonlocal sample_images, sample_labels
        print(f"  Capturing snapshot at epoch {epoch}, batch {batch}...")

        embeddings, labels, images = extract_embeddings(model, viz_loader, device)

        # Store images and labels only on first snapshot
        if sample_images is None:
            sample_images = images
            sample_labels = labels

        # Project using all three methods
        print("    Computing PCA...")
        pca_proj = project_embeddings(embeddings, 'pca')
        print("    Computing t-SNE...")
        tsne_proj = project_embeddings(embeddings, 'tsne')
        print("    Computing UMAP...")
        umap_proj = project_embeddings(embeddings, 'umap')

        # Build snapshot - only store embeddings, not images
        snapshot = {
            'epoch': epoch,
            'batch': batch,
            'total_batches_seen': epoch * total_batches + batch,
            'train_loss': float(train_loss) if train_loss else None,
            'train_accuracy': float(train_acc) if train_acc else None,
            'embeddings': []  # List of embeddings per sample (no images)
        }

        for i in range(len(labels)):
            snapshot['embeddings'].append({
                'pca': [round(float(pca_proj[i, 0]), 4),
                        round(float(pca_proj[i, 1]), 4)],
                'tsne': [round(float(tsne_proj[i, 0]), 4),
                         round(float(tsne_proj[i, 1]), 4)],
                'umap': [round(float(umap_proj[i, 0]), 4),
                         round(float(umap_proj[i, 1]), 4)]
            })

        snapshots.append(snapshot)
        print(f"    Snapshot captured: {len(snapshot['embeddings'])} samples")

    # Capture initial snapshot (before training)
    print("Capturing initial snapshot (untrained model)...")
    capture_snapshot(0, 0)

    # Training loop
    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        print(f"\nEpoch {epoch}/{epochs}")

        for batch_idx, (data, target) in enumerate(train_loader):
            data, target = data.to(device), target.to(device)

            optimizer.zero_grad()
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()

            running_loss += loss.item()
            _, predicted = output.max(1)
            total += target.size(0)
            correct += predicted.eq(target).sum().item()

            # Check if we should capture a snapshot
            if (epoch, batch_idx + 1) in snapshot_intervals:
                avg_loss = running_loss / (batch_idx + 1)
                accuracy = 100. * correct / total
                capture_snapshot(epoch, batch_idx + 1, avg_loss, accuracy)

        # End of epoch stats
        avg_loss = running_loss / len(train_loader)
        accuracy = 100. * correct / total
        print(f"  Loss: {avg_loss:.4f}, Accuracy: {accuracy:.2f}%")

        # Capture end-of-epoch snapshot
        if (epoch, 0) in snapshot_intervals or epoch == epochs:
            capture_snapshot(epoch, 0, avg_loss, accuracy)

    return snapshots, sample_images, sample_labels


# ============================================
# Main
# ============================================

def main():
    # Configuration
    BATCH_SIZE = 64
    EPOCHS = 50  # CIFAR-10 needs more epochs than MNIST
    VIZ_SAMPLES = 1000  # Number of samples to visualize (100 per class)
    SAMPLES_PER_CLASS = 100

    # Device
    device = torch.device('cuda' if torch.cuda.is_available() else
                          'mps' if torch.backends.mps.is_available() else 'cpu')
    print(f"Using device: {device}")

    # Data transforms with augmentation for training
    transform_train = transforms.Compose([
        transforms.RandomHorizontalFlip(),
        transforms.RandomCrop(32, padding=4),
        transforms.ToTensor(),
        transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2470, 0.2435, 0.2616))
    ])

    transform_test = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2470, 0.2435, 0.2616))
    ])

    # Load datasets
    print("Loading CIFAR-10 dataset...")
    train_dataset = datasets.CIFAR10('./data', train=True, download=True, transform=transform_train)
    test_dataset = datasets.CIFAR10('./data', train=False, download=True, transform=transform_test)

    # For visualization, use test transform (no augmentation)
    viz_dataset = datasets.CIFAR10('./data', train=True, download=True, transform=transform_test)

    # Create a fixed subset for visualization (stratified sampling)
    print(f"Selecting {VIZ_SAMPLES} samples for visualization...")
    np.random.seed(42)
    viz_indices = []
    targets = np.array(train_dataset.targets)

    for class_idx in range(10):
        class_indices = np.where(targets == class_idx)[0]
        selected = np.random.choice(class_indices, SAMPLES_PER_CLASS, replace=False)
        viz_indices.extend(selected)

    np.random.shuffle(viz_indices)
    viz_subset = Subset(viz_dataset, viz_indices)

    # Data loaders
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=2)
    viz_loader = DataLoader(viz_subset, batch_size=BATCH_SIZE, shuffle=False)

    print(f"Training samples: {len(train_dataset)}")
    print(f"Visualization samples: {len(viz_subset)}")

    # Initialize model
    model = SimpleCNN().to(device)
    print(f"\nModel architecture:\n{model}")

    # Define snapshot intervals
    # Capture: before training, then every 5 epochs (11 snapshots total)
    snapshot_epochs = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50]
    snapshot_intervals = [(0, 0)]  # Initial
    for e in snapshot_epochs[1:]:
        snapshot_intervals.append((e, 0))

    print(f"\nWill capture snapshots at epochs: {snapshot_epochs}")

    # Train and capture snapshots
    print("\n" + "="*50)
    print("Starting training with embedding snapshots...")
    print("="*50)

    snapshots, sample_images, sample_labels = train_with_snapshots(
        model=model,
        train_loader=train_loader,
        viz_loader=viz_loader,
        device=device,
        epochs=EPOCHS,
        snapshot_intervals=snapshot_intervals
    )

    # Evaluate final model
    print("\n" + "="*50)
    print("Evaluating final model on test set...")
    model.eval()
    correct = 0
    total = 0
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False)

    with torch.no_grad():
        for data, target in test_loader:
            data, target = data.to(device), target.to(device)
            output = model(data)
            _, predicted = output.max(1)
            total += target.size(0)
            correct += predicted.eq(target).sum().item()

    test_accuracy = 100. * correct / total
    print(f"Final test accuracy: {test_accuracy:.2f}%")

    # Build output JSON
    print("\n" + "="*50)
    print("Building output JSON...")

    # Build samples array (images stored once, not per snapshot)
    samples = []
    for i in range(len(sample_labels)):
        samples.append({
            'id': i,
            'label': int(sample_labels[i]),
            'image': sample_images[i].tolist()
        })

    output_data = {
        'metadata': {
            'dataset': 'cifar10',
            'numSamples': VIZ_SAMPLES,
            'samplesPerClass': SAMPLES_PER_CLASS,
            'numSnapshots': len(snapshots),
            'epochs': EPOCHS,
            'algorithms': ['pca', 'tsne', 'umap'],
            'imageSize': 32,
            'imageChannels': 3,
            'embeddingDim': 128,
            'finalTestAccuracy': round(test_accuracy, 2),
            'generated': datetime.now().isoformat(),
            'snapshotEpochs': [s['epoch'] for s in snapshots],
            'classNames': CIFAR10_CLASSES
        },
        'samples': samples,  # Images stored once here
        'snapshots': snapshots  # Only embeddings per snapshot
    }

    # Write to file
    output_path = Path(__file__).parent.parent / "static" / "data" / "cifar10-training-embeddings.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Writing to {output_path}...")
    with open(output_path, 'w') as f:
        json.dump(output_data, f)

    # Report file size
    file_size = output_path.stat().st_size / (1024 * 1024)
    print(f"Done! File size: {file_size:.2f} MB")

    # Summary
    print("\n" + "="*50)
    print("Summary:")
    print("="*50)
    print(f"  Snapshots captured: {len(snapshots)}")
    print(f"  Epochs in snapshots: {[s['epoch'] for s in snapshots]}")
    print(f"  Samples per snapshot: {VIZ_SAMPLES}")
    print(f"  Final test accuracy: {test_accuracy:.2f}%")
    print(f"  Output file: {output_path}")


if __name__ == "__main__":
    main()
