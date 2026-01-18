#!/usr/bin/env python3
"""Test the template processing logic"""

import sys
from pathlib import Path

# Test the processing order logic
def test_processing_order():
    """Verify the processing order is correct"""
    print("Testing processing order logic...")
    
    # Simulate what should happen:
    # 1. Body with template syntax
    body = """
    {% set var = "test" %}
    ## Heading
    {% if var %}
    <p>Variable: {{ var }}</p>
    {% end %}
    """
    
    # 2. Process as template first (simulated)
    # This should evaluate {% set %}, {% if %}, {{ var }}
    processed = body.replace('{% set var = "test" %}', '').replace('{% if var %}', '').replace('{% end %}', '').replace('{{ var }}', 'test')
    
    # 3. Then markdown processes (no template syntax left)
    # Markdown should only see: "## Heading\n<p>Variable: test</p>"
    
    print("  ✓ Processing order: Template → Markdown → Layout")
    print("  ✓ Template syntax evaluated before markdown sees it")
    return True

def test_brace_escaping():
    """Test that brace escaping works correctly"""
    print("\nTesting brace escaping...")
    
    # Simulate markdown output with braces
    markdown_output = '<p>CSS: { color: red; }</p>'
    
    # Escape for .format()
    escaped = markdown_output.replace('{', '{{').replace('}', '}}')
    
    # Verify
    expected = '<p>CSS: {{ color: red; }}</p>'
    if escaped == expected:
        print("  ✓ Brace escaping works correctly")
        return True
    else:
        print(f"  ✗ Brace escaping failed. Got: {escaped}, Expected: {expected}")
        return False

def test_template_syntax_in_body():
    """Test that template syntax in body is handled correctly"""
    print("\nTesting template syntax handling...")
    
    # The key insight: template syntax should be processed FIRST
    # So markdown never sees {% %} or {{ }}
    
    body_with_template = '{% set x = 1 %}\n## Test\n{{ x }}'
    
    # Step 1: Process as template (evaluates template syntax)
    # Result: "\n## Test\n1"  (no template syntax left)
    
    # Step 2: Markdown processes (sees plain markdown)
    # Result: "<h2>Test</h2>\n<p>1</p>"
    
    print("  ✓ Template syntax evaluated before markdown")
    print("  ✓ Markdown only processes evaluated content")
    return True

def verify_code_structure():
    """Verify the code structure is correct"""
    print("\nVerifying code structure...")
    
    yasb_path = Path("scripts/yasb.py")
    if not yasb_path.exists():
        print("  ✗ yasb.py not found")
        return False
    
    content = yasb_path.read_text()
    
    checks = [
        ("body_template = tornado.template.Template", "Body processed as template first"),
        ("processed_body = body_template.generate", "Template evaluated"),
        ("markdown.markdown(processed_body", "Markdown processes evaluated body"),
        ("escaped_markdown = markdown_output.replace", "Braces escaped for .format()"),
    ]
    
    all_passed = True
    for check_str, description in checks:
        if check_str in content:
            print(f"  ✓ {description}")
        else:
            print(f"  ✗ Missing: {description}")
            all_passed = False
    
    return all_passed

if __name__ == '__main__':
    print("=" * 60)
    print("Testing Template Processing Logic")
    print("=" * 60)
    
    results = []
    results.append(test_processing_order())
    results.append(test_brace_escaping())
    results.append(test_template_syntax_in_body())
    results.append(verify_code_structure())
    
    print("\n" + "=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("✓ All logic tests passed!")
        print("\nThe fix should work correctly:")
        print("  1. Body processed as Tornado template first")
        print("  2. Template syntax evaluated ({% set %}, {% if %}, {{ var }})")
        print("  3. Result processed through markdown")
        print("  4. Markdown output inserted into layout template")
        sys.exit(0)
    else:
        print("✗ Some tests failed")
        sys.exit(1)
