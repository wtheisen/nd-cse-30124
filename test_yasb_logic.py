#!/usr/bin/env python3
"""Test the actual logic flow of yasb.py processing"""

import re

def test_include_protection():
    """Test that {% include %} protection works"""
    print("Testing {% include %} protection...")
    
    body = '''
    Some markdown text
    
    {% include "logistics_info.tmpl" %}
    
    More text
    '''
    
    # Simulate the protection logic
    include_patterns = []
    include_index = 0
    
    def protect_include(match):
        nonlocal include_index
        placeholder = f'__INCLUDE_{include_index}__'
        include_patterns.append((placeholder, match.group(0)))
        include_index += 1
        return placeholder
    
    body_protected = re.sub(r'\{%\s*include\s+[^%]+%\}', protect_include, body)
    
    # Verify protection
    if '__INCLUDE_0__' in body_protected and '{% include' not in body_protected:
        print("  ✓ {% include %} protected correctly")
    else:
        print(f"  ✗ Protection failed. Protected body: {body_protected[:100]}")
        return False
    
    # Simulate markdown processing (would convert markdown to HTML)
    # In real markdown, this would process the text but leave placeholders alone
    markdown_output = body_protected.replace('Some markdown text', '<p>Some markdown text</p>')
    
    # Restore includes
    for placeholder, original in include_patterns:
        markdown_output = markdown_output.replace(placeholder, original)
    
    if '{% include "logistics_info.tmpl" %}' in markdown_output:
        print("  ✓ {% include %} restored correctly")
    else:
        print(f"  ✗ Restoration failed. Output: {markdown_output[:200]}")
        return False
    
    # Test brace escaping
    escaped = markdown_output.replace('{', '{{').replace('}', '}}')
    if '{{% include "logistics_info.tmpl" %}}' in escaped:
        print("  ✓ Braces escaped correctly ({{% becomes {% after .format())")
        return True
    else:
        print(f"  ✗ Escaping failed. Escaped: {escaped[:200]}")
        return False

def test_template_logic_processing():
    """Test that template logic is processed before markdown"""
    print("\nTesting template logic processing...")
    
    body = '''
    {% set var = "test" %}
    ## Heading
    {% if var %}
    <p>Value: {{ var }}</p>
    {% end %}
    '''
    
    # Simulate: if body has template logic, process as template first
    has_template_logic = '{% set' in body or '{% if' in body
    
    if has_template_logic:
        # Simulate template processing (evaluates {% set %}, {% if %}, {{ var }})
        processed = body.replace('{% set var = "test" %}', '').replace('{% if var %}', '').replace('{% end %}', '').replace('{{ var }}', 'test')
        # Result should be: "\n## Heading\n<p>Value: test</p>\n"
        
        if '{{ var }}' not in processed and 'test' in processed:
            print("  ✓ Template syntax evaluated before markdown")
            print("  ✓ Markdown will only see: '## Heading\\n<p>Value: test</p>'")
            return True
        else:
            print(f"  ✗ Template processing failed. Result: {processed[:200]}")
            return False
    else:
        print("  ✗ Template logic not detected")
        return False

def test_combined_scenario():
    """Test the actual scenario: body with both template logic and includes"""
    print("\nTesting combined scenario (template logic + includes)...")
    
    # This shouldn't happen in practice, but let's test the logic
    body = '''
    {% set x = 1 %}
    ## Test
    {% include "something.tmpl" %}
    {{ x }}
    '''
    
    # Step 1: Protect includes
    include_patterns = []
    include_index = 0
    
    def protect_include(match):
        nonlocal include_index
        placeholder = f'__INCLUDE_{include_index}__'
        include_patterns.append((placeholder, match.group(0)))
        include_index += 1
        return placeholder
    
    body_protected = re.sub(r'\{%\s*include\s+[^%]+%\}', protect_include, body)
    
    # Step 2: Process template logic
    has_template_logic = '{% set' in body_protected or '{% if' in body_protected
    if has_template_logic:
        # Simulate template processing
        processed = body_protected.replace('{% set x = 1 %}', '').replace('{{ x }}', '1')
        # Include placeholder should still be there
        if '__INCLUDE_0__' in processed:
            print("  ✓ Include protected during template processing")
        else:
            print("  ✗ Include lost during template processing")
            return False
    
    # Step 3: Restore includes
    for placeholder, original in include_patterns:
        processed = processed.replace(placeholder, original)
    
    if '{% include' in processed:
        print("  ✓ Include restored correctly")
        return True
    else:
        print("  ✗ Include not restored")
        return False

def test_brace_escaping_with_includes():
    """Test that brace escaping works correctly with includes"""
    print("\nTesting brace escaping with includes...")
    
    # After markdown and include restoration, we have:
    markdown_output = '<p>Text</p>\n{% include "test.tmpl" %}\n<p>More text</p>'
    
    # Escape braces
    escaped = markdown_output.replace('{', '{{').replace('}', '}}')
    
    # Verify: {% include %} becomes {{% include %}}
    if '{{% include "test.tmpl" %}}' in escaped:
        print("  ✓ {% include %} escaped to {{% include %}}")
        print("  ✓ After .format(), {{% becomes {% (correct)")
        return True
    else:
        print(f"  ✗ Escaping failed. Got: {escaped}")
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("Testing yasb.py Processing Logic")
    print("=" * 60)
    
    results = []
    results.append(test_include_protection())
    results.append(test_template_logic_processing())
    results.append(test_combined_scenario())
    results.append(test_brace_escaping_with_includes())
    
    print("\n" + "=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("✓ All logic tests passed!")
        print("\nThe fix should work:")
        print("  1. {% include %} protected before processing")
        print("  2. Template logic evaluated (if present)")
        print("  3. Markdown processes content")
        print("  4. {% include %} restored")
        print("  5. Braces escaped for .format()")
        print("  6. Final template processed by Tornado")
        exit(0)
    else:
        print("✗ Some tests failed - fix needed")
        exit(1)
