#!/usr/bin/env bash
# Checks the built site in docs/ before it is deployed (run by .github/workflows/build.yaml).
# The checks are structural, so a new release doesn't need this file edited:
#   - core pages exist and the schedule and office hours actually rendered (the sheets loaded),
#   - every local page the home page links to was built,
#   - every released homework page has its notebook button, and each notebook preview it embeds is live.
set -euo pipefail
cd "${1:-docs}"

fail() { echo "ERROR: $*"; exit 1; }

for page in index.html homework_01.html reading_01.html; do
  [ -s "$page" ] || fail "required page $page is missing or empty"
done

grep -q 'homework_01.html' index.html || fail "home page schedule does not link Homework 01 (schedule sheet empty?)"
grep -q 'reading_01.html' index.html || fail "home page schedule does not link Reading 01"
grep -q 'oh-calendar' index.html || fail "home page has no office hours calendar (semester info sheet empty?)"

# Every local .html page linked from the home page must exist.
missing=0
for link in $(grep -oE 'href="[A-Za-z0-9_./-]+\.html(#[^"]*)?"' index.html | sed -E 's/^href="//; s/(#.*)?"$//' | sort -u); do
  case "$link" in http*|//*) continue ;; esac
  if [ ! -s "${link#./}" ]; then
    echo "ERROR: home page links $link, which was not built"
    missing=1
  fi
done
[ "$missing" -eq 0 ] || exit 1

# Released homework pages (those embedding a preview) must have a notebook button, and the preview
# (light and dark) must be reachable. Unreleased homeworks show "not yet available" and are skipped.
for page in homework_[0-9][0-9].html; do
  grep -q 'data-src-light=' "$page" || continue
  grep -qE 'href="https?://[^"]+">(OPEN A COPY IN GOOGLE COLAB|OPEN NOTEBOOK)' "$page" \
    || fail "$page embeds a preview but has no notebook link (Assignments sheet row empty?)"
  for preview in $(grep -oE 'data-src-(light|dark)="[^"]+"' "$page" | sed -E 's/^data-src-(light|dark)="//; s/"$//' | sort -u); do
    curl -fsSIL --retry 3 --retry-delay 5 -o /dev/null "$preview" || fail "$page preview $preview is not reachable"
  done
done

echo "Build verification passed ($(ls homework_[0-9][0-9].html | wc -l) homework pages, $(ls reading_[0-9][0-9].html | wc -l) reading pages)"
