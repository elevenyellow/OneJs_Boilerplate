#!/bin/bash

# Test script for sector search endpoint
# Tests different scenarios: summer/winter, different grade ranges

API_URL="http://localhost:4000/api/sectors/search"

echo "================================================"
echo "Testing Sector Search API"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Summer search near Valencia
echo -e "${BLUE}Test 1: Summer search (July) - Looking for shaded sectors${NC}"
echo "Location: Valencia, Spain (39.5, -0.5)"
echo "Grade range: 6b to 7a"
echo "Season: Summer (July)"
echo ""

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "userLocation": { "lat": 39.5, "lon": -0.5 },
    "gradeRange": { "min": "6b", "max": "7a" },
    "maxDistance": 80,
    "currentMonth": 7,
    "minRoutes": 10,
    "limit": 5
  }' \
  | jq '.'

echo ""
echo "================================================"
echo ""

# Test 2: Winter search near Valencia
echo -e "${BLUE}Test 2: Winter search (January) - Looking for sunny sectors${NC}"
echo "Location: Valencia, Spain (39.5, -0.5)"
echo "Grade range: 6a to 6c"
echo "Season: Winter (January)"
echo ""

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "userLocation": { "lat": 39.5, "lon": -0.5 },
    "gradeRange": { "min": "6a", "max": "6c" },
    "maxDistance": 80,
    "currentMonth": 1,
    "minRoutes": 15,
    "limit": 5
  }' \
  | jq '.'

echo ""
echo "================================================"
echo ""

# Test 3: Advanced filters with rock type
echo -e "${BLUE}Test 3: Limestone sectors with topos${NC}"
echo "Location: Valencia, Spain (39.5, -0.5)"
echo "Grade range: 6c to 7b"
echo "Filters: Limestone, requires topos"
echo ""

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "userLocation": { "lat": 39.5, "lon": -0.5 },
    "gradeRange": { "min": "6c", "max": "7b" },
    "maxDistance": 100,
    "rockTypes": ["Limestone"],
    "hasTopo": true,
    "minRoutes": 20,
    "limit": 5
  }' \
  | jq '.'

echo ""
echo "================================================"
echo ""

# Test 4: Beginner search
echo -e "${BLUE}Test 4: Beginner-friendly sectors${NC}"
echo "Location: Valencia, Spain (39.5, -0.5)"
echo "Grade range: 5a to 6a"
echo "Looking for sectors with many easy routes"
echo ""

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "userLocation": { "lat": 39.5, "lon": -0.5 },
    "gradeRange": { "min": "5a", "max": "6a" },
    "maxDistance": 50,
    "minRoutes": 10,
    "limit": 5
  }' \
  | jq '.'

echo ""
echo "================================================"
echo ""

# Test 5: Advanced climber search
echo -e "${BLUE}Test 5: Advanced climber search${NC}"
echo "Location: Valencia, Spain (39.5, -0.5)"
echo "Grade range: 7b to 8a"
echo "Looking for challenging sectors"
echo ""

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "userLocation": { "lat": 39.5, "lon": -0.5 },
    "gradeRange": { "min": "7b", "max": "8a" },
    "maxDistance": 150,
    "minRoutes": 5,
    "limit": 5
  }' \
  | jq '.'

echo ""
echo "================================================"
echo ""

# Test 6: Force orientation preference
echo -e "${BLUE}Test 6: Force shade preference (override season)${NC}"
echo "Location: Valencia, Spain (39.5, -0.5)"
echo "Grade range: 6b to 7a"
echo "Force orientation: shade"
echo ""

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "userLocation": { "lat": 39.5, "lon": -0.5 },
    "gradeRange": { "min": "6b", "max": "7a" },
    "maxDistance": 80,
    "forceOrientation": "shade",
    "minRoutes": 10,
    "limit": 5
  }' \
  | jq '.'

echo ""
echo "================================================"
echo -e "${GREEN}Tests completed!${NC}"
echo "================================================"
