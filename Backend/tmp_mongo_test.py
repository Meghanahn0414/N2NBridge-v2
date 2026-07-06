import certifi
from pymongo import MongoClient

url = 'mongodb+srv://fatimakonnur_db_user:Fatima%40123456@cluster0.bs3kfwl.mongodb.net/crm_database?retryWrites=true&w=majority&tls=true'
print('URL:', url)
for opts in [
    {},
    {'tlsCAFile': certifi.where()},
    {'tlsAllowInvalidCertificates': True},
    {'tlsCAFile': certifi.where(), 'tlsAllowInvalidCertificates': True},
    {'ssl': True, 'ssl_ca_certs': certifi.where()},
    {'tls': True, 'tlsCAFile': certifi.where(), 'tlsCertificateKeyFile': None}
]:
    try:
        print('TRY', opts)
        client = MongoClient(url, serverSelectionTimeoutMS=5000, connectTimeoutMS=10000, socketTimeoutMS=30000, **opts)
        print('PING', client.admin.command('ping'))
    except Exception as e:
        print('ERR', type(e).__name__, e)

