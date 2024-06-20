#!/bin/bash

# For Path: /Libraries/Preferences/

# ===================== Finder ===================== #
defaults write com.apple.finder AppleShowAllFiles -bool true
defaults write com.apple.finder ShowPathbar -bool true
defaults write com.apple.finder ShowStatusBar -bool true
defaults write com.apple.finder ContainerShowSidebar -bool true
defaults write com.apple.finder ShowToolbar -bool true
defaults write com.apple.finder ShowSidebar -bool true
defaults write com.apple.finder ShowPreviewPane -bool true
defaults write com.apple.finder ShowTabView -bool true
defaults write com.apple.finder ShowRecentTags -bool false
defaults write com.apple.finder ShowHardDrivesOnDesktop -bool false
defaults write com.apple.finder ShowExternalHardDrivesOnDesktop -bool true

defaults write com.apple.finder NewWindowTarget -string "PfHm"
defaults write com.apple.finder NewWindowTargetPath -string "file://${HOME}/"

defaults write com.apple.finder FXPreferredViewStyle -string "Nlsv" # Nlsv, clmv, Flwv, icnv (This is the icon view)
defaults write com.apple.finder FXPreferredSearchViewStyle -string "Nlsv"
defaults write com.apple.finder FXPreferredGroupBy -string "Kind"
defaults write com.apple.finder FXPreferredSortBy -string "Name"

# when performing a search, search the current folder by default
defaults write com.apple.finder FXDefaultSearchScope -string "SCcf"

# remove items from the trash after 30 days
defaults write com.apple.finder FXRemoveOldTrashItems -bool true

# show all filename extensions
defaults write NSGlobalDomain AppleShowAllExtensions -bool true

# show warning before emptying the Trash
defaults write com.apple.finder WarnOnEmptyTrash -bool true
