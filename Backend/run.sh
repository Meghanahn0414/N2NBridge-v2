#!/bin/bash
# CRM Grievance Management System - Unix Run Script
# This script starts the FastAPI application

cd src
echo "Starting CRM Grievance Management System..."
echo "API will be available at: http://localhost:8000"
echo "API Documentation at: http://localhost:8000/api/docs"
echo ""
python main.py
