echo "=========================== docker ==========================="
COMMAND_NAME="docker"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    sudo apt install apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable"
    sudo apt update
    apt-cache policy docker-ce
    sudo apt install docker-ce

    sudo usermod -aG docker ${USER}
    su - ${USER}+
    id -nG
    docker

    REBOOT_TIME=2
    shutdown –r +$REBOOT_TIME "After installing docker, you need to reboot to make sure the features work properly, the OS will restart in $REBOOT_TIME minutes"
else
    echo "$COMMAND_NAME install ok installed"
fi
echo ""
