#!/usr/bin/env python3
"""Test script to verify yasb.py fix for template syntax in body"""

import sys
import os
from pathlib import Path

# Add scripts directory to path
scripts_dir = Path(__file__).parent / "scripts"
sys.path.insert(0, str(scripts_dir))

# Import yasb functions
from yasb import load_page_from_yaml, render_page
import io
from contextlib import redirect_stdout

def test_homework_template():
    """Test that homework template processes correctly"""
    print("Testing homework_01.yaml...")
    try:
        page = load_page_from_yaml("pages/homework_01.yaml")
        # Capture output
        f = io.StringIO()
        with redirect_stdout(f):
            render_page(page)
        output = f.getvalue()
        print("✓ homework_01.yaml processed successfully")
        print(f"  Output length: {len(output)} characters")
        # Check for expected content
        if "Task 1: Notebook" in output:
            print("  ✓ Contains expected content")
        else:
            print("  ✗ Missing expected content")
        return True
    except Exception as e:
        print(f"✗ Error processing homework_01.yaml: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_lab_template():
    """Test that lab template processes correctly"""
    print("\nTesting lab_00.yaml...")
    try:
        page = load_page_from_yaml("pages/lab_00.yaml")
        f = io.StringIO()
        with redirect_stdout(f):
            render_page(page)
        output = f.getvalue()
        print("✓ lab_00.yaml processed successfully")
        print(f"  Output length: {len(output)} characters")
        return True
    except Exception as e:
        print(f"✗ Error processing lab_00.yaml: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_reading_template():
    """Test that reading template processes correctly"""
    print("\nTesting reading_01.yaml...")
    try:
        page = load_page_from_yaml("pages/reading_01.yaml")
        f = io.StringIO()
        with redirect_stdout(f):
            render_page(page)
        output = f.getvalue()
        print("✓ reading_01.yaml processed successfully")
        print(f"  Output length: {len(output)} characters")
        return True
    except Exception as e:
        print(f"✗ Error processing reading_01.yaml: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_template_syntax_preservation():
    """Test that template syntax is properly evaluated"""
    print("\nTesting template syntax evaluation...")
    try:
        # Create a minimal test page
        test_yaml = """title: Test Page
icon: fa-test
navigation: []
internal: {}
external:
    resources: {}
body: |
    {% set test_var = "Hello" %}
    {% if test_var %}
    <p>Variable is: {{ test_var }}</p>
    {% end %}
"""
        import tempfile
        import yaml
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            f.write(test_yaml)
            temp_path = f.name
        
        try:
            page = load_page_from_yaml(temp_path)
            f = io.StringIO()
            with redirect_stdout(f):
                render_page(page)
            output = f.getvalue()
            
            # Check that template syntax was evaluated
            if "Variable is: Hello" in output:
                print("  ✓ Template syntax evaluated correctly")
                return True
            else:
                print(f"  ✗ Template syntax not evaluated. Output snippet: {output[:200]}")
                return False
        finally:
            os.unlink(temp_path)
    except Exception as e:
        print(f"✗ Error in template syntax test: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("Testing yasb.py fix for template syntax processing")
    print("=" * 60)
    
    results = []
    
    # Check if pages exist
    if not Path("pages/homework_01.yaml").exists():
        print("\n⚠ Warning: pages/homework_01.yaml not found. Generating pages first...")
        import subprocess
        try:
            subprocess.run([sys.executable, "scripts/generate_homework_pages.py"], check=True)
        except:
            print("  Could not generate pages. Some tests will be skipped.")
    
    results.append(test_template_syntax_preservation())
    
    if Path("pages/homework_01.yaml").exists():
        results.append(test_homework_template())
    else:
        print("\n⚠ Skipping homework_01.yaml test (file not found)")
    
    if Path("pages/lab_00.yaml").exists():
        results.append(test_lab_template())
    else:
        print("\n⚠ Skipping lab_00.yaml test (file not found)")
    
    if Path("pages/reading_01.yaml").exists():
        results.append(test_reading_template())
    else:
        print("\n⚠ Skipping reading_01.yaml test (file not found)")
    
    print("\n" + "=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"Results: {passed}/{total} tests passed")
    if passed == total:
        print("✓ All tests passed!")
        sys.exit(0)
    else:
        print("✗ Some tests failed")
        sys.exit(1)
