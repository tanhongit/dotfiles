#!/bin/bash

if ! command -v "pm2" &>/dev/null; then
    echo "pm2 could not be found. Setting up pm2."
    sudo npm install -g pm2
else
    echo "pm2 install ok installed"
fi
