import copy

import pytest
from fastapi.testclient import TestClient

from src import app as app_module


_INITIAL_ACTIVITIES = copy.deepcopy(app_module.activities)


@pytest.fixture(autouse=True)
def reset_activities_state():
    """Reset in-memory activity data before and after each test."""
    app_module.activities.clear()
    app_module.activities.update(copy.deepcopy(_INITIAL_ACTIVITIES))

    yield

    app_module.activities.clear()
    app_module.activities.update(copy.deepcopy(_INITIAL_ACTIVITIES))


@pytest.fixture
def client():
    return TestClient(app_module.app)
