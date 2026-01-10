import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "I was skeptical about AI training, but after one session I was hooked. The AI buyer felt so real—it even got annoyed when I pushed too hard. This is exactly what I needed.",
    author: "Sarah Mitchell",
    role: "Top Producer, Berkshire Hathaway",
    location: "Las Vegas, NV",
    rating: 5,
    avatar: "SM",
  },
  {
    quote:
      "The compliance guard alone is worth it. I almost made a disclosure error in practice that would have cost me my license in real life. RoleplayPro caught it instantly.",
    author: "Marcus Chen",
    role: "Broker Associate, RE/MAX",
    location: "Henderson, NV",
    rating: 5,
    avatar: "MC",
  },
  {
    quote:
      "I've done every sales training out there. This is different. The AI coach whispers suggestions at the exact moment I need them. It's like having a mentor in my ear 24/7.",
    author: "Jennifer Rodriguez",
    role: "Luxury Specialist, Sotheby's",
    location: "Reno, NV",
    rating: 5,
    avatar: "JR",
  },
  {
    quote:
      "My team's conversion rate went up 23% in the first month. The daily drills build real muscle memory. Now handling objections feels automatic.",
    author: "David Park",
    role: "Team Lead, Keller Williams",
    location: "Las Vegas, NV",
    rating: 5,
    avatar: "DP",
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative overflow-hidden py-24">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-gold-500/5 blur-[100px]" />
        <div className="absolute right-1/4 bottom-0 h-[500px] w-[500px] translate-y-1/2 rounded-full bg-gold-500/5 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Trusted by{" "}
            <span className="text-gradient-gold">Top Nevada Agents</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Early beta testers are already seeing results. Here's what they're
            saying.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.author}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:border-gold-500/30 hover:shadow-lg hover:shadow-gold-500/5"
            >
              {/* Quote icon */}
              <div className="absolute right-6 top-6 opacity-10">
                <Quote className="h-12 w-12 text-gold-500" />
              </div>

              {/* Rating */}
              <div className="mb-4 flex gap-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-gold-500 text-gold-500"
                  />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="relative text-lg leading-relaxed text-foreground">
                "{testimonial.quote}"
              </blockquote>

              {/* Author */}
              <div className="mt-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-gold-600 font-display text-sm font-bold text-obsidian-950">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                  <div className="text-xs text-gold-500">
                    {testimonial.location}
                  </div>
                </div>
              </div>

              {/* Decorative gradient */}
              <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-gold-500/0 via-gold-500/50 to-gold-500/0 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid gap-8 rounded-2xl border border-gold-500/20 bg-gradient-to-r from-gold-500/5 via-gold-500/10 to-gold-500/5 p-8 sm:grid-cols-4">
          {[
            { value: "500+", label: "Beta Testers" },
            { value: "23%", label: "Avg. Conversion Lift" },
            { value: "4.9/5", label: "Satisfaction Rating" },
            { value: "10,000+", label: "Sessions Completed" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-3xl font-bold text-gold-500 sm:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
