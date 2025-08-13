#!/bin/bash

# start ====== oh-my-zsh
sudo git clone https://github.com/robbyrussell/oh-my-zsh.git ~/.oh-my-zsh

# Fast Syntax Highlighting
sudo git clone https://github.com/zdharma/fast-syntax-highlighting.git "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}"/plugins/fast-syntax-highlighting
# ZSH Autosuggestions
sudo git clone https://github.com/zsh-users/zsh-autosuggestions.git "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}"/plugins/zsh-autosuggestions

# p10k theme
sudo git clone --depth=1 https://github.com/romkatv/powerlevel10k.git "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}"/themes/powerlevel10k

# Install Powerlevel10k fonts
if [ -d "$HOME/Library/Fonts" ]; then
    echo "Installing Powerlevel10k fonts..."
    # Add MesloLGS Nerd Font to ~/Library/Fonts, skipping if already exists
    for t in "Regular" "Bold" "Italic" "Bold Italic"; do
      file="$HOME/Library/Fonts/MesloLGS NF ${t}.ttf"
      if [ -f "$file" ]; then
        echo "✔ Skip: $(basename "$file") (already exists)"
        continue
      fi

      enc=${t// /%20}  # encode spaces for URL
      url="https://github.com/romkatv/powerlevel10k-media/raw/master/MesloLGS%20NF%20${enc}.ttf"

      echo "↓ Download: $(basename "$file")"
      if ! curl -fL --progress-bar -o "$file" "$url"; then
        echo "✖ Error downloading $(basename "$file")"
      fi
    done
fi
# end ====== oh-my-zsh

# set zsh as default
echo "Setting zsh as default shell..."
chsh -s /bin/"${REQUIRED_PKG:-zsh}"
