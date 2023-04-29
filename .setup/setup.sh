#!/bin/bash

cd options/setup
bash before-setup.sh
cd ../../

echo '####################################################################'
echo '########################### start setup ############################'
echo '####################################################################'

cd options/packages

echo "=========================== zsh ==========================="
bash zsh.sh

echo "=========================== imwheel ==========================="
bash imwheel.sh

echo "=========================== set time on dual boot system ==========================="
timedatectl set-local-rtc 1 --adjust-system-clock

echo "=========================== psensor ==========================="
bash psensor.sh

echo "=========================== chrome ==========================="
bash chrome.sh

echo ''
echo '####################################################################'
echo '######################### Run package list #########################'
echo '####################################################################'
echo ''
bash list.sh

cd ../../

echo '####################################################################'
echo '############################### utils ##############################'
echo '####################################################################'
echo ''
bash options/utils.sh

echo '####################################################################'
WEB_DEVELOP="0"
while true; do
    read -p "Do you want to install some packages, programs for web developer? (Y/N)  " yn
    case $yn in
    [Yy]*)
        cd options/web-develop/
        WEB_DEVELOP="1"
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