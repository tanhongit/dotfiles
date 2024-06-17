#!/bin/bash

echo "=========================== chrome ==========================="
bash chrome.sh
echo ""

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

echo "=========================== pm2 ============================"
bash pm2.sh
echo ""

installPackages() {
    PACKAGE_LIST=("curl" "ibus-unikey" "wget" "vim" "tmux" "nano" "net-tools" "terminator" "npm" "gnome-tweaks" "snapd" "lighttpd" "gparted" "playonlinux" "bleachbit" "dconf-editor" "chrome-gnome-shell" "gnome-shell-extensions" "libfuse2" "gedit")

    for packageName in "${PACKAGE_LIST[@]}"; do
        echo "=========================== $packageName ==========================="
        PKG_OK=$(dpkg-query -W --showformat='${Status}\n' "$packageName" | grep "install ok installed")
        echo "Checking for $packageName: $PKG_OK"
        if [ "" = "$PKG_OK" ]; then
            echo "No $packageName. Setting up $packageName."
            sudo apt-get install -y "$packageName"
        fi
        echo ""
    done
}
installPackages

echo "==================== nvm, npm, node ========================"
bash npm.sh
echo ""

echo "=========================== util ==========================="
bash util.sh
echo ""

echo "=========================== deno ==========================="
bash deno.sh
echo ""
