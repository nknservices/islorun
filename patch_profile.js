const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const originalNameInput = `<input type="text" id="profile-user-name" class="font-extrabold text-sm truncate bg-transparent border-b border-dashed border-zinc-700 outline-none w-full max-w-[120px] text-white focus:border-brandAccent" value="Islo Runner" onblur="saveProfileEdits()">`;

const editedNameInput = `<input type="text" id="profile-user-name" class="font-extrabold text-sm truncate bg-transparent border-b border-dashed border-zinc-700 outline-none w-full max-w-[120px] text-white focus:border-brandAccent" value="Islo Runner" onblur="saveProfileEdits()">
                <button onclick="document.getElementById('profile-user-name').focus()" class="text-zinc-500 hover:text-brandAccent transition-colors">
                  <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                </button>`;

html = html.replace(originalNameInput, editedNameInput);

const originalHandlePic = `    function handleProfilePicChange(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
          document.getElementById('profile-user-img').src = evt.target.result;
          saveProfileEdits();
        }
        reader.readAsDataURL(file);
      }
    }`;

const newHandlePic = `    function handleProfilePicChange(e) {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 1048576) {
           alert("Please upload a profile picture smaller than 1MB.");
           e.target.value = '';
           return;
        }
        const reader = new FileReader();
        reader.onload = function(evt) {
          document.getElementById('profile-user-img').src = evt.target.result;
          saveProfileEdits();
          if (typeof lucide !== 'undefined') lucide.createIcons();
        }
        reader.readAsDataURL(file);
      }
    }`;

html = html.replace(originalHandlePic, newHandlePic);

fs.writeFileSync('index.html', html, 'utf-8');
