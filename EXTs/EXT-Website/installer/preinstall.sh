#!/bin/bash
# +----------------+
# | npm preinstall |
# +----------------+

dependencies=

while getopts ":d:" option; do
  case $option in
    d) # -d option for install dependencies
       dependencies=($OPTARG);;
  esac
done

source ../../installer/utils.sh

echo
# check version in package.json file
Installer_version="$(grep -Eo '\"version\"[^,]*' ./package.json | grep -Eo '[^:]*$' | awk  -F'\"' '{print $2}')"
Installer_module="$(grep -Eo '\"name\"[^,]*' ./package.json | grep -Eo '[^:]*$' | awk  -F'\"' '{print $2}')"

# Let's start !
Installer_info "Welcome to $Installer_module v$Installer_version"

echo

# Check platform compatibility
Installer_info "Checking OS..."
Installer_checkOS
if  [ "$platform" == "osx" ]; then
  Installer_error "OS Detected: $OSTYPE ($os_name $os_version $arch)"
  Installer_error "Automatic installation is not included"
  echo
  exit 255
else
  if  [ "$os_name" == "raspbian" ] && [ "$os_version" -lt 11 ]; then
    Installer_error "OS Detected: $OSTYPE ($os_name $os_version $arch)"
    Installer_error "Unfortunately, this module is not compatible with your OS"
    Installer_error "Try to update your OS to the lasted version of raspbian"
    echo
    exit 255
  else
    Installer_success "OS Detected: $OSTYPE ($os_name $os_version $arch)"
  fi
fi

echo
#check dependencies
if [[ -n $dependencies ]]; then
  Installer_info "Checking all dependencies..."
  Installer_update_dependencies || exit 255
  Installer_success "All Dependencies needed are installed !"
fi
