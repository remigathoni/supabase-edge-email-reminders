# Supabase Edge Function: Bill Reminder

## Overview

This Supabase Edge function is designed to send reminders for due bills. It runs on the edge, which means it runs closer to where a user is located.

## Prerequisites

Before setting up this function, ensure you have the following prerequisites in place:

- A Supabase account and project set up.
- A Supabase database with a table containing bill information, including due dates and a table containing user information (this can be generated from an authentication flow)

## Installation

1. Clone this repository to your local machine or download the source code.

2. Add the supabase project url, the project's anon key, and the sendgrid API key to a .env file in the supabase folder.
  ```
  SENDGRID_API_KEY=""
  PROJECT_ANON_KEY=""
  PROJECT_URL=""
  ```

3. Deploy the function to Supabase Edge. You can use the Supabase CLI for this.
  ```
  npx supabase functions deploy
  ```
5. Set up a cron schedule in Supabase to invoke this function daily at midnight.
   ```
   select
   cron.schedule(
    'send-reminder-for-due-bills',
    '0 0 * * *', -- daily at midnight
    $$
    select
      net.http_post(
          url:='your-edge-function-url',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer your-project-anon-key"}'::jsonb
      ) as request_id;
    $$
   );```
## Usage

When the function is invoked, it performs the following steps:

1. Query the database to find bills that are due on the current date.

2. Prepare reminder messages for each due bill.

3. Send reminders to the user associated with that bill.

## Configuration

You may need to customize the following configurations to suit your specific use case:

- Database table and column names.
- Message templates for reminders.
