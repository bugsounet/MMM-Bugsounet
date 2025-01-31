#!/bin/bash
# +---------------------+
# | librespot installer |
# | @bugsounet          |
# +---------------------+

source installer/utils.sh

# module name
Installer_info "Welcome to EXT-Librespot setup"
Installer_info "This installer will install librespot v0.6.0 release"
echo

# check dependencies
dependencies=(build-essential libasound2-dev librust-alsa-sys-dev)
Installer_info "Checking all dependencies..."
Installer_update_dependencies || exit 255
Installer_success "All Dependencies needed are installed !"

echo
cd components
Installer_info "Cloning repository..."
rm -rf sources
git clone -b v0.6.0 -c advice.detachedHead=false https://github.com/librespot-org/librespot sources
Installer_success "Done."

echo

Installer_info "Installing Rust..."
{
  curl https://sh.rustup.rs -sSf | sh -s -- --profile default -y
  source $HOME/.cargo/env
} || {
  Installer_error "Error detected !"
  exit 255
}
Installer_success "Done."

echo

Installer_info "Installing Librespot..."
Installer_warning "It could takes ~30 minutes."
cd sources
cargo build --release --no-default-features --features "alsa-backend with-libmdns" || {
  Installer_error "Error detected !"
  exit 255
}

echo
cd ..

Installer_info "Copy Librespot binary file..."
cp -f sources/target/release/librespot librespot/librespot || {
  Installer_error "Copy error !"
  exit 255
}
Installer_success "Done."

echo

Installer_press_enter_to_continue
