from unittest.mock import MagicMock, patch

from src.database import LookupDatabase


def test_connect_does_not_force_tls_for_local_mongodb():
    mock_client = MagicMock()
    mock_client.__getitem__.return_value = object()
    mock_client.admin.command.return_value = None

    with patch("src.database.MongoClient", return_value=mock_client) as mongo_client_cls, patch.object(LookupDatabase, "_create_indexes") as create_indexes:
        LookupDatabase.connect("mongodb://localhost:27017", "master_lookup")

    kwargs = mongo_client_cls.call_args.kwargs
    assert "tlsCAFile" not in kwargs
    create_indexes.assert_called_once()
