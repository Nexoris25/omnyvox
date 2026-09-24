/** Preview microcopy describes the page, without inventing a business's credentials. */
export function pagePurpose(title: string) {
  const key = title.toLowerCase();
  if (key === "about")
    return "Meet the people and principles behind the work. A closer look at how we think, collaborate and deliver.";
  if (key === "contact")
    return "A good conversation is the first step. Tell us what you have in mind and find the right way to reach our team.";
  if (key === "faq")
    return "Straightforward answers to help you plan your next step. For anything else, our team is ready to help.";
  if (/services|solutions|practice|medical/.test(key))
    return "Explore the ways we can help, understand our approach and find the right starting point for your needs.";
  if (/projects|portfolio|gallery/.test(key))
    return "Explore the detail behind the work: the ideas, choices and care that shape each project.";
  if (/people|team|professionals|faculty/.test(key))
    return "Get to know the people you will work with, their areas of focus and how to start a conversation.";
  if (/rooms|facilities/.test(key))
    return "Find your space. Explore the rooms, thoughtful details and practical information for planning your visit.";
  if (/programmes|admissions/.test(key))
    return "Explore your options, understand the process and take your next step with confidence.";
  if (/properties/.test(key))
    return "Discover spaces for the way you want to live and work. Explore the details, then arrange a conversation or viewing.";
  return "The details you need, clearly explained. Explore this guide and get in touch if you would like a hand.";
}
