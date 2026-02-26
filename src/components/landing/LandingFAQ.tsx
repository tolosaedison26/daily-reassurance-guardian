import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "Does my parent need a smartphone?",
    a: "No. Daily Guardian works with any phone that can receive text messages — including basic cell phones. Your parent simply replies 'OK' to a text message or taps a simple link.",
  },
  {
    q: "What happens if my parent doesn't respond?",
    a: "After a configurable grace period (default: 60 minutes), we send a reminder text. If they still don't respond, your emergency contacts are alerted one at a time — Contact 1, then Contact 2, then Contact 3 — until someone acknowledges the alert.",
  },
  {
    q: "Can I set up vacation mode?",
    a: "Yes. You can pause check-ins for a specific date range using vacation mode. No false alerts while your parent is traveling or staying with family.",
  },
  {
    q: "How is this different from a medical alert button?",
    a: "Medical alert buttons only work when your parent can press them. Daily Guardian is proactive — it checks on them every day, even before anything goes wrong.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is encrypted in transit and at rest. We never sell personal information. Phone numbers and health data are never shared with third parties.",
  },
  {
    q: "Can I manage multiple family members?",
    a: "Yes. Pro plan supports up to 5 seniors. Organization plan supports unlimited seniors with multiple caregiver accounts.",
  },
];

export default function LandingFAQ() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground">Frequently asked questions</h2>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-2xl border border-border px-6 shadow-card">
              <AccordionTrigger className="text-base font-bold text-foreground hover:no-underline py-5">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground leading-relaxed pb-5">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
