#!/bin/bash

bash ../global/zsh-additional.sh
cp ../.zshrc "${HOME}"
cp ../.p10k.zsh "${HOME}"/.p10k.zsh

cd ../global || exit
bash git-config.sh
cd ../macos || exit
