#!/bin/bash

echo "======================= Clear ========================"

cd ../others || exit
bash clear.sh
cd ../setup || exit

echo "=========================== copy overwrite ==========================="
while true; do
    if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
        yn="y"
    else
        echo "Do you want copy and overwrite existing config folders from this source to your os?"
        echo "If you have just installed ubuntu on your machine, you can copy the config by selecting Y/Yes."
        echo "Please select N/No to skip if your os was installed long ago to avoid conflicts."
        read -r -p "Please choose (Y/N)  " yn
    fi

    case $yn in
    [Yy]*)
        sudo apt install gir1.2-gda-5.0 gir1.2-gsound-1.0 -y # install gsound for 'Pano Clipboard Manager'
        #cp -TRv ../../../ "${ZSH_CUSTOM:-$HOME/}"

        cp -TR ../../../.psensor ~/.psensor
        cp ../../../.zshrc ~/.zshrc
        cp ../../../.p10k.zsh ~/.p10k.zsh
        cp -TR ../../../.config ~/.config

        # shellcheck disable=SC1091
        if [ -f "/etc/os-release" ]; then
            . /etc/os-release
            OS=$NAME

            if [ "$OS" == "Ubuntu" ]; then
                cp -TR ../../../ubuntu/.config ~/.config
                cp -TR ../../../ubuntu/.local ~/.local
            elif [ "$OS" == "Zorin OS" ]; then
                cp -TR ../../../zorin/.config ~/.config
                cp -TR ../../../zorin/.local ~/.local
            fi
        fi

        break
        ;;
    [Nn]*) break ;;
    *) echo "Please answer yes or no." ;;
    esac
done
