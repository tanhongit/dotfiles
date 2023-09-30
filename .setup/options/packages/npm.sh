#!/bin/bash

COMMAND_NAME="n"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    sudo npm cache clean -f
    sudo npm install -g $COMMAND_NAME stable
else
    echo "$COMMAND_NAME install ok installed"
fi

COMMAND_NAME="npm"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    sudo npm install -g $COMMAND_NAME
else
    echo "$COMMAND_NAME install ok installed"
fi
