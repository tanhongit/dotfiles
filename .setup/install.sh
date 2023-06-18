#!/bin/bash

cd options/setup || exit
bash before-setup.sh
cd ../../
echo ''

echo '####################################################################'
echo '######################### Run package list #########################'
echo '####################################################################'
echo ''

cd options/packages || exit
bash list.sh
cd ../../

echo '####################################################################'
echo '############################### utils ##############################'
echo '####################################################################'
echo ''
cd options/utils || exit
bash list.sh
cd ../../
echo ''

echo '####################################################################'
while true; do
    if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
        yn="y"
    else
        read -r -p "Do you want to install some packages, programs for Developer? (Y/N)  " yn
    fi
    case $yn in
    [Yy]*)
        cd options/develop || exit
        bash setup.sh
        cd ../../
        break
        ;;
    [Nn]*) break ;;
    *) echo "Please answer yes or no." ;;
    esac
done

echo ''
echo '####################################################################'
echo '########################### after setup ############################'
echo '####################################################################'
echo ''
cd options/setup || exit
bash after-setup.sh
cd ../../

echo "####################################################################"
echo "######################### install docker ###########################"
while true; do
    if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
        yn="y"
    else
        read -r -p "Do you want to install docker? (Y/N)  " yn
    fi
    case $yn in
    [Yy]*)
        cd options/develop/ || exit
        bash docker.sh
        cd ../../
        break
        ;;
    [Nn]*) break ;;
    *) echo "Please answer yes or no." ;;
    esac
done
