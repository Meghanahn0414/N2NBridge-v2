import certifi, ssl
from pymongo import MongoClient
url = 'mongodb+srv://fatimakonnur_db_user:Fatima%40123456@cluster0.bs3kfwl.mongodb.net/crm_database?retryWrites=true&w=majority&tls=true'
print('URL', url)
for opts in [
    {'tls': True, 'tlsCAFile': certifi.where(), 'tlsVersion': ssl.PROTOCOL_TLSv1_2},
    {'tls': True, 'tlsCAFile': certifi.where(), 'tlsVersion': ssl.PROTOCOL_TLS_CLIENT},
    {'tls': True, 'tlsCAFile': certifi.where(), 'tlsVersion': ssl.PROTOCOL_TLSv1_3},
]:
    try:
        print('TRY', opts)
        client = MongoClient(url, serverSelectionTimeoutMS=5000, connectTimeoutMS=10000, socketTimeoutMS=30000, **opts)
        print('PING', client.admin.command('ping'))
    except Exception as e:
        print('ERR', type(e).__name__, e)
