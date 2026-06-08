#!/usr/bin/env python3
"""Fix all route files to use convert_mongo_doc properly"""
import re
from pathlib import Path

files = [
    'grievances/routes.py',
    'events/routes.py',
    'tasks/routes.py',
    'notifications/routes.py',
    'dashboard/routes.py',
    'analytics/routes.py'
]

for file_path in files:
    file = Path(file_path)
    if not file.exists():
        print(f"⚠️  Skipping: {file_path} (not found)")
        continue
        
    content = file.read_text()
    original = content
    
    # Fix patterns like: return [Response(**item) for item in items]
    # To: return [Response(**Helper.convert_mongo_doc(item)) for item in items]
    
    # Pattern 1: return [SomeResponse(**x) for x in ...
    content = re.sub(
        r'return \[(\w+Response)\(\*\*([a-z_])\) for ([a-z_]) in',
        r'return [\1(**Helper.convert_mongo_doc(\2)) for \3 in',
        content
    )
    
    # Pattern 2: return Response(**item) (without list comprehension)
    # where item is not already wrapped with convert_mongo_doc
    content = re.sub(
        r'return (\w+Response)\(\*\*([a-z_]+)\)(?!\))',
        lambda m: (
            f'return {m.group(1)}(**Helper.convert_mongo_doc({m.group(2)}))'
            if 'convert_mongo_doc' not in m.group(0)
            else m.group(0)
        ),
        content
    )
    
    if content != original:
        file.write_text(content)
        print(f"✅ Fixed: {file_path}")
    else:
        print(f"ℹ️  No changes: {file_path}")

print("\n✅ All route files checked and fixed")
