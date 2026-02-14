# Postman Collections & Environments

This folder contains Postman collections and environments for API testing.

## How to Import

- Open Postman, click Import, select a collection from `collections/`.
- Import environments from `environments/`.

## Which Collection to Use

- Use the latest version: `PP_API_V2_1_0_1.postman_collection.json`

## How to Generate

Run:

    npm run docs:generate:v2 -- --bump=patch

## File Structure

- collections/: All API collections
- environments/: Postman environment files
