#!/bin/bash

# Ensure ~/.config is exists
mkdir -p "${HOME}"/.config
mkdir -p "$HOME"/.config/git

cp -Rfv ../.config/git/ignore "$HOME"/.config/git/ignore

# set git config core to ignore file
if [ -z "$(git config --global core.excludesfile)" ]; then
    git config --global core.excludesfile "$HOME"/.config/git/ignore
    git config --global core.ignorecase false
    git config --global core.autocrlf input
    git config --global core.safecrlf true
    echo "Git config core.excludesfile is set"
else
  echo "Git config core.excludesfile is ready"
fi
