#!/usr/bin/env bash
# Claude Dependency Check Script
# Quick security and version check for dependencies

set -euo pipefail

echo "📦 Claude Dependency Security Check"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if pnpm is available
if ! command -v pnpm &> /dev/null; then
  echo -e "${RED}❌ pnpm not found. Install it first.${NC}"
  exit 1
fi

echo "🔍 Checking for vulnerabilities..."
echo ""

# Run pnpm audit
if pnpm audit --json > /tmp/audit-result.json 2>&1; then
  echo -e "${GREEN}✅ No vulnerabilities found${NC}"
else
  # Parse and display vulnerabilities
  echo -e "${RED}⚠️  Vulnerabilities detected:${NC}"
  echo ""

  # Show audit summary
  pnpm audit || true

  echo ""
  echo -e "${YELLOW}Run 'pnpm audit --fix' to attempt automatic fixes${NC}"
fi

echo ""
echo "📊 Checking outdated packages..."
echo ""

# Check outdated packages
pnpm outdated || echo -e "${GREEN}All packages are up to date${NC}"

echo ""
echo "🎯 Critical Package Versions"
echo "-----------------------------"

# Extract versions from package.json
get_version() {
  grep "\"$1\":" package.json | head -1 | sed 's/.*: "\(.*\)".*/\1/'
}

NEXT_VER=$(get_version "next")
REACT_VER=$(get_version "react")
SUPABASE_VER=$(get_version "@supabase/supabase-js")
STRIPE_VER=$(get_version "stripe")

echo -e "Next.js:    $NEXT_VER"
echo -e "React:      $REACT_VER"
echo -e "Supabase:   $SUPABASE_VER"
echo -e "Stripe:     $STRIPE_VER"

echo ""
echo "🔐 Security Recommendations"
echo "----------------------------"

# Check Next.js version
if [[ "$NEXT_VER" == *"16.1.1"* ]]; then
  echo -e "${RED}❌ Next.js 16.1.1 is VULNERABLE (CVE-2025-66478)${NC}"
  echo -e "   ${YELLOW}→ Downgrade to 16.0.10: pnpm update next@16.0.10${NC}"
elif [[ "$NEXT_VER" == *"16.0"* ]]; then
  echo -e "${GREEN}✅ Next.js 16.0.x - checking patch level...${NC}"
  if [[ ! "$NEXT_VER" == *"16.0.10"* ]] && [[ ! "$NEXT_VER" == *"16.0.7"* ]]; then
    echo -e "${YELLOW}⚠️  Consider updating to 16.0.10 (latest stable)${NC}"
  fi
elif [[ "$NEXT_VER" == *"15."* ]]; then
  echo -e "${GREEN}✅ Next.js 15.x - ensure >= 15.6.0${NC}"
fi

# Check React version
if [[ "$REACT_VER" == *"19.2.3"* ]]; then
  echo -e "${GREEN}✅ React 19.2.3 - patched and secure${NC}"
elif [[ "$REACT_VER" == *"19.2.2"* ]] || [[ "$REACT_VER" == *"19.2.1"* ]] || [[ "$REACT_VER" == *"19.2.0"* ]]; then
  echo -e "${RED}❌ React version vulnerable to CVE-2025-55182${NC}"
  echo -e "   ${YELLOW}→ Update to 19.2.3: pnpm update react@19.2.3 react-dom@19.2.3${NC}"
fi

# Check Supabase version
if [[ "$SUPABASE_VER" == *"2.50"* ]] || [[ "$SUPABASE_VER" == *"2.5"* ]]; then
  echo -e "${YELLOW}⚠️  Supabase JS is outdated (vulnerable auth-js dependency)${NC}"
  echo -e "   ${YELLOW}→ Update to latest: pnpm update @supabase/supabase-js@latest${NC}"
elif [[ "$SUPABASE_VER" == *"2.7"* ]]; then
  echo -e "${GREEN}✅ Supabase JS is up to date${NC}"
fi

echo ""
echo "📋 Next Steps"
echo "-------------"
echo "1. Review DEPENDENCY_AUDIT.md for detailed recommendations"
echo "2. Run 'pnpm update' for specific packages as needed"
echo "3. Test thoroughly after updates: pnpm build && pnpm dev"
echo "4. Run 'bash scripts/codex/verify.sh' before committing"

echo ""
echo "================================"
echo -e "${BLUE}Check complete!${NC}"
echo "================================"
