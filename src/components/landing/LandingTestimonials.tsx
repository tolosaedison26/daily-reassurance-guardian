import { Star } from "lucide-react";

const testimonials = [
  {
    initials: "J",
    name: "Jennifer K.",
    role: "Daughter, Chicago",
    quote: "I tried three other apps before Daily Guardian. This is the only one my 79-year-old mother actually uses — because she doesn't have to download anything.",
  },
  {
    initials: "R",
    name: "Rachel M.",
    role: "Daughter, Seattle",
    quote: "My dad had a fall and because he didn't check in, we knew within the hour. The escalation system worked exactly as promised. I can't imagine not having this.",
  },
  {
    initials: "D",
    name: "David L.",
    role: "Son, Denver",
    quote: "Setup took 2 minutes. My mum replies to a text every morning and I get peace of mind. It's the simplest thing that's made the biggest difference.",
  },
];

export default function LandingTestimonials() {
  return (
    <section className="py-16 md:py-24 bg-secondary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground">What families are saying</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-card rounded-2xl p-6 border border-border shadow-card flex flex-col">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-base text-foreground leading-relaxed flex-1 italic">"{t.quote}"</p>
              <div className="flex items-center gap-3 mt-5 pt-5 border-t border-border">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-black text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
