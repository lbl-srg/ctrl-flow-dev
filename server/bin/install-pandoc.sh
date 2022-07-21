#!/bin/sh
set -x

# This command is meant to be run in the GitHub Action continuous integration workflow in an Ubuntu distribution.
sudo apt-get --assume-yes update && sudo apt-get --assume-yes install wget pandoc=2.9.2.1-3ubuntu2 texlive=2021.20220204-1 texlive-extra-utils=2021.20220204-1
