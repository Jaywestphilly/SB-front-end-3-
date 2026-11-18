import React from "react";

export const TermsOfServicePage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 text-slate-200 font-sans leading-relaxed">
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5 sm:p-10 space-y-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Stock Bloc Terms of Service
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Effective date: November 18, 2026
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            1. What Stock Bloc is
          </h2>
          <p>
            Stock Bloc is a financial research service at stockbloc.ai.studio. It has two parts:
          </p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>
              A free terminal for people: market data, quant scores, SEC filing research, and 13F institutional holdings.
            </li>
            <li>
              A pay-per-call API for AI agents: the same research, delivered over HTTP and MCP, paid per call in USDC on the Base blockchain using the x402 payment protocol.
            </li>
          </ul>
          <p>
            Stock Bloc is read-only research. It does not connect to any broker or exchange account, does not place trades, and does not hold anyone&apos;s funds.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            2. No account, no API key
          </h2>
          <p>
            There is no signup and no API key. Human visitors use the free terminal directly. Agents pay per call: an unpaid call returns an HTTP 402 challenge with the price, the agent pays in USDC on Base, then retries the call.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            3. Pricing
          </h2>
          <p>Current per-call prices, in USDC on Base:</p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Market quotes: $0.01</li>
            <li>SEC 13F holdings, filing diffs, and quant scores: $0.05 to $0.10</li>
            <li>Earnings pack: $0.35</li>
          </ul>
          <p>
            The live price list is published at{" "}
            <a
              href="https://stockbloc.ai.studio/.well-known/x402"
              className="text-cyan-400 underline break-all"
            >
              https://stockbloc.ai.studio/.well-known/x402
            </a>
            . Prices may change; the price in the 402 challenge at the time of the call is the price charged.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            4. Payments
          </h2>
          <p>
            Payments are on-chain USDC transfers on Base, settled through the x402 protocol. Once a payment settles on-chain, it cannot be reversed by Stock Bloc. If a paid call fails to return data because of a Stock Bloc error, contact us at{" "}
            <a
              href="mailto:thestockbloc@gmail.com"
              className="text-cyan-400 underline"
            >
              thestockbloc@gmail.com
            </a>{" "}
            and we will look into it.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            5. Not investment advice
          </h2>
          <p>
            Everything Stock Bloc returns is research and data, not investment advice, not a recommendation to buy or sell any security, and not a promise of returns. Do your own research. Past performance does not predict future results.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            6. Data accuracy
          </h2>
          <p>
            Data comes from public sources, including SEC filings and market data providers. We work to keep it accurate and current, but we do not guarantee that any figure, score, or filing summary is complete, correct, or up to date. Filing data reflects the documents as filed; restatements and corrections happen.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            7. Acceptable use
          </h2>
          <p>
            Do not use Stock Bloc to break the law, to mislead others about what the data says, to resell the service as your own without permission, or to attack, overload, or probe the service in ways that degrade it for others. We may block abusive traffic.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            8. Availability
          </h2>
          <p>
            The service is provided as is, with no guarantee of uptime. We may change, suspend, or stop any part of the service at any time.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            9. Liability
          </h2>
          <p>
            To the fullest extent allowed by law, Stock Bloc is not liable for trading losses, decisions made from its data, or any indirect or consequential damages. If you paid for a call, our total liability for that call is limited to the amount you paid for it.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            10. Changes to these terms
          </h2>
          <p>
            We may update these terms. The version at this URL is the current one. Continued use after an update means you accept the updated terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            11. Contact
          </h2>
          <p>
            Questions:{" "}
            <a
              href="mailto:thestockbloc@gmail.com"
              className="text-cyan-400 underline"
            >
              thestockbloc@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
};

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 text-slate-200 font-sans leading-relaxed">
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5 sm:p-10 space-y-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Stock Bloc Privacy Policy
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Effective date: November 18, 2026
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            1. The short version
          </h2>
          <p>
            Stock Bloc has no accounts, no signup, and no API keys. We do not ask for your name, email, or any personal information to use the service. The main thing to know: agent payments are on-chain USDC transfers on the Base blockchain, and wallet addresses in on-chain payments are public by design.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            2. What we collect
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-white">Agent payments:</strong> When an agent pays for a call, the payment is a USDC transfer on Base. The paying wallet address, amount, and transaction are recorded on the public blockchain. We do not link wallet addresses to real-world identities.
            </li>
            <li>
              <strong className="text-white">Server logs:</strong> Like most websites, our servers may log request details (time, endpoint, response status) to operate, debug, and protect the service. We do not use these logs to identify individuals.
            </li>
            <li>
              <strong className="text-white">Emails you send us:</strong> If you email{" "}
              <a
                href="mailto:thestockbloc@gmail.com"
                className="text-cyan-400 underline"
              >
                thestockbloc@gmail.com
              </a>
              , we receive whatever you include in that email.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            3. What we do not collect
          </h2>
          <p>
            No accounts, no passwords, no tracking cookies for advertising, no sale of personal data. We do not run ads on the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            4. Third parties
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-white">Base blockchain:</strong> Payments settle on Base, a public blockchain. Anyone can view on-chain transactions.
            </li>
            <li>
              <strong className="text-white">x402 protocol:</strong> Payment challenges and settlement follow the x402 protocol.
            </li>
            <li>
              <strong className="text-white">Data providers:</strong> Market and filing data comes from public sources and third-party data providers.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            5. Data retention
          </h2>
          <p>
            Server logs are kept only as long as needed to operate the service. On-chain payment records are permanent on the Base blockchain and cannot be deleted by us.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            6. Children
          </h2>
          <p>
            Stock Bloc is not directed at children under 13, and we do not knowingly collect information from them.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            7. Changes
          </h2>
          <p>
            We may update this policy. The version at this URL is the current one.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            8. Contact
          </h2>
          <p>
            Questions:{" "}
            <a
              href="mailto:thestockbloc@gmail.com"
              className="text-cyan-400 underline"
            >
              thestockbloc@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
};
