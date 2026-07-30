def test_get_activities_returns_dictionary(client):
    # Arrange
    path = "/activities"

    # Act
    response = client.get(path)

    # Assert
    assert response.status_code == 200
    assert isinstance(response.json(), dict)


def test_get_activities_has_expected_shape(client):
    # Arrange
    path = "/activities"
    required_fields = {"description", "schedule", "max_participants", "participants"}

    # Act
    response = client.get(path)
    payload = response.json()

    # Assert
    assert response.status_code == 200
    assert len(payload) == 9
    for activity_data in payload.values():
        assert required_fields.issubset(activity_data.keys())
        assert isinstance(activity_data["participants"], list)
