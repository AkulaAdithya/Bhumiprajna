"""
Bhumi Prajna - Database Seed Data
Creates demo accounts, stage definitions, and geographic reference data.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.stage import StageDefinition, DEFAULT_STAGES
from app.models.geography import State, District


# Representative Indian states and districts for the prototype
SEED_STATES = [
    {"name": "Maharashtra", "code": "MH", "latitude": 19.7515, "longitude": 75.7139},
    {"name": "Tamil Nadu", "code": "TN", "latitude": 11.1271, "longitude": 78.6569},
    {"name": "Karnataka", "code": "KA", "latitude": 15.3173, "longitude": 75.7139},
    {"name": "Uttar Pradesh", "code": "UP", "latitude": 26.8467, "longitude": 80.9462},
    {"name": "Gujarat", "code": "GJ", "latitude": 22.2587, "longitude": 71.1924},
    {"name": "Rajasthan", "code": "RJ", "latitude": 27.0238, "longitude": 74.2179},
    {"name": "Madhya Pradesh", "code": "MP", "latitude": 22.9734, "longitude": 78.6569},
    {"name": "West Bengal", "code": "WB", "latitude": 22.9868, "longitude": 87.8550},
    {"name": "Andhra Pradesh", "code": "AP", "latitude": 15.9129, "longitude": 79.7400},
    {"name": "Telangana", "code": "TS", "latitude": 18.1124, "longitude": 79.0193},
    {"name": "Kerala", "code": "KL", "latitude": 10.8505, "longitude": 76.2711},
    {"name": "Odisha", "code": "OR", "latitude": 20.9517, "longitude": 85.0985},
    {"name": "Punjab", "code": "PB", "latitude": 31.1471, "longitude": 75.3412},
    {"name": "Haryana", "code": "HR", "latitude": 29.0588, "longitude": 76.0856},
    {"name": "Bihar", "code": "BR", "latitude": 25.0961, "longitude": 85.3131},
    {"name": "Jharkhand", "code": "JH", "latitude": 23.6102, "longitude": 85.2799},
    {"name": "Chhattisgarh", "code": "CG", "latitude": 21.2787, "longitude": 81.8661},
    {"name": "Assam", "code": "AS", "latitude": 26.2006, "longitude": 92.9376},
    {"name": "Delhi", "code": "DL", "latitude": 28.7041, "longitude": 77.1025},
    {"name": "Goa", "code": "GA", "latitude": 15.2993, "longitude": 74.1240},
]

SEED_DISTRICTS = [
    # Maharashtra
    {"name": "Pune", "state_name": "Maharashtra", "state_code": "MH", "latitude": 18.5204, "longitude": 73.8567},
    {"name": "Mumbai", "state_name": "Maharashtra", "state_code": "MH", "latitude": 19.0760, "longitude": 72.8777},
    {"name": "Nagpur", "state_name": "Maharashtra", "state_code": "MH", "latitude": 21.1458, "longitude": 79.0882},
    {"name": "Nashik", "state_name": "Maharashtra", "state_code": "MH", "latitude": 19.9975, "longitude": 73.7898},
    {"name": "Thane", "state_name": "Maharashtra", "state_code": "MH", "latitude": 19.2183, "longitude": 72.9781},
    # Tamil Nadu
    {"name": "Chennai", "state_name": "Tamil Nadu", "state_code": "TN", "latitude": 13.0827, "longitude": 80.2707},
    {"name": "Coimbatore", "state_name": "Tamil Nadu", "state_code": "TN", "latitude": 11.0168, "longitude": 76.9558},
    {"name": "Madurai", "state_name": "Tamil Nadu", "state_code": "TN", "latitude": 9.9252, "longitude": 78.1198},
    # Karnataka
    {"name": "Bengaluru Urban", "state_name": "Karnataka", "state_code": "KA", "latitude": 12.9716, "longitude": 77.5946},
    {"name": "Mysuru", "state_name": "Karnataka", "state_code": "KA", "latitude": 12.2958, "longitude": 76.6394},
    {"name": "Hubli-Dharwad", "state_name": "Karnataka", "state_code": "KA", "latitude": 15.3647, "longitude": 75.1240},
    # Uttar Pradesh
    {"name": "Lucknow", "state_name": "Uttar Pradesh", "state_code": "UP", "latitude": 26.8467, "longitude": 80.9462},
    {"name": "Noida", "state_name": "Uttar Pradesh", "state_code": "UP", "latitude": 28.5355, "longitude": 77.3910},
    {"name": "Varanasi", "state_name": "Uttar Pradesh", "state_code": "UP", "latitude": 25.3176, "longitude": 82.9739},
    # Gujarat
    {"name": "Ahmedabad", "state_name": "Gujarat", "state_code": "GJ", "latitude": 23.0225, "longitude": 72.5714},
    {"name": "Surat", "state_name": "Gujarat", "state_code": "GJ", "latitude": 21.1702, "longitude": 72.8311},
    {"name": "Vadodara", "state_name": "Gujarat", "state_code": "GJ", "latitude": 22.3072, "longitude": 73.1812},
    # Rajasthan
    {"name": "Jaipur", "state_name": "Rajasthan", "state_code": "RJ", "latitude": 26.9124, "longitude": 75.7873},
    {"name": "Jodhpur", "state_name": "Rajasthan", "state_code": "RJ", "latitude": 26.2389, "longitude": 73.0243},
    # Madhya Pradesh
    {"name": "Bhopal", "state_name": "Madhya Pradesh", "state_code": "MP", "latitude": 23.2599, "longitude": 77.4126},
    {"name": "Indore", "state_name": "Madhya Pradesh", "state_code": "MP", "latitude": 22.7196, "longitude": 75.8577},
    # West Bengal
    {"name": "Kolkata", "state_name": "West Bengal", "state_code": "WB", "latitude": 22.5726, "longitude": 88.3639},
    # Andhra Pradesh
    {"name": "Visakhapatnam", "state_name": "Andhra Pradesh", "state_code": "AP", "latitude": 17.6868, "longitude": 83.2185},
    # Telangana
    {"name": "Hyderabad", "state_name": "Telangana", "state_code": "TS", "latitude": 17.3850, "longitude": 78.4867},
    {"name": "Warangal", "state_name": "Telangana", "state_code": "TS", "latitude": 17.9784, "longitude": 79.5941},
    # Kerala
    {"name": "Thiruvananthapuram", "state_name": "Kerala", "state_code": "KL", "latitude": 8.5241, "longitude": 76.9366},
    {"name": "Kochi", "state_name": "Kerala", "state_code": "KL", "latitude": 9.9312, "longitude": 76.2673},
    # Delhi
    {"name": "New Delhi", "state_name": "Delhi", "state_code": "DL", "latitude": 28.6139, "longitude": 77.2090},
    # Bihar
    {"name": "Patna", "state_name": "Bihar", "state_code": "BR", "latitude": 25.6093, "longitude": 85.1376},
    # Jharkhand
    {"name": "Ranchi", "state_name": "Jharkhand", "state_code": "JH", "latitude": 23.3441, "longitude": 85.3096},
]


async def seed_database(db: AsyncSession):
    """Seed the database with initial data. Idempotent — skips if data exists."""

    # 1. Seed admin user
    result = await db.execute(select(User).where(User.email == settings.ADMIN_EMAIL))
    if not result.scalar_one_or_none():
        admin = User(
            email=settings.ADMIN_EMAIL,
            password_hash=hash_password(settings.ADMIN_PASSWORD),
            full_name="System Administrator",
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin)

    # 2. Seed demo officers
    demo_officers = [
        {
            "email": "central@pravaah.gov.in",
            "full_name": "Dr. Rajesh Kumar (Central)",
            "role": UserRole.CENTRAL_OFFICER,
            "state": None,
            "district": None,
        },
        {
            "email": "state.mh@pravaah.gov.in",
            "full_name": "Smt. Anjali Deshmukh (Maharashtra)",
            "role": UserRole.STATE_OFFICER,
            "state": "Maharashtra",
            "district": None,
        },
        {
            "email": "district.pune@pravaah.gov.in",
            "full_name": "Shri. Vikram Patil (Pune)",
            "role": UserRole.DISTRICT_OFFICER,
            "state": "Maharashtra",
            "district": "Pune",
        },
    ]

    for officer_data in demo_officers:
        result = await db.execute(select(User).where(User.email == officer_data["email"]))
        if not result.scalar_one_or_none():
            officer = User(
                email=officer_data["email"],
                password_hash=hash_password("Pravaah@2026"),
                full_name=officer_data["full_name"],
                role=officer_data["role"],
                state=officer_data["state"],
                district=officer_data["district"],
                is_active=True,
            )
            db.add(officer)

    # 3. Seed stage definitions
    result = await db.execute(select(StageDefinition).limit(1))
    if not result.scalar_one_or_none():
        for stage_data in DEFAULT_STAGES:
            stage = StageDefinition(
                name=stage_data["name"],
                stage_order=stage_data["order"],
                description=stage_data["description"],
            )
            db.add(stage)

    # 4. Seed states
    result = await db.execute(select(State).limit(1))
    if not result.scalar_one_or_none():
        for s in SEED_STATES:
            db.add(State(**s))

    # 5. Seed districts
    result = await db.execute(select(District).limit(1))
    if not result.scalar_one_or_none():
        for d in SEED_DISTRICTS:
            db.add(District(**d))

    await db.commit()
