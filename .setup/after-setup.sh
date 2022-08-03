echo "=========================== copy overwrite ==========================="
while true; do
    read -p "Do you want copy and overwrite existing config folders from this source to your os? (Y/N)  " yn
    case $yn in
    [Yy]*)
        cp -TRv ../ ${ZSH_CUSTOM:-$HOME/}
        break
        ;;
    [Nn]*) break ;;
    *) echo "Please answer yes or no." ;;
    esac
done