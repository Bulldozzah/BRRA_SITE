import { supabase } from "@/integrations/supabase/client";

/**
 * Sends newsletter notification emails to all active subscribers
 * when a news article is published.
 */
export async function sendNewsletterNotification(article: {
  title: string;
  summary?: string | null;
  category: string;
  published_at?: string | null;
}): Promise<{ sent: number; errors: number }> {
  // Fetch all active subscribers
  const { data: subscribers, error } = await (supabase as any)
    .from("newsletter_subscribers")
    .select("email, name")
    .eq("is_subscribed", true);

  if (error || !subscribers || subscribers.length === 0) {
    return { sent: 0, errors: error ? 1 : 0 };
  }

  let sent = 0;
  let errors = 0;

  // Send email to each subscriber via the edge function
  for (const subscriber of subscribers) {
    try {
      const { error: sendError } = await supabase.functions.invoke("send-newsletter-email", {
        body: {
          to: subscriber.email,
          subscriberName: subscriber.name || "Subscriber",
          articleTitle: article.title,
          articleSummary: article.summary || "",
          articleCategory: article.category,
          publishedAt: article.published_at || new Date().toISOString(),
        },
      });
      if (sendError) {
        errors++;
      } else {
        sent++;
      }
    } catch {
      errors++;
    }
  }

  return { sent, errors };
}
