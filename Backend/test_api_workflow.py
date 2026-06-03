"""
CRM API Testing Script - Complete Workflow Demo
Run this script to see how all APIs work with sample data
"""

import requests
import json
from typing import Optional

# Base configuration
BASE_URL = "http://localhost:8000"
HEADERS = {"Content-Type": "application/json"}

# Store tokens and IDs for workflow
auth_token = None
citizen_id = None
officer_id = None
manager_id = None
constituency_id = None
grievance_id = None
alert_id = None
event_id = None


def print_section(title):
    """Print section header"""
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")


def print_response(response, title="Response"):
    """Print formatted response"""
    print(f"{title}:")
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text)
    print(f"Status Code: {response.status_code}\n")


def register_user(full_name, mobile, email, password, role="CITIZEN"):
    """Register a new user"""
    print(f"Registering {role}: {full_name}")
    
    payload = {
        "fullName": full_name,
        "mobile": mobile,
        "email": email,
        "password": password,
        "role": role,
        "address": "Sample Address, City"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/auth/register",
        json=payload,
        headers=HEADERS
    )
    
    print_response(response, f"{role} Registration")
    
    if response.status_code == 200:
        data = response.json()
        return {
            "token": data.get("accessToken"),
            "user_id": data.get("user", {}).get("id"),
            "email": email,
            "password": password
        }
    return None


def login_user(email, password):
    """Login user and get token"""
    print(f"Logging in: {email}")
    
    payload = {
        "email": email,
        "password": password
    }
    
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json=payload,
        headers=HEADERS
    )
    
    print_response(response, "Login Response")
    
    if response.status_code == 200:
        data = response.json()
        return {
            "token": data.get("accessToken"),
            "user_id": data.get("user", {}).get("id")
        }
    return None


def create_constituency(token):
    """Create a constituency"""
    print("Creating Constituency...")
    
    payload = {
        "constituencyCode": "CONS-DEMO-001",
        "name": "Demo Central District",
        "district": "Metropolitan",
        "state": "Demo State"
    }
    
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    response = requests.post(
        f"{BASE_URL}/api/users/constituencies",
        json=payload,
        headers=headers
    )
    
    print_response(response, "Constituency Created")
    
    if response.status_code == 200:
        return response.json().get("id")
    return None


def create_grievance_category(token):
    """Create grievance category"""
    print("Creating Grievance Category...")
    
    payload = {
        "name": "Road Infrastructure",
        "description": "Issues related to roads, potholes, and street maintenance"
    }
    
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    response = requests.post(
        f"{BASE_URL}/api/grievances/categories",
        json=payload,
        headers=headers
    )
    
    print_response(response, "Category Created")
    
    if response.status_code == 200:
        return response.json().get("id")
    return None


def create_grievance(token, citizen_id, category_id, constituency_id):
    """Create a grievance"""
    print("Creating Grievance...")
    
    payload = {
        "citizenId": citizen_id,
        "categoryId": category_id,
        "description": "Large pothole on Main Street affecting traffic and vehicle safety",
        "address": "123 Main Street, Downtown Area",
        "constituencyId": constituency_id,
        "priority": "HIGH",
        "gpsLocation": {
            "type": "Point",
            "coordinates": [77.5946, 12.9716]
        }
    }
    
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    response = requests.post(
        f"{BASE_URL}/api/grievances/",
        json=payload,
        headers=headers
    )
    
    print_response(response, "Grievance Created")
    
    if response.status_code == 200:
        data = response.json()
        return {
            "id": data.get("id"),
            "complaint_number": data.get("complaintNumber")
        }
    return None


def get_grievance(token, grievance_id):
    """Get grievance details"""
    print(f"Getting Grievance: {grievance_id}")
    
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/api/grievances/{grievance_id}",
        headers=headers
    )
    
    print_response(response, "Grievance Details")
    return response.json() if response.status_code == 200 else None


def list_grievances(token, status=None):
    """List grievances with optional filters"""
    print(f"Listing Grievances (status: {status})...")
    
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    params = {"page": 1, "per_page": 5}
    
    if status:
        params["status"] = status
    
    response = requests.get(
        f"{BASE_URL}/api/grievances/",
        headers=headers,
        params=params
    )
    
    print_response(response, "Grievance List")
    return response.json() if response.status_code == 200 else None


def assign_grievance(token, grievance_id, officer_id):
    """Assign grievance to officer"""
    print(f"Assigning Grievance {grievance_id} to Officer {officer_id}")
    
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    response = requests.post(
        f"{BASE_URL}/api/grievances/{grievance_id}/assign/{officer_id}",
        headers=headers
    )
    
    print_response(response, "Assignment Result")
    return response.status_code == 200


def update_grievance(token, grievance_id, status, remarks=None):
    """Update grievance status"""
    print(f"Updating Grievance {grievance_id} to {status}")
    
    payload = {
        "status": status,
        "remarks": remarks or f"Status updated to {status}"
    }
    
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    response = requests.put(
        f"{BASE_URL}/api/grievances/{grievance_id}",
        json=payload,
        headers=headers
    )
    
    print_response(response, "Update Result")
    return response.status_code == 200


def add_grievance_feedback(token, grievance_id):
    """Add feedback to grievance"""
    print(f"Adding Feedback to Grievance {grievance_id}")
    
    payload = {
        "rating": 4,
        "comments": "Work completed satisfactorily. Good quality repair done."
    }
    
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    response = requests.post(
        f"{BASE_URL}/api/grievances/{grievance_id}/feedback",
        json=payload,
        headers=headers
    )
    
    print_response(response, "Feedback Added")
    return response.status_code == 200


def create_alert(token, citizen_id):
    """Create an alert"""
    print("Creating Alert...")
    
    payload = {
        "citizenId": citizen_id,
        "alertType": "EMERGENCY",
        "priority": "CRITICAL",
        "description": "Accident near Main Street intersection - immediate help needed",
        "location": {
            "type": "Point",
            "coordinates": [77.5946, 12.9716]
        }
    }
    
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    response = requests.post(
        f"{BASE_URL}/api/alerts/",
        json=payload,
        headers=headers
    )
    
    print_response(response, "Alert Created")
    
    if response.status_code == 200:
        data = response.json()
        return {
            "id": data.get("id"),
            "alert_number": data.get("alertNumber")
        }
    return None


def get_alert(token, alert_id):
    """Get alert details"""
    print(f"Getting Alert: {alert_id}")
    
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/api/alerts/{alert_id}",
        headers=headers
    )
    
    print_response(response, "Alert Details")
    return response.json() if response.status_code == 200 else None


def list_alerts(token, status=None, priority=None):
    """List alerts with optional filters"""
    print(f"Listing Alerts (status: {status}, priority: {priority})...")
    
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    params = {"page": 1, "per_page": 5}
    
    if status:
        params["status"] = status
    if priority:
        params["priority"] = priority
    
    response = requests.get(
        f"{BASE_URL}/api/alerts/",
        headers=headers,
        params=params
    )
    
    print_response(response, "Alert List")
    return response.json() if response.status_code == 200 else None


def update_alert(token, alert_id, status):
    """Update alert status"""
    print(f"Updating Alert {alert_id} to {status}")
    
    payload = {"status": status}
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    response = requests.put(
        f"{BASE_URL}/api/alerts/{alert_id}",
        json=payload,
        headers=headers
    )
    
    print_response(response, "Alert Update Result")
    return response.status_code == 200


def assign_alert(token, alert_id, officer_id):
    """Assign alert to officer"""
    print(f"Assigning Alert {alert_id} to Officer {officer_id}")
    
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    response = requests.post(
        f"{BASE_URL}/api/alerts/{alert_id}/assign/{officer_id}",
        headers=headers
    )
    
    print_response(response, "Alert Assignment Result")
    return response.status_code == 200


def create_event(token, organizer_id, constituency_id):
    """Create an event"""
    print("Creating Event...")
    
    payload = {
        "organizerId": organizer_id,
        "title": "Citizens Awareness Program - Grievance Filing",
        "description": "Program to raise awareness on how to file grievances effectively",
        "eventDate": "2026-06-15T10:00:00",
        "location": "Community Center, Downtown",
        "eventType": "AWARENESS",
        "expectedAttendees": 100,
        "constituencyId": constituency_id,
        "gpsLocation": {
            "type": "Point",
            "coordinates": [77.5946, 12.9716]
        }
    }
    
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    response = requests.post(
        f"{BASE_URL}/api/events/",
        json=payload,
        headers=headers
    )
    
    print_response(response, "Event Created")
    
    if response.status_code == 200:
        data = response.json()
        return data.get("id")
    return None


def get_event(token, event_id):
    """Get event details"""
    print(f"Getting Event: {event_id}")
    
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/api/events/{event_id}",
        headers=headers
    )
    
    print_response(response, "Event Details")
    return response.json() if response.status_code == 200 else None


def list_events(token):
    """List all events"""
    print("Listing Events...")
    
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/api/events/",
        headers=headers,
        params={"page": 1, "per_page": 5}
    )
    
    print_response(response, "Events List")
    return response.json() if response.status_code == 200 else None


def register_event(token, citizen_id, event_id):
    """Register for event"""
    print(f"Registering for Event: {event_id}")
    
    payload = {
        "citizenId": citizen_id,
        "numberOfTickets": 2
    }
    
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    response = requests.post(
        f"{BASE_URL}/api/events/{event_id}/register",
        json=payload,
        headers=headers
    )
    
    print_response(response, "Event Registration Result")
    return response.status_code == 200


def create_task(token, grievance_id, assigned_to):
    """Create a task"""
    print("Creating Task...")
    
    payload = {
        "grievanceId": grievance_id,
        "title": "Repair Main Street Pothole",
        "description": "Fill pothole with asphalt and compact properly",
        "assignedTo": assigned_to,
        "priority": "HIGH",
        "dueDate": "2026-06-10T17:00:00"
    }
    
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    response = requests.post(
        f"{BASE_URL}/api/tasks/",
        json=payload,
        headers=headers
    )
    
    print_response(response, "Task Created")
    
    if response.status_code == 200:
        return response.json().get("id")
    return None


def get_dashboard_stats(token):
    """Get dashboard statistics"""
    print("Getting Dashboard Statistics...")
    
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/api/dashboard/stats",
        headers=headers
    )
    
    print_response(response, "Dashboard Stats")
    return response.json() if response.status_code == 200 else None


# ============================================
# MAIN WORKFLOW
# ============================================

def main():
    print_section("CRM SYSTEM - COMPLETE WORKFLOW DEMO")
    
    try:
        # 1. Register Users
        print_section("1. USER REGISTRATION")
        
        citizen_data = register_user(
            "Rajesh Kumar",
            "9876543210",
            f"rajesh{__import__('time').time()}@example.com",
            "CitizenPass123@",
            "CITIZEN"
        )
        
        manager_data = register_user(
            "Manager Singh",
            "9876543211",
            f"manager{__import__('time').time()}@example.com",
            "ManagerPass123@",
            "MANAGER"
        )
        
        officer_data = register_user(
            "Officer Priya",
            "9876543212",
            f"officer{__import__('time').time()}@example.com",
            "OfficerPass123@",
            "FIELD_OFFICER"
        )
        
        rep_data = register_user(
            "Representative Amit",
            "9876543213",
            f"rep{__import__('time').time()}@example.com",
            "RepPass123@",
            "REPRESENTATIVE"
        )
        
        if not all([citizen_data, manager_data, officer_data, rep_data]):
            print("Failed to register users!")
            return
        
        # Extract tokens and IDs
        citizen_token = citizen_data["token"]
        manager_token = manager_data["token"]
        officer_token = officer_data["token"]
        rep_token = rep_data["token"]
        
        citizen_id = citizen_data["user_id"]
        manager_id = manager_data["user_id"]
        officer_id = officer_data["user_id"]
        rep_id = rep_data["user_id"]
        
        # 2. Create Constituency
        print_section("2. CREATE CONSTITUENCY")
        constituency_id = create_constituency(manager_token)
        
        if not constituency_id:
            print("Failed to create constituency!")
            return
        
        # 3. Create Grievance Category
        print_section("3. CREATE GRIEVANCE CATEGORY")
        category_id = create_grievance_category(manager_token)
        
        if not category_id:
            print("Failed to create category!")
            return
        
        # 4. Citizen Creates Grievance
        print_section("4. CITIZEN CREATES GRIEVANCE")
        grievance = create_grievance(
            citizen_token,
            citizen_id,
            category_id,
            constituency_id
        )
        
        if not grievance:
            print("Failed to create grievance!")
            return
        
        grievance_id = grievance["id"]
        
        # 5. Get Grievance Details
        print_section("5. GET GRIEVANCE DETAILS")
        get_grievance(citizen_token, grievance_id)
        
        # 6. List Grievances
        print_section("6. LIST GRIEVANCES")
        list_grievances(manager_token, status="NEW")
        
        # 7. Manager Assigns to Officer
        print_section("7. ASSIGN GRIEVANCE TO OFFICER")
        assign_grievance(manager_token, grievance_id, officer_id)
        
        # 8. Officer Updates Status
        print_section("8. OFFICER UPDATES GRIEVANCE STATUS")
        update_grievance(
            officer_token,
            grievance_id,
            "IN_PROGRESS",
            "Repair work started on Main Street"
        )
        
        # 9. Officer Completes Task
        print_section("9. OFFICER COMPLETES WORK")
        update_grievance(
            officer_token,
            grievance_id,
            "RESOLVED",
            "Pothole filled and compacted"
        )
        
        # 10. Citizen Provides Feedback
        print_section("10. CITIZEN PROVIDES FEEDBACK")
        add_grievance_feedback(citizen_token, grievance_id)
        
        # 11. Create Alert
        print_section("11. CREATE ALERT")
        alert = create_alert(citizen_token, citizen_id)
        
        if alert:
            alert_id = alert["id"]
            
            # 12. Get Alert Details
            print_section("12. GET ALERT DETAILS")
            get_alert(manager_token, alert_id)
            
            # 13. List Alerts
            print_section("13. LIST ALERTS")
            list_alerts(manager_token, status="OPEN", priority="CRITICAL")
            
            # 14. Assign Alert to Officer
            print_section("14. ASSIGN ALERT TO OFFICER")
            assign_alert(manager_token, alert_id, officer_id)
            
            # 15. Update Alert Status
            print_section("15. UPDATE ALERT STATUS")
            update_alert(officer_token, alert_id, "RESOLVED")
        
        # 16. Create Event
        print_section("16. CREATE EVENT")
        event_id = create_event(rep_token, rep_id, constituency_id)
        
        if event_id:
            # 17. Get Event Details
            print_section("17. GET EVENT DETAILS")
            get_event(rep_token, event_id)
            
            # 18. List Events
            print_section("18. LIST EVENTS")
            list_events(manager_token)
            
            # 19. Register for Event
            print_section("19. REGISTER FOR EVENT")
            register_event(citizen_token, citizen_id, event_id)
        
        # 20. Create Task
        print_section("20. CREATE TASK")
        task_id = create_task(manager_token, grievance_id, officer_id)
        
        # 21. Get Dashboard Stats
        print_section("21. GET DASHBOARD STATISTICS")
        get_dashboard_stats(manager_token)
        
        print_section("WORKFLOW COMPLETED SUCCESSFULLY!")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
