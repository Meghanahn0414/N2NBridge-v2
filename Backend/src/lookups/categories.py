"""
Static lookup data for representative-specific grievance categories and responsibilities.
"""

COUNCILLOR_CATEGORIES = [
    {"value": "ROADS_POTHOLES", "label": "Roads & Potholes", "description": "Potholes, damaged internal roads, missing speed breakers"},
    {"value": "STREET_LIGHTS", "label": "Street Lights", "description": "Non-functional lights, new light requests, dim lighting"},
    {"value": "GARBAGE_WASTE_MANAGEMENT", "label": "Garbage & Waste Management", "description": "Missed garbage collection, overflowing bins, illegal dumping"},
    {"value": "WATER_SUPPLY", "label": "Water Supply", "description": "Low pressure, leakage, irregular supply, public taps"},
    {"value": "DRAINAGE_SEWAGE", "label": "Drainage & Sewage", "description": "Blocked drains, sewage overflow, waterlogging"},
    {"value": "CLEANLINESS_SANITATION", "label": "Cleanliness & Sanitation", "description": "Unclean streets, public toilets, mosquito breeding"},
    {"value": "PARKS_PLAYGROUNDS", "label": "Parks & Playgrounds", "description": "Poor maintenance, damaged equipment, cleanliness"},
    {"value": "FOOTPATHS_PAVEMENTS", "label": "Footpaths & Pavements", "description": "Broken footpaths, encroachments, accessibility issues"},
    {"value": "PUBLIC_TOILETS", "label": "Public Toilets", "description": "Lack of toilets, maintenance, cleanliness"},
    {"value": "TREES_GREENERY", "label": "Trees & Greenery", "description": "Tree trimming, fallen trees, plantation requests"},
    {"value": "STRAY_ANIMALS", "label": "Stray Animals", "description": "Stray dogs, cattle, animal nuisance"},
    {"value": "ENCROACHMENTS", "label": "Encroachments", "description": "Illegal roadside encroachments affecting public spaces"},
    {"value": "COMMUNITY_FACILITIES", "label": "Community Facilities", "description": "Community halls, libraries, ward offices, crematoriums"},
    {"value": "STORMWATER_DRAINAGE", "label": "Stormwater Drainage", "description": "Flooding during rains, blocked storm drains"},
    {"value": "WARD_DEVELOPMENT_SUGGESTIONS", "label": "Ward Development Suggestions", "description": "Requests for new civic amenities or improvements"},
    {"value": "OTHER_CIVIC_ISSUES", "label": "Other Civic Issues", "description": "Any municipal issue not covered above"},
]

MLA_CATEGORIES = [
    {"value": "STATE_HIGHWAYS", "label": "State Highways", "description": "Roads and infrastructure under state highway jurisdiction"},
    {"value": "PUBLIC_SCHOOLS_HOSPITALS", "label": "Government Schools & Hospitals", "description": "State school or hospital infrastructure and services"},
    {"value": "STATE_WELFARE_SCHEMES", "label": "State Welfare Schemes", "description": "State government welfare programs and benefits"},
    {"value": "ELECTRICITY_INFRASTRUCTURE", "label": "Electricity Infrastructure", "description": "Power distribution, street lighting, and local electricity issues"},
    {"value": "STATE_TRANSPORT", "label": "State Transport", "description": "Buses, state-run transport services, and related infrastructure"},
    {"value": "LAW_POLICY_STATE", "label": "State Law & Policy", "description": "State-level policy issues, regulations, and governance"},
    {"value": "STATE_INFRASTRUCTURE", "label": "State Infrastructure", "description": "State-led public infrastructure, development and civic works"},
    {"value": "OTHER_STATE_ISSUES", "label": "Other State Issues", "description": "Any state-level issue not covered above"},
]

MP_CATEGORIES = [
    {"value": "RAILWAYS", "label": "Railways", "description": "Railway services, stations, trains, and infrastructure"},
    {"value": "NATIONAL_HIGHWAYS", "label": "National Highways", "description": "Major highways and national road infrastructure"},
    {"value": "CENTRAL_SCHEMES", "label": "Central Government Schemes", "description": "Central social welfare programs and benefit delivery"},
    {"value": "PASSPORT_IMMIGRATION", "label": "Passport & Immigration", "description": "Passport services, immigration, and related central services"},
    {"value": "INDIA_POST", "label": "India Post", "description": "Postal services, post office infrastructure, and mail delivery"},
    {"value": "TELECOMMUNICATIONS", "label": "Telecommunications", "description": "Telecom services, connectivity and network-related issues"},
    {"value": "NATIONAL_POLICY", "label": "National Policy", "description": "Central government policy and legislative matters"},
    {"value": "OTHER_NATIONAL_ISSUES", "label": "Other National Issues", "description": "Any national-level issue not covered above"},
]

REPRESENTATIVE_RESPONSIBILITIES = {
    "COUNCILLOR": [
        "Garbage collection",
        "Street lights",
        "Internal roads",
        "Drainage",
        "Water supply",
        "Parks",
        "Public toilets",
        "Cleanliness",
        "Stray animals",
        "Footpaths",
        "Ward-level development",
    ],
    "MLA": [
        "State highways",
        "Government schools and hospitals",
        "State welfare schemes",
        "Electricity policy and major infrastructure",
        "State transport",
        "Law and policy at the state level",
    ],
    "MP": [
        "Railways",
        "National Highways",
        "Central government schemes",
        "Passport and immigration",
        "India Post",
        "Telecommunications",
        "Legislative and national policy matters",
    ],
}
