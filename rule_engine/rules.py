"""Rules for evaluating incoming IoT telemetry readings."""

from collections.abc import Mapping
from copy import deepcopy
from math import isfinite

from .thresholds import (
    SENSOR_THRESHOLDS,
    get_threshold,
    get_thresholds,
    set_threshold,
)


NORMAL = "NORMAL"
ABNORMAL = "ABNORMAL"

# Numeric rule entries reuse the threshold configuration instead of copying it.
RULE_DEFINITIONS = {
    "temperature": SENSOR_THRESHOLDS["temperature"],
    "humidity": SENSOR_THRESHOLDS["humidity"],
    "device_status": {
        "normal_values": ("online", "active", "connected"),
        "abnormal_values": ("offline", "error", "maintenance"),
        "condition": "normal when device_status is online, active, or connected",
    },
}


def get_rules():
    """Return all rule definitions without exposing the internal dictionary."""
    return deepcopy(RULE_DEFINITIONS)


def get_rule(parameter):
    """Return the rule definition for an IoT parameter.

    Raises:
        KeyError: if the parameter does not have a rule definition.
    """
    if not isinstance(parameter, str):
        raise KeyError("Parameter name must be a string")

    name = parameter.lower()
    if name not in RULE_DEFINITIONS:
        raise KeyError("Unknown rule parameter: {}".format(parameter))
    if name in SENSOR_THRESHOLDS:
        return get_threshold(name)
    return deepcopy(RULE_DEFINITIONS[name])


def evaluate_reading(parameter, value):
    """Evaluate one reading and return its status, value, and explanation.

    A missing value or an invalid value is ABNORMAL and includes a reason.
    """
    rule = get_rule(parameter)
    name = parameter.lower()

    if value is None:
        return {"status": ABNORMAL, "value": value, "reason": "missing value"}

    if name == "device_status":
        if not isinstance(value, str):
            return {"status": ABNORMAL, "value": value, "reason": "invalid value"}

        normalized_value = value.strip().lower()
        if normalized_value in rule["normal_values"]:
            return {"status": NORMAL, "value": value, "reason": "recognized normal status"}
        if normalized_value in rule["abnormal_values"]:
            return {"status": ABNORMAL, "value": value, "reason": "recognized abnormal status"}
        return {"status": ABNORMAL, "value": value, "reason": "invalid device status"}

    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return {"status": ABNORMAL, "value": value, "reason": "invalid numeric value"}
    if isinstance(value, float) and not isfinite(value):
        return {"status": ABNORMAL, "value": value, "reason": "invalid numeric value"}

    if rule["min"] <= value <= rule["max"]:
        return {"status": NORMAL, "value": value, "reason": "within configured threshold"}
    return {"status": ABNORMAL, "value": value, "reason": "outside configured threshold"}


def check_rule(parameter, value):
    """Return True when a reading is NORMAL, preserving the original API."""
    return evaluate_reading(parameter, value)["status"] == NORMAL


def evaluate_telemetry(telemetry):
    """Evaluate only the supported parameters present in telemetry data.

    The input is expected to be a mapping such as
    ``{"temperature": 24.5, "humidity": 55, "device_status": "online"}``.
    A supported key with a None value is reported as missing and ABNORMAL.
    """
    if not isinstance(telemetry, Mapping):
        raise TypeError("telemetry must be a mapping")

    results = {}
    for parameter, value in telemetry.items():
        if isinstance(parameter, str) and parameter.lower() in RULE_DEFINITIONS:
            name = parameter.lower()
            result = evaluate_reading(name, value)
            results[name] = dict(result, normal=result["status"] == NORMAL)
    return results


def update_numeric_threshold(parameter, minimum=None, maximum=None):
    """Update the lower and/or upper threshold for a numeric sensor rule."""
    rule = get_rule(parameter)
    if "min" not in rule or "max" not in rule:
        raise ValueError("{} is not a numeric rule".format(parameter))
    return set_threshold(parameter, minimum, maximum)


__all__ = [
    "RULE_DEFINITIONS",
    "NORMAL",
    "ABNORMAL",
    "get_rules",
    "get_rule",
    "get_threshold",
    "get_thresholds",
    "check_rule",
    "evaluate_reading",
    "evaluate_telemetry",
    "update_numeric_threshold",
]
