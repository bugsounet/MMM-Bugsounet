#!/bin/bash

cd installer
source utils.sh

Installer_beep=false

cat DomainName &>/dev/null || {
  Installer_error "Domain not found!"
  exit 255
}

domain=$(<DomainName)
rm -f DomainName

Installer_yesno "Router is ready ?" || {
  Installer_info "Don't forget to forward ports 80 and 443 to your Pi's IP address!"
  exit 255
}

Installer_info "Installing https certificate for $domain\n"
certbot -d $domain --nginx || {
  echo
  Installer_error "Failed to create certificate\n"
  exit 255
}

Installer_success "Certificate installed !\n"
Installer_success "MMM-Bugsounet is now available at https://$domain"
Installer_success "SmartHome is now available at https://$domain/smarthome/"
