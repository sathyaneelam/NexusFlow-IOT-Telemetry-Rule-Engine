"""Initial rule definitions for monitoring IoT telemetry."""

from copy import deepcopy


# Thresholds are centralized here so they can be changed without modifying
# the functions that evaluate telemetry values.
RULE_DEFINITIONS = {
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
    return deepcopy(RULE_DEFINITIONS[name])


def check_rule(parameter, value):
    """Check whether a telemetry value satisfies its rule.

    Returns True for normal values and False for abnormal values.
    """
    rule = get_rule(parameter)

    if parameter.lower() == "device_status":
        if not isinstance(value, str):
            return False
        return value.strip().lower() in rule["normal_values"]

    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return False
    return rule["min"] <= value <= rule["max"]


def evaluate_telemetry(telemetry):
    """Evaluate only the supported parameters present in telemetry data.

    The input is expected to be a mapping such as
    ``{"temperature": 24.5, "humidity": 55, "device_status": "online"}``.
    """
    if not hasattr(telemetry, "items"):
        raise TypeError("telemetry must be a mapping")

    results = {}
    for parameter, value in telemetry.items():
        if isinstance(parameter, str) and parameter.lower() in RULE_DEFINITIONS:
            name = parameter.lower()
            results[name] = {
                "value": value,
                "normal": check_rule(name, value),
            }
    return results


def update_numeric_threshold(parameter, minimum=None, maximum=None):
    """Update the lower and/or upper threshold for a numeric sensor rule."""
    rule = get_rule(parameter)
    name = parameter.lower()

    if "min" not in rule or "max" not in rule:
        raise ValueError("{} is not a numeric rule".format(parameter))

    new_min = rule["min"] if minimum is None else minimum
    new_max = rule["max"] if maximum is None else maximum

    if isinstance(new_min, bool) or not isinstance(new_min, (int, float)):
        raise TypeError("minimum must be a number")
    if isinstance(new_max, bool) or not isinstance(new_max, (int, float)):
        raise TypeError("maximum must be a number")
    if new_min > new_max:
        raise ValueError("minimum threshold cannot exceed maximum threshold")

    RULE_DEFINITIONS[name]["min"] = float(new_min)
    RULE_DEFINITIONS[name]["max"] = float(new_max)
    RULE_DEFINITIONS[name]["condition"] = (
        "normal when {} <= {} <= {}".format(new_min, name, new_max)
    )
    return get_rule(name)


__all__ = [
    "RULE_DEFINITIONS",
    "get_rules",
    "get_rule",
    "check_rule",
    "evaluate_telemetry",
    "update_numeric_threshold",
]
