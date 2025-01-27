#!/bin/bash
# +-------------------+
# | pinctrl installer |
# +-------------------+

dependencies=(cmake device-tree-compiler libfdt-dev)

# -----
# Prettry installer code
# -----

# color codes
_reset="\033[0m"
_red="\033[91m"
_orange="\033[93m"
_green="\033[92m"
_blue="\033[94m"

# Display a message in color
# $1 - message to display
# $2 - color to use
Installer_message() {
  echo -e "$2$1$_reset"
}

# Displays a error in red
Installer_error() { Installer_message "$1" "$_red" 1>&2 ;}

# Displays a warning in yellow
Installer_warning() { Installer_message "$1" "$_orange" ;}

# Displays a success in green
Installer_success() { Installer_message "$1" "$_green" ;}

# Displays an information in blue
Installer_info() { Installer_message "$1" "$_blue" ;}

Installer_update_dependencies () {
  local missings=()
  for package in "${dependencies[@]}"; do
      Installer_is_installed "$package" || missings+=($package)
  done
  if [ ${#missings[@]} -gt 0 ]; then
    Installer_warning "Updating package..."
    for missing in "${missings[@]}"; do
      Installer_error "Missing package: $missing"
    done
    Installer_info "Installing missing package..."
    Installer_update || exit 255
    Installer_install ${missings[@]} || exit 255
  fi
}

# indicates if a package is installed
#
# $1 - package to verify
Installer_is_installed () {
  hash "$1" 2>/dev/null || (dpkg -s "$1" 2>/dev/null | grep -q "installed")
}

#  Installer_update
Installer_update () {
  sudo apt-get update -y || exit 255
}

# install packages, used for dependencies
#
# $@ - list of packages to install
Installer_install () {
  sudo apt-get install -y $@ || exit 255
  sudo apt-get clean || exit 255
}

# ------
# Let's start !
# ------

# Go back to user home
cd ~

Installer_info "① ➤ Install pinctrl dependencies"
if [[ -n $dependencies ]]; then
  Installer_info "Checking all dependencies..."
  Installer_update_dependencies || exit 255
  Installer_success "All Dependencies needed are installed !"
fi

echo

Installer_info "② ➤ Clone utils repository"
git clone https://github.com/raspberrypi/utils || {
  Installer_error "git clone error"
  exit 255
}

echo

Installer_info "③ ➤ Install pinctrl"
{
  cd utils/pinctrl
  cmake .
  make
  sudo make install
} || {
  Installer_error "Install error"
  exit 255
}

echo

Installer_success "pinctrl is now installed !"