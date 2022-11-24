echo "======================= Clear Systemd Journal ========================"
sudo journalctl --vacuum-time=3days

echo "=========================== Clear APT cache ==========================="
sudo apt-get clean
sudo apt-get autoclean
sudo apt-get autoremove
sudo du -sh /var/cache/apt
sudo du -sh /var/lib/apt/lists

echo "=========================== Clear Snap cache ==========================="
sudo snap remove --purge gnome-characters

echo "=============== Remove older versions of Snap applications ============="
du -h /var/lib/snapd/snaps # Show the size of the snap packages

# Removes old revisions of snaps
# CLOSE ALL SNAPS BEFORE RUNNING THIS
set -eu
snap list --all | awk '/disabled/{print $1, $3}' |
    while read snapname revision; do
        snap remove "$snapname" --revision="$revision"
    done

echo "=========================== copy overwrite ==========================="
while true; do
    echo "Do you want copy and overwrite existing config folders from this source to your os?"
    echo "If you have just installed ubuntu on your machine, you can copy the config by selecting Y/Yes."
    echo "Please select N/No to skip if your os was installed long ago to avoid conflicts."
    read -p "Please choose (Y/N)  " yn
    case $yn in
    [Yy]*)
        sudo apt install gir1.2-gda-5.0 gir1.2-gsound-1.0 -y # install gsound for 'Pano Clipboard Manager'
        cp -TRv ../ ${ZSH_CUSTOM:-$HOME/}
        break
        ;;
    [Nn]*) break ;;
    *) echo "Please answer yes or no." ;;
    esac
done
