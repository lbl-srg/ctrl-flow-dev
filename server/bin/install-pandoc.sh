#!/bin/sh
set -x

apt-get --assume-yes update && apt-get --assume-yes install wget pandoc=2.9.2.1-3ubuntu2 texlive=2021.20220204-1 texlive-extra-utils=2021.20220204-1