const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const replacementLogic = `
    function openUpgradeModal() {
      document.getElementById('payment-stage-easypaisa').classList.remove('hidden');
      document.getElementById('payment-stage-processing').classList.add('hidden');
      document.getElementById('upgrade-modal').showModal();
    }

    function closeUpgradeModal() {
      document.getElementById('upgrade-modal').close();
    }

    function submitEasypaisaPayment() {
      const trx = document.getElementById('ep-trx-id').value.trim();
      if (trx.length < 5) return alert("Enter a valid Easypaisa Transaction reference ID.");
      
      document.getElementById('payment-stage-easypaisa').classList.add('hidden');
      document.getElementById('payment-stage-processing').classList.remove('hidden');
      
      const el = document.getElementById('processing-timer');
      el.innerText = "Sending TRX to database for verification...";

      if (db && state.userSession) {
         db.collection('payments').add({
             uid: state.userSession.uid,
             email: state.userSession.email,
             trxId: trx,
             status: 'pending',
             timestamp: firebase.firestore.FieldValue.serverTimestamp()
         }).then(() => {
             el.innerText = "Payment Received! Please allow 1-12 hours for manual verification.";
             setTimeout(() => { closeUpgradeModal(); }, 4000);
         }).catch(err => {
             alert("Error saving transaction: " + err.message);
             closeUpgradeModal();
         });
      } else {
         el.innerText = "You must be logged in to upgrade!";
         setTimeout(() => { closeUpgradeModal(); }, 2000);
      }
    }
`;

// we will replace from `function openUpgradeModal()` down to `function setupDialogFallback()`
html = html.replace(/function openUpgradeModal\(\) \{[\s\S]*?function setupDialogFallback\(\) \{/, replacementLogic + "\n\n    function setupDialogFallback() {");

fs.writeFileSync('index.html', html, 'utf-8');
