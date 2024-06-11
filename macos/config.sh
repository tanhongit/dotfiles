#!/bin/bash

# Ensure ~/.config is exists
mkdir -p "${ZSH_CUSTOM:-$HOME}"/.config

bash ../global/zsh-additional.sh
cp ../.zshrc "${ZSH_CUSTOM:-$HOME}"
cp ../.p10k.zsh "${ZSH_CUSTOM:-$HOME}"/.p10k.zsh
