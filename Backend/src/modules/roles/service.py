# Roles Service
from src.config.database import get_database

def init_roles():
    """Initialize default roles in the database"""
    db = get_database()
    roles_collection = db.roles
    
    # Drop existing roles collection to ensure fresh data
    roles_collection.drop()
    
    # Default roles
    default_roles = [
        {"name": "Citizen", "description": "Regular citizen"},
        {"name": "Admin", "description": "Administrator"},
        {"name": "Manager", "description": "Manager"},
        {"name": "MLA", "description": "Member of Legislative Assembly"},
        {"name": "MP", "description": "Member of Parliament"},
        {"name": "FieldOfficer", "description": "Field Officer"},
        {"name": "Representative", "description": "Representative"}
    ]
    
    # Insert default roles
    roles_collection.insert_many(default_roles)
    print("✅ Default roles initialized")

def get_all_roles():
    """Get all roles from database"""
    db = get_database()
    roles = list(db.roles.find())
    # Convert ObjectId to string for JSON serialization
    for role in roles:
        role["_id"] = str(role["_id"])
    return roles

def get_role_by_id(role_id: str):
    """Get role by ID"""
    db = get_database()
    from bson.objectid import ObjectId
    role = db.roles.find_one({"_id": ObjectId(role_id)})
    if role:
        role["_id"] = str(role["_id"])
    return role

def get_role_by_name(role_name: str):
    """Get role by name"""
    db = get_database()
    role = db.roles.find_one({"name": role_name})
    if role:
        role["_id"] = str(role["_id"])
    return role
