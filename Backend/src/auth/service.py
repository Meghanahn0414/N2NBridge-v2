"""
Authentication Service — Multi-Tenant
"""
import logging
from typing import Optional

from config.database import MongoDatabase
from config.security import SecurityManager
from users.model import TokenResponse, UserLoginRequest, UserResponse
from utils.jwt import TokenManager

logger = logging.getLogger(__name__)


class AuthService:
    """Authentication business logic"""

    @staticmethod
    def login(login_data: UserLoginRequest) -> Optional[TokenResponse]:
        """
        Login for representatives and staff.

        Flow:
          1. Look up email in master user_registry → get db_name
          2. Look up user in tenant DB → verify password
          3. Return JWT with db_name embedded
        """
        try:
            master = MongoDatabase.get_db()

            # Resolve which tenant DB this user belongs to
            registry_entry = master.user_registry.find_one({"email": login_data.email})
            if not registry_entry:
                logger.warning(f"Login: email not found in registry: {login_data.email}")
                return None

            db_name = registry_entry.get("db_name", "")
            if not db_name:
                logger.warning(f"Login: no db_name in registry for {login_data.email}")
                return None

            # Fetch user from the tenant DB
            tenant_db = MongoDatabase.get_tenant_db(db_name)
            user = tenant_db.users.find_one({"email": login_data.email, "isDeleted": {"$ne": True}})
            if not user:
                logger.warning(f"Login: user not found in tenant DB ({db_name}): {login_data.email}")
                return None

            # Verify password
            if not SecurityManager.verify_password(login_data.password, user.get("passwordHash", "")):
                logger.warning(f"Login: wrong password for {login_data.email}")
                return None

            user_id = str(user["_id"])

            # Update last login (non-fatal)
            try:
                from datetime import datetime, timezone
                tenant_db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"lastLoginAt": datetime.now(timezone.utc)}},
                )
            except Exception as e:
                logger.warning(f"Could not update lastLoginAt for {user_id}: {e}")

            token = TokenManager.create_token(user_id, user.get("role", ""), db_name)

            user_response = UserResponse(
                _id=user_id,
                fullName=user.get("fullName"),
                mobile=user.get("mobile"),
                email=user.get("email"),
                role=user.get("role"),
                constituencyId=str(user["constituencyId"]) if user.get("constituencyId") else None,
                wardId=str(user["wardId"]) if user.get("wardId") else None,
                boothNumber=user.get("boothNumber"),
                address=user.get("address"),
                profileImage=user.get("profileImage"),
                status=user.get("status", "ACTIVE"),
                lastLoginAt=user.get("lastLoginAt"),
                createdAt=user.get("createdAt"),
                updatedAt=user.get("updatedAt"),
                citizenId=user.get("citizenId"),
                age=user.get("age"),
                gender=user.get("gender"),
                title=user.get("title"),
                bio=user.get("bio"),
                officePhone=user.get("officePhone"),
                officeAddress=user.get("officeAddress"),
                showApprovalRating=user.get("showApprovalRating"),
                showResolvedCount=user.get("showResolvedCount"),
                notifPreferences=user.get("notifPreferences"),
                broadcastSignature=user.get("broadcastSignature"),
                defaultBroadcastType=user.get("defaultBroadcastType"),
            )

            return TokenResponse(accessToken=token, user=user_response)

        except Exception as e:
            logger.error(f"Login error for {login_data.email}: {e}", exc_info=True)
            raise

    @staticmethod
    def verify_token(token: str) -> Optional[dict]:
        """Verify JWT token"""
        return TokenManager.verify_token(token)

    @staticmethod
    def register_user(user_data: dict, admin_id: str) -> Optional[str]:
        """
        Kept for backward compatibility with any code that still calls this.
        New registrations should go through auth/routes.py endpoints directly.
        """
        try:
            db_name = user_data.get("db_name", "")
            if not db_name:
                logger.error("register_user: db_name is required in multi-tenant mode")
                return None

            tenant_db = MongoDatabase.get_tenant_db(db_name)

            if tenant_db.users.find_one({"email": user_data["email"]}):
                logger.warning(f"register_user: email already exists: {user_data['email']}")
                return None
            if tenant_db.users.find_one({"mobile": user_data.get("mobile")}):
                logger.warning(f"register_user: mobile already exists: {user_data.get('mobile')}")
                return None

            from datetime import datetime, timezone
            now = datetime.now(timezone.utc)
            doc = {**user_data, "isDeleted": False, "createdAt": now, "updatedAt": now}
            doc.pop("db_name", None)

            if doc.get("password"):
                doc["passwordHash"] = SecurityManager.hash_password(doc.pop("password"))

            result = tenant_db.users.insert_one(doc)
            return str(result.inserted_id)

        except Exception as e:
            logger.error(f"register_user error: {e}", exc_info=True)
            return None
