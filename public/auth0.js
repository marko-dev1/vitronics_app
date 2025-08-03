const toast = (msg, duration = 3000) => {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.style.opacity = '0';
  }, duration);
};

// REGISTER FORM HANDLING
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(registerForm);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await res.json();
      if (res.ok) {
        toast('✅ Registered successfully!');
        setTimeout(() => window.location.href = 'login.html', 1000);
      } else {
        toast(`❌ ${result.message}`);
      }
    } catch (err) {
      toast('❌ Server error');
    }
  });
}

// LOGIN FORM HANDLING
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(loginForm);
    const data = Object.fromEntries(formData.entries());

    try {
      
      const res = await fetch('/api/auth/login', {
      method: 'POST',
       credentials: 'include',
      headers: {
    'Content-Type': 'application/json'
      },
       body: JSON.stringify(data)
      });


      const result = await res.json();
      if (res.ok) {
        toast('✅ Login successful!');
        setTimeout(() => window.location.href = 'index.html', 1000); // redirect
      } else {
        toast(`❌ ${result.message}`);
      }
    } catch (err) {
      toast('❌ Server error');
    }
  });
}
