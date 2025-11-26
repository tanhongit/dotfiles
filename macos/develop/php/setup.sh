#!/bin/bash

APP_LIST=("phpstorm")

for appName in "${APP_LIST[@]}"; do
    echo "=========================== $appName ==========================="

    PKG_OK=$(brew list --cask | grep "^$appName$")
    echo "Checking for $appName: $PKG_OK"
    if [ "" = "$PKG_OK" ]; then
        echo "No $appName. Setting up $appName."

        while true; do
            if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
                yn="y"
            else
                read -r -p "Do you want to install $appName? (Y/N)  " yn
            fi
            case $yn in
            [Yy]*)
                brew install --cask "$appName"
                break
                ;;
            [Nn]*) break ;;
            *) echo "Please answer yes or no." ;;
            esac
        done
    else
        echo "$appName install ok installed"
    fi
    echo ""
done

# If Homebrew is available and a PHP formula is installed, ensure brew-php-switcher is installed
if command -v brew >/dev/null 2>&1; then
    # Detect installed php formulas (php, php@7.4, php@8.0, etc.)
    if brew list --formula | grep -E '^php($|@)' >/dev/null 2>&1 || brew list | grep -E '^php($|@)' >/dev/null 2>&1; then
        echo "Detected Homebrew PHP installation. Preparing to install brew-php-switcher."

        # Tap homebrew/homebrew-php if not already tapped
        if ! brew tap | grep -q '^homebrew/homebrew-php$'; then
            echo "Tapping homebrew/homebrew-php..."
            brew tap homebrew/homebrew-php || true
        else
            echo "homebrew/homebrew-php already tapped"
        fi

        # Install brew-php-switcher if not installed
        if ! brew list --formula | grep -q '^brew-php-switcher$'; then
            echo "Installing brew-php-switcher..."
            brew install brew-php-switcher || echo "Failed to install brew-php-switcher (it may be unavailable in your taps)."
        else
            echo "brew-php-switcher already installed"
        fi
    else
        echo "No Homebrew PHP formula detected; skipping brew-php-switcher installation."
    fi
else
    echo "Homebrew not found; skipping brew-php-switcher installation."
fi
