#!/bin/bash

echo "======================= Clear ========================"
# shellcheck disable=SC2164
cd ../others
bash clear.sh
# shellcheck disable=SC2164
cd ../setup

echo "=========================== copy overwrite ==========================="
while true; do
    if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
        yn="y"
    else
        echo "Do you want copy and overwrite existing config folders from this source to your os?"
        echo "If you have just installed ubuntu on your machine, you can copy the config by selecting Y/Yes."
        echo "Please select N/No to skip if your os was installed long ago to avoid conflicts."
        # shellcheck disable=SC2162
        read -p "Please choose (Y/N)  " yn
    fi

    case $yn in
    [Yy]*)
        sudo apt install gir1.2-gda-5.0 gir1.2-gsound-1.0 -y # install gsound for 'Pano Clipboard Manager'
        cp -TRv ../../../ "${ZSH_CUSTOM:-$HOME/}"
        rm -rf ~/.github
        rm -rf ~/.gitignore
        rm -rf ~/.setup
        rm -rf ~/.backup
        rm -rf ~/.git
        break
        ;;
    [Nn]*) break ;;
    *) echo "Please answer yes or no." ;;
    esac
done
