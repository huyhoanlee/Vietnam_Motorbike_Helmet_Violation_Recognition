# from sqlalchemy_searchable import make_searchable, search
import logging
import math
from collections import namedtuple
from typing import Any, Iterable, List

from fastapi import Depends, HTTPException, Query, status
from pydantic.types import Json, constr
from six import string_types
from sqlalchemy import and_, create_engine, not_, or_, orm
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy_filters import apply_filters, apply_pagination, apply_sort
from sqlalchemy_filters.exceptions import BadFilterFormat
from starlette.requests import Request


log = logging.getLogger(__name__)
engine = create_engine(
    str("postgresql://postgres:tungns35@localhost:5433/API"),
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


def insert_row(db_session, obj_table):
    """
    insert table common
    """
    # try:
    db_session.add(obj_table)
    db_session.commit()
    db_session.refresh(obj_table)
    return obj_table
