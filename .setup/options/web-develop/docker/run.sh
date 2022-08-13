echo "=========================== docker ==========================="
COMMAND_NAME="docker"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    sudo apt install apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable"
    sudo apt update
    apt-cache policy docker-ce
    sudo apt install docker-ce -y

    sudo usermod -aG docker ${USER}
    su - ${USER}+
    id -nG
    docker

    echo 'Install docker compose:'
    echo 'Check new version at https://github.com/docker/compose/releases'
    DOCKER_COMPOSE_VERSION=v2.9.0 
    sudo curl -L "https://github.com/docker/compose/releases/download/$DOCKER_COMPOSE_VERSION/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo mv /usr/local/bin/docker-compose /usr/bin/docker-compose
    sudo chmod +x /usr/bin/docker-compose

    REBOOT_TIME=2
    echo "After installing docker, you need to reboot to make sure the features work properly. Rebooting in $REBOOT_TIME seconds."
    shutdown –r -t $REBOOT_TIME
else
    echo "$COMMAND_NAME install ok installed"
fi
echo ""
