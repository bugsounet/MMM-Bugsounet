#!/bin/bash
# +---------+
# | Rebuild |
# +---------+

source ../../installer/utils.sh

# check version in package.json file
Installer_version="$(grep -Eo '\"version\"[^,]*' ./package.json | grep -Eo '[^:]*$' | awk  -F'\"' '{print $2}')"
Installer_module="$(grep -Eo '\"name\"[^,]*' ./package.json | grep -Eo '[^:]*$' | awk  -F'\"' '{print $2}')"

# Let's start !
Installer_info "Welcome to $Installer_module v$Installer_version rebuild script"
Installer_warning "This script will erase current build and reinstall it"
Installer_yesno "Do you want to continue ?" || exit 0

echo
Installer_info "Cleaning..."
rm -rf *.js node_modules
Installer_success "Done."
echo

Installer_info "Reinstalling..."
npm install
