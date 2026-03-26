import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useInView } from "@/hooks/useInView";

const faqs = [
  {
    q: "Do I need a smartphone?",
    a: "Not for daily check-ins. Once set up, Daily Guardian works with any phone that can receive text messages — including basic cell phones. You simply reply to a text. Initial setup is done through a web browser on any device.",
  },
  {
    q: "What happens if I don't respond?",
    a: "After a grace period (default: 2 hours), we send a reminder. If you still don't respond, your emergency contacts are alerted one at a time — Contact 1, then Contact 2, then Contact 3 — until someone acknowledges.",
  },
  {
    q: "Can I pause my check-ins temporarily?",
    a: "Yes. Go to Settings and toggle 'Pause Check-Ins' on. While paused, no SMS is sent and no alerts are triggered. Toggle it off anytime to resume. Perfect for travel or staying with family.",
  },
  {
    q: "How is this different from a medical alert button?",
    a: "Medical alert buttons only work when you can press them. Daily Guardian is proactive — it checks on you every day, even before anything goes wrong.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is encrypted in transit and at rest. We never sell personal information. Phone numbers and health data are never shared with third parties.",
  },
  {
    q: "What does it cost?",
    a: "Daily Guardian is completely free during our early launch period. No credit card required. No hidden fees.",
  },
];

export default function LandingFAQ() {
  const { ref, isVisible } = useInView(0.1);

  return (
    <section
      id="faq"
      className="py-20 sm:py-24 md:py-32 bg-section-alt"
    >
      <div ref={ref} className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className={`fade-up text-center max-w-2xl mx-auto ${isVisible ? "visible" : ""}`}>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground"
            style={{ letterSpacing: "-0.03em" }}
          >
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground" style={{ lineHeight: "1.6" }}>
            Everything you need to know about Daily Guardian.
          </p>
        </div>

        <div
          className={`fade-up mt-10 sm:mt-14 ${isVisible ? "visible" : ""}`}
          style={{ transitionDelay: "100ms" }}
        >
          <Accordion
            type="single"
            collapsible
            className="bg-card border border-border/60 rounded-xl -space-y-px overflow-hidden shadow-sm"
            defaultValue="faq-0"
          >
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border-x-0 border-t-0 last:border-b-0 px-4 sm:px-6"
              >
                <AccordionTrigger className="text-base sm:text-lg font-semibold text-foreground hover:no-underline py-5 cursor-pointer text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pb-5" style={{ lineHeight: "1.7" }}>
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
