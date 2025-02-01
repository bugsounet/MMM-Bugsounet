#!/bin/bash
# +---------------------------------+
# | librespot credentials installer |
# | @bugsounet                      |
# +---------------------------------+

source installer/utils.sh

compare_versions()
{
  var1=$1;
  var2=$2;
  for i in 1 2 3
  do
    part1=$(echo $var1 | cut -d "." -f $i)
    part2=$(echo $var2 | cut -d "." -f $i)
    if [ $part1 -lt $part2 ]
    then
      return 0
    fi
  done
  return 1
}

# module name
Installer_info "Welcome to EXT-Librespot credentials setup"
echo

cd components/librespot
rm -f cache/credentials.json

if [ ! -f "librespot" ]
then
  Installer_error "librespot not found !"
  exit 255
else
  version=$(./librespot -V | awk -F " " '{ print $2 }' | cut -d '-' -f1)
  if compare_versions $version "0.5.0"
  then
    Installer_error "Found: librespot v$version"
    Installer_error "librespot version 0.5.0 or more is needed"
    exit 255
  else
    Installer_success "Found: librespot v$version"
  fi
fi

echo
Installer_info "Execute librespot..."
echo
{
  Installer_warning "Browse the offer link and accept any condition"
  Installer_warning "When you can see: Go back to your terminal on your browser, you can break this script (CTRL+C)"
  echo
  ./librespot -c cache -j
} || {
  Installer_error "Error detected !"
  exit 255
}
Installer_success "Done."

echo

if [ ! -f "cache/credentials.json" ]; then
  Installer_error "Credentials Error detected !"
  exit 255
else
  Installer_success "Credentials Writed."
fi

echo

Installer_press_enter_to_continue
