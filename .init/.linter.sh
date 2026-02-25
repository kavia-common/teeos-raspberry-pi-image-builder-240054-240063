#!/bin/bash
cd /home/kavia/workspace/code-generation/teeos-raspberry-pi-image-builder-240054-240063/frontend_reactjs
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

