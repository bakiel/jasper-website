#!/bin/bash
# JASPER CRM Test Runner
# Location: /opt/jasper-crm/scripts/run_tests.sh

set -e

cd /opt/jasper-crm
source venv/bin/activate

echo "=========================================="
echo "JASPER CRM Integration Tests"
echo "=========================================="
echo ""

# Run live API tests
pytest tests/test_live_api.py -v --tb=short

echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
