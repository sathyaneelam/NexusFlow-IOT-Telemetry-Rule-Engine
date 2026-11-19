"""Unit tests for configured sensor thresholds and monitoring rules."""

import unittest

from rule_engine import (
    ABNORMAL,
    NORMAL,
    evaluate_reading,
    evaluate_telemetry,
    get_threshold,
    set_threshold,
)


class MonitoringRuleTests(unittest.TestCase):
    def setUp(self):
        self.original_temperature = get_threshold("temperature")
        self.original_humidity = get_threshold("humidity")

    def tearDown(self):
        set_threshold(
            "temperature",
            self.original_temperature["min"],
            self.original_temperature["max"],
        )
        set_threshold(
            "humidity",
            self.original_humidity["min"],
            self.original_humidity["max"],
        )

    def test_normal_temperature_and_humidity_readings(self):
        self.assertEqual(evaluate_reading("temperature", 22.5)["status"], NORMAL)
        self.assertEqual(evaluate_reading("humidity", 55)["status"], NORMAL)

    def test_readings_at_threshold_boundaries_are_normal(self):
        temperature = get_threshold("temperature")
        humidity = get_threshold("humidity")
        self.assertEqual(
            evaluate_reading("temperature", temperature["min"])["status"], NORMAL
        )
        self.assertEqual(
            evaluate_reading("temperature", temperature["max"])["status"], NORMAL
        )
        self.assertEqual(
            evaluate_reading("humidity", humidity["min"])["status"], NORMAL
        )
        self.assertEqual(
            evaluate_reading("humidity", humidity["max"])["status"], NORMAL
        )

    def test_out_of_range_readings_are_abnormal(self):
        self.assertEqual(evaluate_reading("temperature", 51)["status"], ABNORMAL)
        self.assertEqual(evaluate_reading("humidity", 29)["status"], ABNORMAL)

    def test_missing_readings_are_abnormal(self):
        result = evaluate_reading("temperature", None)
        self.assertEqual(result["status"], ABNORMAL)
        self.assertEqual(result["reason"], "missing value")
        self.assertEqual(
            evaluate_telemetry({"humidity": None})["humidity"]["status"], ABNORMAL
        )

    def test_invalid_and_non_numeric_readings_are_abnormal(self):
        for value in ("warm", True, float("nan"), float("inf")):
            with self.subTest(value=value):
                result = evaluate_reading("temperature", value)
                self.assertEqual(result["status"], ABNORMAL)
                self.assertEqual(result["reason"], "invalid numeric value")

    def test_thresholds_are_configurable_and_returned_as_copies(self):
        set_threshold("temperature", minimum=5, maximum=40)
        self.assertEqual(get_threshold("temperature")["min"], 5.0)
        self.assertEqual(evaluate_reading("temperature", 4)["status"], ABNORMAL)

        returned_threshold = get_threshold("humidity")
        returned_threshold["min"] = -100
        self.assertEqual(get_threshold("humidity")["min"], 30.0)

    def test_telemetry_results_include_status_and_legacy_normal_flag(self):
        result = evaluate_telemetry({"temperature": 20})
        self.assertEqual(result["temperature"]["status"], NORMAL)
        self.assertTrue(result["temperature"]["normal"])
        self.assertEqual(result["temperature"]["value"], 20)


if __name__ == "__main__":
    unittest.main()
