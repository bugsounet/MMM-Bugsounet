#!/bin/bash
# +-----------------+
# | npm postinstall |
# +-----------------+

rebuild=0
minify=0

while getopts ":rm" option; do
  case $option in
    r) # -r option for magicmirror rebuild
       rebuild=1;;
    m) # -m option for minify all sources
       minify=1;;
  esac
done

source ../../installer/utils.sh
echo

# Go back to installer
cd installer

if [[ $minify == 1 ]]; then
  Installer_info "Minify Main code..."
  node minify.js || {
    Installer_error "Minify Failed!"
    exit 255
  }
  Installer_success "Done"
  echo
else
  Installer_info "Install developer Main code..."
  node dev.js || {
    Installer_error "Install Failed!"
    exit 255
  }
  Installer_success "Done"
  echo
fi

# Go back to module root
cd ..

if [[ $rebuild == 1 ]]; then
  Installer_info "Rebuild MagicMirror..."
  electron-rebuild 1>/dev/null || {
    Installer_error "Rebuild Failed"
    exit 255
  }
  Installer_success "Done"
  echo
fi

# module name
Installer_module="$(grep -Eo '\"name\"[^,]*' ./package.json | grep -Eo '[^:]*$' | awk  -F'\"' '{print $2}')"

Installer_success "$Installer_module is now installed !"
