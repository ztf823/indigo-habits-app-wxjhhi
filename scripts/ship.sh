#!/usr/bin/env bash
# ship.sh — pull latest from GitHub, bump version+build, build, auto-submit to TestFlight.
#
# Usage:
#   ./scripts/ship.sh           # auto-detects next build number from EAS
#   ./scripts/ship.sh 49        # forces version/buildNumber to 1.0.49 / 49
#
# Idempotent. Bails out if working tree is dirty.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

NEXT="${1:-}"

echo "→ git fetch + pull"
git fetch origin --quiet
if [[ -n "$(git status --porcelain)" ]]; then
  echo "✗ working tree is dirty — commit/stash before shipping" >&2
  git status -s
  exit 1
fi
git pull --ff-only origin main

# Determine next build number
if [[ -z "$NEXT" ]]; then
  CURRENT_REMOTE=$(eas build:version:get --platform ios --profile production 2>&1 | grep -oE 'iOS buildNumber - [0-9]+' | grep -oE '[0-9]+$' || echo "")
  if [[ -z "$CURRENT_REMOTE" ]]; then
    echo "✗ could not read remote build number from EAS" >&2
    exit 1
  fi
  NEXT=$((CURRENT_REMOTE + 1))
  echo "→ remote build number is $CURRENT_REMOTE, next will be $NEXT"
fi

# Bump app.json version and buildNumber to match
NEW_VERSION="1.0.$NEXT"
echo "→ bumping app.json to version=$NEW_VERSION buildNumber=$NEXT"
python3 - <<PY
import json
with open("app.json") as f: d = json.load(f)
d["expo"]["version"] = "$NEW_VERSION"
d["expo"]["ios"]["buildNumber"] = "$NEXT"
with open("app.json","w") as f: json.dump(d, f, indent=2); f.write("\n")
PY

if [[ -n "$(git status --porcelain app.json)" ]]; then
  git -c user.name="Zozo" -c user.email="tommyfrancisco@gmail.com" \
    commit -am "build: bump to $NEW_VERSION / build $NEXT" >/dev/null
  echo "→ committed bump"
  git push origin main --quiet
  echo "→ pushed to GitHub"
fi

echo "→ kicking off EAS build with --auto-submit (build $NEXT)"
eas build --platform ios --profile production --non-interactive --no-wait --auto-submit 2>&1 \
  | tee /tmp/ship_eas.log \
  | grep -E 'Build ID|App Version|Build number|Submission details|See logs' || true

BUILD_ID=$(grep -oE 'Build ID *: *[a-f0-9-]+' /tmp/ship_eas.log | awk -F: '{print $2}' | tr -d ' ')
echo
echo "✓ Build $NEXT submitted. Auto-submit to TestFlight enabled."
echo "  Build URL: https://expo.dev/accounts/ztf823/projects/indigo-habits/builds/$BUILD_ID"
echo "  Builds usually take 8-12 min, then ~5-10 min Apple processing, then it lands in TestFlight."
