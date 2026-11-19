# Rule Engine & Alerts

This module provides configurable IoT monitoring thresholds and reusable rules for classifying sensor readings as `NORMAL` or `ABNORMAL`. It does not send notifications or integrate with external alert services.

## Files

- `__init__.py` exports the public rule-engine API so callers can use `from rule_engine import ...`.
- `thresholds.py` stores sensor thresholds and provides functions to retrieve or update them.
- `rules.py` validates readings using the configured thresholds and reports their status.
- `test_rules.py` contains unit tests for normal, abnormal, missing, and invalid readings.
- `README.md` describes the module purpose and usage.

## Monitored Parameters

The configurable demo defaults match the values documented for this project:

- `temperature`: normal range from 0.0 to 50.0 C.
- `humidity`: normal range from 30.0 to 70.0 percent.
- `device_status`: normal values are `online`, `active`, or `connected`; common abnormal values are `offline`, `error`, or `maintenance`.

Temperature and humidity thresholds are maintained separately from the rule evaluation code in `thresholds.py`. `get_threshold(sensor)` returns one threshold configuration and `get_thresholds()` returns all configurations. Both return copies, so callers cannot accidentally change the active settings. Use `set_threshold()` or the existing `update_numeric_threshold()` helper to adjust values.

## Working Overview

1. `get_threshold(sensor)` and `get_thresholds()` retrieve the configured limits and units.
2. `evaluate_reading(sensor, value)` returns `NORMAL` or `ABNORMAL`, along with the reading and a reason. `None`, non-numeric values, booleans, and non-finite numbers are safely marked `ABNORMAL`.
3. `evaluate_telemetry(telemetry)` applies the rules to supported values in a mapping. A supported key whose value is `None` is reported as missing.
4. `check_rule(parameter, value)` remains available for callers that need the original boolean result (`True` for normal).

Example:

```python
from rule_engine import evaluate_reading, evaluate_telemetry, set_threshold

set_threshold("temperature", minimum=5, maximum=40)

print(evaluate_reading("temperature", 24.5))
# {'status': 'NORMAL', 'value': 24.5, 'reason': 'within configured threshold'}

print(evaluate_telemetry({
    "temperature": 24.5,
    "humidity": 55,
    "device_status": "online",
}))
```

Run the unit tests from the project root with:

```shell
python -m unittest rule_engine.test_rules
```
