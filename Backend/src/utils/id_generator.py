"""
ID Generator Utility
Generates unique 4-digit IDs for Citizens and Grievances
"""
import logging
import random
from datetime import datetime

from config.database import MongoDatabase

logger = logging.getLogger(__name__)


class IDGenerator:
    """Generate unique IDs for various entities"""
    
    @staticmethod
    def generate_citizen_id() -> str:
        """
        Generate a unique 4-digit citizen ID
        Format: CTZN-XXXX (where XXXX is a 4-digit number)
        
        Returns:
            str: Unique citizen ID like "CTZN-1234"
        """
        db = MongoDatabase.get_db()
        max_attempts = 1000
        
        for attempt in range(max_attempts):
            # Generate random 4-digit number
            four_digit = random.randint(1000, 9999)
            citizen_id = f"CTZN-{four_digit}"
            
            # Check if ID already exists
            existing = db.users.find_one({"citizenId": citizen_id})
            
            if not existing:
                logger.info(f"Generated unique Citizen ID: {citizen_id}")
                return citizen_id
        
        # Fallback: use timestamp + random suffix if all attempts fail
        fallback_id = f"CTZN-{int(datetime.utcnow().timestamp()) % 10000:04d}"
        logger.warning(f"Could not find unique ID in {max_attempts} attempts. Using fallback: {fallback_id}")
        return fallback_id
    
    @staticmethod
    def generate_grievance_id() -> str:
        """
        Generate a unique 4-digit grievance ID
        Format: GRV-XXXX (where XXXX is a 4-digit number)
        
        Returns:
            str: Unique grievance ID like "GRV-5678"
        """
        db = MongoDatabase.get_db()
        max_attempts = 1000
        
        for attempt in range(max_attempts):
            # Generate random 4-digit number
            four_digit = random.randint(1000, 9999)
            grievance_id = f"GRV-{four_digit}"
            
            # Check if ID already exists in grievances collection
            existing = db.grievances.find_one({"grievanceId": grievance_id})
            
            if not existing:
                logger.info(f"Generated unique Grievance ID: {grievance_id}")
                return grievance_id
        
        # Fallback: use timestamp + random suffix if all attempts fail
        fallback_id = f"GRV-{int(datetime.utcnow().timestamp()) % 10000:04d}"
        logger.warning(f"Could not find unique ID in {max_attempts} attempts. Using fallback: {fallback_id}")
        return fallback_id
    
    @staticmethod
    def generate_alert_id() -> str:
        """
        Generate a unique 4-digit alert ID
        Format: ALT-XXXX (where XXXX is a 4-digit number)
        
        Returns:
            str: Unique alert ID like "ALT-9012"
        """
        db = MongoDatabase.get_db()
        max_attempts = 1000
        
        for attempt in range(max_attempts):
            # Generate random 4-digit number
            four_digit = random.randint(1000, 9999)
            alert_id = f"ALT-{four_digit}"
            
            # Check if ID already exists in alerts collection
            existing = db.alerts.find_one({"alertId": alert_id})
            
            if not existing:
                logger.info(f"Generated unique Alert ID: {alert_id}")
                return alert_id
        
        # Fallback: use timestamp + random suffix if all attempts fail
        fallback_id = f"ALT-{int(datetime.utcnow().timestamp()) % 10000:04d}"
        logger.warning(f"Could not find unique ID in {max_attempts} attempts. Using fallback: {fallback_id}")
        return fallback_id
    
    @staticmethod
    def generate_task_id() -> str:
        """
        Generate a unique 4-digit task ID
        Format: TSK-XXXX (where XXXX is a 4-digit number)
        
        Returns:
            str: Unique task ID like "TSK-3456"
        """
        db = MongoDatabase.get_db()
        max_attempts = 1000
        
        for attempt in range(max_attempts):
            # Generate random 4-digit number
            four_digit = random.randint(1000, 9999)
            task_id = f"TSK-{four_digit}"
            
            # Check if ID already exists in tasks collection
            existing = db.tasks.find_one({"taskId": task_id})
            
            if not existing:
                logger.info(f"Generated unique Task ID: {task_id}")
                return task_id
        
        # Fallback: use timestamp + random suffix if all attempts fail
        fallback_id = f"TSK-{int(datetime.utcnow().timestamp()) % 10000:04d}"
        logger.warning(f"Could not find unique ID in {max_attempts} attempts. Using fallback: {fallback_id}")
        return fallback_id
    
    @staticmethod
    def generate_event_id() -> str:
        """
        Generate a unique 4-digit event ID
        Format: EVT-XXXX (where XXXX is a 4-digit number)
        
        Returns:
            str: Unique event ID like "EVT-7890"
        """
        db = MongoDatabase.get_db()
        max_attempts = 1000
        
        for attempt in range(max_attempts):
            # Generate random 4-digit number
            four_digit = random.randint(1000, 9999)
            event_id = f"EVT-{four_digit}"
            
            # Check if ID already exists in events collection
            existing = db.events.find_one({"eventId": event_id})
            
            if not existing:
                logger.info(f"Generated unique Event ID: {event_id}")
                return event_id
        
        # Fallback: use timestamp + random suffix if all attempts fail
        fallback_id = f"EVT-{int(datetime.utcnow().timestamp()) % 10000:04d}"
        logger.warning(f"Could not find unique ID in {max_attempts} attempts. Using fallback: {fallback_id}")
        return fallback_id
    
    @staticmethod
    def generate_manager_id() -> str:
        """
        Generate a unique 4-digit manager ID
        Format: MGR-XXXX (where XXXX is a 4-digit number)
        
        Returns:
            str: Unique manager ID like "MGR-1234"
        """
        db = MongoDatabase.get_db()
        max_attempts = 1000
        
        for attempt in range(max_attempts):
            # Generate random 4-digit number
            four_digit = random.randint(1000, 9999)
            manager_id = f"MGR-{four_digit}"
            
            # Check if ID already exists
            existing = db.users.find_one({"managerId": manager_id})
            
            if not existing:
                logger.info(f"Generated unique Manager ID: {manager_id}")
                return manager_id
        
        # Fallback: use timestamp + random suffix if all attempts fail
        fallback_id = f"MGR-{int(datetime.utcnow().timestamp()) % 10000:04d}"
        logger.warning(f"Could not find unique ID in {max_attempts} attempts. Using fallback: {fallback_id}")
        return fallback_id
