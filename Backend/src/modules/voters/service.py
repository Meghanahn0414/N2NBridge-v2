# Voters Service
from src.config.database import get_database
from src.config.security import hash_password
from src.modules.voters.model import VoterCreate, VoterUpdate
from src.utils.file_handler import delete_profile_image
from bson.objectid import ObjectId
from datetime import datetime

def create_voter(voter: VoterCreate) -> dict:
    """Create a new voter"""
    db = get_database()
    
    # Check if voter already exists by mobile
    existing = db.voters.find_one({"mobile": voter.mobile})
    if existing:
        raise ValueError("❌ Voter with this mobile already exists")
    
    # Check if email already registered
    if voter.email:
        email_existing = db.voters.find_one({"email": voter.email})
        if email_existing:
            raise ValueError("❌ This email is already registered")
    
    voter_data = {
        "fullName": voter.fullName,
        "mobile": voter.mobile,
        "email": voter.email or None,
        "passwordHash": hash_password(voter.password),
        "age": getattr(voter, 'age', None) or None,
        "gender": getattr(voter, 'gender', None) or None,
        "address": getattr(voter, 'address', None) or None,
        "profileImage": getattr(voter, 'profileImage', None) or None,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    result = db.voters.insert_one(voter_data)
    voter_data["_id"] = str(result.inserted_id)
    return voter_data

def get_voter(voter_id: str) -> dict:
    """Get voter by ID"""
    db = get_database()
    try:
        voter = db.voters.find_one({"_id": ObjectId(voter_id)})
        if voter:
            voter["_id"] = str(voter["_id"])
            # Convert roleId to string if it's ObjectId
            if "roleId" in voter and voter["roleId"]:
                voter["roleId"] = str(voter["roleId"])
        return voter
    except Exception as e:
        print(f"❌ Error getting voter {voter_id}: {str(e)}")
        return None
    
def get_all_voters(skip: int = 0, limit: int = 10) -> list:
    """Get all voters with pagination"""
    db = get_database()
    voters = db.voters.find().skip(skip).limit(limit)
    result = []
    for v in voters:
        voter_dict = dict(v)
        voter_dict["_id"] = str(voter_dict["_id"])
        # Convert roleId to string if it's ObjectId
        if "roleId" in voter_dict and voter_dict["roleId"]:
            voter_dict["roleId"] = str(voter_dict["roleId"])
        result.append(voter_dict)
    return result

def update_voter(voter_id: str, voter_update: VoterUpdate) -> dict:
    """Update voter"""
    db = get_database()
    try:
        # Get existing voter to check for old profile image
        existing_voter = db.voters.find_one({"_id": ObjectId(voter_id)})
        if not existing_voter:
            return None
        
        # If updating with new profile image, delete old one
        if voter_update.profileImage and existing_voter.get("profileImage"):
            delete_profile_image(existing_voter["profileImage"])
        
        update_data = voter_update.dict(exclude_unset=True)
        update_data["updatedAt"] = datetime.utcnow()
        
        result = db.voters.find_one_and_update(
            {"_id": ObjectId(voter_id)},
            {"$set": update_data},
            return_document=True
        )
        
        if result:
            result["_id"] = str(result["_id"])
            # Convert roleId to string if it's ObjectId
            if "roleId" in result and result["roleId"]:
                result["roleId"] = str(result["roleId"])
        return result
    except Exception as e:
        print(f"❌ Error updating voter: {str(e)}")
        return None

def delete_voter(voter_id: str) -> bool:
    """Delete voter"""
    db = get_database()
    try:
        # Get voter to retrieve profile image path
        voter = db.voters.find_one({"_id": ObjectId(voter_id)})
        if voter and voter.get("profileImage"):
            delete_profile_image(voter["profileImage"])
        
        result = db.voters.delete_one({"_id": ObjectId(voter_id)})
        return result.deleted_count > 0
    except Exception as e:
        print(f"❌ Error deleting voter: {str(e)}")
        return False
