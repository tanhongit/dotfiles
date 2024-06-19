#!/bin/bash

# Ensure ~/.config is exists
mkdir -p "${HOME}"/.config

bash ../global/zsh-additional.sh
cp ../.zshrc "${HOME}"
cp ../.p10k.zsh "${HOME}"/.p10k.zsh
