#!/bin/bash
# +---------+
# | Tokens  |
# +---------+

source ../../installer/utils.sh

# check version in package.json file
Installer_module="$(grep -Eo '\"name\"[^,]*' ./package.json | grep -Eo '[^:]*$' | awk  -F'\"' '{print $2}')"

Installer_info "Welcome to $Installer_module Token generator!"
echo

Installer_yesno "Do you want to install/reinstall $Installer_module token?" && (
  rm -f tokenGP.json
  node installer/auth_GPhotos
)

echo
Installer_success "Done."
