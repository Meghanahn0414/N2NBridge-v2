# Voters Routes
from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import Optional
from src.modules.voters.model import (
    VoterCreate, VoterResponse, VoterUpdate
)
from src.modules.voters.service import (
    create_voter, 
    get_voter, 
    get_all_voters, 
    update_voter, 
    delete_voter
)
# from src.utils.file_handler import upload_profile_image

router = APIRouter()

# ============== VOTER REGISTRATION ENDPOINTS ==============

@router.post("/register", response_model=VoterResponse)
async def register_voter(
    fullName: str,
    email: str,
    password: str,
    confirmPassword: str,
    mobile: int,
    age: Optional[int] = None,
    gender: Optional[str] = None,
    address: Optional[str] = None,
    profileImage: Optional[UploadFile] = File(None)
):
    
    try:
        # Create voter object
        voter = VoterCreate(
            fullName=fullName,
            email=email,
            password=password,
            confirmPassword=confirmPassword,
            mobile=mobile,
            age=age,
            gender=gender,
            address=address,
            profileImage=profileImage.filename if profileImage else None
        )
        
        return create_voter(voter)
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"❌ Error registering voter: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/", response_model=list[VoterResponse])
def list_voters(skip: int = 0):
    """Get all voters"""
    try:
        return get_all_voters(skip=skip)
    except Exception as e:
        print(f"❌ Error listing voters: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/{voter_id}", response_model=VoterResponse)
def get_voter_by_id(voter_id: str):
    """Get voter by ID"""
    try:
        voter = get_voter(voter_id)
        if not voter:
            raise HTTPException(status_code=404, detail="Voter not found")
        return voter
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"❌ Error getting voter: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.put("/{voter_id}", response_model=VoterResponse)
def update_voter_by_id(voter_id: str, voter_update: VoterUpdate):
    """Update voter"""
    try:
        result = update_voter(voter_id, voter_update)
        if not result:
            raise HTTPException(status_code=404, detail="Voter not found")
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"❌ Error updating voter: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.delete("/{voter_id}")
def delete_voter_by_id(voter_id: str):
    """Delete voter"""
    try:
        result = delete_voter(voter_id)
        if not result:
            raise HTTPException(status_code=404, detail="Voter not found")
        return {"message": "Voter deleted successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"❌ Error deleting voter: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
