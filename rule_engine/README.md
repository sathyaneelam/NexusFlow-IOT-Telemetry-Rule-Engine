# Rule Engine & Alerts

This module provides the initial Day 1 setup for the NexusFlow IoT Telemetry Rule Engine. It defines reusable rules for normal and abnormal telemetry values and does not depend on or modify the rest of the project.

## Files

- `__init__.py` exports the public rule-engine API so callers can use `from rule_engine import ...`.
- `rules.py` contains the sensor rule definitions, threshold configuration, and reusable functions for reading and evaluating rules.
- `README.md` describes the module purpose and usage.

## Monitored Parameters

The initial definitions cover:

- `temperature`: normal range from 0.0 to 50.0 C.
- `humidity`: normal range from 30.0 to 70.0 percent.
- `device_status`: normal values are `online`, `active`, or `connected`; common abnormal values are `offline`, `error`, or `maintenance`.

Threshold values are centralized in `RULE_DEFINITIONS` and can also be changed for numeric parameters with `update_numeric_threshold()`.

## Working Overview

1. `get_rules()` returns all rule definitions.
2. `get_rule(parameter)` returns one parameter rule.
3. `check_rule(parameter, value)` checks whether one telemetry value is normal.
4. `evaluate_telemetry(telemetry)` evaluates a mapping of supported telemetry values and returns a normal/abnormal result for each known parameter.

Example:

```python
from rule_engine import check_rule, evaluate_telemetry

print(check_rule("temperature", 24.5))
print(evaluate_telemetry({
    "temperature": 24.5,
    "humidity": 55,
    "device_status": "online",
}))
```
