import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

type DeliveryReminderEmailProps = {
  locale: "en" | "my";
  customerName: string;
  packageName: string;
  deliveryDate: string;
  deliveryWindow?: string | null;
};

const translations = {
  en: {
    subject: "Delivery Reminder",
    greeting: (name: string) => `Hi ${name},`,
    reminderMessage: "Your delivery arrives tomorrow!",
    packageSelected: "Package Selected",
    deliveryDate: "Delivery Date",
    deliveryWindow: "Delivery Window",
    thanks: "We can’t wait for you to enjoy it.",
  },
  my: {
    subject: "ပို့ဆောင်မှု သတိပေးချက်",
    greeting: (name: string) => `မင်္ဂလာပါ ${name}`,
    reminderMessage: "မနက်ဖြန် ပို့ဆောင်မည် ဖြစ်ပါသည်။",
    packageSelected: "ရွေးချယ်ထားသော အစီအစဉ်",
    deliveryDate: "ပို့ဆောင်မည့်နေ့",
    deliveryWindow: "ပို့ဆောင်မည့်အချိန်",
    thanks: "သင်တင်စားသုံးရန် မျှော်လင့်နေပါသည်။",
  },
};

export default function DeliveryReminderEmail({
  locale = "en",
  customerName,
  packageName,
  deliveryDate,
  deliveryWindow,
}: DeliveryReminderEmailProps) {
  const t = translations[locale];

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{t.subject}</Preview>
      <Body style={{ fontFamily: locale === "my" ? "Noto Sans Myanmar" : "system-ui" }}>
        <Container>
          <Heading>{t.reminderMessage}</Heading>
          <Text>{t.greeting(customerName)}</Text>

          <Text>
            <strong>{t.packageSelected}:</strong> {packageName}
          </Text>
          <Text>
            <strong>{t.deliveryDate}:</strong> {deliveryDate}
          </Text>
          {deliveryWindow ? (
            <Text>
              <strong>{t.deliveryWindow}:</strong> {deliveryWindow}
            </Text>
          ) : null}

          <Text>{t.thanks}</Text>
        </Container>
      </Body>
    </Html>
  );
}
