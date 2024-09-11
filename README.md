# Mac Menubar Notion

A macOS menubar application for quick access to Notion.

## Description

This application provides a convenient way to access Notion directly from your Mac's menubar. It allows for quick note-taking and easy access to your Notion workspace without the need to open a full browser window.

## Features

- Quick access to Notion from the macOS menubar
- Easy note-taking interface
- Direct link to your Notion workspace
- OAuth authentication with Notion
- Remembers last visited Notion page
- Resizable window

## Prerequisites

- Node.js (v14 or later recommended)
- npm (usually comes with Node.js)
- Notion account
- Notion API integration set up (to obtain CLIENT_ID and CLIENT_SECRET)

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/Iamadig/mac-menubar-notion.git
   ```
2. Navigate to the project directory:
   ```
   cd mac-menubar-notion
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the root directory and add your Notion API credentials:
   ```
   NOTION_CLIENT_ID=your_client_id_here
   NOTION_CLIENT_SECRET=your_client_secret_here
   ```

## Usage

To start the application: