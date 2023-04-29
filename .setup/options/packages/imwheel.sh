#!/bin/bash

REQUIRED_PKG="imwheel"
PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
echo Checking for $REQUIRED_PKG: $PKG_OK
if [ "" = "$PKG_OK" ]; then
    echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
    sudo apt-get install -y $REQUIRED_PKG
    tee -a ~/.imwheelrc <<EOF
".*"
None,      Up,   Button4, 3
None,      Down, Button5, 3
None,      Thumb1, Alt_L|Left
None,      Thumb2, Alt_L|Right
Control_L, Up,   Control_L|Button4
Control_L, Down, Control_L|Button5
Shift_L,   Up,   Shift_L|Button4
Shift_L,   Down, Shift_L|Button5
EOF
    imwheel --kill
    sudo imwheel --kill --buttons "4 5"
