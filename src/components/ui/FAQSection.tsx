"use client";

import { useState } from "react";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    id: 1,
    category: "Pricing",
    question: "Why are your prices so low — is something wrong?",
    answer:
      "We go straight to the source, eliminating middlemen entirely. By purchasing merchandise in bulk volumes worldwide, we gain powerful negotiating leverage and pass those savings on to you — meaning you often pay below wholesale rates.",
  },
  {
    id: 2,
    category: "Shipping",
    question: "Do you ship to South Africa and what does it cost?",
    answer:
      "Yes! We ship to South Africa. Costs start from $30 via USPS and approximately $50–$100 via FedEx. For the most current rates, please visit the international shipping section on our website.",
  },
  {
    id: 3,
    category: "Services",
    question: "Can you resize and mount a stone I purchase?",
    answer:
      "Absolutely. We can resize and mount any stone you purchase from us with perfection — for just $50.",
  },
  {
    id: 4,
    category: "Buying & Selling",
    question: "Do you buy loose gemstones from sellers?",
    answer:
      "We buy closeouts and bulk volumes. If your offering matches our requirements, we'd be interested. Note: you must have a registered business or company — we only buy through verified trade entities.",
  },
  {
    id: 5,
    category: "Products",
    question: "Are your gemstones real or synthetic/simulated?",
    answer:
      "We sell both real and synthetic/simulated products. Each product clearly states its nature in the description. Use the search bar to filter by the type you're looking for.",
  },
  {
    id: 6,
    category: "Pricing",
    question: "What currency are your products priced in?",
    answer: "All our prices are listed in US Dollars (USD).",
  },
  {
    id: 7,
    category: "Visit Us",
    question: "Can I visit your showroom in New York City?",
    answer:
      "You're very welcome! Please call us at least a day in advance at 914-310-1480 to schedule a dedicated appointment. Bring your personal and business ID (or just personal ID if you've purchased from us before and aren't NYC-based).",
  },
  {
    id: 8,
    category: "Gemology",
    question: "Are diamonds the rarest of all gemstones?",
    answer:
      "Not necessarily. De Beers controls diamond supply to maintain demand. A Ruby Spinel of exceptional quality can be rarer than an average diamond. That said, a 'D' color flawless diamond is among the rarest of all gemstones — rarity depends on color, carat, clarity, and whether a gem can be synthesized.",
  },
  {
    id: 9,
    category: "Pricing",
    question: "Are there discounts for bulk purchases?",
    answer:
      "Our prices are already significantly below market, so initial bulk orders may not see additional discounts. However, we do have substantial rebate tiers for large purchases. Check our rewards programme on the website homepage.",
  },
  {
    id: 10,
    category: "Products",
    question: "Where do your emeralds and rubies come from?",
    answer:
      "Our emeralds are sourced from both Brazil and Colombia. Rubies come from Thailand and Burma — two of the most renowned ruby-producing regions in the world.",
  },
  {
    id: 11,
    category: "Products",
    question: "What lengths do silk cord necklaces come in?",
    answer:
      "Silk cords are available in 16, 18, and 20 inch lengths. Where applicable, they feature 925 sterling silver findings.",
  },
  {
    id: 12,
    category: "Gemology",
    question: "What makes a gemstone valuable?",
    answer:
      "Value depends on beauty, rarity, durability, cut quality, demand, and color. Each factor interplays with the others — subtle color differences that seem minor to an untrained eye can translate into significant price differences on the market.",
  },
  {
    id: 13,
    category: "Gemology",
    question: "Is Spinel synthetic?",
    answer:
      "It's a common misconception! Spinel was one of the first gems to be synthesized, so people assume it's always lab-made. In fact, it occurs naturally and can be strikingly beautiful. The famous 'Black Prince's Ruby' in Britain's crown jewels is actually a natural Spinel.",
  },
  {
    id: 14,
    category: "Gemology",
    question: "Why isn't a 1-carat diamond double the price of a 0.5-carat?",
    answer:
      "Diamond pricing is driven by supply and demand, not weight alone. Larger stones are exponentially rarer — a 1-carat stone is more than twice as hard to find as a 0.5-carat. This scarcity premium makes pricing non-linear.",
  },
  {
    id: 15,
    category: "Services",
    question: "How do I find my ring size?",
    answer:
      "The most accurate method is to visit your local jeweler and have your finger professionally sized. This ensures the best fit, especially for rings with wider bands.",
  },
  {
    id: 16,
    category: "Gemology",
    question: "What is the best color for Tanzanite?",
    answer:
      "Tanzanite ranges from violet-blue to pure blue or even purple, depending on how it's cut. Color preference is personal — many are drawn to the exotic violet-blue hues, while true blues tend to be the most broadly preferred in the trade.",
  },
  {
    id: 17,
    category: "Orders",
    question: "When will my order be shipped?",
    answer:
      "Orders are shipped within 24–48 hours of payment confirmation. You'll be notified of any delays. Weekends and public holidays are not counted as business days.",
  },
  {
    id: 18,
    category: "Orders",
    question: "Which carriers do you use for shipping?",
    answer:
      "We ship via FedEx, UPS, Priority Mail, and USPS. Multiple delivery speed options are available for FedEx and UPS so you can choose what suits you best.",
  },
  {
    id: 19,
    category: "Orders",
    question: "Will I receive a tracking number?",
    answer:
      "Yes. Once your order ships, you'll receive your tracking number via email so you can monitor delivery in real time.",
  },
  {
    id: 20,
    category: "Payments",
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, Amex, Discover), PayPal, cashier's checks, and money orders — giving you maximum flexibility.",
  },
  {
    id: 21,
    category: "Payments",
    question: "Is it safe to enter my credit card online?",
    answer:
      "Yes. All transactions are secured with 128-bit SSL encryption, making online purchases as safe as — often safer than — offline transactions.",
  },
  {
    id: 22,
    category: "Payments",
    question: "Can I send my card info by fax?",
    answer: "Yes, you may fax your order to us at 212-768-0599 if you prefer not to order online.",
  },
  {
    id: 23,
    category: "Returns",
    question: "What is your return and refund policy?",
    answer:
      "We offer a 30-day risk-free, no-questions-asked full refund (minus shipping charges). International customers also have 30 days. Sale items are exchange-only. After 30 days and up to 60 days from purchase, items can be returned for replacement or exchange.",
  },
  {
    id: 24,
    category: "Orders",
    question: "What is the Wishlist feature?",
    answer:
      "My Wishlist lets you save items for later or track out-of-stock products. Add items via the 'Add to Wishlist' button on any product page. You can move items to your cart, delete them, or email your wishlist to a friend — all from the Wishlist page.",
  },
  {
    id: 25,
    category: "Shipping",
    question: "Are there customs duties for international orders?",
    answer:
      "International shipments may be subject to import/customs duties and taxes upon arrival in your country. These are the buyer's responsibility. Contact your local customs office for specific rates and regulations.",
  },
  {
    id: 26,
    category: "Gemology",
    question: "Why are colored diamonds so special?",
    answer:
      "Natural color diamonds are breathtakingly rare and expensive. Modern technology now allows colorless diamonds to be permanently color-enhanced at a fraction of the cost. These treated diamonds are stable under normal wear, though extreme heat (above 300°C) should be avoided — always inform your jeweler when resizing.",
  },
];

const categories = ["All", ...Array.from(new Set(faqs.map((f) => f.category)))];

const FAQ_CSS = `
  .fq-toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 8px; }
  .fq-toolbar label { color: #555; }
  .fq-search {
    height: 22px; width: 260px; max-width: 100%; padding: 0 5px;
    border: 1px solid #333; border-radius: 0; background: #fff;
    font: inherit; font-size: 11px; color: #000;
  }
  .fq-search:focus { outline: 1px solid #1c4874; border-color: #1c4874; }
  .fq-cats { display: flex; flex-wrap: wrap; border: 1px solid #a9b3cf; background: #fff; margin-bottom: 10px; }
  .fq-cat {
    padding: 4px 10px; background: #f4f5f9; border: 0; border-right: 1px solid #c9cfdf;
    font: inherit; font-size: 11px; font-weight: bold; color: #1c4874; cursor: pointer;
  }
  .fq-cat:hover { background: #e8ebf3; text-decoration: underline; }
  .fq-cat.is-active { background: linear-gradient(to bottom, #164472 0px, #0d3b6c 3px, #2b547e 100%); color: #fff; }
  .fq-cat small { font-weight: normal; opacity: .75; margin-left: 3px; font-size: 10px; }
  .fq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-items: start; }
  .fq-col { display: flex; flex-direction: column; gap: 8px; }
  .fq-item { background: #fff; border: 1px solid #c9cfdf; }
  .fq-item.is-open { border-color: #2b547e; }
  .fq-q {
    display: flex; gap: 8px; width: 100%; text-align: left; align-items: flex-start;
    padding: 6px 8px; background: none; border: 0; font: inherit; font-size: 11px; cursor: pointer; color: #1c4874; font-weight: bold;
  }
  .fq-q:hover { background: #f4f5f9; }
  .fq-item.is-open .fq-q { background: #dfe2ea; }
  .fq-sign { flex-shrink: 0; width: 14px; height: 14px; border: 1px solid #2b547e; background: #c6cfe6; color: #1c4874; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; line-height: 1; }
  .fq-q-text { flex: 1; }
  .fq-tag { display: inline-block; font-weight: normal; font-size: 9.5px; color: #8a8a8a; margin-bottom: 1px; }
  .fq-a { padding: 6px 8px 8px 30px; color: #333; line-height: 1.7; border-top: 1px solid #e3e6ee; }
  .fq-empty { text-align: center; padding: 20px 10px; background: #fff; border: 1px solid #c9cfdf; }
  .fq-note { margin-top: 10px; text-align: center; padding: 6px 10px; background: #fff; border: 1px solid #c9cfdf; }
  .fq-note strong { color: #1c4874; }
  @media (max-width: 900px) { .fq-grid { grid-template-columns: 1fr; } }
`;

function FAQCard({ item }: { item: FAQItem; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`fq-item${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="fq-q"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="fq-sign" aria-hidden="true">{open ? "−" : "+"}</span>
        <span className="fq-q-text">
          <span className="fq-tag">{item.category}</span>
          <br />
          {item.question}
        </span>
      </button>
      {open && <p className="fq-a">{item.answer}</p>}
    </div>
  );
}

export default function FAQSection() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = faqs.filter((f) => {
    const matchCat = activeCategory === "All" || f.category === activeCategory;
    const matchSearch =
      search === "" ||
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Split into two columns
  const col1 = filtered.filter((_, i) => i % 2 === 0);
  const col2 = filtered.filter((_, i) => i % 2 === 1);

  return (
    <section className="cl-panel" id="faq">
      <style>{FAQ_CSS}</style>
      <h2 className="cl-panel-head">Frequently Asked Questions</h2>
      <div className="cl-panel-body">
        <p>
          Everything you need to know about our gemstones, shipping, payments, and more.
        </p>

        <div className="fq-toolbar">
          <label htmlFor="fq-search">Search:</label>
          <input
            id="fq-search"
            type="text"
            className="fq-search"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div className="fq-cats" role="tablist" aria-label="FAQ categories">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              className={`fq-cat${activeCategory === cat ? " is-active" : ""}`}
            >
              {cat}
              {cat === "All" && <small>({faqs.length})</small>}
            </button>
          ))}
        </div>

        {/* FAQ Grid */}
        {filtered.length === 0 ? (
          <div className="fq-empty">
            <p>
              <strong>No results found.</strong>
            </p>
            <p>Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="fq-grid">
            <div className="fq-col">
              {col1.map((item, i) => (
                <FAQCard key={item.id} item={item} index={i * 2} />
              ))}
            </div>
            <div className="fq-col">
              {col2.map((item, i) => (
                <FAQCard key={item.id} item={item} index={i * 2 + 1} />
              ))}
            </div>
          </div>
        )}

        {/* Footer note */}
        <div className="fq-note">
          <strong>Still have questions?</strong> Call us at{" "}
          <strong>914-310-1480</strong> or fax <strong>212-768-0599</strong>
        </div>
      </div>
    </section>
  );
}