import { Resend } from "resend";

import OrderConfirmationEmail from "@/emails/order-confirmation";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmation(
  customerEmail: string,
  customerName: string,
  locale: "en" | "my",
  orderDetails: {
    packageName: string;
    deliveryDate: string;
    totalAmount: string;
  },
) {
  const subject = locale === "my" ? "အော်ဒါအတည်ပြုပြီး" : "Order Confirmed";

  await resend.emails.send({
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
