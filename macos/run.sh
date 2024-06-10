#!/bin/bash

if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
    brew tap homebrew/cask
fi

brew install --cask skype spotify anydesk phpstorm webstorm postman

if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
    sudo spctl --master-enable  # Re-enable Gatekeeper
fi
