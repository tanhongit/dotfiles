#!/bin/bash

installSnapDevPackages() {
    PACKAGE_LIST=("postman" "ngrok")

    for packageName in "${PACKAGE_LIST[@]}"; do
        echo "=========================== $packageName ==========================="
        if ! command -v "$packageName" &>/dev/null; then
            echo "$COMMAND_NAME could not be found. Setting up $packageName."
            sudo snap install "$packageName"
        else
            echo "$packageName install ok installed"
        fi
        echo ""
    done
}
installSnapDevPackages

bash vscode.sh
