#!/bin/bash

echo "=========================== zsh ==========================="
bash zsh.sh

echo "=========================== imwheel ==========================="
bash imwheel.sh

echo "=========================== set time on dual boot system ==========================="
timedatectl set-local-rtc 1 --adjust-system-clock
echo ""

echo "=========================== psensor ==========================="
bash psensor.sh
echo ""

echo "=========================== chrome ==========================="
bash chrome.sh
echo ""

installPackages() {
    PACKAGE_LIST=("curl" "ibus-unikey" "wget" "vim" "tmux" "nano" "net-tools" "terminator" "nodejs" "npm" "gnome-tweaks" "snapd" "lighttpd" "gparted" "playonlinux" "bleachbit" "dconf-editor" "chrome-gnome-shell" "gnome-shell-extensions" "libfuse2" "gedit")

    for packageName in "${PACKAGE_LIST[@]}"; do
        echo "=========================== $packageName ==========================="
        REQUIRED_PKG=$packageName
        PKG_OK=$(dpkg-query -W --showformat='${Status}\n' "$REQUIRED_PKG" | grep "install ok installed")
        echo "Checking for $REQUIRED_PKG: $PKG_OK"
        if [ "" = "$PKG_OK" ]; then
            echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
            sudo apt-get install -y "$REQUIRED_PKG"
        fi
        echo ""
    done
}
installPackages

echo "=========================== npm ==========================="
bash npm.sh
echo ""

echo "=========================== util ==========================="
bash util.sh
echo ""

echo "=========================== deno ==========================="
bash deno.sh
echo ""
