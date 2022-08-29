echo "=========================== copy overwrite ==========================="
while true; do
    echo "Do you want copy and overwrite existing config folders from this source to your os?"
    echo "If you have just installed ubuntu on your machine, you can copy the config by selecting Y/Yes."
    echo "Please select N/No to skip if your os was installed long ago to avoid conflicts."
    read -p "Please choose (Y/N)  " yn
    case $yn in
    [Yy]*)
        cp -TRv ../ ${ZSH_CUSTOM:-$HOME/}
        break
        ;;
    [Nn]*) break ;;
    *) echo "Please answer yes or no." ;;
    esac
done

echo ""
if [ "1" = "$WEB_DEVELOP" ]; then
    while true; do
        read -p "Do you want to install docker? (Y/N)  " yn
        case $yn in
        [Yy]*)
            cd options/web-develop/docker/
            bash run.sh
            cd ../../../
            break
            ;;
        [Nn]*) break ;;
        *) echo "Please answer yes or no." ;;
        esac
    done
fi