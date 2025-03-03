# API Schema Endpoint Counter

This application allows you to paste or upload API schema configurations in OpenAPI, Postman, or GraphQL formats. It then parses the schema to count the total number of endpoints, queries, and mutations. The results are displayed in a split-screen view with the schema input on the left and the analytics and endpoint list on the right.

## Features

- Supports OpenAPI (JSON/YAML), Postman (JSON), and GraphQL (Introspection/SDL) schemas.
- Counts and displays the total number of endpoints, queries, and mutations.
- Lists each endpoint's path in a scrollable list.
- Allows uploading schema files or pasting schema content directly.

## Usage

1. Select a sample schema from the dropdown or upload your own schema file.
2. Paste your schema content into the text area.
3. View the analytics and endpoint list on the right side of the screen.

## Installation

1. Clone the repository.
2. Install dependencies using `npm install`.
3. Start the development server using `npm start`.

## License

This project is licensed under the MIT License.