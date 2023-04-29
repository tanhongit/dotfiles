#!/bin/bash

echo "======================= Clear Systemd Journal ========================"
sudo journalctl --vacuum-time=3days
# automatically clear log when it reached the certain size
sudo journalctl --vacuum-size=100M

echo "=========================== Clear APT cache ==========================="
sudo du -sh /var/cache/apt
sudo du -sh /var/lib/apt/lists
sudo apt-get clean
sudo apt-get autoclean
sudo apt-get autoremove

echo "=========================== Clear Snap cache ==========================="
sudo snap remove --purge gnome-characters

echo "=============== Remove older versions of Snap applications ============="
du -h /var/lib/snapd/snaps # Show the size of the snap packages

# Removes old revisions of snaps
# CLOSE ALL SNAPS BEFORE RUNNING THIS
set -eu
snap list --all | awk '/disabled/{print $1, $3}' |
    while read snapname revision; do
        sudo snap remove "$snapname" --revision="$revision"
    done

echo "======================= Clear thumbnails cache ======================="
if [ -d "$HOME/.cache/thumbnails" ]; then
    rm -rfv $HOME/.cache/thumbnails/*
fi