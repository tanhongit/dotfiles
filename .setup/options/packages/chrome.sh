#!/bin/bash

COMMAND_NAME="google-chrome"
if ! [ -x "$(command -v $COMMAND_NAME)" ]; then
    cho "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
    sudo dpkg -i google-chrome-stable_current_amd64.deb
else
    echo "$COMMAND_NAME install ok installed"
fi