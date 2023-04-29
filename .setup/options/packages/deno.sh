#!/bin/bash

COMMAND_NAME="deno"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    sudo snap install $COMMAND_NAME
else
    echo "$COMMAND_NAME install ok installed"
fi