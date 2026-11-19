"""Configurable threshold values for IoT sensor monitoring."""

from copy import deepcopy
from math import isfinite


# These demo defaults match the values and units documented for this project.
SENSOR_THRESHOLDS = {
    "temperature": {
        "min": 0.0,
        "max": 50.0,
        "unit": "C",
        "condition": "normal when 0.0 <= temperature <= 50.0",
    },
    "humidity": {
        "min": 30.0,
        "max": 70.0,
        "unit": "%",
        "condition": "normal when 30.0 <= humidity <= 70.0",
    },
}


def get_threshold(sensor):
    """Return a copy of one sensor's threshold configuration.

    Raises KeyError when the sensor has no numeric threshold configuration.
    """
    if not isinstance(sensor, str):
        raise KeyError("Sensor name must be a string")

    name = sensor.lower()
    if name not in SENSOR_THRESHOLDS:
        raise KeyError("Unknown threshold sensor: {}".format(sensor))
    return deepcopy(SENSOR_THRESHOLDS[name])


def get_thresholds():
    """Return copies of all configured sensor thresholds."""
    return deepcopy(SENSOR_THRESHOLDS)


def set_threshold(sensor, minimum=None, maximum=None):
    """Update a sensor's minimum and/or maximum threshold."""
    current = get_threshold(sensor)
    name = sensor.lower()
    new_minimum = current["min"] if minimum is None else minimum
    new_maximum = current["max"] if maximum is None else maximum

    if isinstance(new_minimum, bool) or not isinstance(new_minimum, (int, float)):
        raise TypeError("minimum must be a number")
    if isinstance(new_maximum, bool) or not isinstance(new_maximum, (int, float)):
        raise TypeError("maximum must be a number")
    try:
        new_minimum = float(new_minimum)
        new_maximum = float(new_maximum)
    except OverflowError as error:
        raise ValueError("thresholds must be finite numbers") from error
    if not isfinite(new_minimum) or not isfinite(new_maximum):
        raise ValueError("thresholds must be finite numbers")
    if new_minimum > new_maximum:
        raise ValueError("minimum threshold cannot exceed maximum threshold")

    SENSOR_THRESHOLDS[name]["min"] = new_minimum
    SENSOR_THRESHOLDS[name]["max"] = new_maximum
    SENSOR_THRESHOLDS[name]["condition"] = (
        "normal when {} <= {} <= {}".format(new_minimum, name, new_maximum)
    )
    return get_threshold(name)


__all__ = ["SENSOR_THRESHOLDS", "get_threshold", "get_thresholds", "set_threshold"]
