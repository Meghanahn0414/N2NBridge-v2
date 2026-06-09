import sys  
sys.path.insert(0, 'D:/CRM-01/Backend/src')  
import lookups.routes as lr  
print([route.path for route in lr.router.routes])  
