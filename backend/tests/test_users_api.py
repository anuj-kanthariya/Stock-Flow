import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import User

@pytest.mark.asyncio
async def test_get_current_profile(authenticated_client: AsyncClient, test_user: User):
    res = await authenticated_client.get("/api/v1/users/me")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == str(test_user.id)
    assert data["name"] == test_user.name

@pytest.mark.asyncio
async def test_update_current_profile(authenticated_client: AsyncClient, test_user: User, db_session: AsyncSession):
    res = await authenticated_client.patch(
        "/api/v1/users/me",
        json={
            "company_name": "Acme Corp",
            "phone": "9876543210",
            "business_address": "456 Market St"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["company_name"] == "Acme Corp"
    assert data["phone"] == "9876543210"
    assert data["business_address"] == "456 Market St"
    assert data["profile_completed"] is True

    # Verify db update
    db_res = await db_session.execute(select(User).where(User.id == test_user.id))
    updated_user = db_res.scalar_one()
    assert updated_user.company_name == "Acme Corp"
    assert updated_user.profile_completed is True

@pytest.mark.asyncio
async def test_unauthenticated_request_to_me(test_client):
    # Assuming test_client is the unauthenticated client fixture if available,
    # otherwise we can just use httpx.AsyncClient directly.
    # We will import the app and use it.
    from app.main import app
    async with AsyncClient(app=app, base_url="http://test") as ac:
        res = await ac.get("/api/v1/users/me")
        assert res.status_code == 401
