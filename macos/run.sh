#!/bin/bash

if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
    brew tap homebrew/cask
fi

apps=(skype spotify anydesk phpstorm webstorm postman)
for app in "${apps[@]}"; do
    output=$(brew install --cask $app 2>&1)
    clean_output=$(echo "$output" | grep -v "Warning: macOS's Gatekeeper has been disabled for this Cask")
    echo "$clean_output"
done

if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
    sudo spctl --master-enable
fi
