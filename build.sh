#!/bin/bash

# Build the project
GOOS=linux GOARCH=amd64 go build -o dist/linux/PS-STATS
GOOS=darwin GOARCH=amd64 go build -o dist/mac/PS-STATS
GOOS=windows GOARCH=386 go build -o dist/windows-32bit/PS-STATS.exe 
GOOS=windows GOARCH=amd64 go build -o dist/windows/PS-STATS.exe 