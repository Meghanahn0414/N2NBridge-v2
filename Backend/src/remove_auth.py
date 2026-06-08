#!/usr/bin/env python3
"""Remove authorization from all route files"""
import re
from pathlib import Path

files = [
    'grievances/routes.py',
    'alerts/routes.py',
    'notifications/routes.py',
    'events/routes.py',
    'tasks/routes.py',
    'dashboard/routes.py',
    'analytics/routes.py',
    'users/routes.py',
    'auth/routes.py'
]

for file_path in files:
    file = Path(file_path)
    content = file.read_text()
    
    # Remove the import for get_current_user
    content = re.sub(r'from auth\.routes import get_current_user\n', '', content)
    
    # Remove Depends from import if it's the only thing left
    content = re.sub(r'from fastapi import (.*?), Depends(.*?\n)', 
                     lambda m: f"from fastapi import {m.group(1)}{m.group(2)}\n" if m.group(1) else f"from fastapi import{m.group(2)}\n", 
                     content)
    content = re.sub(r'from fastapi import Depends, (.*?\n)', r'from fastapi import \1', content)
    content = re.sub(r', Depends', '', content)
    
    # Remove current_user parameter from function signatures
    # Pattern 1: ,\n    current_user: dict = Depends(get_current_user)
    content = re.sub(r',\s*\n\s*current_user: dict = Depends\(get_current_user\)', '', content)
    
    # Pattern 2: (current_user: dict = Depends(get_current_user)) -> ()
    content = re.sub(r'\(\s*current_user: dict = Depends\(get_current_user\)\s*\)', '()', content)
    
    # Pattern 3: other_param, current_user: dict = Depends(get_current_user) -> other_param
    content = re.sub(r',\s*current_user: dict = Depends\(get_current_user\)', '', content)
    
    # Replace current_user["user_id"] with None
    content = re.sub(r'current_user\["user_id"\]', 'None', content)
    
    file.write_text(content)
    print(f"✅ Fixed: {file_path}")

print("\n✅ Authorization removed from all files")
