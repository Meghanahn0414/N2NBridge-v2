import socket, ssl, certifi
host = 'ac-qjuznoy-shard-00-00.bs3kfwl.mongodb.net'
port = 27017
print('OPENSSL', ssl.OPENSSL_VERSION)
for version_name, version in [('TLSv1_2', getattr(ssl.TLSVersion, 'TLSv1_2', None)), ('TLSv1_3', getattr(ssl.TLSVersion, 'TLSv1_3', None))]:
    if version is None:
        print('SKIP', version_name, 'not available')
        continue
    ctx = ssl.create_default_context(cafile=certifi.where())
    ctx.minimum_version = version
    ctx.maximum_version = version
    ctx.check_hostname = True
    ctx.verify_mode = ssl.CERT_REQUIRED
    print('TRY', version_name)
    try:
        with socket.create_connection((host, port), timeout=10) as sock:
            with ctx.wrap_socket(sock, server_hostname=host) as ssock:
                print('OK', version_name, ssock.version(), ssock.cipher(), ssock.getpeercert())
    except Exception as e:
        print('ERR', version_name, type(e).__name__, e)
