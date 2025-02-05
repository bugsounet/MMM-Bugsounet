#!/bin/bash
# +---------+
# | updater |
# +---------+

# get the installer directory
Installer_get_current_dir () {
  SOURCE="${BASH_SOURCE[0]}"
  while [ -h "$SOURCE" ]; do
    DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
    SOURCE="$(readlink "$SOURCE")"
    [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
  done
  echo "$( cd -P "$( dirname "$SOURCE" )" && pwd )"
}

Installer_dir="$(Installer_get_current_dir)"

# move to installler directory
cd "$Installer_dir"
source utils.sh

# Go back to module root
cd ..

echo
# check version in package.json file
Installer_version="$(grep -Eo '\"version\"[^,]*' ./package.json | grep -Eo '[^:]*$' | awk  -F'\"' '{print $2}')"
Installer_module="$(grep -Eo '\"name\"[^,]*' ./package.json | grep -Eo '[^:]*$' | awk  -F'\"' '{print $2}')"

# Let's start !
Installer_info "Welcome to $Installer_module v$Installer_version Updater"

echo

# Check not run as root
if [ "$EUID" -eq 0 ]; then
  Installer_error "npm install must not be used as root"
  exit 255
fi

echo

Installer_info "Updating..."
(npm run reset && git pull) || {
  Installer_error "Update Failed!"
  exit 255
}
Installer_success "Done"

echo
Installer_info "Updating MMM-GoogleAssistant..."

# launch installer
npm install

echo
Installer_info "Update EXTs..."
cd EXTs
EXTs=( $( ls -1p | grep / | sed 's/^\(.*\)/\1/' | sed 's/.$//') )
for EXT in "${EXTs[@]}"; do
    cd $EXT
    node_helper=${PWD}/node_helper.js
    if [ -f $node_helper ];then
      echo
      Installer_info "➤ Updating $EXT..."
      echo
      (npm run reset && npm install) || {
        Installer_error "Update Failed!"
        exit 255
      }
    else
      echo
      Installer_info "✋ Skipped: $EXT (Not installed)"
      echo
    fi
    cd ..
done

echo
Installer_success "Done"