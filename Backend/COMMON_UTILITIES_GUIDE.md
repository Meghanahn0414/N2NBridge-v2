# Common Utilities & Base Service Usage Guide

## Overview

Two new shared utility files have been created to eliminate code duplication and standardize patterns across all service modules:

1. **`utils/base_service.py`** - Base service class with common database operations
2. **`utils/common.py`** - Centralized constants, enums, and shared utilities

---

## `utils/base_service.py` - BaseService Class

The `BaseService` class provides common database operations used by all service modules.

### Features

- Database instance management
- CRUD operations (Create, Read, Update, Delete)
- Pagination support
- Soft delete functionality
- Aggregation pipelines
- Error logging

### Available Methods

#### Get Database Instance
```python
from utils import BaseService

db = BaseService.get_db()
```

#### Get Single Document
```python
# Get by ID (filters soft-deleted by default)
grievance = BaseService.get_by_id("grievances", grievance_id)

# Get without filtering soft-deleted
user = BaseService.get_by_id("users", user_id, filter_deleted=False)
```

#### Get List of Documents
```python
# Get all grievances with pagination
grievances = BaseService.get_list(
    "grievances",
    filters={"status": "NEW"},
    skip=0,
    limit=10
)
```

#### Count Documents
```python
# Count active grievances
count = BaseService.count_documents(
    "grievances",
    {"status": "NEW"}
)
```

#### Insert Document
```python
# Insert new grievance
grievance_id = BaseService.insert_one("grievances", {
    "citizenId": "...",
    "description": "...",
    "status": "NEW"
})
```

#### Update Document
```python
# Update grievance status
updated = BaseService.update_one(
    "grievances",
    grievance_id,
    {"status": "ASSIGNED"}
)
```

#### Delete Document
```python
# Soft delete (default)
deleted = BaseService.delete_one("grievances", grievance_id)

# Hard delete
deleted = BaseService.delete_one("grievances", grievance_id, soft_delete=False)
```

#### Run Aggregation
```python
# Get grievance statistics
pipeline = [
    {"$match": {"isDeleted": False}},
    {"$group": {"_id": "$status", "count": {"$sum": 1}}}
]
results = BaseService.aggregate("grievances", pipeline)
```

---

## `utils/common.py` - Shared Constants & Enums

### Usage

Import from common utilities:
```python
from utils import (
    UserRole,
    GrievanceStatus,
    PriorityLevel,
    AlertType,
    NotificationType,
    COLLECTION_NAMES,
    PAGINATION_DEFAULTS
)
```

### Available Enums

#### UserRole
```python
UserRole.ADMIN
UserRole.MANAGER
UserRole.FIELD_OFFICER
UserRole.REPRESENTATIVE
UserRole.VOLUNTEER
UserRole.CITIZEN
```

#### GrievanceStatus
```python
GrievanceStatus.NEW
GrievanceStatus.ASSIGNED
GrievanceStatus.IN_PROGRESS
GrievanceStatus.ON_HOLD
GrievanceStatus.RESOLVED
GrievanceStatus.CLOSED
GrievanceStatus.REJECTED
```

#### PriorityLevel
```python
PriorityLevel.LOW
PriorityLevel.MEDIUM
PriorityLevel.HIGH
PriorityLevel.CRITICAL
```

#### AlertType
```python
AlertType.EMERGENCY
AlertType.SECURITY
AlertType.HEALTH
AlertType.INFRASTRUCTURE
AlertType.POLLUTION
AlertType.OTHER
```

#### Other Enums
- `AlertStatus` - OPEN, ACKNOWLEDGED, IN_PROGRESS, RESOLVED, CLOSED
- `NotificationType` - GRIEVANCE, ALERT, TASK, EVENT, SYSTEM
- `TaskStatus` - PENDING, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED
- `EventStatus` - DRAFT, PUBLISHED, ONGOING, COMPLETED, CANCELLED
- `UserStatus` - ACTIVE, INACTIVE, SUSPENDED

### Available Constants

#### COLLECTION_NAMES
```python
COLLECTION_NAMES["users"]
COLLECTION_NAMES["grievances"]
COLLECTION_NAMES["alerts"]
# ... all 16 collection names
```

#### PAGINATION_DEFAULTS
```python
{
    "page": 1,
    "per_page": 10,
    "max_per_page": 100
}
```

#### RESPONSE_MESSAGES
```python
RESPONSE_MESSAGES["success"]
RESPONSE_MESSAGES["not_found"]
RESPONSE_MESSAGES["unauthorized"]
# ... common response messages
```

#### HTTP_STATUS
```python
HTTP_STATUS["ok"]  # 200
HTTP_STATUS["created"]  # 201
HTTP_STATUS["bad_request"]  # 400
HTTP_STATUS["unauthorized"]  # 401
# ... all common HTTP status codes
```

---

## Example: Refactoring a Service

### Before (Without Base Service)
```python
# grievances/service.py
from config.database import MongoDatabase
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

class GrievanceService:
    @staticmethod
    def get_grievance(grievance_id: str):
        try:
            db = MongoDatabase.get_db()
            grievance = db.grievances.find_one({
                "_id": ObjectId(grievance_id),
                "isDeleted": False
            })
            return grievance
        except Exception as e:
            logger.error(f"Error: {e}")
            return None
    
    @staticmethod
    def list_grievances(skip: int = 0, limit: int = 10):
        try:
            db = MongoDatabase.get_db()
            grievances = list(db.grievances.find({
                "isDeleted": False
            }).skip(skip).limit(limit))
            return grievances
        except Exception as e:
            logger.error(f"Error: {e}")
            return []
```

### After (Using Base Service)
```python
# grievances/service.py
from utils import BaseService

class GrievanceService:
    @staticmethod
    def get_grievance(grievance_id: str):
        return BaseService.get_by_id("grievances", grievance_id)
    
    @staticmethod
    def list_grievances(skip: int = 0, limit: int = 10):
        return BaseService.get_list("grievances", skip=skip, limit=limit)
```

---

## Best Practices

### 1. Use Common Enums
```python
# Instead of string literals
status = "NEW"

# Use enums for type safety
from utils import GrievanceStatus
status = GrievanceStatus.NEW
```

### 2. Use Base Service for Database Operations
```python
# Instead of importing MongoDatabase in every service
from utils import BaseService

# Use BaseService static methods
result = BaseService.get_by_id("grievances", id)
```

### 3. Use COLLECTION_NAMES Constant
```python
# Instead of hardcoding collection names
BaseService.get_list("grievances", ...)

# Use constants for consistency
from utils import COLLECTION_NAMES
BaseService.get_list(COLLECTION_NAMES["grievances"], ...)
```

### 4. Import from Common Utils
```python
# In any service file
from utils import (
    BaseService,
    UserRole,
    GrievanceStatus,
    PriorityLevel,
    COLLECTION_NAMES
)
```

---

## Error Handling

All `BaseService` methods include built-in error logging:

```python
@staticmethod
def get_by_id(collection_name: str, obj_id: str, ...) -> Optional[dict]:
    try:
        # operation
    except Exception as e:
        logger.error(f"Error getting document from {collection_name}: {e}")
        return None
```

Errors are logged automatically, so you don't need to wrap calls in try-catch blocks.

---

## Migration Guide

To refactor existing services to use common utilities:

1. **Remove duplicate imports**
   - Remove individual `MongoDatabase`, `ObjectId` imports
   - Add single import: `from utils import BaseService`

2. **Replace database operations**
   - Replace `db = MongoDatabase.get_db()` with `BaseService.get_db()`
   - Replace `db.collection.find_one(...)` with `BaseService.get_by_id(...)`
   - Replace `db.collection.find(...)` with `BaseService.get_list(...)`

3. **Use enums instead of strings**
   - Import relevant enums from `utils`
   - Replace string literals with enum values

4. **Use constants**
   - Replace hardcoded collection names with `COLLECTION_NAMES`
   - Replace hardcoded messages with `RESPONSE_MESSAGES`

---

## Benefits

✅ **Code Reusability** - Common patterns in one place  
✅ **Consistency** - All services follow same patterns  
✅ **Maintainability** - Changes in one place affect all services  
✅ **Error Handling** - Built-in logging and error handling  
✅ **Type Safety** - Enums instead of string literals  
✅ **Reduced Bugs** - Less code duplication = fewer bugs  

---

## Summary

Use these utilities throughout the codebase to:
- Eliminate duplicate database code
- Use type-safe enums instead of strings
- Follow consistent naming conventions
- Reduce code duplication
- Improve code maintainability
