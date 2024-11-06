#!/bin/bash

bash ../global/zsh-additional.sh
cp ../.zsh_aliases "${HOME}"
cp ../.zshrc "${HOME}"
cp ../.p10k.zsh "${HOME}"/.p10k.zsh

cd ../global || exit
bash git-config.sh
cd ../macos || exit
