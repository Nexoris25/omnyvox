import { query, pool } from "../lib/db";
const author = "Omnyvox Editorial";
async function seed(
  kind: string,
  title: string,
  slug: string,
  body: string,
  category = "general",
  extra: Record<string, unknown> = {},
) {
  const data = {
    title,
    slug,
    body,
    category,
    author,
    status: "published",
    indexing: { index: true, follow: true },
    updatedAt: new Date().toISOString(),
    ...extra,
  };
  await query(
    "INSERT INTO marketing_records(kind,data) VALUES($1,$2) ON CONFLICT(kind,(data->>'slug')) DO NOTHING",
    [kind, JSON.stringify(data)],
  );
}
await seed(
  "authors",
  author,
  "omnyvox-editorial",
  "<p>The Omnyvox editorial team writes practical guides to planning, publishing and maintaining a useful business website.</p>",
);
const [a] = await query<{ id: string }>(
  "SELECT id FROM marketing_records WHERE kind='authors' AND data->>'slug'='omnyvox-editorial'",
);
for (const [title, slug] of [
  ["Website planning", "website-planning"],
  ["Online stores", "online-stores"],
  ["Content & growth", "content-growth"],
])
  await seed("categories", title, slug, "");
await seed(
  "articles",
  "What your business homepage needs to say",
  "what-your-homepage-needs-to-say",
  `<p>A visitor should be able to understand your business before they need to scroll. A clear homepage answers three questions: what do you offer, who is it for, and what should someone do next?</p><h2>Start with the customer’s task</h2><p>Write your first headline around the service or product a customer is looking for. “Accounting support for growing businesses” is more useful than an abstract promise to transform the future. Add one sentence explaining the problem you solve and the area or audience you serve.</p><h2>Choose one primary action</h2><p>Book a consultation, browse the collection, or request a quote: choose the action that fits how your business works. Use a clear button label and repeat it at natural decision points. Secondary links can explain your process or introduce your team.</p><h2>Show evidence people can evaluate</h2><p>Use your own project photographs, specific examples and a straightforward description of your process. Publish customer quotes only with permission. Avoid claims you cannot support or numbers that do not have a source.</p><h2>Keep the path short on mobile</h2><p>Read the page on a small screen. Break long paragraphs into useful sections, place related images beside the explanation, and make sure the main action is easy to reach. A shorter page with a clear purpose often works better than a long list of unrelated features.</p><h2>A final check before publishing</h2><ul><li>Does the heading explain the offer?</li><li>Can someone find your contact details?</li><li>Do all buttons lead to the expected destination?</li><li>Are images descriptive, relevant and readable on mobile?</li></ul>`,
  "website-planning",
  {
    authorId: a.id,
    image: "/marketing-homepage-guide.webp",
    imageAlt: "A desk with paper wireframes and a laptop for website planning",
  },
);
await seed(
  "articles",
  "Prepare your store for its first order",
  "prepare-your-store-for-its-first-order",
  `<p>A polished product page is only part of a useful online store. Before inviting customers to shop, walk through the complete journey from discovering a product to receiving an order confirmation.</p><h2>Make product information specific</h2><p>Describe materials, dimensions, variations and what the customer receives. Use accurate photographs and keep available stock up to date. A customer should not have to send a message to learn the basic details of a product.</p><h2>Explain delivery before checkout</h2><p>State where you deliver, how charges are calculated and what affects delivery timing. If pickup is available, explain how the customer will receive collection instructions. Keep delivery claims aligned with your actual operations.</p><h2>Connect your own payment account</h2><p>In Store payments, connect your Paystack credentials and complete business verification. Configure the webhook for your store and test a payment using test credentials before enabling live payments. A completed browser redirect alone does not prove payment; the signed payment notification updates the order.</p><h2>Publish policies customers can find</h2><p>Your store’s footer should link to your terms, privacy notice, shipping information, and refund or returns policy. Describe your actual process and have the policies reviewed for your business and market.</p><h2>Check the first order from both sides</h2><p>Place a test order, inspect the amount and delivery charge, check the order in your dashboard, and confirm how your team will fulfil it. Keep payment status and fulfilment status separate so your team can see what needs attention.</p>`,
  "online-stores",
  {
    authorId: a.id,
    image: "/marketing-store-guide.webp",
    imageAlt: "A store owner carefully packing an order",
  },
);
await seed(
  "articles",
  "A simple publishing routine for a useful Insights section",
  "a-simple-insights-publishing-routine",
  `<p>Your Insights section can answer the questions your team hears every week. You do not need a crowded publishing calendar. Start with a small set of useful articles and a routine you can maintain.</p><h2>Build a list from real questions</h2><p>Write down the questions customers ask before they buy, during onboarding and after delivery. Group similar questions into categories that use familiar words. Give each article one clear purpose.</p><h2>Make authorship clear</h2><p>Create an author profile for the person responsible for the article. Explain their role and relevant experience without overstating credentials. Review specialist advice with the appropriate expert before publishing it.</p><h2>Edit for the reader’s next step</h2><p>Use descriptive headings, short paragraphs and examples that fit your audience. Add links where they help someone understand a term or complete a task. Use a relevant image with a useful description, rather than decorating every paragraph.</p><h2>Review before you publish</h2><ul><li>Confirm names, facts and linked sources.</li><li>Check the title, category and author.</li><li>Preview the article on mobile.</li><li>Choose whether the page should be indexed.</li><li>Check that any call to action fits the article.</li></ul><h2>Keep older content useful</h2><p>Return to your important articles when your products, processes or policies change. Update the explanation and remove claims that no longer apply. A smaller library of accurate content is easier for your readers to trust.</p>`,
  "content-growth",
  {
    authorId: a.id,
    image: "/marketing-insights-guide.webp",
    imageAlt: "A notebook and books arranged for a writing session",
  },
);
await seed(
  "legal",
  "Privacy notice",
  "privacy",
  `<p>This notice describes the information handled by the Omnyvox platform operated by Nexoris Technologies Ltd.</p><h2>Information in your workspace</h2><p>Account information includes your name, email address and a protected password hash. We store your business verification submission, website content, uploaded media, subscription records and support requests so the platform can provide these services. Business registration submissions are reviewed by authorized administrators.</p><h2>Contact and transaction information</h2><p>Messages submitted through our contact form are available to our support administrators. On customer websites, enquiries and order information are available to the website owner. Payment processing is handled by the connected payment provider; Omnyvox stores transaction references and status rather than card details.</p><h2>Cookies and service providers</h2><p>A necessary session cookie keeps you signed in. Website selection and demo preferences are stored in your browser. Configured hosting, email delivery and payment providers process information needed to deliver those services.</p><h2>Your choices and requests</h2><p>Use the contact page to request access, correction, deletion or information about retention and service providers. We may need to verify your identity before acting on a request. You may also raise a concern with the Nigeria Data Protection Commission. See <a href="https://ndpc.gov.ng/">the Commission’s website</a> for information about data subject rights.</p><h2>Customer websites</h2><p>Each website owner is responsible for explaining their own collection and use of visitor information. Read the privacy notice of the business you are contacting or buying from.</p><p><a href="/contact">Contact Omnyvox about privacy</a></p>`,
);
await seed(
  "legal",
  "Platform terms",
  "terms",
  `<h2>Using your account</h2><p>Provide accurate account and business information, protect your sign-in details, and use the platform only for content and activity you are authorized to manage. Do not upload unlawful material, impersonate another business or attempt to access another customer’s workspace.</p><h2>Your website and content</h2><p>You remain responsible for the content, images, products and claims you publish. Obtain the permissions needed to use third-party material and make your own contact details and business policies available to customers.</p><h2>Plans and payments</h2><p>The pricing and checkout screens identify the plan, billing interval, amount and any included offer. Paid publishing requires an activated subscription. Annual bonus months apply to the payment on which the offer is shown. Contact support about billing errors, cancellation or a refund request; a request is reviewed against the transaction and applicable requirements.</p><h2>Online stores</h2><p>Store owners manage their products, delivery, customer service and return policies. Store payments are processed through the owner’s connected payment account. Omnyvox does not fulfil orders on a store owner’s behalf.</p><h2>Support and account restrictions</h2><p>Contact support if your website is unavailable or you need help with your account. Access may be restricted for unpaid service, security concerns or misuse. Your workspace provides export tools for website content.</p><p><a href="/contact">Contact our support team</a></p>`,
);
for (const [slug, image] of [
  ["what-your-homepage-needs-to-say", "/marketing-homepage-guide.webp"],
  ["prepare-your-store-for-its-first-order", "/marketing-store-guide.webp"],
  ["a-simple-insights-publishing-routine", "/marketing-insights-guide.webp"],
])
  await query(
    "UPDATE marketing_records SET data=jsonb_set(data,'{image}',to_jsonb($1::text)) WHERE kind='articles' AND data->>'slug'=$2 AND COALESCE(data->>'image','') IN ('','/marketing-founders.webp')",
    [image, slug],
  );
for (const [image, alt] of [
  [
    "/marketing-homepage-guide.webp",
    "A desk with paper wireframes and a laptop for website planning",
  ],
  ["/marketing-store-guide.webp", "A store owner carefully packing an order"],
  [
    "/marketing-insights-guide.webp",
    "A notebook and books arranged for a writing session",
  ],
])
  await query(
    "UPDATE marketing_records SET data=jsonb_set(data,'{imageAlt}',to_jsonb($2::text)) WHERE kind='articles' AND data->>'image'=$1 AND COALESCE(data->>'imageAlt','') IN ('','Entrepreneurs discussing their business website')",
    [image, alt],
  );
console.log(
  "Marketing content seeded; the original shared cover is replaced with distinct article images. Review platform legal notices before public launch.",
);
await pool.end();
