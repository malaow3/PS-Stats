#!/bin/bash

# Build the project
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o dist/linux/PS-STATS
CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build -o dist/mac/PS-STATS
CGO_ENABLED=0 GOOS=windows GOARCH=386 go build -o dist/windows-32bit/PS-STATS.exe 
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -o dist/windows/PS-STATS.exe 