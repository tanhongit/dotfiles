#!/bin/bash

cd web || exit
bash list.sh
cd ../

echo '####################################################################'
while true; do
    if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
        yn="y"
    else
        read -r -p "Do you want to install some packages, programs for PHP web developer? (Y/N)  " yn
    fi

    case $yn in
    [Yy]*)
        cd web/php || exit
        bash setup.sh
        cd ../../
        break
        ;;
    [Nn]*) break ;;
    *) echo "Please answer yes or no." ;;
    esac
done

echo '####################################################################'
while true; do
    if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
        yn="y"
    else
        read -r -p "Do you want to install some packages, programs for JS web developer? (Y/N)  " yn
    fi

    case $yn in
    [Yy]*)
        cd web/js || exit
        bash setup.sh
        cd ../../
        break
        ;;
    [Nn]*) break ;;
    *) echo "Please answer yes or no." ;;
    esac
done

installSnapDevPackages() {
    PACKAGE_LIST=("mysql-workbench-community" "dbeaver-ce")

    for packageName in "${PACKAGE_LIST[@]}"; do
        echo "=========================== $packageName ==========================="

        if ! command -v "$packageName" &>/dev/null; then
            echo "$packageName could not be found. Setting up $packageName."
            while true; do
                if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
                    yn="y"
                else
                    read -r -p "Do you want to install $packageName? (Y/N)  " yn
                fi
                case $yn in
                [Yy]*)
                    sudo snap install "$packageName"
                    break
                    ;;
                [Nn]*) break ;;
                *) echo "Please answer yes or no." ;;
                esac
            done
        else
            echo "$packageName install ok installed"
        fi
        echo ''
    done
}
installSnapDevPackages
