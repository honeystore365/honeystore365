#!/bin/bash
# Configure Git to use rebase strategy
git config pull.rebase true
# Pull with tags from origin main
git pull --tags origin main