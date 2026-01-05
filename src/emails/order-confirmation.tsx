import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

type OrderConfirmationEmailProps = {
  locale: "en" | "my";
  customerName: string;
  packageName: string;
  deliveryDate: string;
  totalAmount: string;
};

const translations = {
  en: {
    subject: "Order Confirmed",
    greeting: (name: string) => `Hi ${name},`,
    confirmMessage: "Your order has been confirmed!",
    packageSelected: "Package Selected",
    deliveryDate: "Delivery Date",
    total: "Total Paid",
    thanks: "Thank you for your order!",
  },
  my: {
    subject: "အော်ဒါအတည်ပြုပြီး",
    greeting: (name: string) => `မင်္ဂလာပါ ${name}`,
    confirmMessage: "သင့်အော်ဒါကို အတည်ပြုပြီးပါပြီ!",
    packageSelected: "ရွေးချယ်ထားသော အစီအစဉ်",
    deliveryDate: "ပို့ဆောင်မည့်နေ့",
    total: "စုစုပေါင်း ပေးချေပြီး",
    thanks: "သင့်အော်ဒါအတွက် ကျေးဇူးတင်ပါသည်!",
  },
};

export default function OrderConfirmationEmail({
  locale = "en",
  customerName,
  packageName,
  deliveryDate,
  totalAmount,
}: OrderConfirmationEmailProps) {
  const t = translations[locale];

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{t.subject}</Preview>
      <Body style={{ fontFamily: locale === "my" ? "Noto Sans Myanmar" : "system-ui" }}>
        <Container>
          <Heading>{t.confirmMessage}</Heading>
          <Text>{t.greeting(customerName)}</Text>

          <Text>
            <strong>{t.packageSelected}:</strong> {packageName}
          </Text>
          <Text>
            <strong>{t.deliveryDate}:</strong> {deliveryDate}
          </Text>
          <Text>
            <strong>{t.total}:</strong> {totalAmount}
          </Text>

          <Text>{t.thanks}</Text>
        </Container>
      </Body>
    </Html>
  );
}
