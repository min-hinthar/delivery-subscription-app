import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

type MenuPublishedEmailProps = {
  locale: "en" | "my";
  customerName: string;
  weekStart: string;
  deliveryDate: string;
};

const translations = {
  en: {
    subject: "Weekly Menu Published",
    greeting: (name: string) => `Hi ${name},`,
    message: "This week's menu is now live.",
    weekOf: "Week of",
    deliveryDate: "Delivery Date",
    cta: "Log in to choose your package before Wednesday night.",
  },
  my: {
    subject: "ဒီအပတ် မီနူး ထုတ်ပြန်ပြီး",
    greeting: (name: string) => `မင်္ဂလာပါ ${name}`,
    message: "ဒီအပတ် မီနူးကို ထုတ်ပြန်ပြီးပါပြီ။",
    weekOf: "အပတ်စ",
    deliveryDate: "ပို့ဆောင်မည့်နေ့",
    cta: "ဗုဒ္ဓဟူးည မတိုင်မီ စာရင်းဝင်ပြီး အစီအစဉ်ရွေးပါ။",
  },
};

export default function MenuPublishedEmail({
  locale = "en",
  customerName,
  weekStart,
  deliveryDate,
}: MenuPublishedEmailProps) {
  const t = translations[locale];

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{t.subject}</Preview>
      <Body style={{ fontFamily: locale === "my" ? "Noto Sans Myanmar" : "system-ui" }}>
        <Container>
          <Heading>{t.message}</Heading>
          <Text>{t.greeting(customerName)}</Text>

          <Text>
            <strong>{t.weekOf}:</strong> {weekStart}
          </Text>
          <Text>
            <strong>{t.deliveryDate}:</strong> {deliveryDate}
          </Text>
          <Text>{t.cta}</Text>
        </Container>
      </Body>
    </Html>
  );
}
