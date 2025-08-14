// Utility functions for silent printing
export const printSilently = (ticketData) => {
  console.log('Attempting silent print...');
  
  // Browser printing with hidden content
  const tryBrowserPrint = () => {
    return new Promise((resolve) => {
      // Create hidden print content
      const printDiv = document.createElement('div');
      printDiv.id = 'silent-print-content';
      printDiv.style.position = 'absolute';
      printDiv.style.left = '-9999px';
      printDiv.style.top = '-9999px';
      printDiv.innerHTML = `
        <style>
          @media print {
            body * { visibility: hidden; }
            #silent-print-content, #silent-print-content * { visibility: visible; }
            #silent-print-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            @page { 
              size: 80mm 100mm; 
              margin: 0.5mm; 
            }
            body { 
              margin: 0; 
              padding: 0;
            }
          }
        </style>
        <div style="font-family: 'Courier New', monospace; text-align: center; font-size: 10px; line-height: 0.9; width: 70mm; margin: 0; padding: 2px;">
          <div style="border-bottom: 1px solid #000; padding-bottom: 1px; margin-bottom: 3px; font-weight: bold; font-size: 9px;">
            VIETNAM EMBASSY JAPAN
          </div>
          <div style="margin: 2px 0; font-size: 9px;">
            Phiếu in
          </div>
          <div style="font-size: 28px; font-weight: bold; margin: 4px 0; letter-spacing: 1px;">
            ${ticketData.number}
          </div>
          <div style="font-size: 10px; font-weight: bold; margin: 2px 0;">
            ${ticketData.serviceType}
          </div>
          <div style="font-size: 8px; margin-top: 2px; padding-top: 1px; border-top: 1px dashed #000;">
            ${ticketData.timestamp}
          </div>
          <div style="margin-top: 2px; font-size: 7px; border-top: 1px solid #000; padding-top: 1px; line-height: 0.8;">
            VNEXT -- ${ticketData.formattedDate}<br>
            VNEXT System
          </div>
        </div>
      `;
      
      document.body.appendChild(printDiv);
      
      // Override print dialog
      const originalPrint = window.print;
      let printExecuted = false;
      
      window.print = () => {
        if (!printExecuted) {
          printExecuted = true;
          console.log('Silent print executed');
          
          // Restore and execute
          window.print = originalPrint;
          setTimeout(() => {
            originalPrint.call(window);
            
            // Cleanup
            setTimeout(() => {
              if (printDiv.parentNode) {
                document.body.removeChild(printDiv);
              }
            }, 1000);
            
            resolve(true);
          }, 100);
        }
      };
      
      // Trigger print
      setTimeout(() => {
        window.print();
      }, 100);
    });
  };

  // Execute printing strategy
  tryBrowserPrint();
};

export default { printSilently };
