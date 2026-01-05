import { Resend } from "resend";

import DeliveryReminderEmail from "@/emails/delivery-reminder";
import MenuPublishedEmail from "@/emails/menu-published";
import OrderConfirmationEmail from "@/emails/order-confirmation";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

function canSendEmail() {
  return Boolean(resend);
}

export async function sendOrderConfirmation(
  customerEmail: string,
  customerName: string,
  locale: "en" | "my",
  orderDetails: {
    packageName: string;
    deliveryDate: string;
    deliveryWindow?: string | null;
    totalAmount: string;
  },
) {
  if (!canSendEmail()) {
    return;
  }

  const subject = locale === "my" ? "အော်ဒါအတည်ပြုပြီး" : "Order Confirmed";

  await resend?.emails.send({
    from: "Mandalay Morning Star <orders@mandalaymorningstar.com>",
    to: customerEmail,
    subject,
    react: OrderConfirmationEmail({
      locale,
      customerName,
      ...orderDetails,
    }),
  });
}

export async function sendDeliveryReminder(
  customerEmail: string,
  customerName: string,
  locale: "en" | "my",
  details: {
    packageName: string;
    deliveryDate: string;
    deliveryWindow?: string | null;
  },
) {
  if (!canSendEmail()) {
    return;
  }

  const subject = locale === "my" ? "မနက်ဖြန် ပို့ဆောင်မည်" : "Delivery Reminder";

  await resend?.emails.send({
    from: "Mandalay Morning Star <orders@mandalaymorningstar.com>",
    to: customerEmail,
    subject,
    react: DeliveryReminderEmail({
      locale,
      customerName,
      ...details,
    }),
  });
}

export async function sendMenuPublishedNotice(
  customerEmail: string,
  customerName: string,
  locale: "en" | "my",
  details: {
    weekStart: string;
    deliveryDate: string;
  },
) {
  if (!canSendEmail()) {
    return;
  }

  const subject = locale === "my" ? "ဒီအပတ် မီနူး ထုတ်ပြန်ပြီး" : "Weekly Menu Published";

  await resend?.emails.send({
    from: "Mandalay Morning Star <orders@mandalaymorningstar.com>",
    to: customerEmail,
    subject,
    react: MenuPublishedEmail({
      locale,
      customerName,
      ...details,
    }),
  });
}
