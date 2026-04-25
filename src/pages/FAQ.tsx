import { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Search } from 'lucide-react';

export function FAQ() {
  const [searchTerm, setSearchTerm] = useState('');

  const faqs = [
    {
      q: "How will I receive the account?",
      a: "After payment is confirmed, the Admin will send the account credentials directly to your chat. You will receive a notification when the message arrives."
    },
    {
      q: "How long is the subscription?",
      a: "The subscription duration depends on the product you purchased. The exact duration is stated in the product description. Please check the product details before buying."
    },
    {
      q: "What payment methods are accepted?",
      a: "Currently, we only accept GCash. More payment options (such as Maya and Google Pay) will be added soon."
    },
    {
      q: "How long does delivery take?",
      a: "Delivery time depends on the Admin's availability. Usually within a few hours. You will be notified in the chat when the account is sent."
    },
    {
      q: "Why does the site say Admin is Offline?",
      a: "Our Admin operates during standardized hours. When offline, our AI Assistant is available to answer questions about the site. Your orders will remain safe in the queue and processed as soon as the Admin returns."
    }
  ];

  const filtered = faqs.filter(f => 
    f.q.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.a.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in ease-out duration-500 py-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Frequently Asked Questions</h1>
        <p className="text-lg text-muted-foreground">Everything you need to know about purchasing from Premium Accounts Hub.</p>
      </div>

      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for answers..."
          className="pl-10 h-12 text-base rounded-full bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/50 shadow-sm"
        />
      </div>

      <div className="space-y-4 mt-8">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-10">No matching questions found.</p>
        )}
        {filtered.map((faq, i) => (
          <Card key={i} className="overflow-hidden border-muted-foreground/10 hover:border-muted-foreground/30 transition-colors">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">{faq.q}</h3>
              <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
