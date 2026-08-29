const fs = require('fs');

function replaceInFile(filePath, replacements) {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        for (const [regex, replacement] of replacements) {
            content = content.replace(regex, replacement);
        }
        fs.writeFileSync(filePath, content);
    }
}

// 1. StockDetailModal sub-components
const modalFiles = ['StockHeader.tsx', 'TradeSimulator.tsx', 'PriceChart.tsx', 'FinancialMetrics.tsx', 'NewsPanel.tsx', 'InstitutionalData.tsx', 'OptionsPanel.tsx'];
for (const f of modalFiles) {
    replaceInFile(`src/components/StockDetailModal/${f}`, [
        [/props: any/g, 'props: Record<string, any>']
    ]);
}
replaceInFile('src/components/StockDetailModal/index.tsx', [
    [/propsToPass: any =/g, 'propsToPass: Record<string, any> ='],
    [/standardCandles: any\[\]/g, 'standardCandles: unknown[]'],
    [/\(p: any\)/g, '(p: unknown)'],
    [/\(p: any, i: number\)/g, '(p: unknown, i: number)'],
    [/catch \(err: any\)/g, 'catch (err: unknown)']
]);

// 2. DysonSwarmHub
replaceInFile('src/components/DysonSwarmHub.tsx', [
    [/\(l: any, i: number\)/g, '(l: Record<string, any>, i: number)'],
    [/\.filter\(\(l: any\) =>/g, '.filter((l: Record<string, any>) =>'],
    [/\(a: any, b: any\)/g, '(a: Record<string, any>, b: Record<string, any>)'],
    [/\(story: any, idx: number\)/g, '(story: Record<string, any>, idx: number)']
]);

// 3. StockCard
replaceInFile('src/components/StockCard.tsx', [
    [/({ active, payload }: any)/g, '({ active, payload }: { active?: boolean; payload?: any[] })'],
    [/(_, info: PanInfo)/g, '(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo)']
]);

// 4. StripeCheckoutModal
replaceInFile('src/components/StripeCheckoutModal.tsx', [
    [/catch \(err: any\)/g, 'catch (err: unknown)']
]);

// 5. TerminalGuideHub
replaceInFile('src/components/TerminalGuideHub.tsx', [
    [/\(tab: any\)/g, '(tab: string)'],
    [/props: any/g, 'props: React.SVGProps<SVGSVGElement>']
]);

// 6. ReportRepository
replaceInFile('src/components/ReportRepository.tsx', [
    [/rawItems: any\[\];/g, 'rawItems: unknown[];'],
    [/icon: any;/g, 'icon: React.ElementType;'],
    [/\(f: any\)/g, '(f: Record<string, unknown>)'],
    [/\(r: any\)/g, '(r: unknown[])']
]);

// 7. ProSubscriptionModal, PlaybooksHub, MarketPulseCard, AuthModal, NewsHub
replaceInFile('src/components/ProSubscriptionModal.tsx', [[/\(plan: any\)/g, '(plan: "free" | "pro" | "institutional")']]);
replaceInFile('src/components/MarketPulseCard.tsx', [[/catch \(err: any\)/g, 'catch (err: unknown)']]);
replaceInFile('src/components/PlaybooksHub.tsx', [[/\(tab: any\)/g, '(tab: string)']]);
replaceInFile('src/components/AuthModal.tsx', [[/catch \(err: any\)/g, 'catch (err: unknown)']]);
replaceInFile('src/components/NewsHub.tsx', [[/\(a: any, b: any\)/g, '(a: Record<string, any>, b: Record<string, any>)']]);

