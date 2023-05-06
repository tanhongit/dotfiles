#!/bin/bash

cd options/setup
bash before-setup.sh
cd ../../
echo ''

echo '####################################################################'
echo '######################### Run package list #########################'
echo '####################################################################'
echo ''
cd options/packages
bash list.sh
cd ../../

echo '####################################################################'
echo '############################### utils ##############################'
echo '####################################################################'
echo ''
cd options/utils
bash list.sh
cd ../../
echo ''

echo '####################################################################'
while true; do
    read -p "Do you want to install some packages, programs for Developer? (Y/N)  " yn
    case $yn in
    [Yy]*)
        cd options/develop
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
cd options/setup
bash after-setup.sh
cd ../../

echo "####################################################################"
echo "######################### install docker ###########################"
while true; do
    read -p "Do you want to install docker? (Y/N)  " yn
    case $yn in
    [Yy]*)
        cd options/develop/
        bash docker.sh
        cd ../../
        break
        ;;
    [Nn]*) break ;;
    *) echo "Please answer yes or no." ;;
    esac
done