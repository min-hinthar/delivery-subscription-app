#!/usr/bin/env bash
# Claude Code Review Script
# Runs comprehensive checks on changed files for Codex PRs

set -euo pipefail

echo "🔍 Claude PR Review Checklist"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0

# Get changed files (uncommitted + staged)
CHANGED_FILES=$(git diff --name-only HEAD 2>/dev/null || echo "")

if [ -z "$CHANGED_FILES" ]; then
  echo "⚠️  No changed files detected. Checking staged files..."
  CHANGED_FILES=$(git diff --cached --name-only 2>/dev/null || echo "")
fi

if [ -z "$CHANGED_FILES" ]; then
  echo "❌ No changed files found. Run this from a branch with changes."
  exit 1
fi

echo "📝 Changed files:"
echo "$CHANGED_FILES" | sed 's/^/  - /'
echo ""

# ====================
# Security Checks
# ====================
echo "🔐 Security Checks"
echo "-------------------"

# Check for secrets
if echo "$CHANGED_FILES" | grep -q "\.env\.local"; then
  echo -e "${RED}❌ FAIL: .env.local file modified (should never be committed)${NC}"
  ((FAILED++))
else
  echo -e "${GREEN}✅ PASS: No .env.local changes${NC}"
  ((PASSED++))
fi

# Check for API keys in code
SECRET_PATTERNS="(STRIPE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY|GOOGLE_MAPS_API_KEY|sk_live_|sk_test_)"
if echo "$CHANGED_FILES" | xargs grep -E "$SECRET_PATTERNS" 2>/dev/null | grep -v "process.env" | grep -v "^#" | head -5; then
  echo -e "${RED}❌ FAIL: Potential secrets found in code${NC}"
  ((FAILED++))
else
  echo -e "${GREEN}✅ PASS: No hardcoded secrets detected${NC}"
  ((PASSED++))
fi

# Check for auth guards in protected routes
if echo "$CHANGED_FILES" | grep -E "src/app/\(app\)|src/app/admin" | head -1 > /dev/null; then
  echo -e "${YELLOW}⚠️  WARNING: Protected routes modified - verify auth guards${NC}"
  ((WARNINGS++))
fi

echo ""

# ====================
# Code Quality
# ====================
echo "📊 Code Quality Checks"
echo "----------------------"

# Check for TypeScript 'any' types in changed files
ANY_COUNT=0
for file in $CHANGED_FILES; do
  if [[ "$file" =~ \.(ts|tsx)$ ]] && [ -f "$file" ]; then
    count=$(grep -c "\bany\b" "$file" 2>/dev/null || echo "0")
    ANY_COUNT=$((ANY_COUNT + count))
  fi
done

if [ "$ANY_COUNT" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  WARNING: Found $ANY_COUNT 'any' types in changed files${NC}"
  ((WARNINGS++))
else
  echo -e "${GREEN}✅ PASS: No 'any' types in changed files${NC}"
  ((PASSED++))
fi

# Check for console.log (should use proper logging)
if echo "$CHANGED_FILES" | xargs grep -n "console\.log\|console\.error" 2>/dev/null | grep -v "^//" | head -5; then
  echo -e "${YELLOW}⚠️  WARNING: console.log/error found - consider proper logging${NC}"
  ((WARNINGS++))
fi

# Check TypeScript compilation
echo "Running TypeScript check..."
if pnpm typecheck > /dev/null 2>&1; then
  echo -e "${GREEN}✅ PASS: TypeScript compilation successful${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ FAIL: TypeScript errors detected (run 'pnpm typecheck')${NC}"
  ((FAILED++))
fi

echo ""

# ====================
# UX/Accessibility
# ====================
echo "♿ Accessibility Checks"
echo "-----------------------"

# Check for ARIA labels in new components
if echo "$CHANGED_FILES" | xargs grep -l "button\|input\|select" 2>/dev/null | head -1 > /dev/null; then
  echo -e "${YELLOW}⚠️  INFO: Form elements detected - verify ARIA labels${NC}"
  echo "  Check for: aria-label, aria-describedby, htmlFor on labels"
  ((WARNINGS++))
fi

# Check for color-only information (need text too)
if echo "$CHANGED_FILES" | xargs grep -E "bg-red-|text-red-|bg-green-|text-green-" 2>/dev/null | head -1 > /dev/null; then
  echo -e "${YELLOW}⚠️  INFO: Color classes detected - ensure not relying on color alone${NC}"
  ((WARNINGS++))
fi

echo ""

# ====================
# Performance
# ====================
echo "⚡ Performance Checks"
echo "---------------------"

# Check for client components
CLIENT_COMPONENTS=$(echo "$CHANGED_FILES" | xargs grep -l "\"use client\"" 2>/dev/null | wc -l)
if [ "$CLIENT_COMPONENTS" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  INFO: $CLIENT_COMPONENTS client component(s) modified${NC}"
  echo "  Verify client components are necessary (prefer server components)"
  ((WARNINGS++))
fi

# Check for large image imports
if echo "$CHANGED_FILES" | xargs grep -E "import.*\.(png|jpg|jpeg)" 2>/dev/null | head -3; then
  echo -e "${YELLOW}⚠️  WARNING: Direct image imports found${NC}"
  echo "  Consider using next/image and public/ directory"
  ((WARNINGS++))
fi

echo ""

# ====================
# Documentation
# ====================
echo "📚 Documentation Checks"
echo "-----------------------"

# Check if docs were updated
DOCS_UPDATED=$(echo "$CHANGED_FILES" | grep "^docs/" | wc -l)
if [ "$DOCS_UPDATED" -gt 0 ]; then
  echo -e "${GREEN}✅ PASS: Documentation updated ($DOCS_UPDATED files)${NC}"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠️  INFO: No doc updates - verify if docs need updating${NC}"
  echo "  Consider: BACKLOG.md, QA_UX.md, SECURITY_CHECKLIST.md"
  ((WARNINGS++))
fi

echo ""

# ====================
# Summary
# ====================
echo "================================"
echo "📊 Review Summary"
echo "================================"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ "$FAILED" -gt 0 ]; then
  echo -e "${RED}🚫 PR REVIEW FAILED${NC}"
  echo "Fix the failed checks before creating PR"
  exit 1
elif [ "$WARNINGS" -gt 5 ]; then
  echo -e "${YELLOW}⚠️  PR HAS WARNINGS${NC}"
  echo "Review warnings and address if applicable"
  exit 0
else
  echo -e "${GREEN}✅ PR REVIEW PASSED${NC}"
  echo "Ready for PR creation (address warnings as needed)"
  exit 0
fi
