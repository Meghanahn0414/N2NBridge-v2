import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.base import Base


class Citizen(Base):
    __tablename__ = "citizens"
    __table_args__ = (UniqueConstraint("mobile", "tenant_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID, index=True)
    mobile: Mapped[str] = mapped_column(String(20))
    name: Mapped[str | None] = mapped_column(String(120))
    consent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now()
    )

    cases: Mapped[list["Case"]] = relationship(back_populates="citizen")


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID, index=True)
    citizen_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("citizens.id"), index=True)
    ref: Mapped[str] = mapped_column(String(20), index=True)
    category: Mapped[str] = mapped_column(String(60))
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text)
    ward: Mapped[str | None] = mapped_column(String(60))
    status: Mapped[str] = mapped_column(String(20), default="new")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now()
    )

    citizen: Mapped["Citizen"] = relationship(back_populates="cases")
    timeline: Mapped[list["CaseEvent"]] = relationship(back_populates="case")


class CaseEvent(Base):
    __tablename__ = "case_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID, index=True)
    case_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cases.id"), index=True)
    kind: Mapped[str] = mapped_column(String(40))
    detail: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now()
    )

    case: Mapped["Case"] = relationship(back_populates="timeline")
