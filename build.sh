#!/bin/bash

# Build the project
GOOS=linux GOARCH=amd64 go build -o dist/linux/PS_STATS
GOOS=darwin GOARCH=amd64 go build -o dist/mac/PS_STATS
GOOS=windows GOARCH=386 go build -o dist/windows-32bit/PS_STATS.exe 
GOOS=windows GOARCH=amd64 go build -o dist/windows/PS_STATS.exe 