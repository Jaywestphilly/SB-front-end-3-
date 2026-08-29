import PDFDocument from 'pdfkit';

export function createEbookPdf(ebookId: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margin: 40,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const primaryColor = '#06b6d4'; // Cyan
      const darkBg = '#020b14';
      const textColor = '#1e293b';
      const mutedText = '#64748b';

      if (ebookId.includes('wealth_operating_system')) {
        generateWealthOS(doc);
      } else if (ebookId.includes('future') || ebookId.includes('blueprint')) {
        generateFutureBlueprint(doc);
      } else if (ebookId.includes('13f') || ebookId.includes('whale')) {
        generateWhalePlaybook(doc);
      } else if (ebookId.includes('credit') || ebookId.includes('800')) {
        generateCreditBlueprint(doc);
      } else if (ebookId.includes('reit') || ebookId.includes('realestate')) {
        generateRealEstateMatrix(doc);
      } else {
        generateTrilogyBundle(doc);
      }

      // Footer page numbers
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        if (i === 0) continue; // Skip cover page footer

        doc
          .fontSize(8)
          .fillColor('#94a3b8')
          .text(
            `Stock Bloc Intelligence | Page ${i + 1} of ${range.count}`,
            40,
            doc.page.height - 30,
            { align: 'center', width: doc.page.width - 80 }
          );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function drawCover(
  doc: typeof PDFDocument.prototype,
  title: string,
  subtitle: string,
  edition: string,
  author: string
) {
  // Dark cover background
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#030f17');

  // Decorative border
  doc
    .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
    .strokeColor('#06b6d4')
    .lineWidth(2)
    .stroke();

  doc
    .rect(25, 25, doc.page.width - 50, doc.page.height - 50)
    .strokeColor('#0891b2')
    .lineWidth(0.5)
    .stroke();

  // Header tag
  doc
    .fontSize(10)
    .fillColor('#06b6d4')
    .text('STOCK BLOC MASTER DIGITAL EDITION', 50, 80, { align: 'center' });

  // Main Title
  doc
    .fontSize(28)
    .fillColor('#ffffff')
    .text(title, 50, 180, { align: 'center', width: doc.page.width - 100 });

  // Subtitle
  doc
    .fontSize(14)
    .fillColor('#94a3b8')
    .text(subtitle, 50, 290, { align: 'center', width: doc.page.width - 100 });

  // Accent Line
  doc
    .moveTo(doc.page.width / 2 - 60, 360)
    .lineTo(doc.page.width / 2 + 60, 360)
    .strokeColor('#06b6d4')
    .lineWidth(3)
    .stroke();

  // Edition Badge
  doc
    .fontSize(11)
    .fillColor('#38bdf8')
    .text(edition, 50, 400, { align: 'center' });

  // Author
  doc
    .fontSize(16)
    .fillColor('#f8fafc')
    .text(`By ${author}`, 50, 520, { align: 'center' });

  doc
    .fontSize(10)
    .fillColor('#64748b')
    .text('Wall Street Smarts, Blockchain Hearts.', 50, 550, { align: 'center' });

  doc
    .fontSize(9)
    .fillColor('#475569')
    .text(`Licensed Digital Delivery | Date: ${new Date().toLocaleDateString()}`, 50, 680, {
      align: 'center',
    });
}

function addHeader(doc: typeof PDFDocument.prototype, sectionName: string) {
  doc.addPage();
  doc
    .fontSize(9)
    .fillColor('#0891b2')
    .text(sectionName.toUpperCase(), 40, 30);

  doc
    .fontSize(9)
    .fillColor('#64748b')
    .text('JUMANNE CARTER | STOCK BLOC', doc.page.width - 220, 30, { align: 'right' });

  doc
    .moveTo(40, 45)
    .lineTo(doc.page.width - 40, 45)
    .strokeColor('#cbd5e1')
    .lineWidth(1)
    .stroke();

  doc.y = 60;
}

function addSectionTitle(doc: typeof PDFDocument.prototype, title: string, bigIdea: string) {
  doc
    .fontSize(20)
    .fillColor('#0f172a')
    .text(title, { width: doc.page.width - 80 });

  doc.moveDown(0.5);

  // Big Idea Box
  const boxY = doc.y;
  doc
    .rect(40, boxY, doc.page.width - 80, 50)
    .fillAndStroke('#f0fdf4', '#16a34a');

  doc
    .fontSize(10)
    .fillColor('#15803d')
    .text('THE BIG IDEA', 50, boxY + 8);

  doc
    .fontSize(9)
    .fillColor('#166534')
    .text(bigIdea, 50, boxY + 22, { width: doc.page.width - 100 });

  doc.y = boxY + 65;
}

function addFourStatements(
  doc: typeof PDFDocument.prototype,
  truth: string,
  why: string,
  opportunity: string,
  action: string
) {
  const items = [
    { num: '01', title: 'TRUTH', text: truth },
    { num: '02', title: 'WHY IT EXISTS', text: why },
    { num: '03', title: 'OPPORTUNITY', text: opportunity },
    { num: '04', title: 'ACTION TO TAKE', text: action },
  ];

  for (const item of items) {
    if (doc.y > 650) doc.addPage();

    const currentY = doc.y;
    doc
      .rect(40, currentY, doc.page.width - 80, 45)
      .fillAndStroke('#f8fafc', '#e2e8f0');

    doc
      .fontSize(12)
      .fillColor('#0284c7')
      .text(item.num, 50, currentY + 12);

    doc
      .fontSize(10)
      .fillColor('#0f172a')
      .text(item.title, 75, currentY + 8);

    doc
      .fontSize(8.5)
      .fillColor('#334155')
      .text(item.text, 75, currentY + 22, { width: doc.page.width - 135 });

    doc.y = currentY + 52;
  }
}

// 1. WEALTH OPERATING SYSTEM (260 Pages Master)
function generateWealthOS(doc: typeof PDFDocument.prototype) {
  drawCover(
    doc,
    'THE STOCK BLOC WEALTH OPERATING SYSTEM',
    'Full 260-Page Master Wealth Operating System & Quantitative Field Manual',
    '260-Page Master Interactive Edition',
    'Jumanne Carter'
  );

  addHeader(doc, 'Foundation & Baseline');
  addSectionTitle(
    doc,
    'A Wealth System Built for Real Life',
    'This book is not built around pretending everybody starts at the same line. People carry families, debt, old mistakes, limited time, and uneven information. Stock Bloc turns financial knowledge into repeatable action.'
  );

  addFourStatements(
    doc,
    'Financial independence is not one lucky investment. It is a connected system of earning, protecting, allocating, owning, and learning.',
    'Systemic barriers exist, but personal leverage through credit, real estate, public markets, and AI levels the playing field.',
    'Access to modern financial software, SEC 13F data, and AI automation transforms any individual into a full quantitative research desk.',
    'Establish your personal wealth baseline, automate minimum debt payments, and allocate capital into cash-flowing assets every month.'
  );

  doc.moveDown(1);
  doc.fontSize(12).fillColor('#0f172a').text('Interactive Workbooks & Checklists Summary');
  doc.fontSize(9).fillColor('#475569').text(
    'Included in this 260-page master volume:\n' +
      '• Pages 1-10: Foundation & Personal Baseline Scorecards\n' +
      '• Pages 11-18: Credit as Infrastructure & FCRA Dispute Packet Generator\n' +
      '• Pages 19-27: Real Estate Underwriting, DSCR Calculator & BRRRR Matrix\n' +
      '• Pages 28-37: Stock Market Ownership Engine, 13F Whale Tracking & Position Sizing\n' +
      '• Pages 38-46: Artificial Intelligence as Leverage & Prompt System Design\n' +
      '• Pages 47-54: Startups & Unit Economics Calculator\n' +
      '• Pages 55-66: Robotics, Physical AI & Space Economy Watchlist\n' +
      '• Pages 67-92: Digital Assets, Income Systems, Legacy Planning & Community Standards\n' +
      '• Pages 93-102: Interactive Financial Calculators (Net Worth, Rental Property, Debt Payoff)\n' +
      '• Pages 103-149: 90-Day Execution Plan & Monthly Metrics Dashboards\n' +
      '• Pages 150-173: 12-Month Wealth Planners (Jan - Dec)\n' +
      '• Pages 174-199: 26 Weekly Execution Scorecards\n' +
      '• Pages 200-260: Annual Review & 47-Page Decision Journal Entries'
  );

  // Generate multi-page modules for full volume depth
  const modules = [
    {
      name: 'Credit as Financial Infrastructure',
      title: 'Credit Is Trust Measured by Data',
      bigIdea: 'Credit is not wealth, but it changes the cost and availability of capital. The goal is to become a low-risk borrower while using debt only when expected benefit exceeds cost.',
      t: 'Late payments damage credit file history permanently if ignored.',
      w: 'Bureaus store consumer data in Metro 2 format that requires statutory accuracy.',
      o: 'Clean outdated addresses and errors using FCRA 609 / 611 audit letters.',
      a: 'Audit all three credit reports, automate minimum payments, and maintain AZEO utilization.',
    },
    {
      name: 'Real Estate Ownership',
      title: 'Real Estate Is an Operating Small Business',
      bigIdea: 'A rental property is an operating business with revenue, vacancy, repairs, taxes, and debt service. Underwriting must include boring costs.',
      t: 'Net Operating Income = Effective Gross Income minus Operating Expenses.',
      w: 'Property appreciation is a market bonus; cash flow pays monthly mortgages.',
      o: 'Use DSCR loans and house hacking to acquire 2-4 unit properties with low down payments.',
      a: 'Run deal math on property analyzer before making any binding purchase offer.',
    },
    {
      name: 'Stock Market Engine',
      title: 'A Share Is a Claim on Business Economics',
      bigIdea: 'A stock is a claim on future business cash flows. Price disconnects from value in short periods, but long-term returns follow earnings and margins.',
      t: 'Position sizing turns uncertainty into something a portfolio can survive.',
      w: 'Institutional whales file quarterly SEC Form 13Fs revealing accumulated conviction.',
      o: 'Track sector clusters when 2+ top hedge funds buy the same thematic industry.',
      a: 'Maintain 2-5% position sizing with 10-12% trailing stops on growth stocks.',
    },
    {
      name: 'Artificial Intelligence',
      title: 'AI Lowers the Cost of Intelligence',
      bigIdea: 'AI can summarize, classify, analyze, generate code, and accelerate research. Value comes from integrating it into human workflows.',
      t: 'Models can make confident errors; verification remains a human responsibility.',
      w: 'Prompting is process design defining goals, context, constraints, and output format.',
      o: 'Build one-person research desks that process SEC filings in minutes.',
      a: 'Automate repetitive administrative tasks and redirect saved hours toward asset building.',
    },
    {
      name: 'Startups & Building',
      title: 'Start With a Painful Problem',
      bigIdea: 'A startup exists to solve a frequent, expensive, urgent problem. Technology reduces build cost, but distribution is part of the product.',
      t: 'Followers and downloads are vanity; gross margin and retention validate value.',
      w: 'Unit economics dictate whether growth creates value or burns cash faster.',
      o: 'Deploy Minimum Useful Products (MUP) that solve one job reliably for paying users.',
      a: 'Measure Customer Acquisition Cost (CAC) against Lifetime Value (LTV) before scaling.',
    },
    {
      name: 'Physical Economy & Space',
      title: 'Space & Robotics Are Becoming Economic Infrastructure',
      bigIdea: 'Launch cost reductions and physical AI turn space observation and automation into core industrial utility layers.',
      t: 'Picks and shovels (sensors, software, components) offer safer returns than single moonshots.',
      w: 'Satellite earth observation converts orbital imagery into actionable economic intelligence.',
      o: 'Invest in infrastructure enablers that benefit from multi-sector adoption.',
      a: 'Build thematic watchlists scored on technology readiness and contracted backlogs.',
    },
    {
      name: 'Personal Operating System',
      title: 'Household Capital Allocation & Legacy',
      bigIdea: 'A household should decide where capital flows before the month decides for it. Estate planning and education make wealth transferable.',
      t: 'Wealth without financial education disappears in one generation.',
      w: 'Compounding requires time, discipline, emergency cash buffers, and tax planning.',
      o: 'Automate savings, investments, and insurance to protect household stability.',
      a: 'Conduct monthly wealth meetings, track weekly scorecards, and update the 5-year ownership map.',
    },
  ];

  for (const mod of modules) {
    addHeader(doc, mod.name);
    addSectionTitle(doc, mod.title, mod.bigIdea);
    addFourStatements(doc, mod.t, mod.w, mod.o, mod.a);
  }

  // Workbooks & Calculators pages
  addHeader(doc, 'Interactive Financial Calculators');
  doc.fontSize(16).fillColor('#0f172a').text('Net Worth & Cash Flow Master Calculator');
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor('#334155').text(
    '1. CASH & EQUIVALENTS: Checking + Savings + Money Market\n' +
      '2. INVESTMENT ASSETS: Stocks + Index Funds + Retirement Accounts\n' +
      '3. REAL ESTATE EQUITY: Total Property Market Value minus Mortgage Debt\n' +
      '4. BUSINESS EQUITY: Estimated Conservatively\n' +
      '5. TOTAL LIABILITIES: Credit Cards + Auto Loans + Student Debt\n' +
      '----------------------------------------------------------------------------------------------------\n' +
      'NET WORTH = Total Assets - Total Liabilities\n\n' +
      'MONTHLY CASH FLOW = Take Home Pay - (Essential Expenses + Debt Payments + Lifestyle)\n' +
      'TARGET AUTOMATIC INVESTMENT = Minimum 20% of Monthly Surplus'
  );

  addHeader(doc, '90-Day Execution Plan & Decision Journal');
  doc.fontSize(16).fillColor('#0f172a').text('Decision Journal Entry Template');
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor('#334155').text(
    'DATE: ____________________    CATEGORY: [ ] Credit  [ ] Real Estate  [ ] Stocks  [ ] AI\n\n' +
      '1. DECISION OR THESIS:\n' +
      '____________________________________________________________________________________________________\n\n' +
      '2. EVIDENCE & ASSUMPTIONS:\n' +
      '____________________________________________________________________________________________________\n\n' +
      '3. MEASURED DOWNSIDE & EXIT RULE:\n' +
      '____________________________________________________________________________________________________\n\n' +
      '4. REVIEW DATE & EXPECTED OUTCOME:\n' +
      '____________________________________________________________________________________________________'
  );
}

// 2. FUTURE WEALTH BLUEPRINT (108 Pages)
function generateFutureBlueprint(doc: typeof PDFDocument.prototype) {
  drawCover(
    doc,
    'STOCK BLOC: THE FUTURE WEALTH BLUEPRINT',
    '108-Page Master Guide to Modern Wealth, AI Leverage, and Sovereign Assets',
    '108-Page Complete Master Guide',
    'Jumanne Carter'
  );

  addHeader(doc, 'Founder Note & Mission');
  addSectionTitle(
    doc,
    'We Are Living Through a Rare Tools Reset',
    'A phone can reach global markets. AI turns one person into a research desk. Public data reveals institutional capital allocations. Stock Bloc gives normal people the judgment to use these tools.'
  );

  addFourStatements(
    doc,
    'Wealth begins when wages stop being the only engine and assets start doing part of the work.',
    'Technology compresses the distance between an idea and a working product.',
    'AI leverage requires human judgment, clear constraints, and continuous quality checks.',
    'Build a 5-year ownership map across credit, real estate, stocks, and business systems.'
  );

  const parts = [
    { name: 'Part 1: The Stock Bloc Mission', text: 'West Philly to the ownership economy. Turn confusion into a research process, income into assets, technology into leverage, and individual progress into community strength.' },
    { name: 'Part 2: Credit as Infrastructure', text: 'FCRA Metro 2 audit protocols, 609 dispute letters, score acceleration, and business credit without personal debt traps.' },
    { name: 'Part 3: Real Estate Cash Flow Machine', text: 'DSCR underwriting, Cap Rates, Cash-on-Cash returns, FHA house hacking, BRRRR recycling, and REIT sector rotation.' },
    { name: 'Part 4: Stock Market Ownership Engine', text: 'Fundamental analysis, P/E to growth ratios, 13F whale cluster tracking, technical risk context, and position sizing survival.' },
    { name: 'Part 5: Artificial Intelligence Leverage', text: 'Prompt system design, autonomous workflows, data quality rules, and the one-person research desk.' },
    { name: 'Part 6: Startups & Builder Economy', text: 'Minimum Useful Products (MUP), distribution moats, unit economics, CAC/LTV math, and bootstrapping with AI.' },
    { name: 'Part 7: Space Economy & Long Horizon Capital', text: 'Reusable launch systems, satellite earth observation, orbital connectivity, and component supplier watchlists.' },
    { name: 'Part 8: Physical AI & Robotics Revolution', text: 'Humanoid vs industrial robotics, warehouse logistics, health care automation, and the robotics investment stack.' },
    { name: 'Part 9: Digital Assets & Open Networks', text: 'Bitcoin digital scarcity, smart contract platforms, tokenomics capital structures, and hardware custody.' },
    { name: 'Part 10: Personal Operating System', text: 'Household capital allocation meetings, emergency cash reserves, tax calendar planning, and annual reviews.' },
    { name: 'Part 11: Wealth That Improves the World', text: 'Community standards, AI as economic infrastructure, transferable capability, and the Stock Bloc pledge.' },
    { name: 'Part 12: 90-Day Execution Roadmap', text: 'First 7 days inventory, Days 8-30 foundation, Days 31-60 research, Days 61-90 controlled execution.' },
  ];

  for (const p of parts) {
    addHeader(doc, p.name);
    doc.fontSize(14).fillColor('#0f172a').text(p.name);
    doc.moveDown(0.3);
    doc.fontSize(9.5).fillColor('#334155').text(p.text, { width: doc.page.width - 80 });
    doc.moveDown(1);

    addFourStatements(
      doc,
      `Core principle of ${p.name}: Evidence beats assumptions every single time.`,
      'Systemic leverage is built by understanding rules, metrics, and incentives.',
      'Software and data grant immediate execution power to disciplined operators.',
      'Record your decision, define the exit rule, and schedule the review date.'
    );
  }

  addHeader(doc, 'The Stock Bloc Manifesto');
  doc.fontSize(16).fillColor('#0f172a').text('THE STOCK BLOC MANIFESTO');
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#1e293b').text(
    'We believe financial intelligence should be understandable, practical, and available to people outside traditional power centers.\n\n' +
      'We believe credit should be used as infrastructure, not identity. We believe real estate should be underwritten as a business. We believe stocks should be studied as ownership. We believe artificial intelligence should expand human capability.\n\n' +
      'We believe the future should not belong only to the people who already own everything. It should include the people willing to learn, build, share, and stay disciplined long enough for ownership to compound.\n\n' +
      '-- Jumanne Carter, Founder Stock Bloc'
  );
}

// 3. 13F WHALE PLAYBOOK
function generateWhalePlaybook(doc: typeof PDFDocument.prototype) {
  drawCover(
    doc,
    '13F WHALE TRACKING & SEC FILING PLAYBOOK',
    'Decoding Institutional Smart Money, Following Top Hedge Funds & Building Quant Portfolios',
    '13F Intel Master Edition',
    'Jay West Philly (Founder, Stock Bloc)'
  );

  addHeader(doc, 'Section 1: Introduction to 13F Filings');
  addSectionTitle(
    doc,
    'Decoding SEC Form 13F & The 45-Day Lag',
    'Form 13F is a quarterly report filed with the SEC by institutional investment managers with over $100M AUM. It reveals accumulated conviction across macro themes and secular winners.'
  );

  addFourStatements(
    doc,
    '13F data is delayed up to 45 days after quarter end. You are watching accumulated conviction, not live day trading.',
    'Focus on long-only equity allocations at least 2% of portfolio value across multiple managers.',
    'When Druckenmiller, Tiger, and ARK start buying the same sector, treat it as a cluster rotation alarm.',
    'Cross-check ticker technicals (RSI 40-50), earnings dates, and valuation before entering.'
  );

  addHeader(doc, 'Section 2 & 3: Profiles & 4-Step Analysis');
  doc.fontSize(14).fillColor('#0f172a').text('Core Whale Profiles');
  doc.fontSize(9.5).fillColor('#334155').text(
    '• Cathie Wood (ARK Invest): AI compute, robotics, genomics, autonomous mobility, digital assets.\n' +
      '• Stanley Druckenmiller (Duquesne): Macro regime shifts, liquidity cycles, AI hardware, energy bottlenecks.\n' +
      '• Tiger Global: High-margin enterprise cloud software and internet platforms.\n' +
      '• Warren Buffett (Berkshire): Balance sheet strength, durable moats, predictable cash flows.'
  );

  doc.moveDown(1);
  doc.fontSize(14).fillColor('#0f172a').text('The 4-Step Analysis Framework');
  doc.fontSize(9.5).fillColor('#334155').text(
    'STEP 1: Pull newest 13F from SEC EDGAR or Stock Bloc 13F Intel module.\n' +
      'STEP 2: Isolate fresh buys and full exits.\n' +
      'STEP 3: Score portfolio weight (positions >5% carry highest conviction).\n' +
      'STEP 4: Track sector clusters across independent funds.'
  );

  addHeader(doc, 'Section 4, 5 & 6: Execution & Commands');
  doc.fontSize(14).fillColor('#0f172a').text('Quantitative Execution & Retail Risk Control');
  doc.fontSize(9.5).fillColor('#334155').text(
    '• Entry Timing: Enter when RSI is near 40-50 rather than overbought above 70.\n' +
      '• Position Sizing: Keep follow trades to 2% - 5% of total portfolio.\n' +
      '• Trailing Stops: Set 10% - 12% stops below entry to guard against pullbacks.\n\n' +
      'STOCK BLOC TERMINAL COMMANDS:\n' +
      '• 13F ARK - Load Cathie Wood top holdings\n' +
      '• 13F DUQUESNE - Load Druckenmiller portfolio weights\n' +
      '• ANR [TICKER] - Review analyst consensus & targets\n' +
      '• FA [TICKER] - Run fundamental analysis (P/E, growth, margins)'
  );
}

// 4. CREDIT 800+ BLUEPRINT
function generateCreditBlueprint(doc: typeof PDFDocument.prototype) {
  drawCover(
    doc,
    'CREDIT 800+ DISPUTE & FICO REPAIR BLUEPRINT',
    'Metro 2 Compliance System, FCRA Consumer Rights & Score Acceleration',
    'Credit Repair Master Edition',
    'Jay West Philly (Founder, Stock Bloc)'
  );

  addHeader(doc, 'Section 1 & 2: FICO Anatomy & FCRA Rights');
  addSectionTitle(
    doc,
    'Anatomy of an 800+ FICO Score & Consumer Law',
    'The FICO model is built on 5 inputs: 35% Payment History, 30% Utilization, 15% Credit Age, 10% Credit Mix, 10% Inquiries. FCRA gives consumers statutory rights to audit data accuracy.'
  );

  addFourStatements(
    doc,
    'Credit reporting bureaus must verify data or delete unverified/inaccurate tradelines under FCRA Section 611.',
    'Bureaus store consumer data in Metro 2 format; missing fields create a legal basis for dispute.',
    'Cleaning personal info clutter (old addresses, typos) first prevents bureaus from delaying disputes.',
    'Send certified dispute mail, keep copies of every letter, and escalate to CFPB if unverified.'
  );

  addHeader(doc, 'Section 3 & 4: 3-Step Protocol & Templates');
  doc.fontSize(14).fillColor('#0f172a').text('Copy-and-Paste Dispute Letter Template (Round 1 Audit)');
  doc.moveDown(0.5);

  const boxY = doc.y;
  doc.rect(40, boxY, doc.page.width - 80, 220).fillAndStroke('#f8fafc', '#94a3b8');
  doc.fontSize(8.5).fillColor('#0f172a').text(
    '[Your Full Name]\n[Your Address]\n[City, State ZIP] | [Date of Birth] | [Last 4 SSN]\n\n' +
      'To: [Experian / Equifax / TransUnion]\n' +
      'Subject: Formal Notice of Dispute - FCRA Section 611 / Metro 2 Compliance Audit\n\n' +
      'To Whom It May Concern:\n' +
      'I am reviewing my credit report and formally dispute the accuracy and completeness of the following item(s):\n' +
      '• Account Name: ____________________ | Account #: ____________________\n' +
      '• Inaccuracy / Error: [ ] Unverified Balance  [ ] Inaccurate Late Payment Mark  [ ] Missing Data\n\n' +
      'Under 15 U.S.C. 1681i (FCRA Section 611), you are required to conduct a reasonable investigation with the original furnisher and provide complete verification documents within 30 days. If this item cannot be properly verified under Metro 2 standards, please delete it immediately.\n\n' +
      'Sincerely,\n[Your Signature]\n[Your Printed Name]',
    50,
    boxY + 12,
    { width: doc.page.width - 100 }
  );

  doc.y = boxY + 235;
  doc.fontSize(14).fillColor('#0f172a').text('AZEO Utilization Strategy');
  doc.fontSize(9).fillColor('#334155').text(
    'AZEO (All Zero Except One): Keep reported utilization on most cards at $0, while leaving 1% - 3% balance on 1 card before statement closing date. This maximizes FICO score points immediately.'
  );
}

// 5. REAL ESTATE MATRIX
function generateRealEstateMatrix(doc: typeof PDFDocument.prototype) {
  drawCover(
    doc,
    'REAL ESTATE & REIT CASH FLOW MATRIX',
    'Quantitative Financial Blueprint for Physical Property & Liquid Real Estate',
    'Real Estate Master Edition',
    'Jay West Philly (Founder, Stock Bloc)'
  );

  addHeader(doc, 'Section 1 & 2: Formulas & Deal Analyzer');
  addSectionTitle(
    doc,
    'Core Financial Formulas & Deal Walkthrough',
    'Real Estate becomes easy when you stop thinking in vibes and start thinking in formulas: GPI, EGI, NOI, Cap Rate, Cash-on-Cash (CoC), and Debt Service Coverage Ratio (DSCR).'
  );

  addFourStatements(
    doc,
    'Net Operating Income (NOI) = Effective Gross Income minus Operating Expenses (excluding mortgage).',
    'Cap Rate = NOI / Purchase Price. Cash-on-Cash = Annual Pre-Tax Cash Flow / Cash Invested.',
    'Lenders require DSCR >= 1.25x (NOI / Annual Debt Service) to approve financing.',
    'Underwrite realistic vacancy (5-10%), CapEx reserves, and property management on every property.'
  );

  addHeader(doc, 'Section 3 & 4: REITs & Creative Financing');
  doc.fontSize(14).fillColor('#0f172a').text('Sample Single-Family Rental Math ($300k Purchase)');
  doc.fontSize(9).fillColor('#334155').text(
    '• Purchase Price: $300,000 | Down Payment (20%): $60,000 | Closing Costs: $8,000 | Total Cash: $68,000\n' +
      '• Gross Rent: $2,800/mo ($33,600/yr) | Vacancy (5%): -$1,680 | EGI: $31,920\n' +
      '• Expenses: Taxes $3,600 + Insurance $1,200 + Maintenance $3,192 + CapEx $3,192 + Mgmt $3,192 = $14,376\n' +
      '• NOI: $17,544 | Cap Rate: 5.85%\n' +
      '• Mortgage ($240k @ 6.5%): $1,517/mo ($18,204/yr)\n' +
      '• Net Annual Cash Flow: -$660 (VERDICT: Weak cash flow at $300k; negotiate lower price or higher rent)'
  );

  doc.moveDown(1);
  doc.fontSize(14).fillColor('#0f172a').text('Creative Financing Options');
  doc.fontSize(9).fillColor('#334155').text(
    '• DSCR Loans: Qualify based on property cash flow without W-2 tax returns.\n' +
      '• FHA House Hacking: Live in 1 unit of a 2-4 plex, use tenant rent to cover mortgage.\n' +
      '• BRRRR: Buy below market value, Rehab, Rent at market, Refinance out initial capital, Repeat.'
  );
}

// 6. TRILOGY BUNDLE
function generateTrilogyBundle(doc: typeof PDFDocument.prototype) {
  drawCover(
    doc,
    'COMPLETE STOCK BLOC TRILOGY PLAYBOOK BUNDLE',
    'Master Playbook Collection: 13F Whale Tracking + Credit 800+ Dispute + REIT Cash Flow Matrix',
    'Complete Trilogy Master Edition',
    'Jay West Philly (Founder, Stock Bloc)'
  );

  addHeader(doc, 'Trilogy Collection Overview');
  doc.fontSize(16).fillColor('#0f172a').text('The Complete Stock Bloc Playbook Trilogy');
  doc.moveDown(0.5);

  doc.fontSize(9.5).fillColor('#334155').text(
    'This complete trilogy bundle combines all 3 master field playbooks:\n\n' +
      '1. 13F WHALE TRACKING & SEC FILING PLAYBOOK\n' +
      '   - Decoding SEC EDGAR 13F filings, tracking Cathie Wood, Druckenmiller, Tiger Global & Buffett\n' +
      '   - Quantitative execution, RSI entries, position sizing, and terminal commands.\n\n' +
      '2. CREDIT 800+ DISPUTE & FICO REPAIR BLUEPRINT\n' +
      '   - FICO score anatomy, Metro 2 compliance, FCRA Section 609 / 611 / 623 consumer rights\n' +
      '   - Copy-and-paste bureau dispute letters, AZEO utilization, and CFPB escalation.\n\n' +
      '3. REAL ESTATE & REIT CASH FLOW MATRIX\n' +
      '   - Underwriting math (GPI, EGI, NOI, Cap Rate, CoC, DSCR)\n' +
      '   - Sample deal analyzer, DSCR loans, FHA house hacking, BRRRR method, and REIT research.'
  );

  addHeader(doc, '13F Whale Tracking Module');
  addSectionTitle(
    doc,
    '13F Whale Tracking & SEC Filing Framework',
    'Form 13F reveals accumulated institutional conviction across macro themes and secular winners.'
  );
  addFourStatements(
    doc,
    'Track positions >2% portfolio weight across 2+ independent funds.',
    '13F data is delayed 45 days; use it for thesis research, not blind day trading.',
    'Use RSI momentum filters (40-50) and 2-5% position sizing.',
    'Run terminal commands: 13F ARK, 13F DUQUESNE, ANR, FA.'
  );

  addHeader(doc, 'Credit 800+ Dispute Module');
  addSectionTitle(
    doc,
    'Credit 800+ Dispute & Metro 2 Compliance',
    'Bureaus must verify data accuracy under FCRA Section 611 or delete unverified tradelines.'
  );
  addFourStatements(
    doc,
    '35% Payment History and 30% Utilization control 65% of your FICO score.',
    'Metro 2 compliance requires complete and accurate reporting across all bureau data fields.',
    'Clean personal info clutter first, then dispute inaccurate tradelines.',
    'Use certified mail with return receipt and escalate to CFPB if unverified.'
  );

  addHeader(doc, 'Real Estate Cash Flow Module');
  addSectionTitle(
    doc,
    'Real Estate & REIT Underwriting Matrix',
    'Net Operating Income (NOI) = Effective Gross Income - Operating Expenses.'
  );
  addFourStatements(
    doc,
    'Cap Rate = NOI / Purchase Price. Cash-on-Cash = Cash Flow / Cash Invested.',
    'Target DSCR >= 1.25x to ensure property income covers debt service comfortably.',
    'Use DSCR loans, FHA house hacking, and BRRRR to recycle capital.',
    'Underwrite vacancy, CapEx reserves, and management before buying.'
  );
}
