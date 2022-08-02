# run before install: .setup/pre-install.sh
sh pre-install.sh

echo '####################################################################'
echo '########################### start setup ############################'
echo '####################################################################'

echo "=========================== zsh ==========================="
REQUIRED_PKG="zsh"
PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
echo Checking for $REQUIRED_PKG: $PKG_OK
if [ "" = "$PKG_OK" ]; then
    echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
    sudo apt-get install -y $REQUIRED_PKG

    # start ====== oh-my-zsh
    sudo git clone https://github.com/robbyrussell/oh-my-zsh.git ~/.oh-my-zsh
    # Fast Syntax Highlighting
    sudo git clone https://github.com/zdharma/fast-syntax-highlighting.git \
        ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/fast-syntax-highlighting
    # ZSH Autosuggestions
    sudo git clone https://github.com/zsh-users/zsh-autosuggestions.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
    # p10k theme
    sudo git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
    # end ====== oh-my-zsh

    # set zsh as default
    chsh -s /bin/$REQUIRED_PKG
fi

echo "=========================== imwheel ==========================="
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
Control_L, Up,   Control_L|Button4
Control_L, Down, Control_L|Button5
Shift_L,   Up,   Shift_L|Button4
Shift_L,   Down, Shift_L|Button5
EOF
    imwheel --kill
fi

echo "=========================== set time on dual boot system ==========================="
timedatectl set-local-rtc 1 --adjust-system-clock

echo "=========================== psensor ==========================="
REQUIRED_PKG="psensor"
PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
echo Checking for $REQUIRED_PKG: $PKG_OK
if [ "" = "$PKG_OK" ]; then
    echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
    sudo apt-get install -y lm-sensors hddtemp
    sudo dpkg-reconfigure hddtemp
    sudo sensors-detect
    sudo apt-get install -y $REQUIRED_PKG
fi

echo "=========================== chrome ==========================="
COMMAND_NAME="google-chrome"
if ! [ -x "$(command -v $COMMAND_NAME)" ]; then
    cho "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
    sudo dpkg -i google-chrome-stable_current_amd64.deb
else
    echo "$COMMAND_NAME install ok installed"
fi

echo ''
echo '####################################################################'
echo '######################### Run package list #########################'
echo '####################################################################'
echo ''

installPackages() {
    PACKAGE_LIST=("curl" "wget" "vim" "tmux" "nano" "terminator" "nodejs" "npm" "gnome-tweaks" "snapd" "gparted" "playonlinux" "bleachbit" "dconf-editor" "chrome-gnome-shell" "gnome-shell-extensions")

    for packageName in "${PACKAGE_LIST[@]}"; do
        echo "=========================== $packageName ==========================="
        REQUIRED_PKG=$packageName
        PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
        echo Checking for $REQUIRED_PKG: $PKG_OK
        if [ "" = "$PKG_OK" ]; then
            echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
            sudo apt-get install -y $REQUIRED_PKG
        fi
        echo ""
    done
}
installPackages

sudo npm cache clean -f
sudo npm install -g n stable

COMMAND_NAME="npm"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    sudo npm install -g $COMMAND_NAME
else
    echo "$COMMAND_NAME install ok installed"
fi

echo "=========================== heroku and set multiple accounts ==========================="
REQUIRED_PKG="heroku"
PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
echo Checking for $REQUIRED_PKG: $PKG_OK
if [ "" = "$PKG_OK" ]; then
    echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
    curl https://cli-assets.heroku.com/install-ubuntu.sh | sh
    sodo $REQUIRED_PKG plugins:install heroku-accounts
fi

echo "=========================== ulauncher ==========================="
REQUIRED_PKG="ulauncher"
PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
echo Checking for $REQUIRED_PKG: $PKG_OK
if [ "" = "$PKG_OK" ]; then
    echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
    sudo add-apt-repository ppa:agornostal/$REQUIRED_PKG
    sudo apt -y update
    sudo apt -y install $REQUIRED_PKG
fi

echo "=========================== deno ==========================="
COMMAND_NAME="deno"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    sudo snap install $COMMAND_NAME
else
    echo "$COMMAND_NAME install ok installed"
fi

echo "=========================== flameshot ==========================="
COMMAND_NAME="flameshot"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    sudo apt install -y $COMMAND_NAME
else
    echo "$COMMAND_NAME install ok installed"
fi

echo '####################################################################'
echo '############################### utils ##############################'
echo '####################################################################'
echo ''
bash options/utils.sh

echo ''
echo '####################################################################'
echo '########################### after setup ############################'
echo '####################################################################'
sh after-setup.sh
