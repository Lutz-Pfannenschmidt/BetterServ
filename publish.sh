#!/bin/bash

if [ -f .secrets.env ]; then
    export $(grep -v '^#' .secrets.env | xargs)
else
    echo ".secrets.env file not found!"
    exit 1
fi

METADATA_JSON_PATH="metadata.json"

if [ -z "$AMO_JWT_ISSUER" ] || [ -z "$AMO_JWT_SECRET" ]; then
    echo "Error: AMO_JWT_ISSUER and AMO_JWT_SECRET must be set in .secrets.env"
    exit 1
fi

web-ext sign --channel=listed --amo-metadata="$METADATA_JSON_PATH" --api-key="$AMO_JWT_ISSUER" --api-secret="$AMO_JWT_SECRET"

