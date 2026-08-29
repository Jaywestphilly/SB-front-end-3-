const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'components', 'StockDetailModal.tsx');
let content = fs.readFileSync(file, 'utf8');

// The original closing tags were:
//             </div>
//           </motion.div>
//         </motion.div>
//       )}
//     </AnimatePresence>

// We can just find the first </AnimatePresence> at the end and slice everything after it.
// Actually, `content` now has TWO </AnimatePresence>.
const lastAnimate = content.lastIndexOf('</AnimatePresence>');
const firstAnimate = content.lastIndexOf('</AnimatePresence>', lastAnimate - 1);
if (firstAnimate !== -1) {
    // Keep everything up to the first </AnimatePresence>, then the closing function tags
    content = content.slice(0, firstAnimate + 18) + '\n  );\n};\n';
    fs.writeFileSync(file, content);
}
