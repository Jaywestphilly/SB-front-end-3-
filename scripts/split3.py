import os
import re

base_dir = os.path.dirname(os.path.abspath(__file__))
src_path = os.path.join(base_dir, 'src', 'components', 'StockDetailModal.tsx')
out_dir = os.path.join(base_dir, 'src', 'components', 'StockDetailModal')

with open(src_path, 'r') as f:
    content = f.read()

import_match = re.search(r'^(import[\s\S]*?)(?=const PIE_COLORS)', content)
base_imports = import_match.group(1) if import_match else ''
base_imports = re.sub(r'from "\.\./', 'from "../../', base_imports)
base_imports = re.sub(r'from "\./', 'from "../', base_imports)
base_imports = base_imports.replace('import { StockDetailModalProps }', 'import { StockDetailModalProps } from "../../types";')

sections = [
    {
        'name': 'StockHeader',
        'start': '{/* Price & Change Header */}',
        'end': '{/* PORTFOLIO POSITION TRACKER & P/L CALCULATOR */}',
        'replace': '<StockHeader {...propsToPass} />'
    },
    {
        'name': 'TradeSimulator',
        'start': '{/* PORTFOLIO POSITION TRACKER & P/L CALCULATOR */}',
        'end': '{/* Interactive SVG Line & Candlestick Chart Stage */}',
        'replace': '<TradeSimulator {...propsToPass} />'
    },
    {
        'name': 'PriceChart',
        'start': '{/* Interactive SVG Line & Candlestick Chart Stage */}',
        'end': '{/* CORPORATE FINANCIALS / PRIVATE CAPITAL STRUCTURE WIDGET */}',
        'replace': '<PriceChart {...propsToPass} />'
    },
    {
        'name': 'FinancialMetrics',
        'start': '{/* CORPORATE FINANCIALS / PRIVATE CAPITAL STRUCTURE WIDGET */}',
        'end': '{/* LATEST MARKET HEADLINES & NEWS WIRE */}',
        'replace': '<FinancialMetrics {...propsToPass} />'
    },
    {
        'name': 'NewsPanel',
        'start': '{/* LATEST MARKET HEADLINES & NEWS WIRE */}',
        'end': '{/* ANALYST CONSENSUS WIDGET */}',
        'replace': '<NewsPanel {...propsToPass} />'
    },
    {
        'name': 'AnalystConsensusAndStats',
        'start': '{/* ANALYST CONSENSUS WIDGET */}',
        'end': '{/* INSTITUTIONAL OWNERSHIP % & SMART-MONEY ACTIVITY SECTION */}',
        'replace': ''
    },
    {
        'name': 'InstitutionalData',
        'start': '{/* INSTITUTIONAL OWNERSHIP % & SMART-MONEY ACTIVITY SECTION */}',
        'end': '{/* Stock Bloc Market Intelligence Module */}',
        'replace': '<InstitutionalData {...propsToPass} />\n                  <OptionsPanel {...propsToPass} />'
    }
]

extracted = {}

for sec in sections:
    start_idx = content.find(sec['start'])
    if start_idx != -1:
        if sec['end']:
            end_idx = content.find(sec['end'], start_idx)
            if end_idx == -1: end_idx = len(content)
        else:
            end_idx = len(content)
        
        extracted[sec['name']] = content[start_idx:end_idx]

# Apply replacements to new_content safely by going backwards or using the same boundaries
new_content = content
for sec in reversed(sections):
    start_idx = new_content.find(sec['start'])
    if start_idx != -1:
        if sec['end']:
            end_idx = new_content.find(sec['end'], start_idx)
            if end_idx == -1: end_idx = len(new_content)
        else:
            end_idx = len(new_content)
        new_content = new_content[:start_idx] + sec['replace'] + '\n              ' + new_content[end_idx:]

props_def = """
  const propsToPass: any = {
    stock, activeStock, hoveredPoint, isPositive, hoverIndex, showPaperForm, setShowPaperForm, paperTrades, 
    tradeSuccessMsg, setTradeSuccessMsg, tradeType, setTradeType, sharesInput, 
    setSharesInput, entryPriceInput, setEntryPriceInput, portfolioAggregates, 
    handleExecutePaperTrade, symbolPaperTrades, handleClosePosition, 
    chartMode, setChartMode, zoomLevel, setZoomLevel, panOffset, setPanOffset,
    showSMA, setShowSMA, showVWAP, setShowVWAP, showRSI, setShowRSI, showOverlay, setShowOverlay, benchmarkSymbol, setBenchmarkSymbol, 
    isTrendlineActive, setIsTrendlineActive, isDrawingTrendline, trendline, benchmarkHistory,
    timeframe, setTimeframe, hoverTime, hoverPrice, handleMouseMove, handleMouseLeave,
    handleWheel, handleTouchMove, handleMouseDown, handleMouseUp,
    visibleData, latestRealPoint, xScale, yMin, yMax, renderXAxisTicks, renderYAxisTicks,
    chartRef, chartHeight, chartWidth, PADDING, realHistory, smaData, vwapData,
    rsiData, rsiStatus, macdData, formatTooltipDate,
    analystConsensus, targetLow, targetHigh, targetAverage, currentPrice, 
    showAnalystFirms, setShowAnalystFirms,
    institutionalData, showAllInstitutionalHolders, setShowAllInstitutionalHolders,
    aiAnalysis, isAiLoading, aiError, fetchAiAnalysis
  };
"""

return_lines = list(re.finditer(r'^\s*return\s*\(', new_content, flags=re.MULTILINE))
main_return = return_lines[-1]
new_content = new_content[:main_return.start()] + props_def + '\n' + new_content[main_return.start():]

imports_to_add = """
import { StockHeader } from './StockHeader';
import { TradeSimulator } from './TradeSimulator';
import { PriceChart } from './PriceChart';
import { FinancialMetrics } from './FinancialMetrics';
import { NewsPanel } from './NewsPanel';
import { InstitutionalData } from './InstitutionalData';
import { OptionsPanel } from './OptionsPanel';
"""
new_content = re.sub(r'(import \{ getInstitutionalDataForStock \}.*?\n)', r'\1' + imports_to_add, new_content)

os.makedirs(out_dir, exist_ok=True)

def write_comp(name, jsx):
    code = f"""{base_imports}
export const {name} = (props: any) => {{
  const {{ 
    stock, activeStock, hoveredPoint, isPositive, hoverIndex, showPaperForm, setShowPaperForm, paperTrades, 
    tradeSuccessMsg, setTradeSuccessMsg, tradeType, setTradeType, sharesInput, 
    setSharesInput, entryPriceInput, setEntryPriceInput, portfolioAggregates, 
    handleExecutePaperTrade, symbolPaperTrades, handleClosePosition, 
    chartMode, setChartMode, zoomLevel, setZoomLevel, panOffset, setPanOffset,
    showSMA, setShowSMA, showVWAP, setShowVWAP, showRSI, setShowRSI, showOverlay, setShowOverlay, benchmarkSymbol, setBenchmarkSymbol, 
    isTrendlineActive, setIsTrendlineActive, isDrawingTrendline, trendline, benchmarkHistory,
    timeframe, setTimeframe, hoverTime, hoverPrice, handleMouseMove, handleMouseLeave,
    handleWheel, handleTouchMove, handleMouseDown, handleMouseUp,
    visibleData, latestRealPoint, xScale, yMin, yMax, renderXAxisTicks, renderYAxisTicks,
    chartRef, chartHeight, chartWidth, PADDING, realHistory, smaData, vwapData,
    rsiData, rsiStatus, macdData, formatTooltipDate,
    analystConsensus, targetLow, targetHigh, targetAverage, currentPrice, 
    showAnalystFirms, setShowAnalystFirms,
    institutionalData, showAllInstitutionalHolders, setShowAllInstitutionalHolders,
    aiAnalysis, isAiLoading, aiError, fetchAiAnalysis
  }} = props;
  
  if (!stock) return null;

  return (
    <>
      {jsx}
    </>
  );
}};
"""
    with open(os.path.join(out_dir, f'{name}.tsx'), 'w') as f:
        f.write(code)

write_comp('StockHeader', extracted['StockHeader'])
write_comp('TradeSimulator', extracted['TradeSimulator'])
write_comp('PriceChart', extracted['PriceChart'])
write_comp('FinancialMetrics', extracted['FinancialMetrics'] + '\n' + extracted.get('AnalystConsensusAndStats', ''))
write_comp('NewsPanel', extracted['NewsPanel'])
write_comp('InstitutionalData', extracted['InstitutionalData'])

with open(os.path.join(out_dir, 'OptionsPanel.tsx'), 'w') as f:
    f.write(f"""{base_imports}
export const OptionsPanel = (props: any) => {{
  return (
    <div className="p-5 rounded-2xl bg-neutral-900 border border-white/10 mt-6">
        <h4 className="text-sm font-bold text-white mb-4">Options Chain</h4>
        <p className="text-neutral-400 text-xs">Options data coming soon.</p>
    </div>
  );
}};
""")

with open(os.path.join(out_dir, 'index.tsx'), 'w') as f:
    f.write(new_content)

print("Split completed successfully.")
