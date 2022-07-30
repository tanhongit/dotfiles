sh pre-install.sh

sudo apt-get install -y terminator vim-gtk3 nano

echo "=========================== zsh ==========================="
sudo apt-get install -y zsh

# start ====== oh-my-zsh
sudo git clone https://github.com/robbyrussell/oh-my-zsh.git ~/.oh-my-zsh
# Fast Syntax Highlighting
sudo git clone https://github.com/zdharma/fast-syntax-highlighting.git \
    ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/fast-syntax-highlighting
# ZSH Autosuggestions
sudo git clone https://github.com/zsh-users/zsh-autosuggestions.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
# p10k theme
#sudo git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
sudo git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
# end ====== oh-my-zsh

# set zsh as default
chsh -s /bin/zsh

echo "=========================== wget ==========================="
sudo apt install -y wget curl
wget --version

echo "=========================== nodejs, npm, deno ==========================="
sudo apt-get install -y nodejs 
sudo npm cache clean -f
sudo npm install -g n stable
sudo npm install -g npm
sudo apt-get install -y npm
sudo apt-get install -y deno

echo "=========================== imwheel ==========================="
sudo apt-get install imwheel
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

echo "=========================== heroku and set multiple accounts ==========================="
sudo curl https://cli-assets.heroku.com/install-ubuntu.sh | sh
sodo heroku plugins:install heroku-accounts

echo "=========================== gnome-tweaks ==========================="
sudo apt install -y gnome-tweaks

echo '####################################################################'
echo '############################# softwares ############################'
echo '####################################################################'
echo ''
echo "=========================== some softs ==========================="
sudo apt install -y gparted filezilla playonlinux

echo "=========================== chrome ==========================="
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb

echo "=========================== psensor ==========================="
sudo apt-get install -y lm-sensors hddtemp
sudo dpkg-reconfigure hddtemp
sudo sensors-detect
sudo apt-get install -y psensor

echo "=========================== Ulauncher ==========================="
sudo apt install -y ulauncher

echo "=========================== Bleachbit ==========================="
sudo apt install -y bleachbit

echo "=========================== dconf-editor ==========================="
sudo apt-get install -y dconf-editor

echo "=========================== dconf-editor ==========================="
sudo apt install -y obs-studio
