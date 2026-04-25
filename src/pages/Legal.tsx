export function Legal({ page }: { page: 'terms' | 'privacy' | 'refund' }) {
  const content = {
    terms: {
      title: 'Terms of Service',
      body: `
Welcome to Premium Accounts Hub. By using our service, you agree to these terms:

1. Buying Process
All transactions are strictly prepaid via GCash. After confirming your order, you must provide the payment screenshot in the live chat with our Admin.

2. Account Delivery Timeframe
Delivery times depend on the Admin's availability. Typically, credentials will be sent to your secure chat within a few hours of verified payment. If the AI Assistant replies, it means the Admin is offline, but your order is in queue.

3. Acceptable Use
You are purchasing a subscription access. Sharing, reselling, or attempting to change the underlying account email/billing information (unless stated otherwise) is strictly prohibited. Violation will result in immediate termination of access without a refund.

4. Legitimacy
We ensure 100% legitimate account provisioning. We are a Verified Seller. All interactions happen securely inside this application over an encrypted connection.
      `,
    },
    privacy: {
      title: 'Privacy Policy',
      body: `
Your privacy is our paramount concern.

1. Data Collection
We collect only the bare minimum necessary for your transaction: Your Google Account (Email, Name, Avatar) for secure login, and your chat messages for order fulfillment.

2. Encryption & Security
All your data (Gmail, chat messages, attachments) is encrypted and stored securely within an isolated and hardened Firebase database. We use secure Google authentication and zero-trust security rules.

3. Payment Proofs
Payment screenshots you attach in the chat are stored securely and used explicitly for transaction verification by the Admin. They are never shared publicly or to third parties.

4. Non-disclosure
We will never sell, trade, or otherwise transfer to outside parties your personally identifiable information.
      `,
    },
    refund: {
      title: 'Refund Policy',
      body: `
We maintain a strict and fair refund policy to protect both the buyer and the seller.

1. Eligibility for Refund
Refunds are ONLY provided if the account is not delivered within the promised timeframe or if the account provided is fundamentally defective upon initial delivery and we are unable to resolve it within 24 hours.

2. Non-Refundable
No refunds will be provided if the account is already delivered, verified working, and actively being used by the buyer. Refunds are not issued for "change of mind" after delivery.

3. Process
If you believe you are entitled to a refund, please state your case clearly in the chat with your order reference. Our Admin will evaluate and process it directly to your GCash account.
      `,
    }
  };

  const curr = content[page];

  return (
    <div className="max-w-3xl mx-auto py-8 animate-in fade-in ease-out duration-500">
      <h1 className="text-4xl font-bold tracking-tight mb-8">{curr.title}</h1>
      <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground">
        {curr.body.split('\n\n').map((paragraph, i) => (
          <p key={i} className="mb-4 whitespace-pre-wrap leading-relaxed">
            {paragraph.trim()}
          </p>
        ))}
      </div>
    </div>
  );
}
