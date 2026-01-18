#!/usr/bin/env python3
"""
Generate homework page YAML files from schedule.yaml based on a template.

This script:
1. Reads schedule.yaml to find all "Homework XX" assignments
2. Generates homework_XX.yaml files from templates/homework.tmpl.yaml
3. Replaces template variables with actual homework numbers
"""

import os
import re
import yaml
import sys
from pathlib import Path

# Get the project root directory (parent of scripts/)
PROJECT_ROOT = Path(__file__).parent.parent
SCHEDULE_FILE = PROJECT_ROOT / "static" / "yaml" / "schedule.yaml"
TEMPLATE_FILE = PROJECT_ROOT / "templates" / "homework.tmpl.yaml"
PAGES_DIR = PROJECT_ROOT / "pages"


def extract_homework_numbers(schedule_file):
    """Extract homework numbers from schedule.yaml assignments."""
    homework_numbers = set()
    
    with open(schedule_file, 'r', encoding='utf-8') as f:
        schedule = yaml.safe_load(f)
    
    # Recursively search through the schedule structure
    def find_assignments(obj):
        if isinstance(obj, dict):
            # Check if this dict has an 'assignments' key
            if 'assignments' in obj:
                for assignment in obj['assignments']:
                    # Match "Homework XX" pattern
                    match = re.match(r'^Homework\s+(\d+)$', assignment, re.IGNORECASE)
                    if match:
                        homework_numbers.add(int(match.group(1)))
            # Recursively search nested structures
            for value in obj.values():
                find_assignments(value)
        elif isinstance(obj, list):
            for item in obj:
                find_assignments(item)
    
    find_assignments(schedule)
    return sorted(homework_numbers)


def generate_homework_page(number, template_file, output_dir):
    """Generate a homework page YAML file from template."""
    with open(template_file, 'r', encoding='utf-8') as f:
        template_content = f.read()
    
    # Format the number and assignment name
    number_str = str(number).zfill(2)
    assignment_name = f"homework{number_str}"
    
    # Replace template placeholders in the YAML template
    # These are simple string replacements since we're generating the YAML file itself
    content = template_content
    content = content.replace('{{ number_str }}', number_str)
    content = content.replace('{{ assignment_name }}', assignment_name)
    
    # Write the output file
    output_file = output_dir / f"homework_{number_str}.yaml"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return output_file


def main():
    """Main function to generate all homework pages."""
    if not SCHEDULE_FILE.exists():
        print(f"Error: Schedule file not found: {SCHEDULE_FILE}", file=sys.stderr)
        sys.exit(1)
    
    if not TEMPLATE_FILE.exists():
        print(f"Error: Template file not found: {TEMPLATE_FILE}", file=sys.stderr)
        sys.exit(1)
    
    # Ensure pages directory exists
    PAGES_DIR.mkdir(parents=True, exist_ok=True)
    
    # Extract homework numbers from schedule
    homework_numbers = extract_homework_numbers(SCHEDULE_FILE)
    
    if not homework_numbers:
        print("Warning: No homework assignments found in schedule.yaml", file=sys.stderr)
        return
    
    print(f"Found {len(homework_numbers)} homework assignment(s): {homework_numbers}")
    
    # Generate pages for each homework
    generated = []
    for number in homework_numbers:
        output_file = generate_homework_page(number, TEMPLATE_FILE, PAGES_DIR)
        generated.append(output_file)
        print(f"Generated: {output_file}")
    
    print(f"\nSuccessfully generated {len(generated)} homework page(s)")


if __name__ == '__main__':
    main()
