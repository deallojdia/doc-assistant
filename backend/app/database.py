from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

#krijon modelet e db
class Base(DeclarativeBase):
    pass

#krijon nje sesion per 1 kerkese dhe ia jep routerit
async def get_db():
    async with async_session() as session:
        yield session
