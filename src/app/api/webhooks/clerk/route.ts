import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return new Response('WEBHOOK_SECRET not configured', { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch {
    return new Response('Webhook verification failed', { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    try {
      const primaryEmail = email_addresses.find(e => e.id === evt.data.primary_email_address_id);
      await db.user.create({
        data: {
          clerkId: id,
          email: primaryEmail?.email_address ?? '',
          name: `${first_name ?? ''} ${last_name ?? ''}`.trim() || null,
        },
      });
    } catch (error) {
      console.error('Error creating user:', error);
      return new Response('Error creating user', { status: 500 });
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    try {
      const primaryEmail = email_addresses.find(e => e.id === evt.data.primary_email_address_id);
      await db.user.update({
        where: { clerkId: id },
        data: {
          email: primaryEmail?.email_address ?? '',
          name: `${first_name ?? ''} ${last_name ?? ''}`.trim() || null,
        },
      });
    } catch (error) {
      console.error('Error updating user:', error);
    }
  }

  if (eventType === 'user.deleted') {
    try {
      await db.user.delete({ where: { clerkId: evt.data.id! } });
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  }

  return new Response('', { status: 200 });
}
