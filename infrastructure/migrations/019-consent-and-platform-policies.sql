-- Consent is recorded with contact-form submissions.
ALTER TABLE platform_tickets ADD COLUMN IF NOT EXISTS consented_at timestamptz;

-- Standard platform policies alongside the Terms and Privacy notice.
-- Staff can edit them in Platform admin > Legal pages.
INSERT INTO marketing_records(kind,data) VALUES
('legal', jsonb_build_object(
 'title','Cookie policy','slug','cookies','category','general','author','Omnyvox Editorial','status','published',
 'indexing',jsonb_build_object('index',true,'follow',true),'updatedAt',now(),
 'body',$html$<p>This policy explains how Omnyvox, operated by Nexoris Technologies Ltd, uses cookies and similar browser storage on omnyvox websites and in the Omnyvox workspace. It should be read with our <a href="/legal/privacy">Privacy notice</a>.</p>
<h2>What we use</h2>
<p>We only use what is strictly necessary to provide the service you ask for. We do not use advertising cookies, cross-site tracking or third-party analytics cookies.</p>
<table><thead><tr><th>Name</th><th>Purpose</th><th>Type</th><th>Duration</th></tr></thead><tbody>
<tr><td>omnyvox_session</td><td>Keeps you signed in to your workspace securely.</td><td>Strictly necessary cookie</td><td>Up to 7 days, or until you sign out</td></tr>
<tr><td>omnyvox-selected-site, omnyvox-start, omnyvox-demo, demo-*</td><td>Remember the website you last opened, the plan or template you chose before signing up, and changes made in the demo workspace.</td><td>Session storage</td><td>Until you close the browser tab</td></tr>
<tr><td>omnyvox:draft:*</td><td>Keeps a copy of unsaved website edits on your device so they are not lost if the editor closes.</td><td>Local storage</td><td>Until the edit is saved or discarded</td></tr>
</tbody></table>
<h2>Customer websites</h2>
<p>Websites built on Omnyvox may keep a shopping cart in the visitor’s browser (<code>omnyvox:cart:*</code>) so items remain in the cart between visits. Each website owner is responsible for describing any additional tools they add to their own website.</p>
<h2>Your choices</h2>
<p>Because we only use strictly necessary storage, we do not show a consent banner. You can clear or block cookies and site data in your browser settings; if you block the session cookie you will not be able to sign in. If we ever introduce optional cookies, we will ask for your consent first and update this policy.</p>
<h2>Contact</h2>
<p>Questions about this policy can be sent through our <a href="/contact">contact page</a>.</p>$html$)),
('legal', jsonb_build_object(
 'title','Acceptable use policy','slug','acceptable-use','category','general','author','Omnyvox Editorial','status','published',
 'indexing',jsonb_build_object('index',true,'follow',true),'updatedAt',now(),
 'body',$html$<p>This policy forms part of the <a href="/legal/terms">Platform terms</a>. It sets out what may not be published or done using Omnyvox, so every business on the platform can be trusted by its customers.</p>
<h2>You must not use Omnyvox to</h2>
<ul>
<li>Publish content or sell goods or services that are unlawful in Nigeria or in the place where they are offered.</li>
<li>Impersonate another person or business, or misrepresent your registration, qualifications, licences or affiliations.</li>
<li>Run fraudulent schemes, including fake investment, loan, job or giveaway offers, or collect payments you do not intend to honour.</li>
<li>Collect passwords, card details or identity documents under false pretences, or host phishing pages.</li>
<li>Publish material that infringes copyright, trademarks or other rights, including images you do not have permission to use.</li>
<li>Publish hateful, harassing, sexually exploitative or violent content, or content that endangers children.</li>
<li>Upload malware, attempt to access another customer’s workspace, probe or overload the platform, or bypass plan limits or security controls.</li>
<li>Send unsolicited bulk messages or use customer enquiries for purposes the customer did not agree to.</li>
</ul>
<h2>Regulated activities</h2>
<p>If your business is regulated, for example healthcare, legal, financial, education or property services, you are responsible for holding the required registrations and presenting claims accurately. Do not promise outcomes you cannot guarantee.</p>
<h2>How we enforce this policy</h2>
<p>We may review reported content, ask you to make changes, unpublish content, suspend a website or close an account, depending on the seriousness of the issue. Where appropriate we will explain the reason and give you a chance to respond. We may report unlawful activity to the relevant authorities.</p>
<h2>Reporting a concern</h2>
<p>To report a website built on Omnyvox, use our <a href="/contact">contact page</a> and include the website address and a short description of the problem.</p>$html$)),
('legal', jsonb_build_object(
 'title','Refund & cancellation policy','slug','refunds','category','general','author','Omnyvox Editorial','status','published',
 'indexing',jsonb_build_object('index',true,'follow',true),'updatedAt',now(),
 'body',$html$<p>This policy explains how subscription changes, cancellations and refunds work for Omnyvox plans. It forms part of the <a href="/legal/terms">Platform terms</a>. Purchases made from a business’s own online store are covered by that business’s refund policy, not this one.</p>
<h2>Changing your plan</h2>
<ul>
<li><strong>Upgrades</strong> take effect immediately. You pay only the difference for the remainder of your current billing period, shown before you confirm.</li>
<li><strong>Downgrades</strong> take effect at the end of the period you have already paid for, so you keep everything you paid for. Content over the new plan’s limits is kept and returned to draft, never deleted.</li>
</ul>
<h2>Cancelling</h2>
<p>You can turn off automatic renewal at any time from Subscription &amp; billing in your workspace. Your website stays online until the end of the paid period and is then taken offline. Your content remains in your workspace so you can export it or reactivate later.</p>
<h2>Refunds</h2>
<ul>
<li>Duplicate charges and payments taken in error are refunded in full.</li>
<li>If the service is unavailable for a significant period because of a fault on our side, we will offer a proportionate credit or refund.</li>
<li>Other refund requests, including for annual plans, are reviewed individually against the payment and how the service has been used. Payments for periods already used are generally not refundable.</li>
<li>Professional setup services are refundable only for work that has not started.</li>
</ul>
<h2>How to request a refund</h2>
<p>Contact us through the <a href="/contact">contact page</a> with your invoice number and the reason for your request. We aim to respond within five working days. Approved refunds are returned to the original payment method through our payment provider; the time for funds to arrive depends on your bank.</p>$html$))
ON CONFLICT(kind,(data->>'slug')) DO NOTHING;
