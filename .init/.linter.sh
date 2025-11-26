#!/bin/bash
cd /home/kavia/workspace/code-generation/copy-of-mvp-career-platform-213145-213164/CareerPlatformWebFrontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

