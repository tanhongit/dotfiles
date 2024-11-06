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

        cp -TR ../../.psensor "${HOME}"/.psensor
        cp -TR ../../.config "${HOME}"/.config
        cp ../../../.zsh_aliases "${HOME}"/.zsh_aliases
        cp ../../../.zshrc "${HOME}"/.zshrc
        cp ../../../.p10k.zsh "${HOME}"/.p10k.zsh

        if [ -d "${HOME}"/.local ]; then
            cp -TR ../../../.local "${HOME}"/.local
        fi

        # shellcheck disable=SC1091
        if [ -f "/etc/os-release" ]; then
            . /etc/os-release
            OS=$NAME

            if [ "$OS" == "Ubuntu" ]; then
                cp -TR ../../../ubuntu/.config "${HOME}"/.config
                cp -TR ../../../ubuntu/.local "${HOME}"/.local
            elif [ "$OS" == "Zorin OS" ]; then
                cp -TR ../../../zorin/.config "${HOME}"/.config
                cp -TR ../../../zorin/.local "${HOME}"/.local
            fi
        fi

        break
        ;;
    [Nn]*) break ;;
    *) echo "Please answer yes or no." ;;
    esac
done
