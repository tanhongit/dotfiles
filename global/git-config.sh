#!/bin/bash

# Ensure ~/.config is exists
mkdir -p "${HOME}"/.config
mkdir -p "$HOME"/.config/git

cp -Rfv ../.config/git/ignore "$HOME"/.config/git/ignore

# ================ set git config core to ignore file ================
if [ -z "$(git config --global core.excludesfile)" ]; then
    git config --global core.excludesfile "$HOME"/.config/git/ignore
    echo "Git config core.excludesfile is set"
else
  echo "Git config core.excludesfile is ready"
fi

if [ -z "$(git config --global core.ignorecase)" ]; then
    git config --global core.ignorecase false
    echo "Git config core.ignorecase is set"
else
  echo "Git config core.ignorecase is ready"
fi

if [ -z "$(git config --global core.autocrlf)" ]; then
    git config --global core.autocrlf input
    echo "Git config core.autocrlf is set"
else
  echo "Git config core.autocrlf is ready"
fi

if [ -z "$(git config --global core.safecrlf)" ]; then
    git config --global core.safecrlf true
    echo "Git config core.safecrlf is set"
else
  echo "Git config core.safecrlf is ready"
fi
