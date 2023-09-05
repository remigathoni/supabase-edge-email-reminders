// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
const PROJECT_ANON_KEY = Deno.env.get('PROJECT_ANON_KEY')
const PROJECT_URL = Deno.env.get('PROJECT_URL')


const url = 'https://api.sendgrid.com/v3/mail/send';
serve(async (req) => {
  
  try {
  const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      PROJECT_URL,
      // Supabase API ANON KEY - env var exported by default.
      PROJECT_ANON_KEY,
      // Create client with Auth context of the user that called the function.
      // This way your row-level-security (RLS) policies are applied.
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    
  // Retrieve all the bills in the database
  const { data, error } = await supabaseClient
  .from('Bills')
  .select('*');

  if (error) {
    new Response(
      JSON.stringify({ error: 'Error fetching data from Supabase' }),
      { headers: { "Content-Type": "application/json" } })
  }
  // Check if today is the due date
  const isBillDueToday = (dueDateString:string) => {
    // Get the current date
    const currentDate = new Date();

    // Parse the due date string into a Date object
    const dueDate = new Date(dueDateString);

    // Check if the current date is equal to the due date
    const isDueToday =
      currentDate.getFullYear() === dueDate.getFullYear() &&
      currentDate.getMonth() === dueDate.getMonth() &&
      currentDate.getDate() === dueDate.getDate();

    return isDueToday;
  }

  const sendEmail = async (email: string, bill:string, price:string) => {
    
   try {
     const data = {
      personalizations: [
        {
          to: [
            {
              email: email
            }
          ],
          subject: `Reminder: ${bill} bill is due today.`
        }
      ],
      content: [
        {
          type: 'text/plain',
          value: `Your${bill} bill is due today. Remember to pay Ksh.${price}.`
        }
      ],
      from: {
        email: 'maryg.kahiga@gmail.com',
        name: 'Billmate'
      },
      reply_to: {
        email: 'maryg.kahiga@gmail.com',
        name: 'mary'
      }
    };

  const headers = {
    Authorization: `Bearer ${SENDGRID_API_KEY}`,
    'Content-Type': 'application/json'
  };
      const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
      });
      return {error: null}
   } catch (error) {
    return {error: error.message}
   }
  }
  

  const getUserEmail = async (userId:string) => {
    try {
      const {data:user, error:userErr} = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId);
      if(!user) {
        throw new Error("User not found")
      }
    return {email: user[0].email, error: null}
    } catch (error) {
      return {email: null, error: error.message}
    }
  }
  
  // Iterate over the bills to find due bills
  data?.forEach( async bill => {
    const nextdue = bill.nextdue
    const billIsDueToday = isBillDueToday(nextdue);
    // Exit if the bill is not due
    if(!billIsDueToday) return
    // Send email if bill is due
    const res = await getUserEmail(bill.user_id)
    if(res.error) throw new Error(res.error)
  
    const response = await sendEmail(res.email, bill.name, bill.price)
    if(response.error) throw new Error(response.error)
  })
  // If its the due date, send email

  return new Response(
    JSON.stringify({error: null}),
    { headers: { "Content-Type": "application/json" } },
  )
  } catch (error) {
    return new Response(
    JSON.stringify({error: error.message}),
    { headers: { "Content-Type": "application/json" } },
  )
  }
})

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
