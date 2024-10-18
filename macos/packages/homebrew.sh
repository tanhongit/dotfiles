#!/bin/bash

echo "First Setup"

xcode-select --install

if test ! "$(which brew)"; then
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"  
fi

# Ensure Homebrew is added to the shell environment
if [[ "$SHELL" == *"zsh"* ]]; then
  PROFILE_FILE="$HOME/.zshrc"
elif [[ "$SHELL" == *"bash"* ]]; then
  PROFILE_FILE="$HOME/.bash_profile"
else
  PROFILE_FILE="$HOME/.profile"
fi

# Add Homebrew to the profile if it's not already present
if ! grep -q '/opt/homebrew/bin/brew shellenv' "$PROFILE_FILE"; then
  echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> "$PROFILE_FILE"
  echo "Homebrew added to $PROFILE_FILE"
else
  echo "Homebrew is already in $PROFILE_FILE"
fi

eval "$(/opt/homebrew/bin/brew shellenv)"
