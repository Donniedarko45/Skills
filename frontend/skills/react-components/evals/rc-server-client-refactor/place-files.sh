#!/usr/bin/env bash
# Copies the starting Next.js project into the working directory and installs its dependencies.
set -eu
cp -R "$(dirname "$0")/files/." .
npm install --no-audit --no-fund --silent
