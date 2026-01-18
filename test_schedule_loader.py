#!/usr/bin/env python3

import sys
import os
import yaml
import csv
import io
from datetime import datetime

# Copy the relevant parts from yasb.py
try:
    import requests
except Exception:
    requests = None

def normalize_headers(headers):
    return [h.strip().lower().replace(' ', '_') for h in headers]

def best_of(row, *cands):
    for c in cands:
        if c in row and row[c]:
            return str(row[c]).strip()
    return ''

def parse_date(date_str):
    """Convert MM/DD/YY format to "Mon MM/DD" format."""
    try:
        parts = date_str.split('/')
        if len(parts) == 3:
            month, day, year = parts
            year_int = int(year)
            if year_int < 50:
                year_int += 2000
            else:
                year_int += 1900
            
            dt = datetime(int(year_int), int(month), int(day))
            day_name = dt.strftime('%a')
            return f"{day_name} {month}/{day}"
    except Exception:
        pass
    return date_str

def parse_assignments(assignments_str):
    """Parse comma-separated assignments into a list."""
    if not assignments_str:
        return []
    return [a.strip() for a in assignments_str.split(',') if a.strip()]

# Get URL from semester_info.yaml (which may contain CSV URLs)
try:
    # Try to import the helper function from yasb
    import sys
    import os
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scripts'))
    from yasb import load_semester_info_from_yaml_or_csv
    semester_info = load_semester_info_from_yaml_or_csv('static/yaml/semester_info.yaml')
except ImportError:
    # Fallback: load directly from YAML
    with open('static/yaml/semester_info.yaml', 'r') as f:
        semester_info = yaml.safe_load(f)

schedule_url = semester_info.get('csv_urls', {}).get('schedule', '')
print(f"Loading schedule from: {schedule_url}\n")

# Fetch CSV
if not requests:
    print("ERROR: requests module not available")
    sys.exit(1)

r = requests.get(schedule_url, timeout=30, headers={'User-Agent': 'nd-cse-site-bot/1.0'})
r.raise_for_status()
try:
    text = r.content.decode('utf-8-sig')
except Exception:
    text = r.text

reader = csv.DictReader(io.StringIO(text))
reader.fieldnames = normalize_headers(reader.fieldnames or [])

# Process rows
result = []
current_unit = None
current_section = None
seen_units = set()

for raw in reader:
    row = {k: (v or '').strip() for k, v in raw.items()}
    
    date_raw = best_of(row, 'date')
    unit = best_of(row, 'unit')
    topic = best_of(row, 'topic')
    assignments_str = best_of(row, 'assignments', 'assignment')
    topic_id = best_of(row, 'id')
    
    # If unit is empty, use the previous unit
    if not unit and current_unit:
        unit = current_unit
    
    # Update current_unit if we have a new one
    if unit:
        current_unit = unit
    
    # Skip rows without date and topic
    if not date_raw or not topic:
        continue
    
    # Convert date format
    date = parse_date(date_raw)
    
    # Parse assignments
    assignments = parse_assignments(assignments_str)
    
    # Handle unit changes
    if unit and unit != (current_section['name'] if current_section else None):
        if current_section:
            result.append(current_section)
        current_section = {'name': unit, 'days': []}
        seen_units.add(unit)
    
    # Create section if needed
    if not current_section and unit:
        current_section = {'name': unit, 'days': []}
        seen_units.add(unit)
    
    # Add day entry
    if current_section:
        day_entry = {'date': date, 'topics': topic}
        if assignments:
            day_entry['assignments'] = assignments
        if topic_id:
            day_entry['topic_slug'] = topic_id
        current_section['days'].append(day_entry)

# Add final section
if current_section:
    result.append(current_section)

# Save to file (no duplicate headers - just use result directly)
output_file = 'generated_schedule_output.yaml'
with open(output_file, 'w') as f:
    yaml.dump(result, f, default_flow_style=False, sort_keys=False, allow_unicode=True)

print(f"Output saved to: {output_file}")
print(f"Total sections: {len(result)}")
print(f"Total days: {sum(len(s.get('days', [])) for s in result)}")
